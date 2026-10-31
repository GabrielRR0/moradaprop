# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

Los DTO se agrupan por tema porque varios se heredan entre sí (`EmailCodeDto` extiende `EmailDto`, `ResetPasswordDto` extiende `EmailCodeDto`).

| dto | Para qué ruta |
|---|---|
| register.dto.ts | crear la cuenta (con los requisitos de contraseña) |
| email-code.dto.ts | un correo, y un correo con su código de 6 dígitos |
| login.dto.ts | correo y contraseña |
| refresh.dto.ts | refresh token (solo mobile; en web va en la cookie) |
| reset-password.dto.ts | código y contraseña nueva |
| google.dto.ts | token de Google, y token más código para confirmar un vínculo |
| two-factor.dto.ts | desafío, código de login, confirmar y desactivar el 2FA |

| resource | Qué describe |
|---|---|
| auth-user.resource.ts | el usuario que se devuelve al iniciar sesión (sin hashes ni secretos) |
| auth-session.resource.ts | sesión iniciada (web y mobile), segundo paso requerido, vínculo de Google requerido, y la unión de todas (`LoginResponseResource`) |
| message.resource.ts | respuesta con solo un mensaje |
| session.resource.ts | una sesión abierta del usuario |
| two-factor.resource.ts | datos para configurar el 2FA, 2FA activado con sus códigos de respaldo, y códigos nuevos |

Las opciones de passkey (`/passkeys/login/options` y `/step-up/options`) devuelven el objeto estándar de WebAuthn; su forma la define la librería, no este módulo.

Esta carpeta no importa de controllers ni de services; solo al revés.
