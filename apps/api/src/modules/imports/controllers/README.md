# controllers
Las rutas HTTP del módulo. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    agency/                  cuentas con rol AGENCY   @AgencyGroup()
      import-templates.controller.ts   GET /template.xlsx · GET /template.csv
      imports.controller.ts            POST / (subir) · GET / (historial) · GET /:id (detalle)
```

No hay `public/`: solo las agencias importan. La agencia sale siempre del token. Las plantillas están en su propio controller, registrado **antes** en `imports.module.ts`, para que `GET /:id` no las capture.
