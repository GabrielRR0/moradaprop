# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| resource | Qué describe |
|---|---|
| health.resource.ts | estado del servicio: app, entorno y hora |

Esta carpeta no importa de controllers ni de services; solo al revés.
