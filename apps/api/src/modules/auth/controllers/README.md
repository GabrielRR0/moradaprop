# controllers
Las rutas HTTP del módulo (`/api/auth/*`), separadas por quién puede usarlas. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  public/                          sin sesión   @GuestGroup()  (límite de uso estricto)
    registration.controller.ts         POST /register · /verify-email · /resend-code
    login.controller.ts                POST /login · /login/2fa · /login/2fa/email-code · /refresh
    password-recovery.controller.ts    POST /password/forgot · /password/reset
    human-check.controller.ts          GET /human-check  (¿está activo el "no soy un robot"? — @PublicGroup)
    google-login.controller.ts         POST /google · /google/link/confirm
    passkey-login.controller.ts        POST /passkeys/login/options · /login/verify · /step-up/options · /step-up/verify
  private/
    user/                          cualquier usuario con sesión   @AuthGroup()
      sessions.controller.ts           POST /logout · /logout-all · GET /sessions · DELETE /sessions/:id
      two-factor.controller.ts         POST /2fa/setup · /2fa/confirm · /2fa/disable · /2fa/backup-codes
      reverify.controller.ts           POST /reverify/code · /reverify/passkey/options · /reverify/passkey
      google-account.controller.ts     POST /google/link · DELETE /google
```

## Reglas
- Las rutas que inician sesión (`login`, `verify-email`, `google`, passkey...) responden con `respondWithLogin`: en la **web** el refresh token y el secreto del dispositivo viajan solo en cookies httpOnly; en **mobile**, en el body. Nunca los dos.
- `sessions.controller.ts` lleva `@AllowWithoutSecondFactor` a nivel de clase: una cuenta que aún debe activar su segundo factor igual puede cerrar sesión. En `two-factor.controller.ts` solo `setup` y `confirm` lo llevan (son lo que le falta hacer); `disable` y `backup-codes` no.
- Las rutas que no deben revelar si un correo existe responden siempre el mismo mensaje.
- `register`, `login`, `resend-code` y `password/forgot` llevan `@RequireHumanCheck()`: con `TURNSTILE_ENABLED=true` exigen la cabecera `x-turnstile-token` (ver `common/security/guards/human-check.guard.ts`); apagado no hace nada.
- Mis passkeys (agregar, listar, quitar) no están aquí: viven en `modules/security/passkeys`.
