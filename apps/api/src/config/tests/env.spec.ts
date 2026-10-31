import { loadEnv } from '../env';
import { describeCase } from '@test/support/describe-case';

const entornoValido = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'access-secret-0123456789',
  JWT_REFRESH_SECRET: 'refresh-secret-0123456789',
  ENCRYPTION_KEY: 'encryption-key-0123456789-abcdefghij',
};

describe('config', () => {
  describeCase('config', {
    que: 'carga el entorno con los valores por defecto cuando solo estan las variables obligatorias',
    espera: 'puerto 3001, entorno development y redis local',
    ejecutar: () => loadEnv(entornoValido),
    verificar: (env) => {
      expect(env.port).toBe(3001);
      expect(env.nodeEnv).toBe('development');
      expect(env.redisUrl).toBe('redis://localhost:6379');
    },
    describirObtenido: (env) => `puerto ${env.port}, entorno ${env.nodeEnv}, redis ${env.redisUrl}`,
  });

  describeCase('config', {
    que: 'falla al arrancar si falta DATABASE_URL',
    espera: 'un error que nombra la variable DATABASE_URL',
    ejecutar: () => {
      try {
        loadEnv({ ...entornoValido, DATABASE_URL: undefined });
        return 'no fallo';
      } catch (error) {
        return (error as Error).message;
      }
    },
    verificar: (mensaje) => expect(mensaje).toContain('DATABASE_URL'),
  });

  describeCase('config', {
    que: 'rechaza un secreto JWT demasiado corto',
    espera: 'un error que nombra JWT_ACCESS_SECRET',
    ejecutar: () => {
      try {
        loadEnv({ ...entornoValido, JWT_ACCESS_SECRET: 'corto' });
        return 'no fallo';
      } catch (error) {
        return (error as Error).message;
      }
    },
    verificar: (mensaje) => expect(mensaje).toContain('JWT_ACCESS_SECRET'),
  });

  describeCase('config', {
    que: 'en produccion NO arranca con las claves de desarrollo del repositorio',
    espera: 'error que lista cada clave insegura y CORS apuntando a localhost',
    ejecutar: () => {
      try {
        loadEnv({
          ...entornoValido,
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: 'dev-access-secret-change-me-0123456789',
          JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me-0123456789',
          ENCRYPTION_KEY: 'dev-encryption-key-change-me-0123456789abcdef',
        });
        return 'arranco (mal)';
      } catch (error) {
        return (error as Error).message;
      }
    },
    verificar: (mensaje) => {
      expect(mensaje).toContain('Configuracion insegura para produccion');
      for (const nombre of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY', 'APP_CLIENT_KEY_WEB', 'CORS_ALLOWED_ORIGINS', 'WEBAUTHN_RP_ID', 'ADMIN_API_PREFIX']) {
        expect(mensaje).toContain(nombre);
      }
    },
    describirObtenido: (mensaje) => mensaje.split('\n').slice(0, 3).join(' | '),
  });

  describeCase('config', {
    que: 'en produccion arranca si todas las claves son propias y largas',
    espera: 'carga sin error y entorno production',
    ejecutar: () =>
      loadEnv({
        ...entornoValido,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'q8Zr4mT1vXc7LpN2aYb5KdWe9HsUf3Jg6Rt0',
        JWT_REFRESH_SECRET: 'Hn5Vb2Xk8Mc4QwEz7Ty1PdLs9JrGa3Uf6Ob0',
        ENCRYPTION_KEY: 'Tz3Kp8Wd1Rn6Cv9Lx2Qs5Hj4Mb7Yf0Ga8Ue1Nk',
        ADMIN_API_PREFIX: 'ctl-7f3k9x',
        APP_CLIENT_KEY_WEB: 'web-Kd82nXq91LmPz07Tb',
        APP_CLIENT_KEY_MOBILE: 'mob-Rt55wYc20HsVn38Qa',
        CORS_ALLOWED_ORIGINS: 'https://alquileres-ve.net',
        WEBAUTHN_RP_ID: 'alquileres-ve.net',
        WEBAUTHN_ORIGINS: 'https://alquileres-ve.net',
      }),
    verificar: (env) => expect(env.nodeEnv).toBe('production'),
  });

  describeCase('config', {
    que: 'en desarrollo las claves de ejemplo siguen permitidas',
    espera: 'carga sin error',
    ejecutar: () => loadEnv({ ...entornoValido, NODE_ENV: 'development', APP_CLIENT_KEY_WEB: 'dev-web-client-key' }),
    verificar: (env) => expect(env.nodeEnv).toBe('development'),
  });
  describeCase('config', {
    que: 'en produccion rechaza un prefijo de admin obvio o corto',
    espera: 'error que nombra ADMIN_API_PREFIX para "admin" y para un nombre de menos de 8 caracteres',
    ejecutar: () => {
      const produccion = {
        ...entornoValido,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'q8Zr4mT1vXc7LpN2aYb5KdWe9HsUf3Jg6Rt0',
        JWT_REFRESH_SECRET: 'Hn5Vb2Xk8Mc4QwEz7Ty1PdLs9JrGa3Uf6Ob0',
        ENCRYPTION_KEY: 'Tz3Kp8Wd1Rn6Cv9Lx2Qs5Hj4Mb7Yf0Ga8Ue1Nk',
        APP_CLIENT_KEY_WEB: 'web-Kd82nXq91LmPz07Tb',
        APP_CLIENT_KEY_MOBILE: 'mob-Rt55wYc20HsVn38Qa',
        CORS_ALLOWED_ORIGINS: 'https://alquileres-ve.net',
        WEBAUTHN_RP_ID: 'alquileres-ve.net',
        WEBAUTHN_ORIGINS: 'https://alquileres-ve.net',
      };
      const probar = (prefijo?: string) => {
        try {
          loadEnv({ ...produccion, ADMIN_API_PREFIX: prefijo });
          return 'arranco';
        } catch (error) {
          return (error as Error).message.includes('ADMIN_API_PREFIX') ? 'rechazado' : 'otro error';
        }
      };
      return { porDefecto: probar(undefined), admin: probar('admin'), corto: probar('ctl-7f'), propio: probar('ctl-7f3k9x') };
    },
    verificar: (r) => expect(r).toEqual({ porDefecto: 'rechazado', admin: 'rechazado', corto: 'rechazado', propio: 'arranco' }),
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('config', {
    que: 'el prefijo de admin solo acepta minusculas, numeros y guiones',
    espera: 'rechaza mayusculas, barras y espacios',
    ejecutar: () => ['Admin', 'a/b', 'mi panel', 'ab'].map((valor) => {
      try {
        loadEnv({ ...entornoValido, ADMIN_API_PREFIX: valor });
        return 'acepto';
      } catch {
        return 'rechazo';
      }
    }),
    verificar: (r) => expect(r).toEqual(['rechazo', 'rechazo', 'rechazo', 'rechazo']),
  });

});
