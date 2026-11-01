# support
Un módulo propio por cada paquete de terceros cuya API puede cambiar entre versiones. **La plataforma nunca importa el paquete: importa `support/<modulo>`.** Si el paquete sube de versión mayor, se arregla en un solo lugar.

| Módulo | Envuelve |
|---|---|
| `password` | argon2 |
| `cache` | ioredis |
| `mail` | nodemailer |
| `images` | sharp |
| `jwt` | @nestjs/jwt |
| `google-identity` | google-auth-library |
| `totp` | otplib, qrcode |
| `spreadsheet` | exceljs |
| `db` | @prisma/client |
| `turnstile` | servicio web de Cloudflare Turnstile (`siteverify`, con `fetch`; no es un paquete) |

## Reglas (las hace cumplir ESLint y `tests/support-modules.spec.ts`)
1. Desde fuera solo se importa `support/<modulo>` (su `index.ts`), nunca sus archivos internos (`local/no-internal-imports`).
2. El paquete envuelto solo se importa dentro de su carpeta (`no-restricted-imports` en `eslint.config.mjs`).
3. Cada módulo tiene `index.ts` y `README.md`; todo lo que exporta el index aparece en el README.
4. **Todo** módulo se exporta como un único espacio de nombres terminado en `Support`, sin excepciones, para que en el sitio de uso se vea que viene de `support/`: funciones (`SpreadsheetSupport.buildXlsx()`, `PasswordSupport.hash()`), providers y módulos de Nest (`MailSupport.Service`, `MailSupport.Module`, `JwtSupport.Signer`, `CacheSupport.HttpCache`) y tipos (`MailSupport.Template`, `DbSupport.User`). El `index.ts` de cada módulo es una sola línea: `export * as XSupport from './x-support'`.
5. La API del módulo es propia: no devuelve tipos del paquete (errores propios, perfiles propios).

## Agregar un módulo
1. Crear `support/<nombre>/` con `index.ts`, archivos internos y `README.md` (tabla de funciones).
2. Agregar el paquete a la lista de `no-restricted-imports` en `eslint.config.mjs`.
3. Escribir un test de comportamiento en `support/<nombre>/tests/` y una fila en la tabla de arriba.
4. Migrar los usos directos que queden (`pnpm lint` los señala).
