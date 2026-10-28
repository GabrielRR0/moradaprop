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

## Reglas (las hace cumplir ESLint y `tests/support-modules.spec.ts`)
1. Desde fuera solo se importa `support/<modulo>` (su `index.ts`), nunca sus archivos internos (`local/no-internal-imports`).
2. El paquete envuelto solo se importa dentro de su carpeta (`no-restricted-imports` en `eslint.config.mjs`).
3. Cada módulo tiene `index.ts` y `README.md`; todo lo que exporta el index aparece en el README.
4. Los módulos de funciones se exportan como espacio de nombres terminado en `Support` (`SpreadsheetSupport.buildXlsx()`, `PasswordSupport.hash()`), para que en el sitio de uso se vea que viene de `support/`. Los providers de Nest (`MailService`, `JwtSigner`...) se importan por su nombre.
5. La API del módulo es propia: no devuelve tipos del paquete (errores propios, perfiles propios).

## Agregar un módulo
1. Crear `support/<nombre>/` con `index.ts`, archivos internos y `README.md` (tabla de funciones).
2. Agregar el paquete a la lista de `no-restricted-imports` en `eslint.config.mjs`.
3. Escribir un test de comportamiento en `support/<nombre>/tests/` y una fila en la tabla de arriba.
4. Migrar los usos directos que queden (`pnpm lint` los señala).
