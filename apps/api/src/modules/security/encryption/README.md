# encryption
Mini módulo de `security`: guarda los datos personales **cifrados** en la DB para que un dump, un backup filtrado o una lectura directa no muestre nada útil.

**Piezas**
- `services/key-ring.service.ts` — carga `ENCRYPTION_KEYS` (`v1:clave,v2:clave`) y deriva con HKDF una clave distinta por propósito (`enc` cifrar, `idx` indexar) y por campo.
- `services/field-cipher.service.ts` — `FieldCipher`: `encrypt/decrypt(campo, valor)` (AES-256-GCM). Se guarda `v<N>.iv.tag.dato`; el campo (`User.email`) va como AAD, así un valor copiado a otra columna no descifra. También `encryptJson/decryptJson`, `decryptOrPlain` (migración) y `needsRotation`.
- `services/blind-index.service.ts` — `BlindIndexService.hash(campo, valor, normalizador)`: HMAC determinista para buscar por igualdad y mantener `@unique` (`emailHash`, `rifHash`...) sin el valor en claro.
- `vaults/` — un archivo por entidad (`user.vault.ts`): sabe qué campos de ese modelo se cifran, arma `encode` (datos para guardar), `decode` (descifrar) y los filtros de búsqueda. Usa el núcleo de arriba, que no conoce ningún modelo. Para cifrar otra entidad se crea `vaults/<entidad>.vault.ts` y se suma a `VAULTS` en `encryption.module.ts`.

**Cómo funciona (User, ya cifrado)**
1. Al escribir: `data: { ...vault.encode({ email, name, phone }), ... }` — guarda `email`, `name` y `phone` cifrados, `emailHash` y `searchTokens`.
2. Al buscar por correo exacto: `where: { emailHash: vault.emailHash(email) }` (en auth, `UserAccountService.findByEmail`).
3. Al buscar texto parcial (panel admin): `where: { ...vault.searchWhere(q) }`. `searchTokens` guarda HMAC de los prefijos (3 a 12 letras) de cada palabra del nombre y del correo; "ana.gonz" o "usuar" encuentran al usuario sin texto en claro. Todas las palabras escritas deben coincidir.
4. Al leer: `vault.decode(row)`. También en las relaciones (`owner`, `client`, `user` de auditoría): una relación a User sale cifrada hasta pasarla por `decode`.

**Qué NO se puede hacer con datos cifrados:** `contains`/`startsWith`/ordenar por `email`, `name` o `phone` en SQL. Se busca con los tokens; el orden va por fecha u otro campo no sensible.

**Qué está cifrado (un vault por entidad en `vaults/`)**
| Entidad | Cifrado | Se busca por |
|---|---|---|
| User (`user.vault.ts`) | email, name, phone, twoFactorSecret | `emailHash`, `searchTokens` |
| SocialAccount (`social-account.vault.ts`) | email; `providerId` solo como HMAC | `providerId` (hash) |
| Session (`session.vault.ts`) | ip, userAgent | — |
| Appointment (`appointment.vault.ts`) | contactName, contactPhone, message, responseNote | — |
| AgencyProfile / AgencyMember (`agency.vault.ts`) | legalName, rif, phone, whatsapp, invitedEmail | `rifHash`, `invitedEmailHash` |
| AuditLog (directo con `FieldCipher`) | ip, userAgent, metadata (`{ enc }`) | — |
| VerificationCode | payload guarda el HMAC del providerId, no el valor | — |

Siguen en claro a propósito: `Agency.name`/logo (se muestran en la ficha pública), las propiedades (públicas) y `BlockRule` (bloquear por IP/CIDR exige comparar el valor; pendiente de decidir).

**Regla al leer:** el resultado crudo de `prisma.user.update(...)` también viene cifrado; no lo devuelvas al cliente sin pasarlo por `decode` (o usa `select`).

**Auditoría:** `audit` no importa `security` (habría un ciclo): define el token `AUDIT_USER_DECODER` y este módulo lo provee con `UserVault`.

**Rotar claves:** agregar `v2:...` a `ENCRYPTION_KEYS` (lo nuevo se cifra con la última versión; lo viejo sigue leyéndose) y re-cifrar lo antiguo con `needsRotation`. El índice ciego usa siempre la primera versión, así que rotar no cambia los hashes.

**Importante:** respalda las claves **aparte** de la DB. Si se pierden, los datos no se recuperan. `ENCRYPTION_KEY` sigue siendo v1 si no se define `ENCRYPTION_KEYS`.

Importar desde fuera: `import { FieldCipher, BlindIndexService } from '../security'`.
