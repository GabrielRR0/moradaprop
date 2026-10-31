# settings
Ajustes de la plataforma que el admin cambia **desde el panel**, sin tocar variables de entorno. Hoy: la conexión de correo con **Resend** (API key, correo y nombre del remitente). Es la base para que un comprador del producto lo configure sin editar archivos.

## Cómo funciona
1. **Lista cerrada.** Solo se pueden guardar las claves de `registry/setting-keys.ts` (cada una con su etiqueta, si es secreta y su validación). Una clave inventada responde 404.
2. **Secretos cifrados.** Una clave secreta (la API key) se guarda con AES-256-GCM usando la clave de cifrado del servidor (`ENCRYPTION_KEYS`), con la clave del ajuste como contexto: un valor copiado a otro ajuste no se descifra. Nunca vuelve completa por la API: sale como `re_••••ail9`.
3. **Solo escritura.** El admin puede reemplazar o quitar un secreto, no leerlo. Solo el código del servidor lo descifra, con `SettingsService.get(clave)` (con caché de 30 s).
4. **Acciones sensibles.** Guardar y quitar llevan `@RecentTwoFactor()` (segundo factor de los últimos 5 min). Se audita **qué** ajuste cambió (`settings.update` / `settings.remove`), nunca su valor; por eso no usan `@Audit`, que guarda el cuerpo de la petición.
5. **Correo.** `ResendMailSource` le entrega a `support/mail` la conexión SMTP de Resend (`smtp.resend.com`, usuario `resend`). Sin API key guardada, el correo usa las variables `MAIL_*`. `POST /settings/mail/test` envía un correo de prueba al propio admin y dice si falló y por qué.

## Rutas (bajo `/api/<ADMIN_API_PREFIX>/settings`)
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/` | Lista los ajustes (secretos enmascarados) |
| PUT | `/:key` | Guarda un ajuste (2FA reciente) |
| DELETE | `/:key` | Quita un ajuste (2FA reciente) |
| POST | `/mail/test` | Correo de prueba al admin |

## Agregar un ajuste nuevo
1. Súmalo a `SETTING_KEYS` en `registry/setting-keys.ts` (etiqueta, `secret`, `validate`).
2. Quien lo use pide el valor con `settings.get('clave')`; no hace falta migración.

**Estructura:** `controllers/private/admin`, `contracts/` (`dto/` y `resources/`), `services/`, `registry/` y `tests/`. Cada carpeta lleva su README.
