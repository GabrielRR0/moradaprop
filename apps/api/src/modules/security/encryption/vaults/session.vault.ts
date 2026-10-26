import { Injectable } from '@nestjs/common';
import { FieldCipher } from '../services/field-cipher.service';

const FIELDS = ['ip', 'userAgent'] as const;

/** Vault de Session: la IP y el navegador de cada sesion se guardan cifrados. */
@Injectable()
export class SessionVault {
  constructor(private readonly cipher: FieldCipher) {}

  encode<T extends { ip?: string | null; userAgent?: string | null }>(data: T): T {
    return this.cipher.encryptFields('Session', data, FIELDS);
  }

  decode<T extends { ip?: string | null; userAgent?: string | null }>(row: T): T {
    return this.cipher.decryptFields('Session', row, FIELDS);
  }
}
