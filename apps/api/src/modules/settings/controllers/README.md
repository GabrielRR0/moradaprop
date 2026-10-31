# controllers
Rutas del módulo, separadas por quién puede usarlas.

```
controllers/
  private/admin/                 solo administradores con 2FA   @AdminGroup()
    settings.controller.ts           GET / · PUT|DELETE /:key · POST /mail/test
```

Guardar y quitar llevan `@RecentTwoFactor()`. El orden no importa: `POST /mail/test` y `PUT|DELETE /:key` usan métodos distintos.
