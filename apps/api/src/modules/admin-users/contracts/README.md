# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| list-users-query.dto.ts | buscar y paginar usuarios |
| set-user-status.dto.ts | suspender o reactivar una cuenta, con un motivo opcional |

| resource | Qué describe |
|---|---|
| admin-user.resource.ts | un usuario del panel, su página y el resultado de cambiar su estado |

Esta carpeta no importa de controllers ni de services; solo al revés.
