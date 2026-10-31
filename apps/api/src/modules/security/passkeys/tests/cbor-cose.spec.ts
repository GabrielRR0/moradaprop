import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { describeCase } from '@/../test/support/describe-case';
import { cborEncode } from '@/../test/support/fake-authenticator';
import { parseAuthenticatorData } from '../webauthn/authenticator-data';
import { fromBase64url } from '../webauthn/base64url';
import { decodeCbor, decodeCborExact } from '../webauthn/cbor';
import { parseCoseKey } from '../webauthn/cose';
import { WebAuthnError } from '../webauthn/types';

const razon = (fn: () => unknown): string => {
  try {
    fn();
    return 'no fallo';
  } catch (error) {
    return error instanceof WebAuthnError ? error.reason : `otro error: ${(error as Error).message}`;
  }
};
/** CBOR de un mapa con claves numericas (la forma de una clave COSE). */
const m = (entries: Array<[number, number | Buffer]>) => cborEncode(new Map<number, number | Buffer>(entries) as never);
const hex = (texto: string) => Buffer.from(texto.replace(/\s/g, ''), 'hex');

describe('cbor', () => {
  describeCase('passkeys', {
    que: 'lee lo que escribe el codificador: enteros, negativos, texto, bytes, listas, mapas y booleanos',
    espera: 'ida y vuelta sin perder nada',
    ejecutar: () => {
      const original = new Map<number | string, unknown>([
        [1, 2],
        [-7, -300],
        ['texto', 'ñandú'],
        ['bytes', Buffer.from([1, 2, 3])],
        ['lista', [1, [2, 3], 'x']],
        ['si', true],
        ['no', false],
        ['nada', null],
        ['grande', 70000],
      ]);
      return decodeCborExact(cborEncode(original as never)) as Map<number | string, unknown>;
    },
    verificar: (mapa) => {
      expect(mapa.get(1)).toBe(2);
      expect(mapa.get(-7)).toBe(-300);
      expect(mapa.get('texto')).toBe('ñandú');
      expect(mapa.get('bytes')).toEqual(Buffer.from([1, 2, 3]));
      expect(mapa.get('lista')).toEqual([1, [2, 3], 'x']);
      expect([mapa.get('si'), mapa.get('no'), mapa.get('nada'), mapa.get('grande')]).toEqual([true, false, null, 70000]);
    },
  });

  describeCase('passkeys', {
    que: 'entradas hostiles: truncada, longitud indefinida, etiqueta, flotante, clave repetida, clave invalida, UTF-8 roto',
    espera: 'todas se rechazan con bad-encoding (nunca se cuelga ni lanza otra cosa)',
    ejecutar: () => ({
      truncada: razon(() => decodeCborExact(hex('a2 01 02'))),
      vacia: razon(() => decodeCborExact(Buffer.alloc(0))),
      indefinida: razon(() => decodeCborExact(hex('9f 01 ff'))),
      etiqueta: razon(() => decodeCborExact(hex('c0 01'))),
      flotante: razon(() => decodeCborExact(hex('fb 3ff0000000000000'))),
      claveRepetida: razon(() => decodeCborExact(hex('a2 01 01 01 02'))),
      claveInvalida: razon(() => decodeCborExact(hex('a1 41 01 01'))), // clave de tipo bytes
      utf8Roto: razon(() => decodeCborExact(hex('62 c3 28'))),
      sobrantes: razon(() => decodeCborExact(hex('01 02'))),
    }),
    verificar: (r) => expect(Object.values(r).every((m) => m === 'bad-encoding')).toBe(true),
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('passkeys', {
    que: 'bombas: longitud enorme declarada con pocos bytes y listas anidadas muy hondas',
    espera: 'bad-encoding rapido, sin reservar memoria ni recursion sin limite',
    ejecutar: () => {
      const anidada = Buffer.concat([Buffer.alloc(40, 0x81), Buffer.from([0x00])]); // [[[[...0]]]] a 40 niveles
      return {
        bytesGigantes: razon(() => decodeCborExact(hex('5b 00000000ffffffff'))),
        listaGigante: razon(() => decodeCborExact(hex('99 ffff'))),
        enteroEnorme: razon(() => decodeCborExact(hex('1b ffffffffffffffff'))),
        anidada: razon(() => decodeCborExact(anidada)),
      };
    },
    verificar: (r) => expect(Object.values(r).every((m) => m === 'bad-encoding')).toBe(true),
  });

  describeCase('passkeys', {
    que: 'decodeCbor dice donde termina un valor (para separar la clave publica de lo que sigue)',
    espera: 'end apunta justo despues del valor',
    ejecutar: () => decodeCbor(Buffer.concat([m([[1, 2]]), Buffer.from('resto')]), 0).end,
    verificar: (end) => expect(end).toBe(3),
  });
});

describe('base64url', () => {
  describeCase('passkeys', {
    que: 'base64url estricto: caracteres de base64 normal, relleno mal puesto, demasiado largo y no-texto',
    espera: 'valido pasa (con o sin relleno al final); "+", "/", "=" en medio, mas de 2 "=", exceso de tamano y numeros se rechazan',
    ejecutar: () => ({
      ok: fromBase64url('aGVsbG8', 10).toString(),
      mas: razon(() => fromBase64url('a+b', 10)),
      barra: razon(() => fromBase64url('a/b', 10)),
      conRelleno: fromBase64url('aGVsbG8=', 10).toString(),
      igualEnMedio: razon(() => fromBase64url('aG=VsbG8', 10)),
      muchosIguales: razon(() => fromBase64url('aGVsbG8===', 10)),
      largo: razon(() => fromBase64url('A'.repeat(100), 10)),
      numero: razon(() => fromBase64url(123, 10)),
    }),
    verificar: (r) => expect(r).toEqual({ ok: 'hello', mas: 'bad-encoding', barra: 'bad-encoding', conRelleno: 'hello', igualEnMedio: 'bad-encoding', muchosIguales: 'bad-encoding', largo: 'bad-encoding', numero: 'bad-encoding' }),
  });
});

describe('cose', () => {
  const b = (jwkValue: string | undefined) => Buffer.from(jwkValue as string, 'base64url');

  describeCase('passkeys', {
    que: 'claves COSE invalidas o debiles',
    espera: 'RSA de 1024 bits, punto fuera de la curva, algoritmo no soportado, tipo que no cuadra y basura se rechazan',
    ejecutar: () => {
      const rsaDebil = generateKeyPairSync('rsa', { modulusLength: 1024 }).publicKey.export({ format: 'jwk' });
      return {
        rsaDebil: razon(() => parseCoseKey(m([[1, 3], [3, -257], [-1, b(rsaDebil.n)], [-2, b(rsaDebil.e)]]))),
        fueraDeCurva: razon(() => parseCoseKey(m([[1, 2], [3, -7], [-1, 1], [-2, randomBytes(32)], [-3, randomBytes(32)]]))),
        algoritmo: razon(() => parseCoseKey(m([[1, 2], [3, -35], [-1, 2], [-2, randomBytes(48)], [-3, randomBytes(48)]]))),
        tipoNoCuadra: razon(() => parseCoseKey(m([[1, 3], [3, -7], [-1, 1], [-2, randomBytes(32)], [-3, randomBytes(32)]]))),
        coordenadaCorta: razon(() => parseCoseKey(m([[1, 2], [3, -7], [-1, 1], [-2, randomBytes(31)], [-3, randomBytes(32)]]))),
        noEsMapa: razon(() => parseCoseKey(cborEncode([1, 2] as never))),
        basura: razon(() => parseCoseKey(Buffer.from('basura'))),
      };
    },
    verificar: (r) =>
      expect(r).toEqual({
        rsaDebil: 'bad-public-key',
        fueraDeCurva: 'bad-public-key',
        algoritmo: 'unsupported-algorithm',
        tipoNoCuadra: 'bad-public-key',
        coordenadaCorta: 'bad-public-key',
        noEsMapa: 'bad-public-key',
        basura: 'bad-public-key',
      }),
    describirObtenido: (r) => JSON.stringify(r),
  });
});

describe('authenticatorData', () => {
  const rpIdHash = Buffer.alloc(32, 7);
  const base = (flags: number, extra = Buffer.alloc(0)) => Buffer.concat([rpIdHash, Buffer.from([flags]), Buffer.from([0, 0, 0, 5]), extra]);

  describeCase('passkeys', {
    que: 'authenticatorData bien formado y con problemas',
    espera: 'el valido se lee; corto, con bytes sobrantes y con id de credencial que se sale del buffer se rechazan',
    ejecutar: () => ({
      valido: parseAuthenticatorData(base(0x05)),
      corto: razon(() => parseAuthenticatorData(Buffer.alloc(36))),
      sobrantes: razon(() => parseAuthenticatorData(base(0x05, Buffer.from('x')))),
      idSaleDelBuffer: razon(() => parseAuthenticatorData(base(0x45, Buffer.concat([Buffer.alloc(16), Buffer.from([0x03, 0xff]), Buffer.alloc(4)])))),
      idVacio: razon(() => parseAuthenticatorData(base(0x45, Buffer.concat([Buffer.alloc(16), Buffer.from([0, 0])])))),
    }),
    verificar: (r) => {
      expect(r.valido).toMatchObject({ userPresent: true, userVerified: true, signCount: 5, backupEligible: false });
      expect([r.corto, r.sobrantes, r.idSaleDelBuffer, r.idVacio]).toEqual(['bad-credential', 'bad-credential', 'bad-credential', 'bad-credential']);
    },
  });
});
