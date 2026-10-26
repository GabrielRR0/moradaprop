import { Injectable } from '@nestjs/common';
import { BlindIndexService } from '../services/blind-index.service';
import { FieldCipher } from '../services/field-cipher.service';

type ProfileText = {
  legalName?: string | null;
  rif?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};
const PROFILE_FIELDS = ['legalName', 'rif', 'phone', 'whatsapp'] as const;

/**
 * Vault de agencias: razon social, RIF, telefonos y los correos invitados van cifrados.
 * `name` y el logo quedan en claro (se muestran publicamente en la ficha de la propiedad).
 */
@Injectable()
export class AgencyVault {
  constructor(
    private readonly cipher: FieldCipher,
    private readonly index: BlindIndexService,
  ) {}

  /** AgencyProfile para guardar: cifra los campos y calcula `rifHash` (unico) si viene el RIF. */
  encodeProfile<T extends ProfileText>(data: T): T & { rifHash?: string | null } {
    const out: T & { rifHash?: string | null } = this.cipher.encryptFields('AgencyProfile', data, PROFILE_FIELDS);
    if (typeof data.rif === 'string') out.rifHash = this.index.hash('AgencyProfile.rif', data.rif, 'document');
    else if (data.rif === null) out.rifHash = null;
    return out;
  }

  decodeProfile<T extends ProfileText>(row: T): T {
    return this.cipher.decryptFields('AgencyProfile', row, PROFILE_FIELDS);
  }

  invitedEmailHash(email: string): string {
    return this.index.hash('AgencyMember.invitedEmail', email, 'email');
  }

  /** AgencyMember para guardar: correo invitado cifrado + su hash (unico por agencia). */
  encodeMember<T extends { invitedEmail: string }>(data: T): T & { invitedEmailHash: string } {
    return {
      ...data,
      invitedEmail: this.cipher.encrypt('AgencyMember.invitedEmail', data.invitedEmail),
      invitedEmailHash: this.invitedEmailHash(data.invitedEmail),
    };
  }

  decodeMember<T extends { invitedEmail?: string }>(row: T): T {
    return this.cipher.decryptFields('AgencyMember', row, ['invitedEmail']);
  }
}
