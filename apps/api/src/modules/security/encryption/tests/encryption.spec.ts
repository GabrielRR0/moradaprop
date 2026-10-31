import { describeCase } from '@/../test/support/describe-case';
import { AppConfig } from '@/config';
import { loadEnv } from '@/config/env';
import { BlindIndexService } from '../services/blind-index.service';
import { FieldCipher } from '../services/field-cipher.service';
import { KeyRingService } from '../services/key-ring.service';

const K1 = 'a'.repeat(32);
const K2 = 'b'.repeat(40);

function build(keys: string, activeVersion = '') {
  const config = new AppConfig(loadEnv());
  const patched = Object.assign(Object.create(config), {
    security: { ...config.security, encryption: { keys, activeVersion } },
  }) as AppConfig;
  const ring = new KeyRingService(patched);
  return { ring, cipher: new FieldCipher(ring), index: new BlindIndexService(ring) };
}

describe('security/encryption', () => {
  describeCase('security/encryption', {
    que: 'cifra y descifra un campo sin dejarlo en claro',
    espera: 'ida y vuelta igual; formato v1.*; dos cifrados del mismo valor son distintos',
    ejecutar: () => {
      const { cipher } = build(`v1:${K1}`);
      const a = cipher.encrypt('User.email', 'ana@correo.cl');
      const b = cipher.encrypt('User.email', 'ana@correo.cl');
      return { a, b, vuelta: cipher.decrypt('User.email', a) };
    },
    verificar: ({ a, b, vuelta }) => {
      expect(vuelta).toBe('ana@correo.cl');
      expect(a).toMatch(/^v1\./);
      expect(a).not.toContain('ana');
      expect(a).not.toBe(b);
    },
    describirObtenido: ({ a }) => `cifrado "${a.slice(0, 28)}..."`,
  });

  describeCase('security/encryption', {
    que: 'un valor cifrado copiado a otra columna no se puede descifrar (AAD)',
    espera: 'descifrar con otro campo lanza error',
    ejecutar: () => {
      const { cipher } = build(`v1:${K1}`);
      const payload = cipher.encrypt('User.email', 'ana@correo.cl');
      try {
        cipher.decrypt('User.phone', payload);
        return 'descifro';
      } catch {
        return 'error';
      }
    },
    verificar: (r) => expect(r).toBe('error'),
  });

  describeCase('security/encryption', {
    que: 'un valor manipulado no descifra (GCM autentica)',
    espera: 'cambiar un byte lanza error',
    ejecutar: () => {
      const { cipher } = build(`v1:${K1}`);
      const payload = cipher.encrypt('User.name', 'Ana');
      const parts = payload.split('.');
      parts[3] = Buffer.from('X').toString('base64url');
      try {
        cipher.decrypt('User.name', parts.join('.'));
        return 'descifro';
      } catch {
        return 'error';
      }
    },
    verificar: (r) => expect(r).toBe('error'),
  });

  describeCase('security/encryption', {
    que: 'rota claves: lo cifrado con v1 sigue descifrando con v2 activa',
    espera: 'v1 se lee, lo nuevo sale como v2 y needsRotation detecta lo viejo',
    ejecutar: () => {
      const viejo = build(`v1:${K1}`).cipher.encrypt('User.phone', '+56911112222');
      const { cipher } = build(`v1:${K1},v2:${K2}`);
      const nuevo = cipher.encrypt('User.phone', '+56911112222');
      return {
        vuelta: cipher.decrypt('User.phone', viejo),
        nuevo,
        rot: cipher.needsRotation(viejo),
        rotNuevo: cipher.needsRotation(nuevo),
      };
    },
    verificar: ({ vuelta, nuevo, rot, rotNuevo }) => {
      expect(vuelta).toBe('+56911112222');
      expect(nuevo).toMatch(/^v2\./);
      expect(rot).toBe(true);
      expect(rotNuevo).toBe(false);
    },
  });

  describeCase('security/encryption', {
    que: 'el indice ciego es estable, normaliza y no cambia al rotar el cifrado',
    espera: 'mismo correo en otra grafia da el mismo hash; con v2 activa sigue igual; campos distintos dan hashes distintos',
    ejecutar: () => {
      const a = build(`v1:${K1}`).index;
      const b = build(`v1:${K1},v2:${K2}`).index;
      return {
        h1: a.hash('User.email', ' Ana@Correo.CL ', 'email'),
        h2: b.hash('User.email', 'ana@correo.cl', 'email'),
        otro: a.hash('SocialAccount.email', 'ana@correo.cl', 'email'),
      };
    },
    verificar: ({ h1, h2, otro }) => {
      expect(h1).toBe(h2);
      expect(h1).not.toBe(otro);
      expect(h1).toMatch(/^[0-9a-f]{64}$/);
    },
  });

  describeCase('security/encryption', {
    que: 'rechaza una configuracion de claves invalida',
    espera: 'clave corta o version activa inexistente lanzan error',
    ejecutar: () => {
      const errores: boolean[] = [];
      const casos: Array<[string, string?]> = [['v1:corta'], [`v1:${K1}`, 'v9']];
      for (const [keys, active] of casos) {
        try {
          build(keys, active);
          errores.push(false);
        } catch {
          errores.push(true);
        }
      }
      return errores;
    },
    verificar: (e) => expect(e).toEqual([true, true]),
  });
});
