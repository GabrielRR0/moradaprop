# controllers
```
controllers/
  private/
    admin/                     solo ADMIN con 2FA   @AdminGroup()
      blocks.controller.ts         GET / · POST / · DELETE /:id   (/api/admin/security/blocks)
```
Crear y quitar una regla quedan en la auditoría (`@Audit`).
