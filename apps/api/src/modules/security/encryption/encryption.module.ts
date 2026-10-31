import { Global, Module } from '@nestjs/common';
import { AUDIT_FIELD_CIPHER, AUDIT_IP_INDEX, AUDIT_USER_DECODER } from '@/modules/audit';
import { BlindIndexService } from './services/blind-index.service';
import { FieldCipher } from './services/field-cipher.service';
import { KeyRingService } from './services/key-ring.service';
import { AgencyVault } from './vaults/agency.vault';
import { AppointmentVault } from './vaults/appointment.vault';
import { SessionVault } from './vaults/session.vault';
import { SocialAccountVault } from './vaults/social-account.vault';
import { UserVault } from './vaults/user.vault';

/** Un vault por entidad: para cifrar otra, crear vaults/<entidad>.vault.ts y sumarlo a VAULTS. */
const VAULTS = [UserVault, SocialAccountVault, SessionVault, AppointmentVault, AgencyVault];

/** Le da a auditoria el hash de la IP de cada evento (para filtrar el visor por IP). */
const auditIpIndex = {
  provide: AUDIT_IP_INDEX,
  inject: [BlindIndexService],
  useFactory: (index: BlindIndexService) => ({ hash: (ip: string) => index.hash('AuditLog.ip', ip) }),
};

/** Global (como CryptoModule): lo usan auth, users, audit, agencies... sin importarse entre si y sin ciclos con audit. */
@Global()
@Module({
  providers: [KeyRingService, FieldCipher, BlindIndexService, ...VAULTS, { provide: AUDIT_USER_DECODER, useExisting: UserVault }, { provide: AUDIT_FIELD_CIPHER, useExisting: FieldCipher }, auditIpIndex],
  exports: [FieldCipher, BlindIndexService, ...VAULTS, AUDIT_USER_DECODER, AUDIT_FIELD_CIPHER, AUDIT_IP_INDEX],
})
export class EncryptionModule {}
