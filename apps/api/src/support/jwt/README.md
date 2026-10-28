# jwt
Envuelve `@nestjs/jwt`. La plataforma firma y verifica tokens solo con `JwtSupport.Signer`; si el paquete cambia de API, se arregla aquí.

| Uso | Qué es |
|---|---|
| `JwtSupport.Module` | Módulo de Nest a importar (sin secreto global: cada llamada pasa el suyo). |
| `JwtSupport.Signer` | Provider que se inyecta. |
| `signer.sign(payload, { secret, expiresIn })` | Firma un JWT (HS256 por defecto). Las opciones son el tipo `JwtSupport.SignOptions`. |
| `signer.verify<T>(token, secret)` | Devuelve el payload o lanza si es inválido o venció. |

Para agregar una función: nuevo método en `jwt-signer.service.ts` y una fila en esta tabla.
