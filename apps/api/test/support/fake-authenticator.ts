import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto';

/**
 * Autenticador de software para los tests: hace lo mismo que una huella, Face ID o Windows Hello (genera un par de
 * claves, arma authenticatorData y clientDataJSON y firma el desafio), pero sin navegador. Sirve para probar el
 * registro y el uso de passkeys completos y, con `tweak`, para fabricar respuestas manipuladas.
 */

// ---------------- CBOR minimo (solo para armar attestationObject y la clave COSE) ----------------

type Cbor = number | string | boolean | null | Buffer | Cbor[] | Map<number | string, Cbor> | { [key: string]: Cbor };

function head(major: number, value: number): Buffer {
  if (value < 24) return Buffer.from([(major << 5) | value]);
  if (value < 0x100) return Buffer.from([(major << 5) | 24, value]);
  if (value < 0x10000) return Buffer.from([(major << 5) | 25, value >> 8, value & 0xff]);
  const out = Buffer.alloc(5);
  out[0] = (major << 5) | 26;
  out.writeUInt32BE(value, 1);
  return out;
}

export function cborEncode(value: Cbor): Buffer {
  if (typeof value === 'number') return value >= 0 ? head(0, value) : head(1, -1 - value);
  if (typeof value === 'string') {
    const text = Buffer.from(value, 'utf8');
    return Buffer.concat([head(3, text.length), text]);
  }
  if (typeof value === 'boolean') return Buffer.from([value ? 0xf5 : 0xf4]);
  if (value === null) return Buffer.from([0xf6]);
  if (Buffer.isBuffer(value)) return Buffer.concat([head(2, value.length), value]);
  if (Array.isArray(value)) return Buffer.concat([head(4, value.length), ...value.map(cborEncode)]);
  const entries = value instanceof Map ? [...value.entries()] : Object.entries(value);
  return Buffer.concat([head(5, entries.length), ...entries.flatMap(([k, v]) => [cborEncode(k), cborEncode(v)])]);
}

// ---------------- Autenticador ----------------

export type FakeAlgorithm = 'ES256' | 'RS256' | 'EdDSA';
const COSE_ALG: Record<FakeAlgorithm, number> = { ES256: -7, RS256: -257, EdDSA: -8 };

const FLAG = { UP: 0x01, UV: 0x04, BE: 0x08, BS: 0x10, AT: 0x40 } as const;
const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest();

/** Cambios para fabricar respuestas MANIPULADAS en los tests de seguridad. */
export interface Tweak {
  type?: string;
  challenge?: string;
  origin?: string;
  crossOrigin?: boolean;
  rpId?: string;
  up?: boolean;
  uv?: boolean;
  backupBitsIncoherent?: boolean;
  signCount?: number;
  /** Estropea la firma (cambia un byte). */
  corruptSignature?: boolean;
  /** Cambia authenticatorData DESPUES de firmar. */
  tamperAuthData?: boolean;
  /** Cambia clientDataJSON DESPUES de firmar. */
  tamperClientData?: boolean;
  userHandle?: Buffer | null;
  /** Firma con otra clave (la de otro autenticador). */
  signWith?: FakeAuthenticator;
  /** Declara un id de credencial distinto. */
  claimId?: string;
}

export interface FakeOptions {
  alg?: FakeAlgorithm;
  rpId: string;
  origin: string;
  /** Contador inicial; sube 1 en cada uso. Con `synced` queda en 0 (como las passkeys de iCloud o Google). */
  signCount?: number;
  synced?: boolean;
}

export class FakeAuthenticator {
  readonly alg: FakeAlgorithm;
  readonly credentialId = randomBytes(32);
  readonly id = this.credentialId.toString('base64url');
  signCount: number;
  userHandle: Buffer | null = null;
  private readonly privateKey: KeyObject;
  private readonly publicJwk: Record<string, string>;

  constructor(private readonly options: FakeOptions) {
    this.alg = options.alg ?? 'ES256';
    this.signCount = options.synced ? 0 : (options.signCount ?? 1);
    const pair =
      this.alg === 'ES256'
        ? generateKeyPairSync('ec', { namedCurve: 'P-256' })
        : this.alg === 'RS256'
          ? generateKeyPairSync('rsa', { modulusLength: 2048 })
          : generateKeyPairSync('ed25519');
    this.privateKey = pair.privateKey;
    this.publicJwk = pair.publicKey.export({ format: 'jwk' }) as Record<string, string>;
  }

  /** Clave publica en formato COSE, como la entrega un autenticador real. */
  coseKey(): Buffer {
    const b = (name: string) => Buffer.from(this.publicJwk[name], 'base64url');
    const map =
      this.alg === 'ES256'
        ? new Map<number, Cbor>([[1, 2], [3, -7], [-1, 1], [-2, b('x')], [-3, b('y')]])
        : this.alg === 'RS256'
          ? new Map<number, Cbor>([[1, 3], [3, -257], [-1, b('n')], [-2, b('e')]])
          : new Map<number, Cbor>([[1, 1], [3, -8], [-1, 6], [-2, b('x')]]);
    return cborEncode(map);
  }

  /** Respuesta de `navigator.credentials.create()` (ya en formato JSON). */
  create(options: { challenge: string }, tweak: Tweak = {}) {
    const { rpId } = this.options;
    const clientData = this.clientData('webauthn.create', options.challenge, tweak);
    const credentialId = this.credentialId; // el id real, el que queda dentro de lo firmado
    const idLength = Buffer.alloc(2);
    idLength.writeUInt16BE(credentialId.length);
    const authData = Buffer.concat([
      this.authData(tweak.rpId ?? rpId, tweak, FLAG.AT),
      Buffer.alloc(16), // aaguid
      idLength,
      credentialId,
      this.coseKey(),
    ]);
    const attestationObject = cborEncode({ fmt: 'none', attStmt: {}, authData });
    return {
      id: tweak.claimId ?? this.id,
      rawId: tweak.claimId ?? this.id,
      type: 'public-key',
      response: {
        clientDataJSON: clientData.toString('base64url'),
        attestationObject: attestationObject.toString('base64url'),
        transports: ['internal'],
      },
    };
  }

  /** Respuesta de `navigator.credentials.get()` (ya en formato JSON). Cada uso sube el contador. */
  get(options: { challenge: string }, tweak: Tweak = {}) {
    const { rpId, synced } = this.options;
    if (!synced) this.signCount += 1;
    const clientData = this.clientData('webauthn.get', options.challenge, tweak);
    const authData = this.authData(tweak.rpId ?? rpId, tweak, 0);
    const signer = tweak.signWith ?? this;
    const signature = signer.signBytes(Buffer.concat([authData, sha256(clientData)]));
    if (tweak.corruptSignature) signature[signature.length - 1] ^= 0xff;

    const shownAuthData = tweak.tamperAuthData ? Buffer.concat([authData.subarray(0, 36), Buffer.from([authData[36] ^ 0x01])]) : authData;
    const shownClientData = tweak.tamperClientData ? Buffer.from(clientData.toString('utf8').replace('"type"', '"type" ')) : clientData;
    const handle = tweak.userHandle === undefined ? this.userHandle : tweak.userHandle;
    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key',
      response: {
        clientDataJSON: shownClientData.toString('base64url'),
        authenticatorData: shownAuthData.toString('base64url'),
        signature: signature.toString('base64url'),
        ...(handle ? { userHandle: handle.toString('base64url') } : {}),
      },
    };
  }

  private clientData(defaultType: string, challenge: string, tweak: Tweak): Buffer {
    return Buffer.from(
      JSON.stringify({
        type: tweak.type ?? defaultType,
        challenge: tweak.challenge ?? challenge,
        origin: tweak.origin ?? this.options.origin,
        crossOrigin: tweak.crossOrigin ?? false,
      }),
    );
  }

  private authData(rpId: string, tweak: Tweak, extraFlags: number): Buffer {
    let flags = extraFlags;
    if (tweak.up !== false) flags |= FLAG.UP;
    if (tweak.uv !== false) flags |= FLAG.UV;
    if (this.options.synced) flags |= FLAG.BE | FLAG.BS;
    if (tweak.backupBitsIncoherent) flags = (flags & ~FLAG.BE) | FLAG.BS;
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(tweak.signCount ?? this.signCount);
    return Buffer.concat([sha256(rpId), Buffer.from([flags]), counter]);
  }

  private signBytes(data: Buffer): Buffer {
    return this.alg === 'EdDSA' ? sign(null, data, this.privateKey) : sign('sha256', data, this.privateKey);
  }
}

export const COSE_ALGORITHM = COSE_ALG;
