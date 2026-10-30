# maplibre
Envuelve `maplibre-gl` (mapa) junto con su CSS. Es el único lugar que lo importa; el resto usa `MapLibreSupport`.

| Uso | Qué es |
|---|---|
| `MapLibreSupport.load()` | Carga la librería bajo demanda (`import()` dinámico) y devuelve `Library`. |
| `MapLibreSupport.Library` | Tipo de la librería cargada (`lib.Map`, `lib.Marker`...). |
| `MapLibreSupport.Map`, `Marker`, `StyleSpecification` | Tipos del mapa, los pines y el estilo. |

El worker lo sirve `support/maplibre-worker` (ruta `/maplibre/[file]`), sin copiarlo al proyecto.

**Agregar uno:** exportarlo en `maplibre.ts` y añadir una fila aquí.
