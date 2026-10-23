# cache
Cache de respuestas costosas y muy repetidas (mapa y busquedas). Guia completa: `docs/RENDIMIENTO.md`.

**Archivos:** `cache-policies.ts` (cuanto dura cada cosa: **se edita aqui**), `cache.service.ts` (el motor), `http-cache.decorator.ts` (`@HttpCache` para el navegador/CDN).

**Como funciona:** `cache.remember(clave, () => consultaCostosa())`.
1. Si la clave esta guardada, la devuelve sin tocar la base.
2. Si no, y otro cliente ya la esta calculando, espera ese mismo resultado ("un solo vuelo"): 1.000 clientes pidiendo el mismo mapa = 1 consulta.
3. Si nadie la calcula, la calcula y la guarda lo que diga su politica (`CACHE_POLICIES`). `CACHE_TTL_SECONDS=0` apaga toda la cache.

**Donde vive:** `CACHE_DRIVER=memory` (este proceso, maximo 500 entradas) o `redis` (compartida entre servidores; es lo que usa Docker). Si Redis falla, la app consulta la base directo.

**Limite conocido:** se actualiza por vencimiento (unos segundos, segun la politica), no por evento. Una propiedad nueva puede tardar hasta `serverSeconds` en aparecer en el mapa publico.
