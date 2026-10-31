# dto
Lo que **entra** al módulo. Cada clase valida un body o una query con class-validator. El `ValidationPipe` global rechaza lo que no cumpla y los campos desconocidos.

| Archivo | Para qué ruta |
|---|---|
| create-property.dto.ts | publicar una propiedad |
| update-property.dto.ts | editarla |
| manage-property.dto.ts | cambiar estado y asignar agente |
| search-properties.dto.ts | filtros del listado y del mapa |
| mine-properties.dto.ts | paginación de "mis propiedades" |

Agregar uno: crea `nombre.dto.ts`, decora cada campo con su validación y úsalo como tipo del `@Body()` o `@Query()`. Lo que sale de las rutas va en `../resources/`.
