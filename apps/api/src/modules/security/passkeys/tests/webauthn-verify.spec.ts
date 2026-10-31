import { describeCase } from '@/../test/support/describe-case';
import { FakeAuthenticator, type FakeAlgorithm, type Tweak } from '@/../test/support/fake-authenticator';
import { verifyAuthenticationResponse, verifyRegistrationResponse } from '../webauthn/verify';
import { WebAuthnError, type RelyingParty } from '../webauthn/types';

const RP: RelyingParty = { id: 'alquileres.test', origins: ['https://alquileres.test'] };
const CHALLENGE = 'Y2hhbGxlbmdlLWRlLXBydWViYQ'; // lo que el servidor emitio

const nuevo = (alg: FakeAlgorithm = 'ES256', synced = false) =>
  new FakeAuthenticator({ alg, rpId: RP.id, origin: RP.origins[0], synced });

const registrar = (auth: FakeAuthenticator, tweak: Tweak = {}) =>
  verifyRegistrationResponse({ response: auth.create({ challenge: CHALLENGE }, tweak), expectedChallenge: CHALLENGE, rp: RP });

/** Registra y devuelve la credencial tal como la guardaria el servidor. */
const credencial = (auth: FakeAuthenticator) => {
  const r = registrar(auth);
  return { publicKey: r.publicKey, algorithm: r.algorithm };
};

const usar = (auth: FakeAuthenticator, tweak: Tweak = {}, cred = credencial(auth), challenge = CHALLENGE) =>
  verifyAuthenticationResponse({ response: auth.get({ challenge: CHALLENGE }, tweak), expectedChallenge: challenge, rp: RP, credential: cred });

/** Motivo por el que se rechazo (o "no fallo"). */
const razon = (fn: () => unknown): string => {
  try {
    fn();
    return 'no fallo';
  } catch (error) {
    return error instanceof WebAuthnError ? error.reason : `otro error: ${(error as Error).message}`;
  }
};

describe('webauthn: registro', () => {
  describeCase('passkeys', {
    que: 'registro valido con cada algoritmo (ES256, RS256 de Windows Hello y EdDSA)',
    espera: 'devuelve el id, la clave publica COSE y el algoritmo correctos',
    ejecutar: () =>
      (['ES256', 'RS256', 'EdDSA'] as const).map((alg) => {
        const auth = nuevo(alg);
        const r = registrar(auth);
        return { alg, id: r.credentialId === auth.id, clave: r.publicKey.equals(auth.coseKey()), algorithm: r.algorithm, transports: r.transports };
      }),
    verificar: (r) => {
      expect(r.every((x) => x.id && x.clave)).toBe(true);
      expect(r.map((x) => x.algorithm)).toEqual([-7, -257, -8]);
      expect(r[0].transports).toEqual(['internal']);
    },
    describirObtenido: (r) => r.map((x) => `${x.alg}:${x.algorithm}`).join(' '),
  });

  describeCase('passkeys', {
    que: 'una passkey sincronizada (iCloud, Google): contador 0 y bandera de respaldo',
    espera: 'se acepta, con backedUp = true y signCount 0',
    ejecutar: () => registrar(nuevo('ES256', true)),
    verificar: (r) => expect(r).toMatchObject({ backedUp: true, signCount: 0 }),
  });

  describeCase('passkeys', {
    que: 'registros manipulados o mal formados',
    espera: 'cada uno se rechaza con SU motivo: desafio, origen, cross-origin, sitio, presencia, verificacion, tipo, id, respaldo',
    ejecutar: () => ({
      desafio: razon(() => registrar(nuevo(), { challenge: 'otro-desafio' })),
      origen: razon(() => registrar(nuevo(), { origin: 'https://phishing.test' })),
      crossOrigin: razon(() => registrar(nuevo(), { crossOrigin: true })),
      sitio: razon(() => registrar(nuevo(), { rpId: 'otro.test' })),
      sinPresencia: razon(() => registrar(nuevo(), { up: false })),
      sinVerificar: razon(() => registrar(nuevo(), { uv: false })),
      tipo: razon(() => registrar(nuevo(), { type: 'webauthn.get' })),
      idDistinto: razon(() => registrar(nuevo(), { claimId: Buffer.from('otro-id').toString('base64url') })),
      respaldo: razon(() => registrar(nuevo(), { backupBitsIncoherent: true })),
    }),
    verificar: (r) =>
      expect(r).toEqual({
        desafio: 'bad-challenge',
        origen: 'bad-origin',
        crossOrigin: 'cross-origin',
        sitio: 'bad-rp-id',
        sinPresencia: 'user-not-present',
        sinVerificar: 'user-not-verified',
        tipo: 'bad-type',
        idDistinto: 'bad-credential',
        respaldo: 'bad-credential',
      }),
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('passkeys', {
    que: 'datos corruptos: attestationObject truncado, no-CBOR y clientDataJSON que no es JSON',
    espera: 'bad-encoding / bad-attestation / bad-client-data, nunca una excepcion rara',
    ejecutar: () => {
      const auth = nuevo();
      const base = auth.create({ challenge: CHALLENGE });
      const con = (cambio: Partial<typeof base.response>) => ({ ...base, response: { ...base.response, ...cambio } });
      const corto = Buffer.from(base.response.attestationObject, 'base64url').subarray(0, 20).toString('base64url');
      const verificar = (response: typeof base) => razon(() => verifyRegistrationResponse({ response, expectedChallenge: CHALLENGE, rp: RP }));
      return {
        truncado: verificar(con({ attestationObject: corto })),
        noCbor: verificar(con({ attestationObject: Buffer.from('esto no es cbor').toString('base64url') })),
        noJson: verificar(con({ clientDataJSON: Buffer.from('{no json').toString('base64url') })),
        caracteres: verificar(con({ clientDataJSON: 'a+b/c==' })),
        vacio: verificar(con({ attestationObject: '' })),
      };
    },
    verificar: (r) => {
      expect(r.truncado).toBe('bad-encoding');
      expect(r.noJson).toBe('bad-client-data');
      expect(r.caracteres).toBe('bad-encoding');
      expect(['bad-encoding', 'bad-attestation']).toContain(r.noCbor);
      expect(['bad-encoding', 'bad-attestation']).toContain(r.vacio);
    },
    describirObtenido: (r) => JSON.stringify(r),
  });
});

describe('webauthn: uso de una passkey', () => {
  describeCase('passkeys', {
    que: 'inicio de sesion valido con cada algoritmo',
    espera: 'la firma verifica; devuelve el contador y el userHandle',
    ejecutar: () =>
      (['ES256', 'RS256', 'EdDSA'] as const).map((alg) => {
        const auth = nuevo(alg);
        auth.userHandle = Buffer.from('handle-del-usuario');
        const r = usar(auth);
        return { alg, signCount: r.signCount, handle: r.userHandle?.toString() };
      }),
    verificar: (r) => {
      expect(r.map((x) => x.signCount)).toEqual([2, 2, 2]); // registro 1 + un uso
      expect(r.every((x) => x.handle === 'handle-del-usuario')).toBe(true);
    },
  });

  describeCase('passkeys', {
    que: 'usos manipulados',
    espera: 'cada uno se rechaza con su motivo: desafio, origen, sitio, presencia, verificacion, tipo, firma alterada, datos alterados',
    ejecutar: () => ({
      desafio: razon(() => usar(nuevo(), { challenge: 'otro' })),
      origen: razon(() => usar(nuevo(), { origin: 'https://phishing.test' })),
      sitio: razon(() => usar(nuevo(), { rpId: 'otro.test' })),
      sinPresencia: razon(() => usar(nuevo(), { up: false })),
      sinVerificar: razon(() => usar(nuevo(), { uv: false })),
      tipo: razon(() => usar(nuevo(), { type: 'webauthn.create' })),
      firma: razon(() => usar(nuevo(), { corruptSignature: true })),
      authData: razon(() => usar(nuevo(), { tamperAuthData: true })),
      clientData: razon(() => usar(nuevo(), { tamperClientData: true })),
    }),
    verificar: (r) =>
      expect(r).toEqual({
        desafio: 'bad-challenge',
        origen: 'bad-origin',
        sitio: 'bad-rp-id',
        sinPresencia: 'user-not-present',
        sinVerificar: 'user-not-verified',
        tipo: 'bad-type',
        firma: 'bad-signature',
        authData: 'bad-signature',
        clientData: 'bad-signature',
      }),
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('passkeys', {
    que: 'firmado con la clave de OTRO autenticador, o credencial guardada con otro algoritmo',
    espera: 'bad-signature en ambos (la firma valida de otro no sirve; un RS256 no se hace pasar por ES256)',
    ejecutar: () => {
      const victima = nuevo();
      const atacante = nuevo();
      const rsa = nuevo('RS256');
      return {
        otraClave: razon(() => usar(victima, { signWith: atacante })),
        otroAlgoritmo: razon(() => usar(rsa, {}, { publicKey: rsa.coseKey(), algorithm: -7 })),
      };
    },
    verificar: (r) => {
      expect(r.otraClave).toBe('bad-signature');
      expect(r.otroAlgoritmo).toBe('bad-public-key');
    },
    describirObtenido: (r) => JSON.stringify(r),
  });
});
