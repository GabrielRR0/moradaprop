# controllers
Las rutas HTTP del módulo, separadas por quién puede usarlas. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    user/                    cualquier usuario con sesión   @AuthGroup()
      appointments.controller.ts            POST / · GET /mine · PATCH /:id/cancel
      appointment-thread.controller.ts      GET /:id · POST /:id/messages · PATCH /:id/messages/:messageId · PATCH /:id/slots/:slotId/accept   (la conversación; el ÚLTIMO del módulo por su GET /:id)
    publisher/               propietario, agencia y admin   @PublisherGroup()
      received-appointments.controller.ts   GET /received · PATCH /:id/respond · PATCH /:id/complete · POST /:id/slots · PATCH /:id/close
```

No hay `public/`: todas las rutas piden sesión.

## Reglas
- El cliente y el dueño salen siempre del token.
- Las rutas fijas (`mine`, `received`) van antes que `GET :id`: en el módulo, `AppointmentThreadController` se registra al final.
- La conversación la abren las dos partes, por eso su controller es `@AuthGroup()` y el acceso real lo decide la política (no el rol).
- Que la cita sea del cliente (cancelar, aceptar una fecha) o de una propiedad que el usuario gestiona (responder, completar, proponer fechas, cerrar) lo valida `services/access/appointment.policy.ts`; quien no cumple recibe 404.
