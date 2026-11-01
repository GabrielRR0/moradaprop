# Mapa de la API

Todas las rutas cuelgan de `/api`. Documentación interactiva: **Swagger en `http://localhost:3001/docs`** (solo fuera de producción). GraphQL en `/api/graphql`.

## Cabeceras obligatorias

Toda petición (salvo `GET /api/health`) debe llevar:

| Cabecera | Valor |
|---|---|
| `X-App-Client` | `web` o `mobile` |
| `X-App-Key` | la clave de esa app (`APP_CLIENT_KEY_WEB` / `APP_CLIENT_KEY_MOBILE`) |
| `Authorization` | `Bearer <accessToken>` en rutas con sesión |

Sin ellas responde `403 Cliente no autorizado`. Más sobre el porqué en [SEGURIDAD.md](SEGURIDAD.md).

**Sesión:** el login devuelve `accessToken` (15 min). En la **web** el refresh token va en una cookie `httpOnly` (envía las peticiones con `credentials: 'include'`); en **móvil** viene en el body como `refreshToken`. Cuando el access token vence, llama a `POST /api/auth/refresh`. Si varias pestañas o peticiones refrescan a la vez con el mismo token, solo una gana: las demás reciben `401`. **Dispositivo:** al iniciar sesión desde un dispositivo nuevo el API entrega un secreto de dispositivo: en la **web** una cookie `httpOnly` `device_token` (ruta `/api/auth`, 30 días; no hay que hacer nada más que enviar `credentials: 'include'`) y en **móvil** el campo `deviceToken` del body, que la app debe guardar de forma segura y enviar en la cabecera `x-device-token` en `login` y `refresh`. **Una sesión solo se renueva con el dispositivo con el que se abrió** (si no, `401` y hay que iniciar sesión de nuevo). **El cliente debe reintentar el refresh una vez** (ya con el cookie nuevo que dejó la ganadora) antes de cerrar la sesión del usuario. Las respuestas de login, refresh y verificación de correo traen `enrollment` (si la cuenta debe activar passkey o 2FA y hasta cuándo); con `SECOND_FACTOR_MODE=enforce`, quien debe activarlo y no lo hizo recibe `403 SECOND_FACTOR_ENROLLMENT_REQUIRED` en todo salvo las rutas de enrolamiento. **Guía completa para el frontend: [FRONTEND-SEGURIDAD.md](FRONTEND-SEGURIDAD.md).**

**✋ "No soy un robot" (opcional):** las rutas marcadas ✋ (`register`, `login`, `resend-code` y `password/forgot`) exigen la cabecera `x-turnstile-token` con la respuesta del widget de Cloudflare Turnstile **solo si** el servidor tiene `TURNSTILE_ENABLED=true` (`GET /auth/human-check` lo dice). Cada token sirve una vez. Errores: `403 HUMAN_CHECK_REQUIRED` (falta), `403 HUMAN_CHECK_FAILED` (falso, vencido o repetido) y `503 HUMAN_CHECK_UNAVAILABLE` (Cloudflare no respondió: reintentar).

**Errores comunes:** `400` datos inválidos · `401` sin sesión/token vencido · `403` sin permiso (o `code: TWO_FACTOR_REQUIRED`, `EMAIL_NOT_VERIFIED`) · `404` no existe o no te corresponde · `409` conflicto (duplicado, límite de plan) · `429` demasiadas peticiones.

**Leyenda de acceso:** 🌐 público · 🔓 sin sesión pero sensible (límite 10/min) · 🔑 requiere sesión · 👤 requiere rol (y ser dueño/gestor del recurso) · 🛡 administrador con 2FA.

## Auth — `/api/auth`

| Método y ruta | Acceso | Para qué |
|---|---|---|
| `GET /human-check` | 🔓 | ¿Está activo el "no soy un robot"? Responde `{ enabled, siteKey }` (la clave pública del widget, o `null` si está apagado). La web lo consulta antes de dibujar sus formularios |
| `POST /register` | 🔓 | Crea la cuenta (CLIENT, OWNER o AGENCY) y envía un código al correo. ✋ |
| `POST /verify-email` | 🔓 | Verifica el correo con el código e inicia sesión |
| `POST /resend-code` | 🔓 | Reenvía el código (1 por minuto). ✋ |
| `POST /login` | 🔓 | Correo + contraseña. Si hay 2FA devuelve `twoFactorRequired`, `challengeToken`, `methods` y `unusual` (true = inicio de sesión raro: solo `totp`/`backup`, sin correo). Si el inicio es muy raro, `methods` puede incluir `"passkey"` (usar `/passkeys/step-up/*`). Si el inicio es muy raro y la cuenta **no tiene 2FA ni passkey**: `403` con `code: "SECOND_FACTOR_REQUIRED"` (activar 2FA desde su dispositivo habitual) |
| `POST /login/2fa` | 🔓 | Segundo paso: TOTP, código de respaldo o código por correo |
| `POST /login/2fa/email-code` | 🔓 | Envía el código del segundo paso por correo |
| `POST /refresh` | 🔓 | Renueva el access token (rota el refresh token) |
| `POST /password/forgot` · `/password/reset` | 🔓 | Recuperar contraseña con código por correo |
| `POST /google` | 🔓 | Entrar o registrarse con Google (`idToken`) |
| `POST /google/link/confirm` | 🔓 | Confirma con código la vinculación de Google a una cuenta existente |
| `POST /logout` · `/logout-all` | 🔑 | Cierra esta sesión o todas |
| `GET /sessions` · `DELETE /sessions/:id` | 🔑 | Ver y cerrar sesiones propias |
| `GET /devices` · `DELETE /devices/:id` | 🔑 | Dispositivos de confianza propios (`current`, `confirmed`, `lastCountry`); quitar uno cierra sus sesiones |
| `POST /passkeys/register/options` · `POST /passkeys/register/verify` | 🔑 | Agregar una passkey (huella, Face ID, Windows Hello). Pide la contraseña y, con `RISK_MODE=enforce`, un dispositivo confirmado (`403 TRUSTED_DEVICE_REQUIRED`) |
| `GET /passkeys` · `PATCH /passkeys/:id` · `DELETE /passkeys/:id` | 🔑 | Mis passkeys (nombre, si se sincroniza, último uso). Una ajena responde `404` |
| `POST /passkeys/login/options` · `POST /passkeys/login/verify` | 🔓 | **Entrar con passkey**, sin correo ni contraseña. Entrega la sesión igual que `/login` (cookie en web, body en móvil) |
| `POST /passkeys/step-up/options` · `POST /passkeys/step-up/verify` | 🔓 | Segundo paso con passkey cuando `/login` devolvió `methods` con `"passkey"` (se envía el `challengeToken`) |
| `GET /second-factor` | 🔑 | ¿Debo activar passkey o 2FA? `{ mode, required, hasFactor, mustEnrollNow, graceEndsAt, recommended, blocked }`. Se puede consultar aunque la cuenta esté limitada |
| `GET /security-events` | 🔑 | Historial de seguridad propio: inicios de sesión raros, bloqueos, dispositivos (país y dispositivo, sin IPs) |
| `POST /2fa/setup` · `/2fa/confirm` · `/2fa/disable` · `/2fa/backup-codes` | 🔑 | Activar, desactivar y regenerar respaldos del 2FA |
| `POST /google/link` · `DELETE /google` | 🔑 | Vincular o desvincular Google |

## Usuarios — `/api/users` (🔑)

| Ruta | Para qué |
|---|---|
| `GET /me` · `PATCH /me` | Ver y editar el propio perfil |
| `POST /me/password` | Cambiar contraseña (cierra las demás sesiones) |
| `POST /me/become-owner` | Sumar el rol de dueño directo |

## Propiedades — `/api/properties`

| Método y ruta | Acceso | Para qué |
|---|---|---|
| `GET /` | 🌐 | Búsqueda con filtros y paginación (máx. 50 por página, 50 páginas) |
| `GET /map` | 🌐 | Pines del mapa; agrupa en clusters según `zoom` |
| `GET /:id` | 🌐 | Ficha. Si hay sesión indica `isFavorite` y `canManage`. Las pausadas solo las ve quien las gestiona |
| `GET /mine` | 👤 OWNER/AGENCY/ADMIN | Propiedades que gestiono, en cualquier estado |
| `GET /favorites` | 🔑 | Mis favoritas |
| `POST /` | 👤 OWNER/AGENCY | Publicar (dueño/agencia salen del token) |
| `PATCH /:id` · `DELETE /:id` | 👤 + gestor | Editar / borrar (borra también las fotos) |
| `PATCH /:id/status` | 👤 + gestor | Cambiar estado (transiciones validadas) |
| `PATCH /:id/agent` | 👤 AGENCY/ADMIN | Asignar un agente de la agencia |
| `POST /:id/images` | 👤 + gestor | Subir hasta 10 fotos (campo `files`, multipart) |
| `DELETE /:id/images/:imageId` · `PATCH /:id/images/:imageId/cover` | 👤 + gestor | Borrar / elegir portada |
| `POST /:id/favorite` · `DELETE /:id/favorite` | 🔑 | Marcar / quitar favorita |

**Filtros de búsqueda y mapa:** `q`, `state`, `municipality`, `urbanization`, `type`, `currency`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, `parkingSpots`, `hasGenerator`, `hasWaterTank`, `hasFiberOptic`, `hasSecurity`, `swLat`, `swLng`, `neLat`, `neLng`. El mapa añade `zoom` (1–20); la búsqueda, `sort`, `page` y `limit`.

**Estados:** `PUBLICADA`, `RESERVADA` (sigue visible con `inReservation: true`, "En Proceso de Reserva"), `ALQUILADA` (no aparece en búsquedas, su ficha sigue abierta), `PAUSADA` (oculta).

**Fotos:** cada imagen trae `thumb` (300×200), `medium` (800×600) y `hd` (hasta 1920×1440) como URLs listas para usar.

**GraphQL** (`/api/graphql`, solo lectura): `properties(...)`, `property(id)`, `propertyMap(...)` (🌐) y `myProperties` (👤). Acepta los mismos filtros.

## Agencias — `/api/agencies`

| Ruta | Acceso | Para qué |
|---|---|---|
| `GET /me` · `PATCH /me` | 👤 AGENCY | Ver / editar mi agencia (equipo y uso del plan). Editar: solo el administrador |
| `POST /me/members/invite` | 👤 admin de agencia | Invitar un agente por correo |
| `DELETE /me/members/:memberId` | 👤 admin de agencia | Quitar un agente |
| `POST /invitations/accept` | 🔑 | Aceptar una invitación (el correo debe coincidir) |

## Citas y apartados — `/api/appointments`

| Ruta | Acceso | Para qué |
|---|---|---|
| `POST /` | 🔑 | Escribirle al anunciante: `type` = `INTERES` · `PREGUNTA` · `VISITA` · `RESERVA` y `message`. No se pide fecha |
| `GET /mine` | 🔑 | Mis solicitudes (con último mensaje y si hay algo nuevo) |
| `PATCH /:id/cancel` | 🔑 | Cancelar la mía |
| `GET /:id` | 🔑 + parte | La conversación (la abren el cliente y quien gestiona; la marca como vista) |
| `POST /:id/messages` | 🔑 + parte | Escribir un mensaje (`body`). Si responde quien gestiona, la solicitud pasa a `ABIERTA` |
| `PATCH /:id/messages/:messageId` | 🔑 + autor | Editar un mensaje propio de texto, **hasta 3 minutos** después de enviarlo (`400` si ya pasó; `403` si es de otra persona). Cada mensaje trae `editableUntil` y la conversación `serverTime` |
| `PATCH /:id/slots/:slotId/accept` | 🔑 + cliente | Aceptar una de las fechas propuestas: queda la visita `CONFIRMADA` |
| `GET /received` | 👤 OWNER/AGENCY/ADMIN | Leads de mis propiedades (con datos de contacto) |
| `POST /:id/slots` | 👤 + gestor | Proponer de 1 a 5 fechas (`slots` en ISO, `note` opcional) |
| `PATCH /:id/close` | 👤 + gestor | Cerrar la conversación |
| `PATCH /:id/respond` | 👤 + gestor | Confirmar o rechazar (`CONFIRM` / `REJECT`) |
| `PATCH /:id/complete` | 👤 + gestor | Marcar la visita como realizada |

Confirmar un **apartado** pasa la propiedad a `RESERVADA`; si el cliente lo cancela, vuelve a `PUBLICADA`.

La conversación **no es en tiempo real** (se pide al abrirla; hay aviso por correo). Quien gestiona deja la propiedad con `PATCH /api/properties/:id/status`: `PUBLICADA`; `RESERVADA` + `acceptsVisits: true` (reservada, aún se piden citas) o `RESERVADA` + `acceptsVisits: false` (reservada del todo: ya no recibe solicitudes). La ficha pública trae `hasScheduledVisit` (sin el día) y, solo con sesión, el `whatsapp` del anunciante.

## Textos reutilizables — `/api/reply-templates` (👤 OWNER/AGENCY/ADMIN)

Borradores para responder mensajes con un toque. Son **privados** de quien los escribe o **compartidos** con el equipo de su inmobiliaria. Título y texto van cifrados.

| Ruta | Para qué |
|---|---|
| `GET /` | Los míos y los compartidos por mi equipo (`canShare` dice si puedo compartir) |
| `POST /` | Guardar uno: `title`, `body` y `shared` (compartir exige pertenecer a una inmobiliaria) |
| `PATCH /:id` | Editar o cambiar si se comparte. Lo hace su autor o el administrador de la inmobiliaria |
| `DELETE /:id` | Borrarlo (mismos permisos) |

Límites: 50 privados por persona y 100 compartidos por inmobiliaria; título hasta 80 y texto hasta 1000 caracteres. Un privado ajeno responde `404` (ni el administrador lo ve).

## Importación masiva — `/api/imports` (👤 AGENCY)

| Ruta | Para qué |
|---|---|
| `GET /template.xlsx` · `/template.csv` | Descargar la plantilla |
| `POST /` | Subir la planilla (campo `file`, multipart). Máx. 5 MB y 500 filas |
| `GET /` · `GET /:id` | Historial y detalle con errores por fila |

## Administración — `/api/<ADMIN_API_PREFIX>` (🛡)

El prefijo sale de la variable `ADMIN_API_PREFIX` (en desarrollo `admin`; en producción un nombre propio y poco obvio, mínimo 8 caracteres: el servidor no arranca con uno obvio). Las rutas de abajo se escriben con `/admin` por ser el valor de desarrollo. Las marcadas ⏱ piden **2FA reciente** (últimos 5 min): si no, `403 RECENT_TWO_FACTOR_REQUIRED` y se llama a `POST /api/auth/reverify/code` o a `/reverify/passkey` (ver [FRONTEND-SEGURIDAD.md](FRONTEND-SEGURIDAD.md) §8.1).

| Ruta | Para qué |
|---|---|
| `GET /security` · `POST /security` ⏱ · `DELETE /security/:id` ⏱ | Bloqueos (IP, CIDR, país, usuario, correo, dominio) |
| `GET /settings` · `PUT /settings/:key` ⏱ · `DELETE /settings/:key` ⏱ | Ajustes de la plataforma (API key de Resend, remitente). Los secretos se guardan cifrados y salen enmascarados (`re_••••ail9`) |
| `POST /settings/mail/test` | Envía un correo de prueba al propio admin con la configuración actual; responde `{ ok, to, error }` |
| `GET /audit` | Auditoría con filtros (`userId`, `action`, `resource`, `ip`, `anonymous=true`, `from`, `to`, `page`). Los eventos sin usuario se borran a los 5 días |
| `POST /security/from-log` ⏱ | Bloquea la IP de un evento de la auditoría (`{ auditLogId, reason?, hours? }`); no deja bloquear la IP del propio admin |
| `GET /users` · `PATCH /users/:id/status` ⏱ | Listar usuarios; suspender (corta el acceso al instante y cierra sesiones) o reactivar |

## Salud

`GET /api/health` (🌐, sin cabeceras de app): estado del servicio, para monitoreo.
