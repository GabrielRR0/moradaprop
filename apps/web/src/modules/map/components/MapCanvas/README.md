# MapCanvas
El mapa real del módulo `map`: crea el mapa con `MapLibreSupport`, dibuja los pines y la ficha flotante como HTML encima, y expone al padre una `ref` para volar, acercar y centrar.

| Archivo | Qué es |
|---|---|
| `MapCanvas.tsx` | Crea el mapa una sola vez, repinta el estilo al cambiar modo noche o tipo de mapa, y sincroniza pines, ficha y "mi ubicación". |
| `MapPins.tsx` | Pines y grupos (portales de React sobre los marcadores de MapLibre). |
| `mapcanvas.css` | Contenedor (`.mc-wrap`, `.mc-map`), capa de carga y retoques de los controles de MapLibre. |

## Cómo funciona
- El estilo viene de OpenFreeMap (`NEXT_PUBLIC_MAP_STYLE_URL` / `NEXT_PUBLIC_MAP_DETAIL_STYLE_URL`). Si no carga, el mapa queda liso y los pines siguen.
- El worker se pide a `/maplibre/maplibre-gl-worker.mjs` (`lib.setWorkerUrl`), que sirve `app/maplibre/[file]` desde `node_modules`. Ver `support/maplibre-worker`.
- El mapa necesita **WebGL2**. Sin él `new lib.Map()` lanza `GPUInitializationError`.

## Cosas que rompen el mapa (ya vistas)
- **Mapa vacío con canvas y pines en el DOM.** El contenedor `.mc-map` debe medir lo mismo que `.mc-wrap` (`position: absolute; inset: 0`). MapLibre le agrega la clase `.maplibregl-map { position: relative }` y, con igual especificidad, gana el CSS que cargue después: el contenedor queda con alto 0 y no se ve nada. Por eso la regla es `.mc-wrap .mc-map` (más específica). **No la simplifiques a `.mc-map`.**
- **"WebGL2 is required".** No es del código: el navegador no tiene WebGL2 (aceleración desactivada, GPU degradada por falta de disco o memoria, o una extensión de privacidad que lo bloquea). Probar en incógnito y revisar `chrome://gpu`.
- **"Worker failed to load".** La ruta `/maplibre/maplibre-gl-worker.mjs` debe dar 200 con `text/javascript`. Si da 500, ver `support/maplibre-worker/README.md`.

## Cómo comprobar que el mapa se pinta
Un canvas en el DOM **no** prueba que se vea. Medir también el alto del contenedor (`document.querySelector('.mc-map').getBoundingClientRect().height` debe ser > 0) y mirar una captura real de la pantalla.
