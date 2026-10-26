import { decodeCbor } from './cbor';
import { WebAuthnError } from './types';

/** Banderas de authenticatorData (WebAuthn nivel 3). */
const FLAG_UP = 0x01; // usuario presente (toco el dispositivo)
const FLAG_UV = 0x04; // usuario VERIFICADO (huella, cara o PIN)
const FLAG_BE = 0x08; // la passkey se puede sincronizar (backup eligible)
const FLAG_BS = 0x10; // y ya esta sincronizada (backup state)
const FLAG_AT = 0x40; // trae datos de credencial (solo al registrar)
const FLAG_ED = 0x80; // trae extensiones

const MAX_CREDENTIAL_ID = 1023;

export interface AuthenticatorData {
  rpIdHash: Buffer;
  userPresent: boolean;
  userVerified: boolean;
  backupEligible: boolean;
  backupState: boolean;
  signCount: number;
  /** Solo al registrar. */
  attested?: { credentialId: Buffer; credentialPublicKey: Buffer };
}

/** Lee authenticatorData. Estricto: no admite bytes sobrantes ni longitudes que se salgan del buffer. */
export function parseAuthenticatorData(data: Buffer): AuthenticatorData {
  if (data.length < 37) throw new WebAuthnError('bad-credential', 'authenticatorData demasiado corto');

  const flags = data[32];
  const parsed: AuthenticatorData = {
    rpIdHash: data.subarray(0, 32),
    userPresent: (flags & FLAG_UP) !== 0,
    userVerified: (flags & FLAG_UV) !== 0,
    backupEligible: (flags & FLAG_BE) !== 0,
    backupState: (flags & FLAG_BS) !== 0,
    signCount: data.readUInt32BE(33),
  };
  let pos = 37;

  if (flags & FLAG_AT) {
    if (data.length < pos + 18) throw new WebAuthnError('bad-credential', 'faltan los datos de la credencial');
    pos += 16; // aaguid: no se usa (no validamos la marca del dispositivo)
    const idLength = data.readUInt16BE(pos);
    pos += 2;
    if (idLength === 0 || idLength > MAX_CREDENTIAL_ID || data.length < pos + idLength) {
      throw new WebAuthnError('bad-credential', 'id de credencial invalido');
    }
    const credentialId = Buffer.from(data.subarray(pos, pos + idLength));
    pos += idLength;

    const { end } = decodeCbor(data, pos); // donde termina la clave publica
    parsed.attested = { credentialId, credentialPublicKey: Buffer.from(data.subarray(pos, end)) };
    pos = end;
  }

  if (flags & FLAG_ED) pos = decodeCbor(data, pos).end;
  if (pos !== data.length) throw new WebAuthnError('bad-credential', 'bytes sobrantes en authenticatorData');
  return parsed;
}
