# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| create-reply-template.dto.ts | guardar un texto: `title`, `body` y si se comparte con el equipo (`shared`) |
| update-reply-template.dto.ts | editarlo: solo lo que se envía cambia |

| resource | Qué describe |
|---|---|
| reply-template.resource.ts | un texto ya descifrado (con `shared`, `author`, `mine` y `canEdit`) y la lista con `canShare` |

Esta carpeta no importa de controllers ni de services; solo al revés.
