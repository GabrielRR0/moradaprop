# db
Envuelve `@prisma/client`: es el único lugar que lo importa. El resto del código usa `DbSupport.Role`, `DbSupport.User`, `DbSupport.Prisma.UserWhereInput`...; si Prisma cambia de versión mayor (nuevo generador, otra ruta de import), se arregla solo en `db.ts`.

| Uso | Qué es |
|---|---|
| `DbSupport.Prisma` | Espacio de nombres de Prisma: tipos de consulta (`Prisma.UserWhereInput`), `Prisma.TransactionClient`, errores. |
| `DbSupport.PrismaClient` | El cliente. Lo extiende `PrismaService` (`common/prisma`) y lo usan el seed y los scripts. |
| `DbSupport.Role`, `PropertyStatus`, `PropertyType`, `Currency`, `BlockType`, `UserStatus`, `VerificationType`, `PasskeyChallengeKind`, `FootprintKind`, `ContactChannel`, `AppointmentType`, `AppointmentStatus` | Enums del esquema (valor y tipo). |
| `DbSupport.User`, `Property`, `AgencyMember`, `AgencyProfile`, `BlockRule`, `PasskeyCredential` | Modelos (solo tipo). |

**Agregar uno:** un modelo o enum nuevo en `schema.prisma` que el código necesite se exporta en `db.ts` (en `export { ... }` si es enum, en `export type { ... }` si es modelo) y se agrega a la tabla. `PrismaService` sigue en `common/prisma`.
