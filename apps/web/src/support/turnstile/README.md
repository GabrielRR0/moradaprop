# turnstile
Carga y dibuja el widget **"no soy un robot" de Cloudflare Turnstile**. Es el único lugar que toca el script `challenges.cloudflare.com`; el resto de la web usa `TurnstileSupport`.

| Uso | Qué es |
|---|---|
| `TurnstileSupport.render(contenedor, opciones)` | Dibuja el widget y devuelve un `Widget`. Carga el script una sola vez (si falla, por ejemplo por un bloqueador de contenido, permite reintentar). |
| `TurnstileSupport.RenderOptions` | `sitekey` (clave pública), `onToken`, `onError` y `onExpire`. |
| `TurnstileSupport.Widget` | `reset()` pide un token nuevo (cada uno sirve una sola vez) y `remove()` lo quita de la página. |

El widget se dibuja en modo `interaction-only`: casi siempre se resuelve en silencio y solo aparece si hace falta una acción de la persona. Sigue el tema claro u oscuro de la página y está en español.

**Quién lo usa:** `modules/auth` (`useHumanCheck` y `HumanCheck`). Si está activo o no lo decide la API (`GET /api/auth/human-check`, variable `TURNSTILE_ENABLED`), no esta capa.

**Envuelve** el script de Cloudflare (no hay paquete npm).
