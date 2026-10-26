import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describeCase } from '../../../../../test/support/describe-case';
import { parseAuthenticatorData } from '../webauthn/authenticator-data';
import { fromBase64url, toBase64url } from '../webauthn/base64url';
import { decodeCborExact } from '../webauthn/cbor';
import { parseCoseKey, verifySignature } from '../webauthn/cose';
import { WebAuthnError } from '../webauthn/types';
import { parseClientData, verifyAuthenticationResponse, verifyRegistrationResponse } from '../webauthn/verify';

/**
 * Respuestas REALES de navegadores y llaves de seguridad (datos de prueba publicos del proyecto SimpleWebAuthn, MIT;
 * solo se usan sus DATOS, no su codigo). Nuestro autenticador de software y nuestro verificador los escribimos con la
 * misma comprension de la especificacion, asi que podrian equivocarse juntos: estos datos no los escribimos nosotros.
 * Son de llaves sin verificacion de usuario (UV), por eso el verificador completo los rechaza con 'user-not-verified'
 * DESPUES de pasar todo lo anterior; las piezas (lectura de datos y firma) se prueban por separado.
 */
interface Registration { id: string; attestationObject: string; clientDataJSON: string }
interface Assertion { id: string; authenticatorData: string; clientDataJSON: string; signature: string; publicKey: string; counter: number }
const vectors = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'real-vectors.json'), 'utf8')) as {
  rpId: string;
  origin: string;
  registrations: Record<'none' | 'packed' | 'fidoU2F', Registration>;
  assertions: Record<'primera' | 'sinUsar', Assertion>;
};

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest();
const rp = { id: vectors.rpId, origins: [vectors.origin] };
const razon = (fn: () => unknown): string => {
  try {
    fn();
    return 'no fallo';
  } catch (error) {
    return error instanceof WebAuthnError ? error.reason : `otro error: ${(error as Error).message}`;
  }
};
const REGISTRATIONS = ['none', 'packed', 'fidoU2F'] as const;

describe('datos reales: registro', () => {
  describeCase('passkeys', {
    que: 'attestationObject real (fmt none de Firefox, packed y fido-u2f con cadena de certificados): CBOR, authData y clave publica',
    espera: 'se leen sin error; el hash del sitio coincide, el usuario esta presente, hay credencial y su clave COSE es ES256',
    ejecutar: () =>
      REGISTRATIONS.map((nombre) => {
        const v = vectors.registrations[nombre];
        const attestation = decodeCborExact(fromBase64url(v.attestationObject, 16_384)) as Map<string, unknown>;
        const auth = parseAuthenticatorData(attestation.get('authData') as Buffer);
        return {
          nombre,
          fmt: attestation.get('fmt'),
          sitio: auth.rpIdHash.equals(sha256(vectors.rpId)),
          presente: auth.userPresent,
          conCredencial: Boolean(auth.attested),
          algoritmo: parseCoseKey(auth.attested!.credentialPublicKey).algorithm,
          idCoincide: nombre === 'packed' ? null : toBase64url(auth.attested!.credentialId) === v.id,
        };
      }),
    verificar: (r) => {
      expect(r.map((x) => x.fmt)).toEqual(['none', 'packed', 'fido-u2f']);
      for (const x of r) expect(x).toMatchObject({ sitio: true, presente: true, conCredencial: true, algoritmo: -7 });
      expect(r.filter((x) => x.idCoincide !== null).every((x) => x.idCoincide)).toBe(true);
    },
    describirObtenido: (r) => r.map((x) => `${x.fmt}:ES256`).join(' '),
  });

  describeCase('passkeys', {
    que: 'clientDataJSON real: con barras escapadas ("https:\\/\\/") y campos de mas (androidPackageName)',
    espera: 'se lee: tipo webauthn.create y el origen correcto',
    ejecutar: () => REGISTRATIONS.map((nombre) => parseClientData(vectors.registrations[nombre].clientDataJSON).data),
    verificar: (r) => {
      for (const data of r) expect(data).toMatchObject({ type: 'webauthn.create', origin: vectors.origin, crossOrigin: false });
    },
  });

  describeCase('passkeys', {
    que: 'el verificador COMPLETO con registros reales: Firefox (none) y packed traen verificacion de usuario; la llave U2F no',
    espera: 'none y packed se verifican de punta a punta (id, clave ES256, contador); la llave U2F se rechaza con "user-not-verified"',
    ejecutar: () =>
      REGISTRATIONS.map((nombre) => {
        const v = vectors.registrations[nombre];
        // El fixture packed trae un id de relleno ("bbb"): se usa el id real que va dentro de lo firmado.
        const attestation = decodeCborExact(fromBase64url(v.attestationObject, 16_384)) as Map<string, Buffer>;
        const id = toBase64url(parseAuthenticatorData(attestation.get('authData') as Buffer).attested!.credentialId);
        const challenge = parseClientData(v.clientDataJSON).data.challenge;
        const response = { id, rawId: id, type: 'public-key', response: { clientDataJSON: v.clientDataJSON, attestationObject: v.attestationObject } };
        try {
          return { nombre, ok: verifyRegistrationResponse({ response, expectedChallenge: challenge, rp }), id };
        } catch (error) {
          return { nombre, error: error instanceof WebAuthnError ? error.reason : String(error) };
        }
      }),
    verificar: ([none, packed, u2f]) => {
      expect(none.ok).toMatchObject({ credentialId: none.id, algorithm: -7, backedUp: false });
      expect(packed.ok).toMatchObject({ credentialId: packed.id, algorithm: -7 });
      expect(u2f.error).toBe('user-not-verified');
    },
    describirObtenido: (r) => r.map((x) => `${x.nombre}: ${x.error ?? 'verificado'}`).join(' | '),
  });

  describeCase('passkeys', {
    que: 'ese mismo registro real, pero manipulado: otro desafio, otro origen, otro sitio',
    espera: 'cada uno se rechaza con su motivo',
    ejecutar: () => {
      const v = vectors.registrations.none;
      const challenge = parseClientData(v.clientDataJSON).data.challenge;
      const response = { id: v.id, rawId: v.id, type: 'public-key', response: { clientDataJSON: v.clientDataJSON, attestationObject: v.attestationObject } };
      return {
        desafio: razon(() => verifyRegistrationResponse({ response, expectedChallenge: 'otro', rp })),
        origen: razon(() => verifyRegistrationResponse({ response, expectedChallenge: challenge, rp: { ...rp, origins: ['https://otro.test'] } })),
        sitio: razon(() => verifyRegistrationResponse({ response, expectedChallenge: challenge, rp: { ...rp, id: 'otro.test' } })),
      };
    },
    verificar: (r) => expect(r).toEqual({ desafio: 'bad-challenge', origen: 'bad-origin', sitio: 'bad-rp-id' }),
  });
});

describe('datos reales: uso', () => {
  const firmado = (v: Assertion) => {
    const authData = fromBase64url(v.authenticatorData, 4096);
    const clientData = fromBase64url(v.clientDataJSON, 4096);
    return { authData, clientData, data: Buffer.concat([authData, sha256(clientData)]), signature: fromBase64url(v.signature, 1024) };
  };

  describeCase('passkeys', {
    que: 'firma REAL (ES256, DER) sobre authenticatorData + SHA-256(clientDataJSON) con la clave COSE real',
    espera: 'verifica; con un byte cambiado en la firma, en authenticatorData o en clientDataJSON, o con la clave de OTRA passkey, NO verifica',
    ejecutar: () => {
      const claves = Object.values(vectors.assertions).map((v) => parseCoseKey(fromBase64url(v.publicKey, 256)));
      return Object.values(vectors.assertions).map((v, i) => {
        const { authData, clientData, data, signature } = firmado(v);
        const alterar = (b: Buffer) => Buffer.concat([b.subarray(0, 5), Buffer.from([b[5] ^ 0x01]), b.subarray(6)]);
        const { algorithm, key } = claves[i];
        return {
          algoritmo: algorithm,
          valida: verifySignature(algorithm, key, data, signature),
          firmaAlterada: verifySignature(algorithm, key, data, alterar(signature)),
          authDataAlterado: verifySignature(algorithm, key, Buffer.concat([alterar(authData), sha256(clientData)]), signature),
          clientDataAlterado: verifySignature(algorithm, key, Buffer.concat([authData, sha256(alterar(clientData))]), signature),
          otraClave: verifySignature(algorithm, claves[1 - i].key, data, signature),
        };
      });
    },
    verificar: (r) => {
      for (const x of r) expect(x).toEqual({ algoritmo: -7, valida: true, firmaAlterada: false, authDataAlterado: false, clientDataAlterado: false, otraClave: false });
    },
    describirObtenido: (r) => r.map((x) => `valida=${x.valida} alterada=${x.firmaAlterada}`).join(' | '),
  });

  describeCase('passkeys', {
    que: 'authenticatorData real de un uso: sitio, presencia y contador',
    espera: 'el hash coincide con el sitio, usuario presente, sin verificar (llave vieja) y el contador es el que tenia mas 1',
    ejecutar: () => Object.values(vectors.assertions).map((v) => ({ auth: parseAuthenticatorData(fromBase64url(v.authenticatorData, 4096)), anterior: v.counter })),
    verificar: (r) => {
      for (const { auth, anterior } of r) {
        expect(auth.rpIdHash.equals(sha256(vectors.rpId))).toBe(true);
        expect(auth).toMatchObject({ userPresent: true, userVerified: false });
        expect(auth.signCount).toBeGreaterThanOrEqual(anterior);
      }
      expect(r[0].auth.signCount).toBe(144);
    },
  });

  describeCase('passkeys', {
    que: 'el verificador completo con un uso real (llave SIN verificacion de usuario)',
    espera: 'pasa desafio, origen, sitio y presencia y se detiene en "user-not-verified"',
    ejecutar: () =>
      Object.values(vectors.assertions).map((v) =>
        razon(() =>
          verifyAuthenticationResponse({
            response: { id: v.id, rawId: v.id, type: 'public-key', response: { clientDataJSON: v.clientDataJSON, authenticatorData: v.authenticatorData, signature: v.signature } },
            expectedChallenge: parseClientData(v.clientDataJSON).data.challenge,
            rp,
            credential: { publicKey: fromBase64url(v.publicKey, 256), algorithm: -7 },
          }),
        ),
      ),
    verificar: (r) => expect(r).toEqual(['user-not-verified', 'user-not-verified']),
  });
});
