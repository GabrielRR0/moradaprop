import { Injectable } from '@nestjs/common';
import { AppConfig } from '@/config';
import { BlindIndexService } from '@/modules/security/encryption';
import type { RelyingParty } from '../../webauthn/types';

/** Los datos del sitio que pide la passkey (dominio y origenes permitidos) y el identificador opaco de cada usuario. */
@Injectable()
export class PasskeyRelyingPartyService {
  constructor(
    private readonly config: AppConfig,
    private readonly index: BlindIndexService,
  ) {}

  get rp(): RelyingParty {
    const { rpId, origins } = this.config.security.webauthn;
    return { id: rpId, origins };
  }

  /** Identificador opaco y estable del usuario para el autenticador (HMAC): ni su id real ni datos personales. */
  userHandle(userId: string): Buffer {
    return Buffer.from(this.index.hash('Passkey.userHandle', userId), 'hex');
  }
}
