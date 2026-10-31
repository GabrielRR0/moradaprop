# controllers
```
controllers/
  private/
    admin/                     solo ADMIN con 2FA   @AdminGroup()
      blocks.controller.ts         GET / · POST / · POST /from-log · DELETE /:id   (/api/admin/security)
```
Crear, quitar y bloquear desde un evento (`from-log`) quedan en la auditoría (`@Audit`) y piden 2FA reciente. `from-log` recibe el id de un evento del visor, toma su IP de ahí y no deja bloquear la IP del propio admin.
