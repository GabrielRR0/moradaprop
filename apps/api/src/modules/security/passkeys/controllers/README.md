# controllers
```
controllers/
  private/
    user/                      cualquier usuario con sesión   @AuthGroup()
      passkeys.controller.ts       POST /register/options · POST /register/verify · GET / · PATCH /:id · DELETE /:id
```
Entrar con una passkey no está aquí: vive en `auth` (`/auth/passkeys/login` y `/step-up`) porque crea la sesión. Registrar o quitar una passkey exige un dispositivo confirmado y la contraseña otra vez.
