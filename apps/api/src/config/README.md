# config
Configuración tipada: env.schema.ts valida las variables de entorno al arrancar (falla rápido), env.ts las normaliza y areas/*.config.ts las agrupa por área (app, auth, security, storage, mail...). Se inyecta AppConfig.

**Guardián de producción:** `production-guard.ts` impide arrancar con `NODE_ENV=production` si quedaron claves de desarrollo (JWT, cifrado, claves de cliente), secretos cortos o CORS apuntando a localhost. Ver `docs/SEGURIDAD.md` §7.
