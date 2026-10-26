# security
Toda la seguridad de la aplicación en un solo módulo. Cada defensa es un **mini módulo** privado dentro de su carpeta; el resto de la app solo habla con `security/index.ts`.

| Mini módulo | Qué defiende | Documentación |
|---|---|---|
| [blocks/](blocks/README.md) | Bloqueos de IP, rango, país, usuario, correo y dominio (panel admin) | `blocks/README.md` |
| [access-risk/](access-risk/README.md) | ¿Es raro este inicio de sesión? País, red y dispositivo de cada usuario; segundo factor obligatorio si es muy raro; dispositivos de confianza | `access-risk/README.md` |
| [geo/](geo/README.md) | País de cada petición (cabeceras del CDN) para bloquear y para medir riesgo | `geo/README.md` |
| [encryption/](encryption/README.md) | Cifrado de datos personales en la DB (AES-256-GCM, claves versionadas) e índice ciego para buscar por igualdad | `encryption/README.md` |
| [ownership/](ownership/README.md) | Que un usuario no toque datos que no son suyos (404 uniforme + auditoría) | `ownership/README.md` |
| [passkeys/](passkeys/README.md) | Entrar y verificarse con huella, Face ID o Windows Hello (WebAuthn con código propio): passkeys que no se pueden phishear | `passkeys/README.md` |
| [second-factor/](second-factor/README.md) | Passkey o 2FA **obligatorio** para admin, dueños y agencias: plazo de gracia y limitación a las rutas de enrolamiento | `second-factor/README.md` |
| [threat-model/](threat-model/README.md) | Modelo de amenazas STRIDE: escudos que vigilan el tráfico y revisiones de archivos subidos | `threat-model/README.md` |

**Cómo se usa desde otro módulo** (nunca se importan archivos de las subcarpetas):
```ts
import { SecurityModule, SecurityService, OwnershipService, ThreatModelService } from '../security';
// en el @Module:  imports: [SecurityModule]
```

**Reglas** (las impone ESLint, ver `eslint-rules/module-boundaries.mjs`):
- Un mini módulo es una carpeta con su propio `<nombre>.module.ts` e `index.ts`.
- Desde fuera de `security` solo se importa `security/index.ts`. Desde dentro, un hermano solo se importa por el `index.ts` del otro (`../blocks`, nunca `../blocks/services/...`).
- Las rutas admin de la seguridad se declaran en `security.routes.ts` y las monta `routes/admin.routes.ts`.

**Agregar un mini módulo de seguridad**
1. Crea `security/<nombre>/` con `<nombre>.module.ts`, `index.ts` y `README.md`.
2. Súmalo en `security.module.ts` (`imports` y `exports`).
3. Exporta desde `security/index.ts` lo que otros módulos necesiten (servicios, tipos).
4. Si tiene rutas admin, agrégalas en `security.routes.ts`.

**Quitar uno**: borra su carpeta, su línea en `security.module.ts` y sus exportaciones en `index.ts`. Los módulos que lo usaban dejan de compilar justo en las líneas que lo llaman (ej. `ownership.require(...)`), así que no queda nada colgado.

**Tests**: `pnpm test:module security` corre los de todos los mini módulos; `pnpm test:module threat-model` solo los de uno.
