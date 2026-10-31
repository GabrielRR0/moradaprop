# controllers
Las rutas HTTP del módulo. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    user/                    cualquier usuario con sesión   @AuthGroup()
      users.controller.ts    GET y PATCH /me · POST /me/password · POST /me/become-owner
```

No hay `public/`: todas las rutas piden sesión. Ninguna recibe un `userId`: el usuario sale siempre del token. `GET /me` se puede usar aunque la cuenta aún deba activar su segundo factor (`@AllowWithoutSecondFactor`), para que el frontend sepa qué le falta.
