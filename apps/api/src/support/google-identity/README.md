# google-identity
Envuelve `google-auth-library`. Valida el idToken de "Entrar con Google" y devuelve un `GoogleProfile` propio.

| Función | Qué hace |
|---|---|
| `GoogleIdentity.verify(idToken, clientId)` | Devuelve `{ sub, email, emailVerified, name, picture }` o lanza si el token no es válido. |

Es un provider: se registra en el módulo que lo usa (`providers: [GoogleIdentity]`). Los tests e2e lo simulan con `jest.spyOn(app.get(GoogleIdentity), 'verify')`.
