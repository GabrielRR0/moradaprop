# audit
Registro de acciones (quién, qué, desde dónde).

- AuditService.log() guarda un evento y nunca rompe la acción auditada.
- @Audit(accion, recurso) + interceptor global registran rutas marcadas cuando terminan bien.
- utils/sanitize.ts redacta contraseñas, tokens, códigos y secretos antes de guardar.
- Visor admin: GET /api/admin/audit con filtros: `userId`, `action` (prefijo), `resource`, `ip`, `anonymous=true` (solo eventos sin usuario), `from` / `to` y paginación.
- **Eventos anónimos** (sin usuario): intentos de login a cuentas que no existen (`auth.login.unknown`, sin guardar el correo escrito), amenazas detectadas y accesos denegados. Llevan IP y navegador de gente sin cuenta, por eso **se borran a los 5 días** (`policy.ts`, `AuditRetentionService`: al arrancar y cada 6 horas). Los eventos con usuario no se borran solos.
- **Filtrar por IP:** la IP va cifrada; `AuditLog.ipHash` (HMAC) permite buscarla sin guardarla en claro y nunca sale en una respuesta. Los eventos anteriores a esa columna no se encuentran por IP.
- **Qué NO se guarda:** las visitas normales (páginas, búsquedas) de nadie. Eso lo ve el CDN o el hosting (Cloudflare); aquí solo está lo que solo la app sabe: quién es el usuario y las decisiones de seguridad.
- **Bloquear una IP desde un evento:** `POST /api/admin/security/from-log` (módulo `security/blocks`).

**Estructura:** `controllers/` (`private/admin`), `contracts/` (`dto/` y `resources/`), `services/`, `decorators/` (`@Audit`), `interceptors/` y `utils/`. Cada carpeta nueva tiene su README.
