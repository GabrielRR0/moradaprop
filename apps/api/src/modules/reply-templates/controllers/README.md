# controllers
Las rutas HTTP del módulo. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    publisher/               propietario, agencia (y sus agentes) y admin   @PublisherGroup()
      reply-templates.controller.ts   GET / · POST / · PATCH /:id · DELETE /:id
```

No hay `public/`: todas las rutas piden sesión. El autor sale siempre del token; quién puede editar o borrar lo decide `services/access/reply-template.policy.ts` (quien no cumple recibe 404).
