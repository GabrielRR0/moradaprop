# catalog
Lectura pública de propiedades: lo que ve cualquier visitante. Ningún archivo escribe en la base de datos.

| Archivo | Qué hace | Caché |
|---|---|---|
| property-search.service.ts | listado con filtros, orden y paginación | sí (`search`) |
| property-map.service.ts | pines del mapa, agrupados en clusters según el zoom | sí (`map`) |
| property-rent-stats.service.ts | alquiler típico por estado | sí (`rentStats`) |
| property-detail.service.ts | ficha completa; la pausada solo la ven quienes la gestionan | no (depende del usuario) |

Los filtros y los estados visibles (`buildPropertyWhere`, `PUBLIC_SEARCH_STATUSES`) están en `../../utils/property-filters.ts` porque los usan la búsqueda, el mapa y las estadísticas.
