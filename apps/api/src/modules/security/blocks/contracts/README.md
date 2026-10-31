# contracts
Todo lo que entra y sale de este mini módulo.

```
contracts/
  dto/         lo que ENTRA
  resources/   lo que SALE
```

| dto | Para qué ruta |
|---|---|
| create-block-rule.dto.ts | crear una regla de bloqueo (tipo, valor, motivo y vencimiento opcionales) |

| resource | Qué describe |
|---|---|
| block-rule.resource.ts | una regla de bloqueo; la lista y el borrado devuelven este mismo tipo |

Esta carpeta no importa de controllers ni de services; solo al revés.
