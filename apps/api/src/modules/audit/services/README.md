# services
Pocos archivos, por eso quedan planos.

- **audit-retention.service.ts**: borra los eventos anónimos con más de `AUDIT_RETENTION.anonymousDays` (5) días; corre al arrancar y cada 6 horas.

- **audit.service.ts**: `ipOf(id)` da la IP descifrada de un evento (para bloquearla desde el visor). `log()` guarda un evento (nunca rompe la acción auditada), `list()` alimenta el visor admin y `recentForUser()` da a cada usuario su propio historial de seguridad. Cifra ip, user agent y metadata al guardar y los descifra al leer.
