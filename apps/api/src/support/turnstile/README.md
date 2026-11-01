# turnstile
Validación del widget **"no soy un robot" de Cloudflare Turnstile**. Es la única puerta hacia Cloudflare: nadie más habla con `challenges.cloudflare.com`.

| Uso | Qué es |
|---|---|
| `TurnstileSupport.Module` | Módulo de Nest (global) a importar. |
| `TurnstileSupport.Service` | Provider que se inyecta; `verify(token, ip?)` devuelve el resultado. |
| `TurnstileSupport.Result` | Tipo del resultado: `'valid'`, `'invalid'` o `'unavailable'`. |

**Cómo funciona:** el navegador resuelve el widget y obtiene un token; la API se lo manda a Cloudflare junto con la clave secreta (`TURNSTILE_SECRET_KEY`) y la IP, y Cloudflare confirma si es válido. Cada token sirve **una sola vez** y vence a los 5 minutos.

**Resultados:**
- `valid`: es de una persona y no se había usado.
- `invalid`: Cloudflare lo rechazó (falso, vencido o repetido) o no tiene forma de token (vacío o de más de 2048 caracteres, sin llamar a Cloudflare).
- `unavailable`: no se pudo preguntar (red caída, más de 5 s de espera, error de Cloudflare o clave secreta rechazada). Quien llama decide qué hacer; el guard `HumanCheckGuard` **niega** el acceso (falla cerrado) con un código distinto para que la web deje reintentar.

Quién lo usa y cómo se activa: `common/security/guards/human-check.guard.ts` y la variable `TURNSTILE_ENABLED` (ver `docs/SEGURIDAD.md`).

**Envuelve** el servicio web `siteverify` de Cloudflare (con `fetch`; no hay paquete).
