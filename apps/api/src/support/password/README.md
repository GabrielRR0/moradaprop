# password
Política de contraseña (8-128, letras y números), hash argon2id, verificación y `burnCheck` (gasta el mismo tiempo cuando el usuario no existe, para no filtrar cuentas por tiempos).

**Envuelve** `argon2`. Se usa como `PasswordSupport.hash(...)`.

| Función | Qué hace |
|---|---|
| `PasswordSupport.hash(plain)` | Hash argon2id. |
| `PasswordSupport.verify(hash, plain)` | `true`/`false` (nunca lanza). |
| `PasswordSupport.burnCheck(plain)` | Verificación falsa para igualar tiempos. |
| `PasswordSupport.PATTERN` / `PasswordSupport.MESSAGE` | Regla y mensaje que usan los DTO. |
