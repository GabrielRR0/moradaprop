# second-factor
Mini módulo de `security`: **passkey o 2FA obligatorio** para quien maneja datos de otros. Admin, dueños (`OWNER`) y agencias (`AGENCY`) deben tener al menos una passkey o el 2FA con app autenticadora; los clientes solo reciben una recomendación. Quien no cumple queda limitado a las rutas necesarias para activarlo.

## Cómo funciona
1. **Quién debe** y **cuánto plazo** se decide en un solo archivo: `policy.ts` (roles obligatorios, roles sin gracia, `graceDays: 7`).
2. `SecondFactorService.status(user)` calcula el estado de una cuenta: `required`, `hasFactor`, `mustEnrollNow`, `graceEndsAt`, `recommended`, `blocked`. Lo reciben el frontend en `login`, `refresh`, `verify-email`, `login/2fa` y `GET /api/auth/second-factor`.
3. **Cuándo empieza el plazo** (columna `User.secondFactorRequiredFrom`):
   - Cuenta **nueva** de dueño o agencia: se fija al registrarse (`RegisterService`) → desde el primer ingreso.
   - Cuenta que **ya existía** con rol de dueño o agencia: la migración le da 7 días desde que se aplica.
   - Cuenta que **recibe el rol después** (ej. "ser dueño") o un **admin** sin fecha: empieza al emitir su próximo token (admin: de inmediato; los demás: 7 días).
4. **Cómo se bloquea:** con `SECOND_FACTOR_MODE=enforce`, el access token de quien debe activarlo y no lo hizo lleva `enroll: true` (`TokenService`). `SecondFactorGuard` (global, después de `JwtAuthGuard` y `RolesGuard`) deja pasar **solo** las rutas marcadas con `@AllowWithoutSecondFactor()` y las públicas; el resto responde `403 SECOND_FACTOR_ENROLLMENT_REQUIRED`.
5. **Sin esperar al siguiente token:** antes de bloquear, el guard confirma **en la base** que sigue sin factor. Si acaba de registrar una passkey o activar el 2FA, pasa de inmediato aunque su token (hasta 15 min) todavía diga `enroll`.

## Rutas permitidas durante el enrolamiento (`@AllowWithoutSecondFactor()`)
`GET /users/me` · `GET /auth/second-factor` · `GET|DELETE /auth/sessions` · `GET /auth/devices` · `GET /auth/security-events` · `GET /auth/passkeys` · `POST /auth/passkeys/register/options|verify` · `POST /auth/2fa/setup|confirm` · `POST /auth/logout|logout-all`. Más las rutas públicas. **Para permitir otra, ponle el decorador; para bloquear una, quítaselo.**

## Modos (`SECOND_FACTOR_MODE`)
| Modo | Qué hace |
|---|---|
| `off` | No mide nada |
| `monitor` (por defecto) | Calcula y devuelve `enrollment` (con `mustEnrollNow`), pero **no bloquea** ni marca el token |
| `enforce` | Bloquea a quien debe activarlo y no lo hizo |

Pásalo a `enforce` cuando el frontend ya tenga la pantalla "Protege tu cuenta" (ver `docs/FRONTEND-SEGURIDAD.md`); si no, los dueños y agencias quedarían limitados sin forma de salir.

## Segundo factor reciente para acciones sensibles (`@RecentTwoFactor()`)
Estar en una sesión con 2FA no basta para suspender una cuenta, bloquear una IP o cambiar una clave: esas rutas piden que el segundo factor se haya comprobado **hace menos de `recentMinutes` (5)** en `policy.ts`.
1. Se marca la ruta con `@RecentTwoFactor()` (hoy: cambiar el estado de un usuario y crear o quitar bloqueos).
2. `RecentTwoFactorGuard` (global) lee `Session.strongAuthAt` en la base. Si es más viejo, responde `403 RECENT_TWO_FACTOR_REQUIRED`.
3. El cliente llama a `POST /api/auth/reverify/code` (app autenticadora o código de respaldo) o a `/reverify/passkey/options` + `/reverify/passkey`, y repite la acción.
4. `strongAuthAt` se fija al iniciar sesión con segundo factor, al activarlo y al re-verificar. **El refresh la conserva**: renovar el token no renueva la verificación.
El código por correo **no** vale aquí a propósito: quien toma el correo de un admin no debe poder confirmar acciones con él.

## Agregar o quitar un rol obligatorio
Edita `requiredRoles` en `policy.ts` (y `immediateRoles` si no debe tener gracia). Nada más depende de la lista.

## Límites
- La marca `enroll` viaja en el token (15 min): si cambia el rol de una cuenta, el efecto llega con el siguiente token.
- Perder el **último** factor (quitar la única passkey, desactivar el 2FA) devuelve a la cuenta al estado limitado de inmediato (su plazo ya venció).
- Recuperar una cuenta que perdió todos sus factores sigue pasando por el restablecimiento de contraseña por correo.

**Estructura:** `controllers/` (`private/user`), `contracts/resources/`, `services/` y `guards/`. Cada carpeta nueva tiene su README.
