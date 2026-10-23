# Guía para colaboradores

Cómo trabajar en este proyecto sin romper nada ni abrir huecos de seguridad. Si eres nuevo, lee en este orden: este archivo → [SEGURIDAD.md](SEGURIDAD.md) → [CONVENCIONES.md](CONVENCIONES.md) → el `README.md` del módulo que vas a tocar.

## 1. Levantar el proyecto

Requisitos: Docker, Node 22 y pnpm. No necesitas crear `.env` para desarrollo.

```bash
pnpm install     # una vez
pnpm dev         # = docker compose up (db, redis, mailpit, api y web)
```

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/health |
| Swagger (solo desarrollo) | http://localhost:3001/docs |
| Correos de prueba (Mailpit) | http://localhost:8026 |
| Postgres desde tu máquina | `localhost:5433` |

Al arrancar, Docker aplica las migraciones pendientes y carga **datos demo** (≈120 propiedades por Venezuela con fotos generadas). Cuentas demo, todas con clave `Demo12345`: `admin@demo.local`, `dueno@demo.local`, `agencia@demo.local`, `cliente@demo.local`. El admin necesita activar el 2FA antes de entrar al panel (`POST /api/auth/2fa/setup`).

Si un puerto está ocupado, copia `.env.example` a `.env` y cambia `WEB_PORT`, `API_PORT`, `DB_PORT`, `REDIS_PORT` o `MAILPIT_UI_PORT`. **Nunca subas `.env`.**

## 2. Comandos

| Comando | Para qué |
|---|---|
| `pnpm dev` / `pnpm stop` / `pnpm logs` | Levantar, detener y ver logs |
| `pnpm dev:db` · `dev:api` · `dev:web` | Levantar solo una parte (ahorra disco y memoria) |
| `pnpm test:api` | Pruebas unitarias de la API |
| `pnpm test:e2e` | Pruebas de extremo a extremo (necesita la base de datos levantada: `pnpm dev:db`) |
| `pnpm test:module <modulo>` | Solo las pruebas de un módulo (ej. `pnpm test:module properties`) |
| `pnpm lint` · `pnpm lint:fix` · `pnpm format` | Reglas de código y formato |
| `pnpm build` | Compila todo |
| `pnpm db:create <nombre>` | Crea una migración **sin aplicarla**, para que revises el SQL |
| `pnpm db:migrate` | Aplica migraciones pendientes en tu base local |
| `pnpm db:deploy` · `db:status` | Aplica solo migraciones ya escritas · ver estado |
| `pnpm db:reset` | Borra y recrea tu base **local** |
| `pnpm db:seed` · `pnpm db:seed -- --fresh` | Cargar datos demo · regenerarlos desde cero |

Los resultados de las pruebas salen **en español** con lo que se probó, lo que se esperaba y lo que se obtuvo.

## 3. Cómo está organizado

```
apps/api/src/
  modules/<modulo>/     un módulo de negocio (auth, properties, agencies, appointments, imports…)
    <modulo>.module.ts, <modulo>.controller.ts, index.ts (archivo padre)
    services/           la lógica; un service fachada + services hijos
    dto/                validación de entradas
    utils/, tests/, README.md
  common/               piezas compartidas (cache, crypto, files, images, mail, password, prisma, security, storage, graphql)
  config/               variables de entorno tipadas y validadas
  routes/               un archivo de rutas por módulo
  database/             guardián de migraciones
apps/api/prisma/        schema.prisma, migrations/, seed.ts
apps/api/test/          pruebas e2e y ayudantes
apps/web/               frontend (Next.js + React)
docs/                   esta documentación
```

**Cada carpeta tiene un `README.md` que explica qué hay, para qué sirve y cómo funciona.** Léelo antes de editar, y **actualízalo en el mismo cambio** si modificas el comportamiento. Si creas una carpeta o módulo nuevo, créale su README.

### Reglas de arquitectura (las impone `pnpm lint`)
- 🔒 De otro módulo **solo se importa su archivo padre** (`index.ts` o `<modulo>.module.ts`), nunca archivos internos.
- 🔒 Máximo **600 líneas por archivo**; si crece, se parte en archivos pequeños dentro del módulo.
- 🔒 Nadie lee `process.env` fuera de `config/`.
- **Controller delgado:** solo recibe la petición y llama a un service. La lógica va en `services/`.
- **Un service fachada** (`<modulo>.service.ts`) que delega en services hijos, cada uno con una sola responsabilidad.

## 4. Cómo escribir código que se entienda

El código debe poder leerse sin esfuerzo. Reglas prácticas:

1. **Una función hace una cosa** y su nombre dice cuál. Si necesitas un comentario para explicar *qué* hace, renómbrala; usa comentarios para explicar *por qué*.
2. **Evita el anidado profundo.** Valida y sal temprano (`if (!x) throw …`) en vez de anidar `if` dentro de `if`.
3. **Nombres completos y en el idioma del negocio** (`assertCanManage`, `managedFilter`), no abreviaturas (`chk`, `tmp`).
4. **Valores sueltos → constantes con nombre** (`MAX_PAGE`, `MAX_IMPORT_BYTES`) y, si es algo que se ajusta (tiempos de caché, límites de peticiones), en su archivo único: `cache-policies.ts`, `rate-limits.ts`.
5. **Poca lógica en un solo lugar.** Si una cosa se decide en cinco archivos, es difícil de cambiar y de auditar: centralízala.
6. **Piezas reemplazables.** El mapa agrupa pines en `clusters.ts` y el almacenamiento está detrás de `StorageProvider`: si mañana cambia la tecnología, se cambia un archivo.

## 5. Base de datos y migraciones

Detalle completo en [CONVENCIONES.md §8](CONVENCIONES.md).

- Cada cambio de esquema es una **migración versionada** en `apps/api/prisma/migrations/`. Flujo: edita `schema.prisma` → `pnpm db:create <nombre>` → **revisa el SQL generado** → `pnpm db:migrate`.
- **Nunca** edites una migración ya aplicada (Prisma lo detecta por checksum).
- **No hay "down"**: para deshacer un cambio se crea otra migración que lo revierta.
- Nada de `prisma db push` ni cambiar tablas a mano.
- Un guardián bloquea `reset`, `push`, `dev` y `create` en producción o contra cualquier base que no sea local (ej. Supabase). Ahí solo se aplican migraciones existentes con `pnpm db:deploy`. No lo desactives.
- Antes de un `deploy` a una base con datos reales, haz un respaldo.

## 6. Pruebas

- **Todo cambio lleva pruebas.** Las unitarias viven junto al código en `tests/`; las de extremo a extremo en `apps/api/test/e2e/`.
- Para una función de negocio, prueba el caso feliz **y los que no deben pasar**: sin sesión, otro usuario, datos inválidos, límites.
- Las pruebas e2e usan una base aparte (`alquiler_test`, se crea y migra sola). Se **niegan** a correr contra una base cuyo nombre no termine en `_test`.
- En las pruebas la caché está apagada (`CACHE_TTL_SECONDS=0`) para que cada prueba vea el estado real.
- Usa el formato en español de `describeCase` (qué se prueba / qué se espera / qué se obtuvo) como las pruebas existentes.
- No des por buena una prueba que falla "a veces": una prueba intermitente suele esconder un error real (así se encontró un fallo del lector de Excel).

## 7. Antes de abrir un cambio (lista)

- [ ] `pnpm lint` sin errores y `pnpm build` compila.
- [ ] `pnpm test:api` y `pnpm test:e2e` en verde.
- [ ] Pruebas nuevas para lo que cambié, incluidos los casos que **no** deben funcionar.
- [ ] README del módulo actualizado; documentación de `docs/` si cambió una regla o un endpoint (`API.md`).
- [ ] **Revisión de seguridad** (si añadí o cambié un endpoint): grupo de rutas correcto; el usuario sale del token; DTO con límites; validé que el recurso sea del usuario; la respuesta no trae campos internos; no registré secretos. Ver [SEGURIDAD.md §8](SEGURIDAD.md).
- [ ] Sin `console.log` de depuración, sin `.env`, claves ni archivos de `uploads/` en el cambio.
- [ ] Migración nueva revisada a mano; no edité migraciones antiguas.
- [ ] Si agregué una dependencia, justifiqué por qué y revisé que esté mantenida.

## 8. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `Docker Desktop is unable to start` | Disco lleno (el disco virtual de Docker crece). Libera espacio; `docker system df` muestra qué ocupa. Para trabajar usa `pnpm dev:db` en vez de levantar todo |
| `P1000 Authentication failed` al migrar | Hay otro Postgres usando el puerto. Aquí el host usa **5433** (`DB_PORT`) |
| `pnpm test:e2e` no conecta | Levanta la base: `pnpm dev:db` |
| El mapa no muestra una propiedad recién creada | La caché pública dura unos segundos (`cache-policies.ts`) |
| `Configuracion insegura para produccion` al arrancar | Faltan secretos propios; ver la lista en [SEGURIDAD.md §7](SEGURIDAD.md) |
| Error `429` en pruebas manuales | Rate limit por IP; espera un minuto o ajusta `rate-limits.ts` en desarrollo |
| El frontend no ve datos del API | Revisa que mande `X-App-Client` y `X-App-Key` y que `CORS_ALLOWED_ORIGINS` incluya su origen |

## 9. Dónde está cada cosa (resumen)

| Quiero saber… | Mira |
|---|---|
| Qué endpoints existen y quién puede usarlos | [API.md](API.md) |
| Por qué algo es seguro y qué no romper | [SEGURIDAD.md](SEGURIDAD.md) |
| Cómo hacer más rápido o proteger de tráfico masivo | [RENDIMIENTO.md](RENDIMIENTO.md) |
| Reglas de arquitectura y estilo | [CONVENCIONES.md](CONVENCIONES.md) |
| Diseño del frontend | [diseno/README.md](diseno/README.md) |
| Qué hace un módulo concreto | `README.md` dentro de su carpeta |
