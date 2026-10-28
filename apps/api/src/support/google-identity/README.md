# google-identity
Envuelve `google-auth-library`. Valida el idToken de "Entrar con Google" y devuelve un perfil propio.

| Uso | Qué es |
|---|---|
| `GoogleIdentitySupport.Verifier` | Provider que se inyecta (`providers: [GoogleIdentitySupport.Verifier]`). |
| `verifier.verify(idToken, clientId)` | Devuelve `GoogleIdentitySupport.Profile` (`{ sub, email, emailVerified, name, picture }`) o lanza si el token no es válido. |

Los tests e2e lo simulan con `jest.spyOn(app.get(GoogleIdentitySupport.Verifier), 'verify')`.
