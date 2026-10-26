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

**Sesión:** el login devuelve `accessToken` (15 min). En la **web** el refresh token va en una cookie `httpOnly` (envía las peticiones con `credentials: 'include'`); en **móvil** viene en el body como `refreshToken`. Cuando el access token vence, llama a `POST /api/auth/refresh`. Si varias pestañas o peticiones refrescan a la vez con el mismo token, solo una gana: las demás reciben `401`. **El cliente debe reintentar el refresh una vez** (ya con el cookie nuevo que dejó la ganadora) antes de cerrar la sesión del usuario.

**Errores comunes:** `400` datos inválidos · `401` sin sesión/token vencido · `403` sin permiso (o `code: TWO_FACTOR_REQUIRED`, `EMAIL_NOT_VERIFIED`) · `404` no existe o no te corresponde · `409` conflicto (duplicado, límite de plan) · `429` demasiadas peticiones.

**Leyenda de acceso:** 🌐 público · 🔓 sin sesión pero sensible (límite 10/min) · 🔑 requiere sesión · 👤 requiere rol (y ser dueño/gestor del recurso) · 🛡 administrador con 2FA.

## Auth — `/api/auth`

| Método y ruta | Acceso | Para qué |
|---|---|---|
| `POST /register` | 🔓 | Crea la cuenta (CLIENT, OWNER o AGENCY) y envía un código al correo |
| `POST /verify-email` | 🔓 | Verifica el correo con el código e inicia sesión |
| `POST /resend-code` | 🔓 | Reenvía el código (1 por minuto) |
| `POST /login` | 🔓 | Correo + contraseña. Si hay 2FA devuelve `twoFactorRequired` y `challengeToken` |
| `POST /login/2fa` | 🔓 | Segundo paso: TOTP, código de respaldo o código por correo |
| `POST /login/2fa/email-code` | 🔓 | Envía el código del segundo paso por correo |
| `POST /refresh` | 🔓 | Renueva el access token (rota el refresh token) |
| `POST /password/forgot` · `/password/reset` | 🔓 | Recuperar contraseña con código por correo |
| `POST /google` | 🔓 | Entrar o registrarse con Google (`idToken`) |
| `POST /google/link/confirm` | 🔓 | Confirma con código la vinculación de Google a una cuenta existente |
| `POST /logout` · `/logout-all` | 🔑 | Cierra esta sesión o todas |
| `GET /sessions` · `DELETE /sessions/:id` | 🔑 | Ver y cerrar sesiones propias |
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
| `POST /` | 🔑 | Solicitar una visita (con fecha) o un apartado |
| `GET /mine` | 🔑 | Mis solicitudes |
| `PATCH /:id/cancel` | 🔑 | Cancelar la mía |
| `GET /received` | 👤 OWNER/AGENCY/ADMIN | Leads de mis propiedades (con datos de contacto) |
| `PATCH /:id/respond` | 👤 + gestor | Confirmar o rechazar (`CONFIRM` / `REJECT`) |
| `PATCH /:id/complete` | 👤 + gestor | Marcar la visita como realizada |

Confirmar un **apartado** pasa la propiedad a `RESERVADA`; si el cliente lo cancela, vuelve a `PUBLICADA`.

## Importación masiva — `/api/imports` (👤 AGENCY)

| Ruta | Para qué |
|---|---|
| `GET /template.xlsx` · `/template.csv` | Descargar la plantilla |
| `POST /` | Subir la planilla (campo `file`, multipart). Máx. 5 MB y 500 filas |
| `GET /` · `GET /:id` | Historial y detalle con errores por fila |

## Administración — `/api/admin` (🛡)

| Ruta | Para qué |
|---|---|
| `GET/POST /security` · `DELETE /security/:id` | Bloqueos (IP, CIDR, país, usuario, correo, dominio) |
| `GET /audit` | Auditoría con filtros (`userId`, `action`, `resource`, `page`) |
| `GET /users` · `PATCH /users/:id/status` | Listar usuarios; suspender (corta el acceso al instante y cierra sesiones) o reactivar |

## Salud

`GET /api/health` (🌐, sin cabeceras de app): estado del servicio, para monitoreo.
