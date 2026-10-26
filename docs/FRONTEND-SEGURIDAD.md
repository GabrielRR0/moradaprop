# Guía de seguridad para el frontend (login, registro y advertencias)

Para quien construye la web (`apps/web`) y, después, la app móvil. Explica **cómo debe comportarse el frontend** para trabajar con la seguridad del API: qué enviar, qué pantallas hacen falta, qué responde el servidor en cada caso y qué debe mostrar la interfaz.

> Todo lo de este documento está verificado contra el API real (las respuestas de ejemplo son capturas de pruebas de integración). Detalle de cada ruta: [API.md](API.md). Por qué existen estas defensas: [SEGURIDAD.md](SEGURIDAD.md).

---

## 1. Lo esencial en 8 puntos

1. **Cada petición lleva dos cabeceras** (`x-app-client`, `x-app-key`) y, en la web, `credentials: 'include'`.
2. El **access token vive solo en memoria** (dura 15 min). El **refresh token y el dispositivo viajan en cookies `httpOnly`** que el JavaScript no puede leer: no los guardes ni los toques.
3. Al abrir la app, la web pide un access token con `POST /auth/refresh` (la cookie hace el resto). No existe "recordar sesión" en `localStorage`.
4. **Login no siempre devuelve una sesión**: puede pedir un **segundo paso** (app autenticadora, código de respaldo o **passkey**: huella / Face ID / Windows Hello) o rechazar con un `code`. Hay que modelarlo como una máquina de estados (§6).
5. **Passkeys**: el navegador habla con el sistema operativo (`navigator.credentials`); el servidor nunca ve la huella ni la cara (§7).
6. **Admin, dueños y agencias deben activar passkey o 2FA.** Mientras no lo hagan, el API solo deja usar las rutas de enrolamiento; todo lo demás responde `403 SECOND_FACTOR_ENROLLMENT_REQUIRED` (§8).
7. El servidor registra **avisos de seguridad** de cada cuenta (inicio de sesión desde otro país, dispositivo nuevo, bloqueos). El frontend debe mostrarlos (§9). **No se envían por correo.**
8. Los mensajes de error útiles vienen en `code` (cuando existe) y `message`. Muestra tu propio texto según el `code`; nunca dependas del texto del servidor para la lógica.

---

## 2. Configuración base

### Cabeceras y cookies

| Qué | Valor | Notas |
|---|---|---|
| `x-app-client` | `web` o `mobile` | Obligatoria en **todas** las rutas (salvo `/health`). Sin ella: `403 "Cliente no autorizado"` |
| `x-app-key` | `NEXT_PUBLIC_APP_CLIENT_KEY` (web) | Filtra tráfico ajeno; **no es un secreto** (viaja en el navegador) |
| `credentials` | `'include'` en `fetch` | Para que el navegador envíe y reciba las cookies |
| `Authorization` | `Bearer <accessToken>` | En las rutas con sesión |
| `x-device-token` | secreto del dispositivo | **Solo móvil** (la web usa la cookie). Ver §10 |

Cookies que pone el API en la web (no las puedes leer, solo viajan):

| Cookie | Qué es | Vida |
|---|---|---|
| `refresh_token` | Renueva la sesión | 7 días (rota en cada refresh) |
| `device_token` | Identifica este navegador como dispositivo conocido | 30 días sin uso (se renueva) |

Ambas son `HttpOnly`, `SameSite=Lax`, `Secure` en producción y **ruta `/api/auth`** (solo se envían a `/api/auth/*`).

### Que las cookies funcionen (lo que más falla)

- La web y el API deben ser **el mismo sitio** (mismo dominio registrable: `app.tudominio.com` + `api.tudominio.com` sirve). Con dominios distintos, el navegador **no envía** las cookies y todo parece "sin sesión".
- Lo más simple: servir el API bajo el mismo origen de la web con un *rewrite* de Next.js (`/api/*` → API). Así no hay CORS ni problemas de cookies.
- El origen de la web debe estar en `CORS_ALLOWED_ORIGINS` del API, y para passkeys en `WEBAUTHN_ORIGINS` (§7).
- Las cookies de `/api/auth` **no las ve el servidor de Next.js** (componentes de servidor, middleware). La sesión se maneja en el cliente.
- **HTTPS** en producción (las cookies `Secure` y las passkeys lo exigen). `localhost` funciona sin HTTPS.

### Variables del frontend

```
NEXT_PUBLIC_API_URL=/api                      # o la URL del API si no usas rewrite
NEXT_PUBLIC_APP_CLIENT_KEY=<clave de la web>  # la misma APP_CLIENT_KEY_WEB del API
```

---

## 3. Cliente HTTP recomendado

Un solo módulo (`api.ts`) que concentre: cabeceras, el access token en memoria, **un único refresh a la vez** y el reintento. Así ninguna pantalla repite esta lógica.

```ts
// api.ts — esqueleto recomendado
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(public status: number, public code: string | undefined, message: string, public body?: unknown) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshing: Promise<AuthSession | null> | null = null;

export const setAccessToken = (token: string | null) => (accessToken = token);

async function raw(path: string, init: RequestInit & { json?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-app-client': 'web',
      'x-app-key': process.env.NEXT_PUBLIC_APP_CLIENT_KEY!,
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.code, Array.isArray(body?.message) ? body.message[0] : body?.message, body);
  return body;
}

/** Renueva la sesion. Si varias peticiones lo piden a la vez, solo sale UNA (el servidor rechaza las repetidas). */
export function refreshSession(): Promise<AuthSession | null> {
  refreshing ??= raw('/auth/refresh', { method: 'POST', json: {} })
    .then((s: AuthSession) => { accessToken = s.accessToken; return s; })
    .catch(() => { accessToken = null; return null; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function api(path: string, init: Parameters<typeof raw>[1] = {}) {
  try {
    return await raw(path, init);
  } catch (e) {
    // 401 con sesion: el access token vencio. Se renueva UNA vez y se reintenta.
    if (e instanceof ApiError && e.status === 401 && accessToken && !path.startsWith('/auth/')) {
      if (await refreshSession()) return raw(path, init);
    }
    throw e;
  }
}
```

Reglas que debe cumplir ese módulo:

- **Un solo refresh en vuelo.** El servidor está hecho para que, si dos pestañas o peticiones refrescan con el mismo cookie, **gane una y la otra reciba `401`** sin cerrar la sesión. Por eso: si te llega un `401` en `/auth/refresh`, espera a que termine el refresh que ya está en curso y vuelve a intentar **una vez** antes de mandar al usuario al login.
- **Reintentar una sola vez.** Un segundo `401` = sesión terminada → limpiar estado y mostrar el login.
- **Nada de tokens en `localStorage`/`sessionStorage`.** Si se filtran por XSS, el atacante tiene la sesión. En memoria, sí.
- **Al arrancar la app** llama `refreshSession()`: si devuelve sesión, el usuario ya estaba logueado; si no, muestra el login.

---

## 4. Tipos de las respuestas

```ts
export interface PublicUser {
  id: string; email: string; name: string; phone: string | null; avatarUrl: string | null;
  roles: Array<'CLIENT' | 'OWNER' | 'AGENCY' | 'ADMIN'>;
  emailVerified: boolean; twoFactorEnabled: boolean; hasPassword: boolean;
}

/** Estado del segundo factor. Viene en login, refresh, verify-email y en GET /auth/second-factor. */
export interface Enrollment {
  mode: 'off' | 'monitor' | 'enforce';
  required: boolean;       // por su rol (admin, dueño, agencia) DEBE tener passkey o 2FA
  hasFactor: boolean;      // ya tiene al menos una passkey o el 2FA con app
  mustEnrollNow: boolean;  // vencio el plazo y no lo tiene
  graceEndsAt: string | null; // ISO: hasta cuando puede activarlo
  recommended: boolean;    // no es obligatorio (cliente), pero conviene
  blocked: boolean;        // esta limitado a las rutas de enrolamiento (solo con mode 'enforce')
}

/** Sesion lista (web: el refresh_token y el device_token van en cookies, no en el body). */
export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  enrollment?: Enrollment;
  // Solo movil: el body trae tambien refreshToken y, si es un dispositivo nuevo, deviceToken
  refreshToken?: string;
  deviceToken?: string;
}

/** Login que pide un segundo paso. */
export interface LoginChallenge {
  twoFactorRequired: true;
  challengeToken: string;      // dura 5 minutos
  methods: Array<'passkey' | 'totp' | 'backup' | 'email'>;
  unusual: boolean;            // true = inicio de sesion inusual (otro pais, red o dispositivo)
}

export type LoginResult = AuthSession | LoginChallenge | { linkRequired: true; email: string; message: string }; // linkRequired: solo Google

/** Errores: SIEMPRE tienen status y message; `code` solo en los de seguridad. */
export type ApiErrorBody = { statusCode: number; message: string | string[]; error?: string; code?: string };

export const isChallenge = (r: LoginResult): r is LoginChallenge => 'twoFactorRequired' in r;
```

---

## 5. Registro

**Flujo:** `POST /auth/register` → pantalla "te enviamos un código" → `POST /auth/verify-email` → **ya queda con sesión iniciada**.

```
POST /auth/register   { email, password, name, accountType: 'CLIENT'|'OWNER'|'AGENCY', phone?, agencyName? }
  201 { message: "Si el correo es valido, te enviamos un codigo de verificacion" }   // SIEMPRE lo mismo, exista o no el correo
POST /auth/verify-email   { email, code }           // código de 6 dígitos
  200 AuthSession  (+ cookies refresh_token y device_token en web)
POST /auth/resend-code    { email }                 // reenviar el código (hay un tiempo de espera entre envíos)
```

Qué hacer:

- **No digas si el correo ya existía.** El API responde igual a propósito; tu pantalla también ("Si el correo es válido, te enviamos un código").
- Validación en el formulario (el API la repite): contraseña 8–128 caracteres con **letras y números**, nombre 2–100, teléfono `+` y 7–15 dígitos, `agencyName` obligatorio si `accountType = 'AGENCY'`. Un `400` trae `message` como **lista de textos**: muestra el primero o todos.
- Tras `verify-email` ya hay sesión: guarda `accessToken` en memoria, lee `enrollment` y sigue el §8:
  - `OWNER` o `AGENCY` **nuevos**: `enrollment.blocked === true` desde el primer instante → llévalos directo a **"Protege tu cuenta"** (pantalla de activar passkey o 2FA) antes de cualquier otra cosa.
  - `CLIENT`: `enrollment.recommended === true` → entra normal y muéstrale una invitación (cerrable) a activar huella/Face ID.
- Esta primera entrada deja al navegador como **dispositivo de confianza** (cookie `device_token`). Es lo que más adelante permite activar passkeys y usar VPN sin fricción.
- **Límite:** si una misma IP crea muchas cuentas en una hora, el API (en modo estricto, `THREAT_MODE=enforce`) la bloquea unas horas: `403 "Acceso restringido"`.

---

## 6. Login: una máquina de estados

`POST /auth/login { email, password }` puede terminar en **cuatro** resultados distintos. La pantalla de login debe manejarlos todos:

```
                      ┌─ AuthSession ───────────────► entrar a la app (revisar enrollment, §8)
 POST /auth/login ────┼─ LoginChallenge ────────────► paso 2 (según `methods`)
                      ├─ 403 + code ────────────────► mensaje específico (tabla de abajo)
                      └─ 401 / 429 ─────────────────► credenciales inválidas / demasiados intentos
```

### Resultado A: sesión lista (`200`, trae `accessToken`)
Guarda el token en memoria, revisa `enrollment` (§8) y carga los avisos de seguridad (§9).

### Resultado B: segundo paso (`200`, trae `twoFactorRequired: true`)

```json
{ "twoFactorRequired": true, "challengeToken": "eyJ...", "methods": ["passkey","totp","backup"], "unusual": true }
```

- `unusual: true` significa que el servidor vio algo raro (otro país, red o dispositivo nuevo). **Díselo al usuario**: *"Detectamos un inicio de sesión inusual. Verifica que eres tú."* Con `unusual: true` **no habrá** opción de código por correo: solo passkey, app o código de respaldo.
- `methods` dice **qué puede usar esta cuenta**. Muestra solo esos botones y ordénalos: `passkey` primero.

| `methods` incluye | Qué hacer | Rutas |
|---|---|---|
| `passkey` | Botón "Usar huella / Face ID" | `POST /auth/passkeys/step-up/options` → `navigator.credentials.get()` → `POST /auth/passkeys/step-up/verify` (§7) |
| `totp` | Campo de 6 dígitos (app autenticadora) | `POST /auth/login/2fa { challengeToken, code }` |
| `backup` | Mismo campo acepta un código de respaldo `xxxxx-xxxxx` (se gasta al usarse) | `POST /auth/login/2fa` |
| `email` | Enlace "mejor envíame un código por correo" | `POST /auth/login/2fa/email-code { challengeToken }` y luego `/auth/login/2fa` con el código |

- El `challengeToken` **vence a los 5 minutos**: si pasa, vuelve al paso de correo y clave.
- Éxito de cualquiera de los métodos → `AuthSession` (igual que el resultado A).
- **Código incorrecto → `401 "Codigo invalido"`.** Déjalo reintentar, pero avísale: **tras 3 fallos en un inicio inusual la cuenta se bloquea 30 minutos** (`403`) y se avisa al dueño. Muestra algo como *"Te quedan pocos intentos"* a partir del segundo fallo.

### Resultado C: rechazos con `code`

| Status | `code` | Significado | Qué mostrar |
|---|---|---|---|
| 403 | `EMAIL_NOT_VERIFIED` | La cuenta existe pero no verificó el correo | Llevarlo a la pantalla del código (con "reenviar") |
| 403 | `SECOND_FACTOR_REQUIRED` | Inicio **muy raro** y la cuenta **no tiene** passkey ni 2FA | *"Por seguridad, entra desde tu dispositivo habitual y activa huella/Face ID o la verificación en dos pasos para poder entrar desde otros lugares."* No hay forma de seguir desde aquí |
| 403 | — (`"Cuenta bloqueada temporalmente…"`) | Bloqueo por fallos de clave o de segundo factor | Mostrar el mensaje y que pruebe más tarde (o entre con su passkey, que no se bloquea por esto) |
| 403 | — (`"Acceso restringido"`) | Su IP, país o cuenta está bloqueado | Mensaje genérico; no dar detalles ni forma de evadirlo |
| 403 | — (`"Cuenta suspendida"`) | Cuenta suspendida por un admin | Mensaje y contacto de soporte |

### Resultado D: errores generales

| Status | Cuándo | Qué hacer |
|---|---|---|
| 401 | `"Credenciales invalidas"` | Correo o clave mal. **El mensaje es el mismo exista o no el correo**: no lo cambies por "el correo no existe" |
| 400 | Validación (`message` es una lista) | Marcar los campos |
| 429 | Demasiados intentos (10 por minuto por IP en login, registro y códigos) | *"Demasiados intentos, espera un momento"*; deshabilita el botón unos segundos |

### Entrar solo con passkey (sin correo ni clave)
Un botón **"Entrar con huella / Face ID"** debajo del formulario: `POST /auth/passkeys/login/options` → `navigator.credentials.get()` → `POST /auth/passkeys/login/verify` → `AuthSession`. Funciona aunque el usuario no escriba nada (el dispositivo ofrece sus passkeys). Si el usuario cancela el diálogo del sistema, **no es un error**: no muestres nada.

### Google
`POST /auth/google { idToken }` devuelve una sesión, un desafío (igual que el login) o `{ linkRequired: true, email, message }` si ya existe una cuenta con ese correo: en ese caso pide el código que llegó al correo y llama a `POST /auth/google/link/confirm { idToken, code }`. Pasa por el **mismo análisis de riesgo** que el login normal.

### Recuperar contraseña
`POST /auth/password/forgot { email }` (respuesta genérica) → `POST /auth/password/reset { email, code, newPassword }`. Al restablecerla se cierran **todas** las sesiones: el usuario debe volver a entrar. (Cambiarla desde su cuenta, `POST /users/me/password`, cierra las *demás* y conserva la actual.)

---

## 7. Passkeys en el navegador (huella, Face ID, Windows Hello)

Una *passkey* es una clave que vive en el dispositivo del usuario y se desbloquea con su huella, su cara o el PIN del equipo. El servidor solo guarda la parte pública. No se puede *phishear* (la firma está atada al dominio).

### Requisitos
- **HTTPS** (o `localhost`).
- El **dominio** de la web debe coincidir con `WEBAUTHN_RP_ID` y su origen exacto estar en `WEBAUTHN_ORIGINS` del API. Si no coinciden, el navegador responde `SecurityError`.
- Detectar soporte: `window.PublicKeyCredential` existe. Si no, **oculta** los botones de passkey.

### Registrar una passkey (usuario con sesión)

```ts
async function registrarPasskey(password: string, label?: string) {
  // 1. Opciones del servidor (pide la contraseña otra vez y un dispositivo ya confirmado)
  const options = await api('/auth/passkeys/register/options', { method: 'POST', json: { password } });

  // 2. El sistema operativo pide huella / Face ID / PIN
  const credential = (await navigator.credentials.create({
    publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options),
  })) as PublicKeyCredential;

  // 3. Guardar en el servidor
  return api('/auth/passkeys/register/verify', { method: 'POST', json: { credential: credential.toJSON(), label } });
}
```

### Entrar con una passkey

```ts
async function entrarConPasskey() {
  const options = await api('/auth/passkeys/login/options', { method: 'POST', json: {} });
  const credential = (await navigator.credentials.get({
    publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options),
  })) as PublicKeyCredential;
  return api('/auth/passkeys/login/verify', { method: 'POST', json: { credential: credential.toJSON() } }); // -> AuthSession
}
```

Como **segundo paso** (cuando `login` devolvió `methods` con `"passkey"`) es igual, pero con el desafío:

```ts
const options = await api('/auth/passkeys/step-up/options', { method: 'POST', json: { challengeToken } });
const credential = await navigator.credentials.get({ publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options) });
const session = await api('/auth/passkeys/step-up/verify', { method: 'POST', json: { challengeToken, credential: credential.toJSON() } });
```

### Compatibilidad
`parse…FromJSON` y `toJSON()` existen en Chrome 129+, Safari 18+ y Firefox 119+. Para navegadores anteriores hay que convertir a mano los campos base64url (`challenge`, `user.id`, los `id` de `excludeCredentials`/`allowCredentials`) a `ArrayBuffer` antes de llamar a `credentials.create/get`, y devolver `id`, `rawId`, `type` y `response.{clientDataJSON, attestationObject | authenticatorData, signature, userHandle}` en base64url. El API acepta el base64url con o sin relleno (`=`).

### Errores del navegador y qué hacer

| Error (`DOMException.name`) | Causa | Mensaje |
|---|---|---|
| `NotAllowedError` | El usuario canceló o venció el tiempo | **No es un error**: no mostrar nada, o un discreto "Cancelado" |
| `InvalidStateError` (al registrar) | Ese dispositivo ya tiene una passkey de esta cuenta | "Este dispositivo ya está registrado" |
| `SecurityError` | El dominio no coincide con `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGINS` | Error de configuración: avisar al equipo |
| `NotSupportedError` | El equipo no tiene biometría ni PIN configurado | "Configura un PIN o huella en tu dispositivo" |

### Errores del API en passkeys

| Ruta | Status | Significado |
|---|---|---|
| `register/options` | 403 `"Contrasena incorrecta"` | Falta o es mala la contraseña (cuentas sin contraseña, solo Google, no la piden) |
| `register/options` y `register/verify` | 403 `TRUSTED_DEVICE_REQUIRED` | (Modo estricto, `RISK_MODE=enforce`.) Se intentó desde un navegador que aún no es dispositivo confirmado → *"Agrega tu passkey desde el dispositivo con el que sueles entrar"* |
| `register/verify` | 409 | Esa passkey ya estaba registrada, o ya tiene el máximo (10) |
| `register/verify` | 400 `"No se pudo registrar la passkey"` | Respuesta inválida o desafío vencido (5 min): empezar de nuevo |
| `login/verify`, `step-up/verify` | 401 `"Passkey invalida"` | Cualquier fallo: mismo mensaje a propósito |

### Pantalla "Mis passkeys" (Seguridad de la cuenta)
`GET /auth/passkeys` → `{ items: [{ id, label, backedUp, transports, createdAt, lastUsedAt }] }`. Permitir **renombrar** (`PATCH /auth/passkeys/:id { label }`) y **quitar** (`DELETE /auth/passkeys/:id`, `204`; también exige dispositivo confirmado). `backedUp: true` = se sincroniza (iCloud, Google). Recomienda tener **al menos dos** métodos (dos passkeys, o passkey + app autenticadora) por si pierden el teléfono.

---

## 8. Segundo factor obligatorio: la pantalla "Protege tu cuenta"

**Quién:** admin, dueños (`OWNER`) y agencias (`AGENCY`). Los clientes no están obligados (solo se les recomienda).

**Cómo lo sabe el frontend:** el objeto `enrollment` que llega en login, refresh y verificación de correo (y `GET /auth/second-factor` para consultarlo en cualquier momento).

| Situación | Campos | Qué mostrar |
|---|---|---|
| Ya tiene passkey o 2FA | `hasFactor: true` | Nada |
| Cliente sin factor | `recommended: true` | Banner **cerrable** "Protege tu cuenta con huella o Face ID" (recuerda con `localStorage` que lo cerró) |
| Obligatorio, con plazo | `required && !hasFactor && !mustEnrollNow` | Banner **persistente**: *"Tienes hasta {graceEndsAt} para activar la verificación en dos pasos"* con cuenta regresiva |
| Obligatorio, plazo vencido | `mustEnrollNow: true` | **Pantalla completa**, sin salida salvo cerrar sesión |
| Limitado por el servidor | `blocked: true` (`mode: 'enforce'`) | Igual que el anterior: el API ya está rechazando todo lo demás |
| `mode: 'monitor'` | `mustEnrollNow: true`, `blocked: false` | Solo avisar (modo de prueba): no bloquees tú lo que el servidor no bloquea |

**Si el API rechaza algo con `403 SECOND_FACTOR_ENROLLMENT_REQUIRED`** (cualquier ruta, en cualquier momento): redirige a "Protege tu cuenta". Hazlo en el cliente HTTP, no pantalla por pantalla:

```ts
if (e instanceof ApiError && e.code === 'SECOND_FACTOR_ENROLLMENT_REQUIRED') router.replace('/seguridad/activar');
```

**Rutas que siguen funcionando mientras está limitado** (las que necesita esa pantalla): `GET /users/me`, `GET /auth/second-factor`, `GET /auth/sessions`, `DELETE /auth/sessions/:id`, `GET /auth/devices`, `GET /auth/security-events`, `GET /auth/passkeys`, `POST /auth/passkeys/register/options|verify`, `POST /auth/2fa/setup|confirm`, `POST /auth/logout`, `POST /auth/logout-all` y todas las **públicas** (buscar propiedades). Todo lo demás (publicar, mis propiedades, citas recibidas...) responde 403.

### Opción 1: passkey (la recomendada)
Botón "Usar huella / Face ID" → `registrarPasskey(password)` (§7). Al terminar, **el mismo token ya funciona** (el servidor lo comprueba en vivo); llama a `refreshSession()` para dejar el estado limpio y quitar la pantalla.

### Opción 2: app autenticadora (Google Authenticator, Authy…)

```
POST /auth/2fa/setup     {}                        -> { secret, otpauthUrl, qrCode }   // qrCode: data:image/png;base64,...
   mostrar el QR (y el secret por si no puede escanear)
POST /auth/2fa/confirm   { code: "123456" }        -> { backupCodes: [8 códigos], accessToken }
```

- **Muestra los 8 `backupCodes` UNA sola vez** y obliga a descargarlos o copiarlos antes de continuar ("guárdalos: son tu salvavidas si pierdes el teléfono"). No se pueden volver a ver; se regeneran con `POST /auth/2fa/backup-codes`.
- Reemplaza tu access token por el `accessToken` de la respuesta.
- Ambas opciones piden estar en un **dispositivo ya confirmado** (el navegador con el que se registró o entró antes). Si no, `403 TRUSTED_DEVICE_REQUIRED`: *"Hazlo desde el dispositivo con el que sueles entrar"*.

---

## 9. Advertencias y avisos de seguridad

El servidor **no envía correos** de seguridad: los avisos se muestran dentro de la app.

### Historial de la cuenta: `GET /auth/security-events`

```json
{ "items": [{
  "id": "…", "at": "2026-10-26T03:28:20.751Z",
  "type": "risk.stepup.passed", "title": "Inicio de sesion verificado con segundo factor",
  "level": "HIGH", "country": "VE", "device": "Chrome en Windows", "details": ["red nueva", "dispositivo nuevo"]
}] }
```

- Nunca trae IPs. `country` y `device` pueden ser `null`.
- **Después de cada login**, pide los eventos y muestra un aviso (toast o banner) si hay uno **nuevo** (guarda en `localStorage` el `id` del último que ya viste).
- Tipos que debes reconocer (`type`) y cómo presentarlos:

| `type` | Severidad en la UI | Texto sugerido |
|---|---|---|
| `risk.assessed` (`level: MEDIUM`) | Informativo (amarillo) | "Nuevo inicio de sesión desde {país} · {dispositivo}. ¿Fuiste tú?" |
| `risk.stepup.passed` | Informativo | "Verificaste tu identidad en un inicio de sesión inusual" |
| `risk.device.confirmed` | Informativo | "Dispositivo confirmado: {dispositivo}" |
| `risk.passkey.registered` / `risk.passkey.revoked` | Informativo | "Se agregó / quitó una passkey" |
| `risk.denied` | Alerta (rojo) | "Bloqueamos un intento de entrar a tu cuenta" |
| `risk.stepup.failed`, `risk.account.locked` | Alerta | "Hubo intentos fallidos de verificación y bloqueamos la cuenta un rato" |
| `risk.factor.denied` | Alerta | "Alguien intentó cambiar tus métodos de verificación desde un dispositivo no confirmado" |
| `risk.session.revoked` | Alerta | "Cerramos una sesión por seguridad" |
| `risk.passkey.cloned` | Alerta | "Desactivamos una passkey porque detectamos una posible copia" |

- Para las alertas ofrece el botón **"No fui yo"**: lleva a "Seguridad de la cuenta" con acciones directas: **cerrar todas las sesiones** (`POST /auth/logout-all`), **cambiar la contraseña** (`POST /users/me/password`) y **revisar dispositivos**.

### Dispositivos de confianza: `GET /auth/devices`
`{ items: [{ id, label, confirmed, firstSeenAt, lastSeenAt, lastCountry, current }] }`. Lista con una marca "Este dispositivo" (`current`), si está **confirmado** y último país. `DELETE /auth/devices/:id` (`204`) lo quita **y cierra sus sesiones**. Si el usuario quita el dispositivo actual, termina la sesión: maneja el `401` siguiente.

### Sesiones activas: `GET /auth/sessions`
`[{ id, ip, userAgent, createdAt, lastUsedAt, current }]` → lista con botón "Cerrar" (`DELETE /auth/sessions/:id`).

### Pantalla "Seguridad de la cuenta" (todo junto)
Una sola pantalla con: estado del segundo factor (`/auth/second-factor`), mis passkeys, app autenticadora (activar/desactivar, códigos de respaldo), dispositivos, sesiones, historial de avisos y "cerrar todas las sesiones".

---

## 10. Sesión, renovación y móvil

- **Access token**: 15 minutos, en memoria. Al `401` (con sesión) → un `refreshSession()` y un reintento.
- **Refresh (web)**: la cookie viaja sola. Cada `POST /auth/refresh` devuelve una sesión nueva (`AuthSession`) y rota la cookie.
- **Si el refresh falla (`401 "Sesion invalida o vencida"`)** → la sesión terminó: limpia el estado y manda al login. Causas: venció (7 días), la cerraron desde otro dispositivo, o **se renovó desde un navegador/dispositivo distinto al de la sesión** (el servidor lo toma como posible robo y la revoca).
- **Cerrar sesión**: `POST /auth/logout` (`204`). Después limpia el access token y el estado. `POST /auth/logout-all` cierra todas.
- **Varias pestañas**: si una pestaña cierra sesión, las demás lo notan en su siguiente `401`. Si quieres inmediatez, usa `BroadcastChannel`.

### Móvil (`x-app-client: mobile`)
No hay cookies: todo va en el body y en cabeceras.

| Qué | Cómo |
|---|---|
| Refresh token | Viene en el body del login/refresh como `refreshToken`. Guárdalo en el **almacén seguro** del sistema (Keychain / Keystore), nunca en preferencias normales. Envíalo en el body de `/auth/refresh` y `/auth/logout`: `{ "refreshToken": "…" }` |
| Dispositivo | Cuando es un dispositivo nuevo, el body trae `deviceToken`. Guárdalo igual en el almacén seguro y **envíalo en la cabecera `x-device-token` en todos los `login` y `refresh`**. Sin él, el servidor revoca la sesión al renovar |
| Passkeys | Requieren configurar dominios asociados (`apple-app-site-association`, `assetlinks.json`); se habilitan cuando se construya la app |

---

## 11. Tabla maestra de errores

Cómo identificarlos: primero `code` (si existe), después `status`.

| Status | `code` | Rutas típicas | La UI debe… |
|---|---|---|---|
| 400 | — (`message` = lista) | Cualquiera con cuerpo | Marcar los campos inválidos |
| 400 | — `"Codigo invalido o vencido"` | verify-email, reset | Pedir el código otra vez / reenviar |
| 401 | — `"Credenciales invalidas"` | login | Mensaje único de correo/clave incorrectos |
| 401 | — `"Codigo invalido"` | login/2fa | Dejar reintentar; avisar del límite de 3 |
| 401 | — `"Passkey invalida"` | passkeys login/step-up | Dejar reintentar o usar otro método |
| 401 | — `"Token requerido"` / `"Token invalido o vencido"` | Con sesión | Refresh y un reintento |
| 401 | — `"Sesion invalida o vencida"` | refresh | Ir al login |
| 403 | `EMAIL_NOT_VERIFIED` | login | Ir a verificar el correo |
| 403 | `SECOND_FACTOR_REQUIRED` | login, Google | Explicar que active un factor desde su dispositivo habitual |
| 403 | `TRUSTED_DEVICE_REQUIRED` | passkeys y 2fa (alta y baja) | "Hazlo desde tu dispositivo habitual" |
| 403 | `SECOND_FACTOR_ENROLLMENT_REQUIRED` | **cualquier ruta** | Redirigir a "Protege tu cuenta" |
| 403 | `TWO_FACTOR_REQUIRED` | Rutas de admin | Pedir que active/verifique su 2º factor |
| 403 | — `"Cuenta bloqueada temporalmente…"` | login, login/2fa | Esperar; (la passkey sí entra) |
| 403 | — `"Acceso restringido"` | Cualquiera | Mensaje genérico, sin detalles |
| 403 | — `"No tienes permiso para esta accion"` | Rutas por rol | Ocultar esa sección a ese rol |
| 403 | — `"Cliente no autorizado"` | Cualquiera | Error de configuración (cabeceras `x-app-*`) |
| 404 | — | Recursos | "No encontrado". Un recurso **ajeno** también da 404: no insinúes que existe |
| 409 | — | passkeys | Ya registrada / máximo alcanzado |
| 429 | — | login, registro, códigos | Esperar unos segundos |

Forma del cuerpo de error: `{ "statusCode": 403, "message": "…", "error": "Forbidden", "code": "…"? }` (`message` es una **lista** en los `400` de validación).

---

## 12. Pantallas a construir (checklist)

- [ ] **Registro** (cliente / dueño / agencia) + **verificar correo** con reenvío.
- [ ] **Login** con los 4 resultados (§6): sesión, segundo paso, errores con `code`, errores generales. Botón **"Entrar con huella / Face ID"** y **Google**.
- [ ] **Segundo paso** según `methods` (passkey, app, código de respaldo, correo) y aviso de `unusual`.
- [ ] **Recuperar contraseña** (forgot + reset).
- [ ] **"Protege tu cuenta"**: activar passkey o app autenticadora; mostrar códigos de respaldo una vez.
- [ ] **Banners** de `enrollment` (recomendado, con plazo, vencido).
- [ ] **Seguridad de la cuenta**: passkeys, app autenticadora, dispositivos, sesiones, historial de avisos, cerrar todo.
- [ ] **Aviso tras login** con el último evento de `security-events`.
- [ ] **Cliente HTTP** único con refresh en vuelo único (§3) y redirección por `SECOND_FACTOR_ENROLLMENT_REQUIRED`.
- [ ] **Página de error de configuración** (cabeceras, passkeys en dominio equivocado) visible solo en desarrollo.

## 13. Cómo probarlo en local

- El API arranca con los modos en `monitor` (`RISK_MODE`, `SECOND_FACTOR_MODE`, `THREAT_MODE`): **mide y avisa pero no bloquea**. Para ver las pantallas de bloqueo, el equipo de backend puede ponerlos en `enforce` en su `.env`.
- Passkeys en local: abre la web en `http://localhost:3000` (o el origen de `WEBAUTHN_ORIGINS`). Chrome y Edge permiten una **llave virtual** en DevTools → *WebAuthn* para probar sin sensor biométrico.
- Para simular "otro país" hace falta un CDN que ponga la cabecera `cf-ipcountry`; en local el país es desconocido y solo se evalúan red, dispositivo y fallos. El backend lo prueba con cabeceras simuladas en sus tests de integración.
- Para ver un inicio **inusual** en local: entra una vez (queda como dispositivo conocido) y luego entra desde una ventana de incógnito (no tiene la cookie `device_token`).

## 14. Lo que NO se debe hacer

- ❌ Guardar el access token en `localStorage`, `sessionStorage` o cookies legibles.
- ❌ Intentar leer `refresh_token` o `device_token` (son `httpOnly`; si "no las ves", está bien).
- ❌ Decidir permisos en el frontend como si fueran seguros: ocultar un botón no protege nada; el API es quien decide.
- ❌ Mostrar mensajes que revelen si un correo existe, o por qué exactamente se bloqueó un acceso.
- ❌ Reintentar sin límite un `401`/`429`: un reintento y listo.
- ❌ Mostrar de nuevo los códigos de respaldo después de la primera vez, o guardarlos en el navegador.
- ❌ Bloquear la interfaz por `enrollment.mustEnrollNow` cuando `mode` es `monitor`: el servidor aún no lo exige.
- ❌ Mandar `userId`, `role` o `ownerId` en ningún cuerpo: el API los toma del token y rechaza campos desconocidos con `400`.
