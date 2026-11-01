// Unico lugar donde se importa @prisma/client. Se agrega aqui lo que el resto del codigo necesite.

/** Cliente y espacio de nombres de Prisma (`Prisma.UserWhereInput`, `Prisma.TransactionClient`...). */
export { Prisma, PrismaClient } from '@prisma/client';

/** Enums del esquema (`schema.prisma`). */
export {
  AgencyMemberRole,
  AppointmentStatus,
  AppointmentType,
  BlockType,
  ContactChannel,
  Currency,
  FootprintKind,
  ImportStatus,
  InvitationStatus,
  MessageKind,
  PasskeyChallengeKind,
  PropertyStatus,
  PropertyType,
  Role,
  SlotStatus,
  UserStatus,
  VerificationType,
} from '@prisma/client';

/** Modelos del esquema. */
export type { AgencyMember, AgencyProfile, BlockRule, ImportJob, PasskeyCredential, Property, User } from '@prisma/client';
