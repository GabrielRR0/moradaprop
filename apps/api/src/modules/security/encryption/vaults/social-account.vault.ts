import { Injectable } from '@nestjs/common';
import { BlindIndexService } from '../services/blind-index.service';
import { FieldCipher } from '../services/field-cipher.service';

/**
 * Vault de SocialAccount: el correo va cifrado y el id del proveedor (el `sub` de Google) se guarda
 * solo como HMAC en la misma columna `providerId`: basta para reconocer la cuenta y no se puede revertir.
 */
@Injectable()
export class SocialAccountVault {
  constructor(
    private readonly cipher: FieldCipher,
    private readonly index: BlindIndexService,
  ) {}

  /** Valor que se guarda y se busca en la columna providerId. */
  providerId(providerId: string): string {
    return this.index.hash('SocialAccount.providerId', providerId);
  }

  encode<T extends { providerId: string; email?: string | null }>(data: T): T {
    return { ...this.cipher.encryptFields('SocialAccount', data, ['email']), providerId: this.providerId(data.providerId) };
  }

  decode<T extends { email?: string | null }>(row: T): T {
    return this.cipher.decryptFields('SocialAccount', row, ['email']);
  }
}
