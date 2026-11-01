# Módulo `auth`

Acceso a la cuenta, conectado al API real: ingresar (con segundo paso y passkeys), registro, verificar correo, recuperar contraseña y la **sesión** del navegador. Guía de comportamiento: [docs/FRONTEND-SEGURIDAD.md](../../../../../docs/FRONTEND-SEGURIDAD.md).

## Qué contiene

| Ruta         | Página            | Qué hace                                                                                          |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `/ingresar`  | `LoginPage`       | Correo + clave → sesión, segundo paso (passkey / app / respaldo / correo) o rechazo con `code`. También "Entrar con huella / Face ID". `?next=` vuelve a donde estaba. |
| `/registro`  | `RegisterPage`    | 4 pasos: perfil → datos → código del correo → listo. Dueño y agencia pasan por "Protege tu cuenta". |
| `/verificar` | `VerifyEmailPage` | Llega aquí quien entró con el correo sin verificar (`?email=`): se le envía un código nuevo.       |
| `/recuperar` | `ForgotPage`      | Correo → código + clave nueva → listo (se cierran todas las sesiones).                            |

También exporta `SessionBoot` (se monta en el layout: conecta el cliente HTTP y recupera la sesión al abrir), `AuthGate` (protege `/panel`, `/publicar`, `/admin`, `/seguridad`) y utilidades para el módulo `security`.

```
auth/
  index.ts                 # PADRE (con 'use client')
  components/              # <Pagina>.tsx + una carpeta por pantalla (LoginScreen, RegisterScreen, ForgotScreen) + shared/ (AuthLayout, VerifyEmailStep, HumanCheck, auth.css)
  hooks/                   # useLoginFlow, useRegisterFlow, useForgotFlow, useVerifyEmail, useHumanCheck, useCooldown, register-data
  services/                # auth.service (rutas), auth-errors (texto por error), auth-routing (a dónde ir), webauthn (passkeys)
  session/                 # session.store: quién es el usuario y su estado de 2º factor
  tests/
```

## Cómo funciona

- **Un solo cliente HTTP** (`src/lib/api.ts`): cabeceras `x-app-*`, `credentials: 'include'`, access token **solo en memoria**, un único refresh a la vez y un reintento. Nada va a `localStorage`.
- La pantalla de login es una **máquina de estados** (`useLoginFlow`): credenciales → segundo paso. El desafío vence a los 5 min y se vuelve al inicio; tras 2 fallos en un inicio inusual se avisa del bloqueo.
- **Confirmar el segundo factor** (`useConfirmIdentity` + `ConfirmIdentitySheet`, exportados para otros módulos): panel "Confirma que eres tú" con código de la app autenticadora o de respaldo, o passkey. Lo usa la administración antes de acciones sensibles (la API responde `403 RECENT_TWO_FACTOR_REQUIRED`). El código por correo no se ofrece: la API no lo acepta ahí.
- **"No soy un robot" (Cloudflare Turnstile), opcional.** Lo decide la API (`TURNSTILE_ENABLED`): `useHumanCheck` le pregunta a `GET /auth/human-check` y, si está activo, `HumanCheck` dibuja el widget (sobre `support/turnstile`) en login, registro, recuperar contraseña y reenvío de códigos; el token viaja en la cabecera `x-turnstile-token` y **sirve una sola vez** (se pide uno nuevo tras cada envío). Apagado, no dibuja nada y los formularios no cambian.
- Los errores se traducen por `code` y `status` (`services/auth-errors.ts`); ningún texto revela si un correo existe. Cancelar el diálogo de una passkey **no** es un error.
- Pantallas adaptables (una sola versión para escritorio y móvil): panel de color solo en escritorio; formularios con deslizamiento entre pasos, vibración en errores, casillas de código con pegar y autoavance.
- Passkeys: solo con las funciones JSON de WebAuthn (Chrome 129+, Safari 18+, Firefox 119+); en otros navegadores se ocultan los botones.

## Reglas

- Fuera de este módulo solo se importa `index.ts` (regla ESLint `local/no-internal-imports`).
- Máximo 600 líneas por archivo.
- Pendiente: botón de Google (falta el id de cliente de Google) y la app móvil.
