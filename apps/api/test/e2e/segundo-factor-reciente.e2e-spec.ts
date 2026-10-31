import { describeCase } from '../support/describe-case';
import { createAdmin, loginAdmin } from '../support/auth-helpers';
import { createTestApp, PASSWORD, totp, type TestApp } from '../support/test-app';

describe('Segundo factor reciente en acciones sensibles (e2e)', () => {
  let t: TestApp;
  let adminToken = '';
  let adminId = '';
  let secret = '';

  const admin = (method: 'get' | 'post' | 'delete') => (url: string) => t.web(method)(url).set('Authorization', `Bearer ${adminToken}`);
  const bloquearPais = (value: string) => admin('post')('/api/admin/security').send({ type: 'COUNTRY', value });
  /** Simula que el admin comprobo su segundo factor hace `minutes` minutos. */
  const envejecer = (minutes: number) =>
    t.prisma.session.updateMany({ where: { userId: adminId, revokedAt: null }, data: { strongAuthAt: new Date(Date.now() - minutes * 60_000) } });

  beforeAll(async () => {
    t = await createTestApp();
    ({ userId: adminId, secret } = await createAdmin(t, 'admin-reciente@correo.com', true));
    adminToken = await loginAdmin(t, 'admin-reciente@correo.com', secret);
  });
  afterAll(() => t.close());

  describeCase('2FA reciente (e2e)', {
    que: 'recien iniciada la sesion con 2FA, una accion sensible pasa sin pedir nada mas',
    espera: '201 al crear un bloqueo',
    ejecutar: () => bloquearPais('ZA'),
    verificar: (res) => expect(res.status).toBe(201),
    describirObtenido: (res) => `${res.status}`,
  });

  describeCase('2FA reciente (e2e)', {
    que: 'pasados mas de 5 minutos la accion sensible pide confirmar el segundo factor, pero leer sigue igual',
    espera: '403 RECENT_TWO_FACTOR_REQUIRED al crear y 200 al listar',
    ejecutar: async () => {
      await envejecer(10);
      return { crear: await bloquearPais('ZB'), listar: await admin('get')('/api/admin/security') };
    },
    verificar: ({ crear, listar }) => {
      expect(crear.status).toBe(403);
      expect(crear.body.code).toBe('RECENT_TWO_FACTOR_REQUIRED');
      expect(listar.status).toBe(200);
    },
    describirObtenido: ({ crear, listar }) => `crear ${crear.status} (${crear.body.code}), listar ${listar.status}`,
  });

  describeCase('2FA reciente (e2e)', {
    que: 'un codigo incorrecto no habilita la accion',
    espera: '401 en /auth/reverify/code y la accion sigue rechazada',
    ejecutar: async () => ({
      reverify: await admin('post')('/api/auth/reverify/code').send({ code: '000000' }),
      crear: await bloquearPais('ZB'),
    }),
    verificar: ({ reverify, crear }) => {
      expect(reverify.status).toBe(401);
      expect(crear.status).toBe(403);
    },
    describirObtenido: ({ reverify, crear }) => `reverify ${reverify.status}, crear ${crear.status}`,
  });

  describeCase('2FA reciente (e2e)', {
    que: 'con un codigo correcto la accion se habilita por unos minutos',
    espera: '200 con validUntil a ~5 minutos y luego 201 al crear el bloqueo',
    ejecutar: async () => {
      const reverify = await admin('post')('/api/auth/reverify/code').send({ code: totp(secret, 30) });
      return { reverify, crear: await bloquearPais('ZB') };
    },
    verificar: ({ reverify, crear }) => {
      expect(reverify.status).toBe(200);
      const minutes = (new Date(reverify.body.validUntil).getTime() - Date.now()) / 60_000;
      expect(minutes).toBeGreaterThan(4);
      expect(minutes).toBeLessThanOrEqual(5);
      expect(crear.status).toBe(201);
    },
    describirObtenido: ({ reverify, crear }) => `reverify ${reverify.status} (vale hasta ${reverify.body.validUntil}), crear ${crear.status}`,
  });

  describeCase('2FA reciente (e2e)', {
    que: 'renovar el token de acceso no renueva la verificacion',
    espera: 'tras refrescar la sesion sigue valiendo la hora original: vencida, vuelve a pedir el segundo factor',
    ejecutar: async () => {
      // Los pasos de tiempo ya usados no se aceptan otra vez (anti-replay): se reinicia para poder iniciar sesion de nuevo.
      await t.prisma.user.update({ where: { id: adminId }, data: { twoFactorLastStep: null } });
      const login = await t.web('post')('/api/auth/login').send({ email: 'admin-reciente@correo.com', password: PASSWORD });
      const second = await t.web('post')('/api/auth/login/2fa').send({ challengeToken: login.body.challengeToken, code: totp(secret) });
      const cookie = ((second.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refresh_token=')) ?? '').split(';')[0];
      await envejecer(10);
      const refresco = await t.web('post')('/api/auth/refresh').set('Cookie', cookie).send({});
      const crear = await t.web('post')('/api/admin/security').set('Authorization', `Bearer ${refresco.body.accessToken}`).send({ type: 'COUNTRY', value: 'ZC' });
      return { refresco, crear };
    },
    verificar: ({ refresco, crear }) => {
      expect(refresco.status).toBe(200);
      expect(crear.status).toBe(403);
      expect(crear.body.code).toBe('RECENT_TWO_FACTOR_REQUIRED');
    },
    describirObtenido: ({ refresco, crear }) => `refresh ${refresco.status}, crear ${crear.status} (${crear.body.code})`,
  });
});
