import { describeCase } from '@test/support/describe-case';
import { AppConfig } from '@/config';
import { loadEnv } from '@/config/env';
import { CryptoService } from '../crypto.service';

const crypto = new CryptoService(new AppConfig(loadEnv()));

describe('CryptoService', () => {
  describeCase('common/crypto', {
    que: 'cifra y descifra un secreto (AES-256-GCM) sin dejarlo en claro',
    espera: 'ida y vuelta igual; el cifrado no contiene el texto original; cada cifrado es distinto',
    ejecutar: () => {
      const secreto = 'JBSWY3DPEHPK3PXP';
      const a = crypto.encrypt(secreto);
      const b = crypto.encrypt(secreto);
      return { secreto, a, b, vuelta: crypto.decrypt(a) };
    },
    verificar: ({ secreto, a, b, vuelta }) => {
      expect(vuelta).toBe(secreto);
      expect(a).not.toContain(secreto);
      expect(a).not.toBe(b);
    },
    describirObtenido: ({ a, vuelta }) => `cifrado "${a.slice(0, 24)}..." -> descifrado "${vuelta}"`,
  });

  describeCase('common/crypto', {
    que: 'detecta un cifrado manipulado (la etiqueta GCM falla)',
    espera: 'descifrar un texto alterado lanza error',
    ejecutar: () => {
      const [iv, tag, data] = crypto.encrypt('secreto').split('.');
      const alterado = [iv, tag, Buffer.from('otro-contenido').toString('base64url')].join('.');
      try {
        crypto.decrypt(alterado);
        return 'no fallo';
      } catch {
        return `fallo como se esperaba (${data.length} bytes originales)`;
      }
    },
    verificar: (resultado) => expect(resultado).toContain('fallo como se esperaba'),
  });

  describeCase('common/crypto', {
    que: 'el hash de un codigo depende del contexto: el mismo codigo no sirve para otro usuario o tipo',
    espera: 'mismo contexto = mismo hash; contexto distinto = hash distinto',
    ejecutar: () => ({
      igual: crypto.hashCode('123456', 'u1:EMAIL') === crypto.hashCode('123456', 'u1:EMAIL'),
      otroUsuario: crypto.hashCode('123456', 'u1:EMAIL') === crypto.hashCode('123456', 'u2:EMAIL'),
      otroTipo: crypto.hashCode('123456', 'u1:EMAIL') === crypto.hashCode('123456', 'u1:RESET'),
    }),
    verificar: (r) => expect(r).toEqual({ igual: true, otroUsuario: false, otroTipo: false }),
  });

  describeCase('common/crypto', {
    que: 'genera codigos numericos con ceros a la izquierda y tokens aleatorios largos y unicos',
    espera: 'codigos de 6 digitos; tokens de 64 caracteres distintos entre si',
    ejecutar: () => ({
      codigos: Array.from({ length: 200 }, () => crypto.numericCode(6)),
      tokens: new Set(Array.from({ length: 50 }, () => crypto.randomToken())),
    }),
    verificar: ({ codigos, tokens }) => {
      expect(codigos.every((c) => /^\d{6}$/.test(c))).toBe(true);
      expect(tokens.size).toBe(50);
      expect([...tokens][0]).toHaveLength(64);
    },
  });

  describeCase('common/crypto', {
    que: 'compara en tiempo constante y rechaza longitudes distintas',
    espera: 'true solo si son identicos',
    ejecutar: () => [crypto.safeEqual('abc', 'abc'), crypto.safeEqual('abc', 'abd'), crypto.safeEqual('abc', 'abcd')],
    verificar: (r) => expect(r).toEqual([true, false, false]),
  });
});
