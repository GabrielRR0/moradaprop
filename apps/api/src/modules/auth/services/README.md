# services
La lógica del módulo. Los controllers solo hablan con la fachada `auth.service.ts`, que delega en los services de cada tema.

```
services/
  auth.service.ts            fachada
  registration/              crear la cuenta
    register.service.ts            registro (la respuesta no revela si el correo existe)
    verify-email.service.ts        verifica el correo con el código y entrega la sesión
    verification-code.service.ts   códigos de 6 dígitos hasheados, con intentos y cooldown
  sign-in/                   entrar y mantener la sesión
    login.service.ts               contraseña + evaluación de riesgo (security/access-risk) + segundo paso
    passkey-login.service.ts       entrar con passkey y segundo paso con passkey
    token.service.ts               firma y verifica los JWT: access token y token corto del segundo paso
    session.service.ts             sesiones con refresh token rotativo: iniciar, renovar, listar y cerrar
  password/
    password-reset.service.ts      recuperar la contraseña con un código
  two-factor/
    two-factor-setup.service.ts    activar y desactivar el 2FA y renovar los códigos de respaldo
    two-factor-login.service.ts    segundo paso del login: código por correo y completar el inicio de sesión
    reverify.service.ts            volver a comprobar el segundo factor con la sesión abierta (acciones sensibles)
    two-factor-verifier.service.ts comprueba los códigos (app autenticadora, respaldo, correo) y crea los de respaldo
  google/
    google-auth.service.ts         entrar con Google, vincular y desvincular
  account/
    user-account.service.ts        buscar usuarios por correo o id (lo usan varios services)
```
