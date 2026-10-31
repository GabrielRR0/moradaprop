# config
Configuración tipada: env.schema.ts valida las variables de entorno al arrancar (falla rápido), env.ts las normaliza y areas/*.config.ts las agrupa por área (app, auth, security, storage, mail...). Se inyecta AppConfig.

**Prefijo de admin:** `ADMIN_API_PREFIX` define la URL de las rutas de administración (`/api/<prefijo>/...`). `admin-api-prefix.ts` lo expone a `routes/`, que lo lee al importarse (por eso `main.ts` carga el `.env` primero, ver `bootstrap/load-env.ts`).

**Guardián de producción:** `production-guard.ts` impide arrancar con `NODE_ENV=production` si quedaron claves de desarrollo (JWT, cifrado, claves de cliente), secretos cortos o CORS apuntando a localhost, y si `ADMIN_API_PREFIX` es obvio (`admin`, `panel`...) o tiene menos de 8 caracteres. Ver `docs/SEGURIDAD.md` §7.
