# controllers
```
controllers/
  private/
    admin/                       solo ADMIN con 2FA   @AdminGroup()
      admin-users.controller.ts      GET /api/admin/users · PATCH /api/admin/users/:id/status
```
No hay rutas públicas ni de usuario. El administrador no puede cambiar el estado de su propia cuenta (lo valida el service).
