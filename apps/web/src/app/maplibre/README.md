# maplibre
Ruta `GET /maplibre/[file]` que sirve el worker de MapLibre (`maplibre-gl-worker.mjs`) y el módulo que ese worker importa (`maplibre-gl-shared.mjs`).

| Archivo | Qué es |
|---|---|
| `[file]/route.ts` | Pide el texto a `MapLibreWorkerSupport.readWorkerFile` y lo devuelve como `text/javascript` con caché de 1 hora; 404 para cualquier otro nombre. |

La lógica (lista blanca de dos nombres y lectura desde `node_modules`) está en `src/support/maplibre-worker/`; aquí solo se expone por HTTP. `MapCanvas` pasa `/maplibre/maplibre-gl-worker.mjs` a `setWorkerUrl`.

**Comprobar:** `http://localhost:3000/maplibre/maplibre-gl-worker.mjs` debe responder 200 y mostrar JavaScript (unos 500 KB).
