import { AppConfig } from '../../src/config';
import { GoogleAuthService } from '../../src/modules/auth/services/google-auth.service';
import { describeCase } from '../support/describe-case';
import { registerVerified, userByEmail } from '../support/auth-helpers';
import { UserVault } from '../../src/modules/security';
import { createTestApp, PASSWORD, type TestApp } from '../support/test-app';

/** idToken falso -> lo que Google diria de el. */
const identidades: Record<string, { sub: string; email: string; name: string; email_verified: boolean }> = {
  'tok-nuevo': { sub: 'g-111', email: 'nuevo.google@correo.com', name: 'Nuevo Google', email_verified: true },
  'tok-existente': { sub: 'g-222', email: 'existente@correo.com', name: 'Existente', email_verified: true },
  'tok-otro-sub': { sub: 'g-999', email: 'existente@correo.com', name: 'Existente', email_verified: true },
  'tok-sin-verificar': { sub: 'g-333', email: 'x@correo.com', name: 'X', email_verified: false },
  'tok-ajeno': { sub: 'g-111', email: 'nuevo.google@correo.com', name: 'Nuevo Google', email_verified: true },
};

describe('Auth: Google (e2e)', () => {
  let t: TestApp;
  let token = '';

  const google = (idToken: string) => t.web('post')('/api/auth/google').send({ idToken });

  beforeAll(async () => {
    t = await createTestApp();

    // Google se "simula": no se puede llamar a Google desde los tests.
    const service = t.app.get(GoogleAuthService);
    jest.spyOn(service['client'], 'verifyIdToken').mockImplementation((async ({ idToken }: { idToken: string }) => {
      const identidad = identidades[idToken];
      if (!identidad) throw new Error('token invalido');
      return { getPayload: () => identidad };
    }) as never);

    ({ accessToken: token } = await registerVerified(t, 'existente@correo.com'));
  });
  afterAll(() => t.close());

  describeCase('Google (e2e)', {
    que: 'si Google no esta configurado, el endpoint responde 503',
    espera: '503 "Google no esta configurado"',
    ejecutar: async () => google('tok-nuevo'),
    verificar: (res) => {
      expect(res.status).toBe(503);
      expect(res.body.message).toBe('Google no esta configurado');
    },
    describirObtenido: (res) => `${res.status} ${res.body.message}`,
  });

  describeCase('Google (e2e)', {
    que: 'un idToken que Google no reconoce o con correo sin verificar se rechaza',
    espera: '401 en ambos casos',
    ejecutar: async () => {
      Object.assign(t.app.get(AppConfig).google, { clientId: 'cliente-test', clientSecret: 's', enabled: true });
      return [(await google('tok-falso')).status, (await google('tok-sin-verificar')).status];
    },
    verificar: (estados) => expect(estados).toEqual([401, 401]),
  });

  describeCase('Google (e2e)', {
    que: 'un correo nuevo crea la cuenta ya verificada, sin contrasena, como CLIENT',
    espera: '200 con sesion; usuario verificado, sin passwordHash, roles [CLIENT] y SocialAccount google',
    ejecutar: async () => {
      const res = await google('tok-nuevo');
      const user = await userByEmail(t, 'nuevo.google@correo.com', { include: { socialAccounts: true } });
      return { res, user };
    },
    verificar: ({ res, user }) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(user?.emailVerifiedAt).not.toBeNull();
      expect(user?.passwordHash).toBeNull();
      expect(user?.roles).toEqual(['CLIENT']);
      expect(user?.socialAccounts[0].provider).toBe('google');
    },
    describirObtenido: ({ res, user }) =>
      `${res.status}, verificado ${Boolean(user?.emailVerifiedAt)}, con contrasena ${Boolean(user?.passwordHash)}, roles ${JSON.stringify(user?.roles)}`,
  });

  describeCase('Google (e2e)', {
    que: 'volver a entrar con la misma cuenta de Google no duplica el usuario',
    espera: '200 y sigue habiendo un solo usuario con ese correo',
    ejecutar: async () => {
      const res = await google('tok-nuevo');
      const cantidad = await t.prisma.user.count({ where: { emailHash: t.app.get(UserVault).emailHash('nuevo.google@correo.com') } });
      return [res.status, cantidad];
    },
    verificar: (r) => expect(r).toEqual([200, 1]),
  });

  describeCase('Google (e2e)', {
    que: 'un correo que ya tiene cuenta NO se vincula solo: pide confirmar con un codigo enviado a ese correo',
    espera: 'linkRequired=true, sin sesion, y un correo link-google a la cuenta',
    ejecutar: async () => {
      const res = await google('tok-existente');
      const vinculos = await t.prisma.socialAccount.count({ where: { providerId: 'g-222' } });
      return { res, vinculos };
    },
    verificar: ({ res, vinculos }) => {
      expect(res.body.linkRequired).toBe(true);
      expect(res.body.accessToken).toBeUndefined();
      expect(vinculos).toBe(0);
      expect(t.mail.sent.some((m) => m.to === 'existente@correo.com' && m.template.name === 'link-google')).toBe(true);
    },
    describirObtenido: ({ res, vinculos }) => `linkRequired=${res.body.linkRequired}, vinculos creados ${vinculos}`,
  });

  describeCase('Google (e2e)', {
    que: 'el codigo de vinculacion no sirve con una cuenta de Google distinta ni si es incorrecto',
    espera: '400 con otra cuenta de Google (mismo correo, otro sub) y 400 con codigo malo',
    ejecutar: async () => {
      const code = t.mail.lastCode('existente@correo.com', 'link-google');
      const otraCuenta = await t.web('post')('/api/auth/google/link/confirm').send({ idToken: 'tok-otro-sub', code });
      const codigoMalo = await t.web('post')('/api/auth/google/link/confirm').send({ idToken: 'tok-existente', code: '000000' });
      return [otraCuenta.status, codigoMalo.status];
    },
    verificar: (estados) => expect(estados).toEqual([400, 400]),
  });

  describeCase('Google (e2e)', {
    que: 'con el codigo correcto se vincula Google a la cuenta existente y se inicia sesion',
    espera: '200 con sesion y un SocialAccount nuevo en esa cuenta; luego Google entra directo',
    ejecutar: async () => {
      // Los intentos fallidos agotaron el codigo anterior; se pide uno nuevo (esperando el cooldown simulado).
      await t.prisma.verificationCode.updateMany({ data: { createdAt: new Date(Date.now() - 120_000) } });
      await google('tok-existente');
      const code = t.mail.lastCode('existente@correo.com', 'link-google');
      const confirm = await t.web('post')('/api/auth/google/link/confirm').send({ idToken: 'tok-existente', code });
      const directo = await google('tok-existente');
      const vinculos = await t.prisma.socialAccount.count({ where: { providerId: 'g-222' } });
      return { confirm, directo, vinculos };
    },
    verificar: ({ confirm, directo, vinculos }) => {
      expect(confirm.status).toBe(200);
      expect(confirm.body.accessToken).toEqual(expect.any(String));
      expect(directo.body.accessToken).toEqual(expect.any(String));
      expect(vinculos).toBe(1);
    },
    describirObtenido: ({ confirm, directo, vinculos }) => `confirmar ${confirm.status}, entrar directo ${directo.status}, vinculos ${vinculos}`,
  });

  describeCase('Google (e2e)', {
    que: 'no se puede vincular una cuenta de Google que ya pertenece a otro usuario',
    espera: '409',
    ejecutar: async () => {
      // g-111 ya pertenece a nuevo.google@correo.com; "existente" intenta vincularla.
      return (await t.web('post')('/api/auth/google/link').set('Authorization', `Bearer ${token}`).send({ idToken: 'tok-ajeno' })).status;
    },
    verificar: (status) => expect(status).toBe(409),
  });

  describeCase('Google (e2e)', {
    que: 'desvincular Google exige tener contrasena para no quedarse sin forma de entrar',
    espera: '409 para la cuenta solo-Google y 200 para la que tiene contrasena',
    ejecutar: async () => {
      const soloGoogle = await google('tok-nuevo');
      const sinClave = await t.web('delete')('/api/auth/google').set('Authorization', `Bearer ${soloGoogle.body.accessToken}`);
      const conClave = await t.web('delete')('/api/auth/google').set('Authorization', `Bearer ${token}`);
      const login = await t.web('post')('/api/auth/login').send({ email: 'existente@correo.com', password: PASSWORD });
      return [sinClave.status, conClave.status, login.status];
    },
    verificar: (estados) => expect(estados).toEqual([409, 200, 200]),
  });
});
