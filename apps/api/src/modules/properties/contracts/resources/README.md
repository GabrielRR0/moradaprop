# resources
Lo que **sale** del módulo. Así como `../dto/` dice qué entra, aquí cada archivo dice qué forma tiene una respuesta.

| Archivo | Respuesta | La usan |
|---|---|---|
| property-image.resource.ts | una foto con sus 3 tamaños | tarjeta y ficha |
| property-card.resource.ts | tarjeta de listado (incluye `acceptsVisits`: false = reservada del todo) | búsqueda, mine, favoritos |
| property-detail.resource.ts | ficha completa; suma `hasScheduledVisit` (hay una visita acordada, sin decir el día) y `whatsapp` (solo con sesión) | detalle, crear, editar, estado, agente |
| property-list.resource.ts | página de tarjetas (`items`, `total`, `page`, `limit`) | búsqueda, mine |
| property-map.resource.ts | pines y clusters del mapa | mapa |
| rent-stats.resource.ts | alquiler típico por estado | rent-stats |
| property-actions.resource.ts | respuestas cortas: favorito, fotos subidas, portada | favoritos e imágenes |

## Son interfaces, nada más
```ts
export interface FavoriteResource {
  favorite: boolean;
}
```
No tienen lógica ni decoradores: solo campos y comentarios. Si el campo no está aquí, no sale por la API.

## Cómo se usan
1. El **mapper** (`utils/property-mapper.ts`) y los **services** declaran lo que devuelven: `Promise<PropertyListResource>`.
2. El **controller** repite ese tipo en su firma, así se lee de un vistazo qué entrega cada ruta.
3. Si el código devuelve algo distinto a la interfaz, TypeScript no compila. Es el equivalente a que el Resource mande.

## Para agregar una respuesta
1. Crea `nombre.resource.ts` con la interface y un comentario por cada campo que no sea obvio.
2. Expórtala en `index.ts`.
3. Úsala como tipo de retorno en el service y en el controller.

Regla: una respuesta nueva = un archivo nuevo. Si dos respuestas comparten campos, una `extends` la otra (como `PropertyDetailResource` extiende a la tarjeta).
