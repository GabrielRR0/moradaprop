# geo
Mini módulo de `security`: de qué país viene cada petición. Lo usan `blocks` (bloqueo por país) y `access-risk` (¿es raro este inicio de sesión?).

**Fuente:** cabeceras del CDN (`cf-ipcountry`, `x-vercel-ip-country`, `x-country-code`). No hay base de datos de IPs ni paquetes de terceros. Sin CDN delante no hay país (`null`). `claimedCountry` devuelve el código tal cual (incluidos `XX` = desconocido y `T1` = Tor de Cloudflare, que se pueden bloquear); `countryOf` los descarta, porque no dicen dónde está nadie.

**Dos preguntas, dos métodos** (`geo.service.ts`):
- `claimedCountry(req)`: el país que *dice* la cabecera. Para **bloquear**: falsificarla no le sirve al atacante.
- `countryOf(req)`: el país **de confianza**. Solo existe con `TRUST_PROXY=true` (el API solo recibe tráfico del CDN). Sin eso devuelve `null`, porque cualquiera podría mandar la cabecera con el país de su víctima para parecer "habitual". Para **decidir riesgo**.

**Middleware** `geoLocate(geo)` (en `bootstrap/configure-app.ts`): pone `req.country` y `@RequestInfo()` lo entrega como `context.country`.

**Cambiar la fuente:** escribir otro `GeoLocator` (`country(headers) → 'VE' | null`) y cambiar el `useClass` de `GEO_LOCATOR` en `geo.module.ts`. Nada más depende de la fuente.

**Despliegue:** para que el país sirva, el servidor debe quedar detrás del CDN con `TRUST_PROXY=true` y aceptar solo tráfico del CDN (si no, la IP y el país también se podrían falsificar).
