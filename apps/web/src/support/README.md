# support (web)
Un módulo propio por cada librería de terceros cuya API puede cambiar entre versiones. **La web nunca importa la librería: importa `@/support/<modulo>`.** Si sube de versión mayor, se arregla en un solo lugar.

| Módulo | Se usa como | Envuelve |
|---|---|---|
| `motion` | `MotionSupport.motion.div`, `MotionSupport.AnimatePresence` | motion |
| `query` | `QuerySupport.useQuery(...)` | @tanstack/react-query |
| `maplibre` | `MapLibreSupport.load()`, `MapLibreSupport.Map` | maplibre-gl |
| `maplibre-worker` | `MapLibreWorkerSupport.readWorkerFile(name)` (solo servidor) | archivos del worker de maplibre-gl |
| `turnstile` | `TurnstileSupport.render(contenedor, opciones)` | script de Cloudflare Turnstile (no es un paquete npm) |

## Reglas (las hace cumplir ESLint)
1. La librería solo se importa dentro de su carpeta (`no-restricted-imports` en `eslint.config.mjs`).
2. Desde fuera solo se importa `@/support/<modulo>` (su `index.ts`), nunca sus archivos internos (`local/no-internal-imports`).
3. Cada módulo tiene `index.ts` (`export * as XSupport from './x'`) y `README.md` con la tabla de lo que expone.

## Agregar un módulo
1. Crear `support/<nombre>/` con `<nombre>.ts` (los `export ... from 'paquete'`), `index.ts` y `README.md`.
2. Agregar el paquete a `WEB_WRAPPED` en `eslint.config.mjs`.
3. Migrar los usos directos que queden (`pnpm lint` los señala).
