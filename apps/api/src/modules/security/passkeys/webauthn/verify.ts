import { createHash, timingSafeEqual } from 'node:crypto';
import { parseAuthenticatorData, type AuthenticatorData } from './authenticator-data';
import { fromBase64url, stripPadding, toBase64url } from './base64url';
import { decodeCborExact } from './cbor';
import { parseCoseKey, verifySignature } from './cose';
import {
  WebAuthnError,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type RelyingParty,
  type VerifiedAuthentication,
  type VerifiedRegistration,
} from './types';

const KNOWN_TRANSPORTS = new Set(['usb', 'nfc', 'ble', 'internal', 'hybrid', 'smart-card']);

export interface ClientData {
  type: string;
  challenge: string;
  origin: string;
  crossOrigin: boolean;
}

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest();

function safeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Lee clientDataJSON (lo que el navegador dice haber firmado). Devuelve tambien sus bytes: la firma los cubre tal cual. */
export function parseClientData(clientDataJSON: unknown): { raw: Buffer; data: ClientData } {
  const raw = fromBase64url(clientDataJSON, 4096);
  let json: unknown;
  try {
    json = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new WebAuthnError('bad-client-data', 'no es JSON');
  }
  if (!json || typeof json !== 'object') throw new WebAuthnError('bad-client-data', 'no es un objeto');
  const { type, challenge, origin, crossOrigin } = json as Record<string, unknown>;
  if (typeof type !== 'string' || typeof challenge !== 'string' || typeof origin !== 'string') {
    throw new WebAuthnError('bad-client-data', 'faltan campos');
  }
  if (crossOrigin !== undefined && typeof crossOrigin !== 'boolean') throw new WebAuthnError('bad-client-data', 'crossOrigin invalido');
  return { raw, data: { type, challenge, origin, crossOrigin: crossOrigin === true } };
}

function checkClientData(data: ClientData, expectedType: string, expectedChallenge: string, rp: RelyingParty) {
  if (data.type !== expectedType) throw new WebAuthnError('bad-type', data.type);
  if (!safeEqual(data.challenge, expectedChallenge)) throw new WebAuthnError('bad-challenge');
  if (!rp.origins.includes(data.origin)) throw new WebAuthnError('bad-origin', data.origin);
  if (data.crossOrigin) throw new WebAuthnError('cross-origin');
}

function checkAuthenticatorData(auth: AuthenticatorData, rp: RelyingParty) {
  if (!safeEqual(auth.rpIdHash, sha256(rp.id))) throw new WebAuthnError('bad-rp-id');
  if (!auth.userPresent) throw new WebAuthnError('user-not-present');
  // La verificacion biometrica (o PIN) es OBLIGATORIA: sin ella la passkey seria solo "algo que tienes".
  if (!auth.userVerified) throw new WebAuthnError('user-not-verified');
  if (auth.backupState && !auth.backupEligible) throw new WebAuthnError('bad-credential', 'banderas de respaldo incoherentes');
}

/**
 * Verifica el REGISTRO de una passkey (WebAuthn, seccion 7.1). `expectedChallenge` es el que el servidor emitio y
 * ya consumio. No se valida la marca del dispositivo (attestation): se pide "none" y solo importa la clave publica.
 */
export function verifyRegistrationResponse(input: {
  response: RegistrationResponseJSON;
  expectedChallenge: string;
  rp: RelyingParty;
}): VerifiedRegistration {
  const { response, expectedChallenge, rp } = input;
  if (response.type !== 'public-key') throw new WebAuthnError('bad-type', 'type');

  const { data } = parseClientData(response.response.clientDataJSON);
  checkClientData(data, 'webauthn.create', expectedChallenge, rp);

  const attestation: unknown = decodeCborExact(fromBase64url(response.response.attestationObject, 16_384));
  if (!(attestation instanceof Map)) throw new WebAuthnError('bad-attestation', 'no es un mapa');
  const authData = attestation.get('authData');
  if (typeof attestation.get('fmt') !== 'string' || !Buffer.isBuffer(authData)) {
    throw new WebAuthnError('bad-attestation', 'faltan fmt o authData');
  }

  const auth = parseAuthenticatorData(authData);
  checkAuthenticatorData(auth, rp);
  if (!auth.attested) throw new WebAuthnError('bad-credential', 'no trae la credencial');

  // El id que dice el navegador debe ser el que quedo dentro de lo firmado por el autenticador.
  const credentialId = toBase64url(auth.attested.credentialId);
  if (stripPadding(response.id) !== credentialId || stripPadding(response.rawId) !== credentialId) throw new WebAuthnError('bad-credential', 'ids distintos');

  const { algorithm } = parseCoseKey(auth.attested.credentialPublicKey); // valida algoritmo, tipo y fuerza de la clave
  const transports = (response.response.transports ?? []).filter((t) => KNOWN_TRANSPORTS.has(t)).slice(0, KNOWN_TRANSPORTS.size);

  return {
    credentialId,
    publicKey: auth.attested.credentialPublicKey,
    algorithm,
    signCount: auth.signCount,
    backedUp: auth.backupState,
    transports: [...new Set(transports)],
  };
}

/**
 * Verifica el USO de una passkey (WebAuthn, seccion 7.2): desafio, origen, sitio, verificacion del usuario y la
 * FIRMA con la clave publica guardada. El contador y el dueño de la credencial los comprueba quien la guarda.
 */
export function verifyAuthenticationResponse(input: {
  response: AuthenticationResponseJSON;
  expectedChallenge: string;
  rp: RelyingParty;
  credential: { publicKey: Buffer; algorithm: number };
}): VerifiedAuthentication {
  const { response, expectedChallenge, rp, credential } = input;
  if (response.type !== 'public-key') throw new WebAuthnError('bad-type', 'type');
  if (stripPadding(response.id) !== stripPadding(response.rawId)) throw new WebAuthnError('bad-credential', 'ids distintos');

  const { raw: clientDataBytes, data } = parseClientData(response.response.clientDataJSON);
  checkClientData(data, 'webauthn.get', expectedChallenge, rp);

  const authDataBytes = fromBase64url(response.response.authenticatorData, 4096);
  const auth = parseAuthenticatorData(authDataBytes);
  checkAuthenticatorData(auth, rp);

  const signature = fromBase64url(response.response.signature, 1024);
  const { algorithm, key } = parseCoseKey(credential.publicKey);
  if (algorithm !== credential.algorithm) throw new WebAuthnError('bad-public-key', 'algoritmo no coincide');

  const signedData = Buffer.concat([authDataBytes, sha256(clientDataBytes)]);
  if (!verifySignature(algorithm, key, signedData, signature)) throw new WebAuthnError('bad-signature');

  const userHandle = response.response.userHandle ? fromBase64url(response.response.userHandle, 64) : null;
  return { signCount: auth.signCount, backedUp: auth.backupState, userHandle: userHandle && userHandle.length > 0 ? userHandle : null };
}
