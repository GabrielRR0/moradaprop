# services
Un solo service, por eso queda plano.

- **audit.service.ts**: `log()` guarda un evento (nunca rompe la acción auditada), `list()` alimenta el visor admin y `recentForUser()` da a cada usuario su propio historial de seguridad. Cifra ip, user agent y metadata al guardar y los descifra al leer.
