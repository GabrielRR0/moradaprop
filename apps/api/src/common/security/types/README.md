# types
Las formas de datos que comparte la seguridad: un archivo por tipo, y el sufijo dice qué papel juega.

| Archivo | Tipo | Qué es |
|---|---|---|
| auth-user-context.type.ts | `AuthUserContext` | el usuario autenticado, sacado del token |
| request-context.type.ts | `RequestContext` | IP, user agent, país y dispositivo de la petición |
| app-request.type.ts | `AppRequest`, `AppClient` | la petición de Express con usuario, país y app de origen |
| access-token.payload.ts | `AccessTokenPayload` | contenido del access token |
| two-factor-challenge.payload.ts | `TwoFactorChallengePayload` | contenido del token del segundo paso |

## Sufijos
- `Context`: datos de la petición actual que **no** vienen del body.
- `Payload`: contenido de un token.
- `Dto` y `Resource`: lo que entra y sale por HTTP (viven en `contracts/` de cada módulo).

Se importa siempre desde la carpeta: `import type { AuthUserContext } from '@/common/security/types'`. Para un tipo nuevo, crea su archivo y súmalo al `index.ts`.
