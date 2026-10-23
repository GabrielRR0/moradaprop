# Módulo `map`

Búsqueda en el **mapa real de Venezuela** (MapLibre) con pines, grupos, ficha flotante, lista lateral y filtros.
Mantiene el diseño de `docs/diseno/pantallas/Mapa.dc.html`, `Movil.dc.html` y `Filtros.dc.html`.
**Estas pantallas están editadas a mano**: el conversor (`scripts/diseno-a-react`) las omite (`handEdited`).

| Ruta       | Página        | Pantallas                                                                  |
| ---------- | ------------- | -------------------------------------------------------------------------- |
| `/mapa`    | `MapPage`     | `MapScreen` (escritorio) o `MapMobileScreen` (teléfono): solo se monta una |
| `/filtros` | `FiltersPage` | `FiltersScreen`                                                            |

## Estructura

```
map/
  index.ts                         # PADRE: exporta MapPage y FiltersPage
  components/
    MapPage.tsx, FiltersPage.tsx   # eligen escritorio/móvil (ClientResponsive) y envuelven en Suspense
    MapCanvas/                     # el mapa: MapLibre + pines (MapPins) + estilos del diseño (mapcanvas.css)
    MapScreen/                     # escritorio: MapFilterBar, MapResults (lista), MapPane (mapa + botones)
    MapMobileScreen/               # teléfono: mapa completo + hoja inferior con tarjetas + pestañas
    FiltersScreen/                 # panel de filtros (Básico / Avanzado)
    shared/                        # ChipMenu (menús de precio/habitaciones/orden), PropertyPopup (ficha flotante)
  hooks/
    useMapExplorer.ts              # TODO el estado del mapa: filtros, pines, lista, selección, buscador, URL
    useFiltersScreen.ts            # filtros del panel + conteo real "Ver N propiedades"
  services/                        # datos: API real o datos de ejemplo (ver abajo)
  utils/                           # format (precios, textos), places (ciudades/estados), map-style, amenities
  tests/map.test.ts
```

## Cómo funciona

1. **Mapa.** `MapCanvas` crea el mapa con `maplibre-gl` (zoom, arrastre, pellizco, límites de Venezuela, mínimo
   zoom 4.6). El estilo base es OpenFreeMap (`NEXT_PUBLIC_MAP_STYLE_URL`, gratis, sin clave) y `utils/map-style.ts`
   lo **repinta con los colores del diseño** (`--map-bg`, `--map-road`, `--map-park`, `--map-water`), así que cambia
   solo con el modo noche. El botón "tipo de mapa" alterna con el estilo detallado (`NEXT_PUBLIC_MAP_DETAIL_STYLE_URL`).
   Si el estilo no carga (sin internet) el mapa queda liso pero los pines siguen funcionando.
2. **Worker.** Next no empaqueta bien el worker de MapLibre, por eso `apps/web/scripts/copy-maplibre-worker.mjs` lo
   copia a `public/maplibre/` antes de `dev` y `build` (carpeta ignorada por git).
3. **Datos.** Cada vez que el mapa se mueve (espera 280 ms) `useMapExplorer` pide:
   - `GET /api/properties/map` con la caja visible (+25 % de margen), `zoom` (MapLibre + 1 = escala del backend) y filtros → pines y grupos;
   - `GET /api/properties` con la caja exacta, 20 por página ("Ver más") → lista y total;
   - `GET /api/properties/:id` solo si el pin elegido no está en la lista.
     TanStack Query guarda cada consulta y mantiene lo anterior en pantalla mientras llega lo nuevo.
4. **Pines.** Son HTML sobre el mapa (portales de React) con las clases del diseño (`.pin`, `.cluster`, `.pop`).
   Tocar un grupo acerca el mapa; tocar un pin abre la ficha flotante y resalta la tarjeta de la lista (y al revés).
5. **Buscador.** `utils/places.ts` tiene estados, ciudades y urbanizaciones con su centro: al elegir una el mapa vuela
   allí. Si se escribe algo que no es un lugar, se usa como texto de búsqueda (`q`).
6. **URL compartible.** Filtros, centro y zoom van en la URL (`?maxPrice=500&hasGenerator=true&c=10.49,-66.9&z=11`).
   `/filtros` lee y devuelve esos mismos parámetros.

## Fuente de datos (`services/`)

`NEXT_PUBLIC_USE_MOCKS`: `auto` (por defecto) usa el API y, si no responde, **datos de ejemplo** (≈60 propiedades en las
mismas ciudades que `apps/api/prisma/seed.ts`) mostrando el aviso "Datos de ejemplo"; `true` siempre ejemplo; `false` solo API.
El API se llama con `X-App-Client: web` y `X-App-Key` (`NEXT_PUBLIC_APP_CLIENT_KEY`) y el origen debe estar en
`CORS_ALLOWED_ORIGINS`. `property-api.ts` aplana los marcadores (`point` anidado → plano).

## Pendiente / depende del backend

- Cada grupo (`cluster`) debería traer su caja (`bounds`) para acercar exacto; hoy se acerca 2.2 niveles al centro.
- Buscador de ubicaciones del API (`/locations/search`) para reemplazar la lista fija de `places.ts`.
- Tasa del dólar para "Ver en Bs.".
- "Dibujar mi zona" y Favoritos/Alertas del mapa son botones sin función todavía.
