import { authenticator } from 'otplib';
import { describeCase } from '../support/describe-case';
import { jwtPayload, registerVerified } from '../support/auth-helpers';
import { createTestApp, PASSWORD, totp, type TestApp } from '../support/test-app';

const EMAIL = 'dosfa@correo.com';

describe('Auth: verificacion en dos pasos (e2e)', () => {
  let t: TestApp;
  let accessToken = '';
  let secret = '';
  let backupCodes: string[] = [];

  const iniciarLogin = async () => (await t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD })).body;

  beforeAll(async () => {
    t = await createTestApp();
    accessToken = (await registerVerified(t, EMAIL)).accessToken;
  });
  afterAll(() => t.close());

  describeCase('2FA activar (e2e)', {
    que: 'setup entrega el secreto y el QR, pero NO activa el 2FA todavia, y guarda el secreto cifrado',
    espera: 'secreto + QR; usuario sin 2FA activo; el secreto guardado no es el secreto en claro',
    ejecutar: async () => {
      const res = await t.web('post')('/api/auth/2fa/setup').set('Authorization', `Bearer ${accessToken}`);
      const user = await t.prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
      return { res, user };
    },
    verificar: ({ res, user }) => {
      expect(res.status).toBe(200);
      expect(res.body.qrCode).toContain('data:image/png;base64');
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.twoFactorSecret).not.toBe(res.body.secret);
      expect(user.twoFactorSecret).toBeTruthy();
      secret = res.body.secret;
    },
    describirObtenido: ({ res, user }) => `${res.status}, 2FA activo: ${user.twoFactorEnabled}, secreto en base cifrado: ${user.twoFactorSecret !== secret}`,
  });

  describeCase('2FA activar (e2e)', {
    que: 'confirmar con un codigo incorrecto no activa el 2FA',
    espera: '401 y el usuario sigue sin 2FA',
    ejecutar: async () => {
      const res = await t.web('post')('/api/auth/2fa/confirm').set('Authorization', `Bearer ${accessToken}`).send({ code: '000000' });
      const user = await t.prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
      return [res.status, user.twoFactorEnabled];
    },
    verificar: (r) => expect(r).toEqual([401, false]),
  });

  describeCase('2FA activar (e2e)', {
    que: 'confirmar con el codigo de la app activa el 2FA y entrega 8 codigos de respaldo (hasheados en base)',
    espera: '200, 8 codigos formato xxxxx-xxxxx, un token nuevo con twoFactor=true y hashes (no codigos) en la base',
    ejecutar: async () => {
      const res = await t.web('post')('/api/auth/2fa/confirm').set('Authorization', `Bearer ${accessToken}`).send({ code: authenticator.generate(secret) });
      const guardados = await t.prisma.twoFactorBackupCode.findMany();
      return { res, guardados };
    },
    verificar: ({ res, guardados }) => {
      expect(res.status).toBe(200);
      expect(res.body.backupCodes).toHaveLength(8);
      expect(res.body.backupCodes[0]).toMatch(/^[a-z0-9]{5}-[a-z0-9]{5}$/);
      expect(jwtPayload(res.body.accessToken).twoFactor).toBe(true);
      expect(guardados).toHaveLength(8);
      expect(guardados.some((g) => res.body.backupCodes.includes(g.codeHash))).toBe(false);
      backupCodes = res.body.backupCodes;
    },
    describirObtenido: ({ res, guardados }) => `${res.status}, ${res.body.backupCodes?.length} codigos, ${guardados.length} hashes guardados`,
  });

  describeCase('2FA login (e2e)', {
    que: 'con 2FA activo, el login con clave correcta NO entrega sesion: pide el segundo paso',
    espera: 'twoFactorRequired=true con challengeToken y sin accessToken ni cookie',
    ejecutar: async () => t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD }),
    verificar: (res) => {
      expect(res.body.twoFactorRequired).toBe(true);
      expect(res.body.challengeToken).toEqual(expect.any(String));
      expect(res.body.accessToken).toBeUndefined();
      expect(res.headers['set-cookie']).toBeUndefined();
    },
    describirObtenido: (res) => `twoFactorRequired=${res.body.twoFactorRequired}, accessToken=${res.body.accessToken}, metodos ${JSON.stringify(res.body.methods)}`,
  });

  describeCase('2FA login (e2e)', {
    que: 'un codigo incorrecto en el segundo paso falla; un challengeToken falso tambien',
    espera: '401 en ambos',
    ejecutar: async () => {
      const { challengeToken } = await iniciarLogin();
      const mal = await t.web('post')('/api/auth/login/2fa').send({ challengeToken, code: '000000' });
      const falso = await t.web('post')('/api/auth/login/2fa').send({ challengeToken: 'abc.def.ghi', code: totp(secret, 30) });
      return [mal.status, falso.status];
    },
    verificar: (estados) => expect(estados).toEqual([401, 401]),
  });

  describeCase('2FA login (e2e)', {
    que: 'el codigo TOTP correcto completa el login y la sesion queda marcada con 2FA',
    espera: '200 con accessToken cuyo claim twoFactor es true',
    ejecutar: async () => {
      const { challengeToken } = await iniciarLogin();
      // Codigo del paso siguiente: el paso actual ya lo uso la confirmacion (anti-replay).
      return t.web('post')('/api/auth/login/2fa').send({ challengeToken, code: totp(secret, 30) });
    },
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(jwtPayload(res.body.accessToken).twoFactor).toBe(true);
    },
    describirObtenido: (res) => `${res.status}, claim twoFactor=${res.body.accessToken ? jwtPayload(res.body.accessToken).twoFactor : 'n/a'}`,
  });

  describeCase('2FA login (e2e)', {
    que: 'anti-replay: el mismo codigo TOTP no se puede usar dos veces',
    espera: '401 al repetir el mismo codigo en otro login',
    ejecutar: async () => {
      const { challengeToken } = await iniciarLogin();
      return (await t.web('post')('/api/auth/login/2fa').send({ challengeToken, code: totp(secret, 30) })).status;
    },
    verificar: (status) => expect(status).toBe(401),
  });

  describeCase('2FA login (e2e)', {
    que: 'un codigo de respaldo funciona UNA sola vez',
    espera: 'primer uso 200, segundo uso 401',
    ejecutar: async () => {
      const usar = async () => {
        const { challengeToken } = await iniciarLogin();
        return (await t.web('post')('/api/auth/login/2fa').send({ challengeToken, code: backupCodes[0] })).status;
      };
      return [await usar(), await usar()];
    },
    verificar: (estados) => expect(estados).toEqual([200, 401]),
  });

  describeCase('2FA login (e2e)', {
    que: 'el codigo enviado por correo es una alternativa a la app',
    espera: 'se envia un correo two-factor-code y ese codigo completa el login',
    ejecutar: async () => {
      const { challengeToken } = await iniciarLogin();
      await t.web('post')('/api/auth/login/2fa/email-code').send({ challengeToken });
      const code = t.mail.lastCode(EMAIL, 'two-factor-code');
      return t.web('post')('/api/auth/login/2fa').send({ challengeToken, code });
    },
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    },
    describirObtenido: (res) => `${res.status}`,
  });

  describeCase('2FA desactivar (e2e)', {
    que: 'desactivar exige la contrasena correcta',
    espera: '403 con contrasena incorrecta',
    ejecutar: async () => {
      const { challengeToken } = await iniciarLogin();
      const sesion = await t.web('post')('/api/auth/login/2fa').send({ challengeToken, code: backupCodes[1] });
      const res = await t
        .web('post')('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${sesion.body.accessToken}`)
        .send({ password: 'Incorrecta1', code: backupCodes[2] });
      accessToken = sesion.body.accessToken;
      return res.status;
    },
    verificar: (status) => expect(status).toBe(403),
  });

  describeCase('2FA desactivar (e2e)', {
    que: 'con contrasena y un codigo valido se desactiva y se borran los codigos de respaldo',
    espera: '200, usuario sin 2FA, sin secreto y sin codigos de respaldo; el login vuelve a ser directo',
    ejecutar: async () => {
      const res = await t
        .web('post')('/api/auth/2fa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: PASSWORD, code: backupCodes[2] });
      const user = await t.prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
      const respaldos = await t.prisma.twoFactorBackupCode.count();
      const login = await iniciarLogin();
      return { res, user, respaldos, login };
    },
    verificar: ({ res, user, respaldos, login }) => {
      expect(res.status).toBe(200);
      expect(user.twoFactorEnabled).toBe(false);
      expect(user.twoFactorSecret).toBeNull();
      expect(respaldos).toBe(0);
      expect(login.accessToken).toEqual(expect.any(String));
    },
    describirObtenido: ({ res, user, respaldos, login }) =>
      `${res.status}, 2FA ${user.twoFactorEnabled}, respaldos ${respaldos}, login directo ${Boolean(login.accessToken)}`,
  });
});
