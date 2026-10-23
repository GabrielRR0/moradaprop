# Rendimiento y proteccion de endpoints

Cada mejora es una pieza independiente con **un solo lugar donde se edita**. Para ajustar algo, ve a su archivo; no hay que tocar controllers ni services.

| Quiero... | Donde se cambia | Como |
|---|---|---|
| Cambiar cuanto dura el mapa o la busqueda en cache | `apps/api/src/common/cache/cache-policies.ts` | Cambiar `serverSeconds` / `browserSeconds` / `staleSeconds` |
| Poner cache a una consulta nueva | `cache-policies.ts` + el service + el controller | Politica nueva, `cache.remember(clave, consulta, CACHE_POLICIES.x)` y `@HttpCache('x')` |
| Apagar toda la cache (depurar) | variable `CACHE_TTL_SECONDS=0` | Sin tocar codigo |
| Cambiar cuantas peticiones por minuto permite cada tipo de ruta | `apps/api/src/common/security/rate-limits.ts` | Cambiar el numero en `RATE_LIMITS` |
| Dar un limite propio a una ruta | el controller | `@Throttle(limitPerMinute(RATE_LIMITS.upload))` |
| Que cache y limites se compartan entre varios servidores | variable `CACHE_DRIVER=redis` | Ya viene asi en Docker |
| Cambiar el maximo de paginas o de pines del mapa | `dto/search-properties.dto.ts` (`MAX_PAGE`) y `property-search.service.ts` (`MAP_POINT_LIMIT`) | Cambiar la constante |
| Cambiar como se agrupan los pines del mapa | `modules/properties/utils/clusters.ts` | Es una funcion aislada: se puede reemplazar por PostGIS sin tocar nada mas |
| Que mas peticiones iguales compartan cache en el mapa | `modules/properties/utils/bounding-box.ts` | Ajustar el tamano de la cuadricula |

## Que pasa cuando miles de clientes piden el mismo mapa

1. **CDN / navegador** (`@HttpCache`): si el cliente ya tiene una copia de menos de 10-15 s, ni siquiera llega al servidor.
2. **Rate limit** (`rate-limits.ts`): una misma IP no puede pasar del limite; los contadores estan en Redis y valen para todos los servidores.
3. **Cache del servidor** (`CacheService`): las peticiones identicas simultaneas comparten UNA consulta ("un solo vuelo"); el resultado se guarda unos segundos en Redis.
4. **Cuadricula del mapa** (`snapBox`): usuarios que miran casi la misma zona piden exactamente lo mismo, asi comparten cache.
5. **Base de datos**: solo recibe una consulta por cada (zona, filtros) distinta cada pocos segundos.

Ademas: respuestas comprimidas (gzip), tope de paginas (`MAX_PAGE`), tope de pines del mapa, limite de profundidad en GraphQL.

## Limites honestos (lo que NO hace todavia)

- **La cache se renueva por tiempo, no por evento.** Una propiedad recien publicada puede tardar hasta `serverSeconds` en verse en el mapa publico. Para que sea inmediato habria que llamar `cache.forget('properties:')` al escribir.
- **La clave `x-app-key` de la web es visible en el navegador**: sirve para filtrar trafico ajeno, no para detener a un atacante. La defensa real es el rate limit + un CDN/WAF (por ejemplo Cloudflare) delante del API.
- **El mapa agrupa en el servidor leyendo hasta 5.000 filas.** Sirve bien hasta decenas de miles de propiedades gracias a la cache. Mas alla, el siguiente paso es agrupar dentro de la base con PostGIS (`ST_SnapToGrid`), cambiando solo `clusters.ts` y `mapInDatabase`.
- **La busqueda por texto usa `contains`** (recorre la tabla). Con cientos de miles de propiedades hace falta un indice de texto (pg_trgm o busqueda de texto completo de Postgres).
- **Rate limit solo por IP.** Detras de proxies/NAT muchas personas comparten IP. Si molesta, se puede limitar por usuario cuando hay sesion.

## Como verificarlo

- `pnpm test:e2e` incluye `rendimiento.e2e-spec.ts` (60 clientes simultaneos = 1 consulta, cabeceras, gzip, topes).
- `pnpm --filter @app/api exec ts-node scripts/check-redis.ts` prueba contra un Redis real que dos servidores comparten la cache y que la app sobrevive si Redis se cae (requiere `docker compose up -d redis`).
