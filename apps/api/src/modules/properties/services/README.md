# services
La lógica del módulo. El controller y el resolver solo hablan con la fachada `properties.service.ts`; ella delega en el service que corresponde.

```
services/
  properties.service.ts     fachada: un método por cosa que se puede hacer
  catalog/                  lectura pública (cualquiera, con o sin sesión)
  management/               lo que hacen quienes publican
  images/                   fotos de una propiedad
  favorites/                favoritos de un usuario
  access/                   quién puede hacer qué con una propiedad
```

## Reglas
1. **Una carpeta por tema** (un sustantivo: `catalog`, `images`) y **un archivo por caso de uso** dentro.
2. **Nombre: `property-<caso>.service.ts`**. Las lecturas se nombran por lo que devuelven (`search`, `map`, `detail`); las escrituras con `write`.
3. **Lecturas y escrituras no se mezclan.** Las lecturas no tienen efectos y pueden cachearse (`catalog/`); las escrituras auditan y usan transacciones (`management/`).
4. **No se separa por verbo** (crear, editar, borrar): comparten permisos, auditoría y caché, y dividirlos los repetiría.
5. **Un archivo de más de ~150 líneas se divide** y cada pieza se nombra por lo que hace.
6. **Lo que usan varios services** (filtros, constantes) vive en `../utils/`, no se importa de un service a otro de `catalog/`.
7. Otros módulos solo usan lo que exporta el `index.ts` del módulo (`PropertiesService` y `PropertyPolicyService`).

## Agregar algo nuevo
1. Decide el tema: ¿es lectura pública, gestión, fotos, favoritos o permisos?
2. Crea `property-<caso>.service.ts` en esa carpeta (o una carpeta nueva si es un tema nuevo, con su README).
3. Regístralo en `properties.module.ts` y expón un método en la fachada.
