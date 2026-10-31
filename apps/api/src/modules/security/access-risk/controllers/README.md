# controllers
Las rutas HTTP del mini módulo, separadas por quién puede usarlas. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    user/                      cualquier usuario con sesión   @AuthGroup()
      devices.controller.ts            GET /api/auth/devices · DELETE /api/auth/devices/:id
      security-events.controller.ts    GET /api/auth/security-events
    admin/                     solo ADMIN con 2FA             @AdminGroup()
      access-risk-admin.controller.ts  GET /api/admin/security/access-risk
```

Las rutas de usuario se pueden consultar aunque la cuenta aún deba activar su segundo factor (`@AllowWithoutSecondFactor`). Siempre filtran por el usuario del token, nunca por la URL.
