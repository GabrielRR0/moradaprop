# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| query-audit.dto.ts | filtros del visor: usuario, acción, recurso y paginación |

| resource | Qué describe |
|---|---|
| audit-log.resource.ts | un evento de auditoría (ya descifrado) y su página |

Esta carpeta no importa de controllers ni de services; solo al revés.
