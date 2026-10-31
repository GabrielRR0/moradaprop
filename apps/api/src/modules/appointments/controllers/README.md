# controllers
Las rutas HTTP del módulo, separadas por quién puede usarlas. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    user/                    cualquier usuario con sesión   @AuthGroup()
      appointments.controller.ts            POST / · GET /mine · PATCH /:id/cancel
    publisher/               propietario, agencia y admin   @PublisherGroup()
      received-appointments.controller.ts   GET /received · PATCH /:id/respond · PATCH /:id/complete
```

No hay `public/`: todas las rutas piden sesión.

## Reglas
- El cliente y el dueño salen siempre del token.
- Las rutas fijas (`mine`, `received`) y las de `:id/...` están en controllers distintos y no se pisan.
- Que la cita sea del cliente (cancelar) o de una propiedad que el usuario gestiona (responder y completar) lo valida `services/access/appointment.policy.ts`; quien no cumple recibe 404.
