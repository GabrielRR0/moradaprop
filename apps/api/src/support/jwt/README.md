# jwt
Envuelve `@nestjs/jwt`. La plataforma firma y verifica tokens solo con `JwtSigner`; si el paquete cambia de API, se arregla aquí.

| Función | Qué hace |
|---|---|
| `JwtSigner.sign(payload, { secret, expiresIn })` | Firma un JWT (HS256 por defecto). |
| `JwtSigner.verify<T>(token, secret)` | Devuelve el payload o lanza si es inválido o venció. |

Se importa `JwtSignerModule` en el módulo que lo necesite. Para agregar una función: nuevo método en `jwt-signer.service.ts` y una fila en esta tabla.

También exporta `JwtSignerModule` y el tipo `SignOptions` (`{ secret, expiresIn }`).
