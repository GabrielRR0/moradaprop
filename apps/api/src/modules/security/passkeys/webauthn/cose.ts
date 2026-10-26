import { createPublicKey, verify, type JsonWebKeyInput, type KeyObject } from 'node:crypto';
import { decodeCborExact } from './cbor';
import { COSE_ALG, WebAuthnError } from './types';

/** Etiquetas COSE de una clave (RFC 9052/9053). */
const KTY = 1;
const ALG = 3;
const CRV = -1; // tambien "n" en RSA
const X = -2; // tambien "e" en RSA
const Y = -3;

const bytes = (value: unknown, length?: number): Buffer => {
  if (!Buffer.isBuffer(value) || (length !== undefined && value.length !== length)) {
    throw new WebAuthnError('bad-public-key', 'parametro de la clave invalido');
  }
  return value;
};

const b64 = (value: Buffer) => value.toString('base64url');

/** Clave publica COSE (bytes del autenticador) -> clave de Node. Rechaza algoritmos no soportados y claves debiles. */
export function parseCoseKey(cose: Buffer): { algorithm: number; key: KeyObject } {
  let map: unknown;
  try {
    map = decodeCborExact(cose);
  } catch {
    throw new WebAuthnError('bad-public-key', 'la clave no es CBOR valido');
  }
  if (!(map instanceof Map)) throw new WebAuthnError('bad-public-key', 'la clave no es un mapa');

  const kty = map.get(KTY);
  const algorithm = map.get(ALG);

  let jwk: JsonWebKeyInput['key'];
  if (algorithm === COSE_ALG.ES256) {
    if (kty !== 2 || map.get(CRV) !== 1) throw new WebAuthnError('bad-public-key', 'ES256 exige P-256');
    jwk = { kty: 'EC', crv: 'P-256', x: b64(bytes(map.get(X), 32)), y: b64(bytes(map.get(Y), 32)) };
  } else if (algorithm === COSE_ALG.RS256) {
    if (kty !== 3) throw new WebAuthnError('bad-public-key', 'RS256 exige RSA');
    const n = bytes(map.get(CRV));
    const e = bytes(map.get(X));
    const modulus = n.subarray(n.findIndex((byte) => byte !== 0));
    if (modulus.length < 256 || e.length === 0 || e.length > 4) {
      throw new WebAuthnError('bad-public-key', 'clave RSA menor a 2048 bits o exponente invalido');
    }
    jwk = { kty: 'RSA', n: b64(n), e: b64(e) };
  } else if (algorithm === COSE_ALG.EdDSA) {
    if (kty !== 1 || map.get(CRV) !== 6) throw new WebAuthnError('bad-public-key', 'EdDSA exige Ed25519');
    jwk = { kty: 'OKP', crv: 'Ed25519', x: b64(bytes(map.get(X), 32)) };
  } else {
    throw new WebAuthnError('unsupported-algorithm', String(algorithm));
  }

  try {
    return { algorithm, key: createPublicKey({ key: jwk, format: 'jwk' }) };
  } catch {
    // Por ejemplo, un punto que no esta en la curva.
    throw new WebAuthnError('bad-public-key', 'la clave no es valida');
  }
}

/** ¿`signature` firma `data` con esta clave? Nunca lanza: cualquier problema es "no". */
export function verifySignature(algorithm: number, key: KeyObject, data: Buffer, signature: Buffer): boolean {
  try {
    if (algorithm === COSE_ALG.ES256 || algorithm === COSE_ALG.RS256) return verify('sha256', data, key, signature);
    if (algorithm === COSE_ALG.EdDSA) return verify(null, data, key, signature);
  } catch {
    return false;
  }
  return false;
}
