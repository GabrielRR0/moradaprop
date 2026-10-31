# audit
Registro de acciones (quién, qué, desde dónde).

- AuditService.log() guarda un evento y nunca rompe la acción auditada.
- @Audit(accion, recurso) + interceptor global registran rutas marcadas cuando terminan bien.
- utils/sanitize.ts redacta contraseñas, tokens, códigos y secretos antes de guardar.
- Visor admin: GET /api/admin/audit con filtros.

**Estructura:** `controllers/` (`private/admin`), `contracts/` (`dto/` y `resources/`), `services/`, `decorators/` (`@Audit`), `interceptors/` y `utils/`. Cada carpeta nueva tiene su README.
