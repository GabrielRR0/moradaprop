# maplibre-worker
Sirve el worker de `maplibre-gl` directo desde `node_modules` (solo servidor). Va separado de `maplibre` porque aquel importa CSS y la ruta que sirve el worker no debe cargarlo.

| Uso | Qué es |
|---|---|
| `MapLibreWorkerSupport.readWorkerFile(name)` | Texto de `maplibre-gl-worker.mjs` o `maplibre-gl-shared.mjs`; `null` para cualquier otro nombre (no sale de `dist`). |

Lo usa la ruta `app/maplibre/[file]/route.ts` (`/maplibre/<archivo>`), que `MapCanvas` pasa a `setWorkerUrl`. Así no hay copia generada en el repo (antes `scripts/copy-maplibre-worker.mjs` la dejaba en `public/maplibre/` y ESLint marcaba 1161 errores en ese bundle minificado).

**Agregar otro archivo:** añadir su nombre a `WORKER_FILES` en `maplibre-worker.ts` y un caso en el test.

**Ruta de `dist`.** Se arma con `process.cwd()/node_modules/maplibre-gl/dist` (cwd = `apps/web`). No usar `require.resolve('maplibre-gl/package.json')`: Turbopack lo reescribe a una ruta virtual (`[project]/node_modules/.pnpm/...`) que no existe en disco y la ruta responde 500 (`ENOENT`).

**Probar:** abrir `/maplibre/maplibre-gl-worker.mjs` y `/maplibre/maplibre-gl-shared.mjs`; ambos deben dar 200. Tras cambiar este módulo, `docker compose restart web`.
