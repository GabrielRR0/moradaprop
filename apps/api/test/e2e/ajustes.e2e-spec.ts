import { describeCase } from '../support/describe-case';
import { auditLogs, createAdmin, loginAdmin, registerVerified } from '../support/auth-helpers';
import { createTestApp, totp, type TestApp } from '../support/test-app';
import { SettingsService } from '../../src/modules/settings';

const API_KEY = 're_AbCdEfGh12345678_secretTail9';

describe('Ajustes de la plataforma (e2e)', () => {
  let t: TestApp;
  let adminToken = '';
  let adminId = '';
  let secret = '';
  let userToken = '';

  const admin = (method: 'get' | 'post' | 'put' | 'delete') => (url: string) => t.web(method)(url).set('Authorization', `Bearer ${adminToken}`);
  const guardarClave = (value = API_KEY) => admin('put')('/api/admin/settings/mail.resendApiKey').send({ value });

  beforeAll(async () => {
    t = await createTestApp();
    ({ accessToken: userToken } = await registerVerified(t, 'cliente-ajustes@correo.com'));
    ({ userId: adminId, secret } = await createAdmin(t, 'admin-ajustes@correo.com', true));
    adminToken = await loginAdmin(t, 'admin-ajustes@correo.com', secret);
  });
  afterAll(() => t.close());

  describeCase('ajustes (e2e)', {
    que: 'un usuario normal no puede ver ni cambiar los ajustes',
    espera: '403 en GET y en PUT',
    ejecutar: async () => ({
      ver: await t.web('get')('/api/admin/settings').set('Authorization', `Bearer ${userToken}`),
      guardar: await t.web('put')('/api/admin/settings/mail.fromName').set('Authorization', `Bearer ${userToken}`).send({ value: 'X' }),
    }),
    verificar: ({ ver, guardar }) => {
      expect(ver.status).toBe(403);
      expect(guardar.status).toBe(403);
    },
    describirObtenido: ({ ver, guardar }) => `ver ${ver.status}, guardar ${guardar.status}`,
  });

  describeCase('ajustes (e2e)', {
    que: 'al inicio ningun ajuste esta configurado',
    espera: '200 con las 3 claves del registro, todas sin valor',
    ejecutar: () => admin('get')('/api/admin/settings'),
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.map((s: { key: string }) => s.key)).toEqual(['mail.resendApiKey', 'mail.fromAddress', 'mail.fromName']);
      expect(res.body.every((s: { configured: boolean }) => !s.configured)).toBe(true);
    },
    describirObtenido: (res) => `${res.status}, ${res.body.length} ajustes`,
  });

  describeCase('ajustes (e2e)', {
    que: 'rechaza claves desconocidas y valores que no sirven',
    espera: '404 para una clave inventada y 400 para una API key sin el prefijo re_',
    ejecutar: async () => ({
      desconocida: await admin('put')('/api/admin/settings/mail.otra').send({ value: 'x' }),
      mala: await guardarClave('sk_live_1234567890123456'),
    }),
    verificar: ({ desconocida, mala }) => {
      expect(desconocida.status).toBe(404);
      expect(mala.status).toBe(400);
    },
    describirObtenido: ({ desconocida, mala }) => `desconocida ${desconocida.status}, mala ${mala.status}`,
  });

  describeCase('ajustes (e2e)', {
    que: 'guardar la API key de Resend la deja cifrada y nunca la devuelve completa',
    espera: '200 con vista enmascarada; en la base va cifrada; el listado tampoco la trae; el codigo si la puede leer',
    ejecutar: async () => {
      const guardar = await guardarClave();
      const listado = await admin('get')('/api/admin/settings');
      const fila = await t.prisma.platformSetting.findUniqueOrThrow({ where: { key: 'mail.resendApiKey' } });
      const leida = await t.app.get(SettingsService).get('mail.resendApiKey');
      return { guardar, listado, fila, leida };
    },
    verificar: ({ guardar, listado, fila, leida }) => {
      expect(guardar.status).toBe(200);
      expect(guardar.body).toMatchObject({ key: 'mail.resendApiKey', secret: true, configured: true, value: null, preview: 're_••••ail9' });
      expect(JSON.stringify(guardar.body)).not.toContain(API_KEY);
      expect(JSON.stringify(listado.body)).not.toContain(API_KEY);
      expect(fila.secret).toBe(true);
      expect(fila.value).not.toContain(API_KEY);
      expect(fila.value.startsWith('v1.')).toBe(true);
      expect(leida).toBe(API_KEY);
    },
    describirObtenido: ({ guardar, fila }) => `${guardar.status}, vista ${guardar.body.preview}, en la base "${fila.value.slice(0, 12)}..."`,
  });

  describeCase('ajustes (e2e)', {
    que: 'los ajustes que no son secretos se muestran tal cual',
    espera: 'el correo remitente vuelve en "value"',
    ejecutar: () => admin('put')('/api/admin/settings/mail.fromAddress').send({ value: 'no-reply@midominio.com' }),
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ secret: false, value: 'no-reply@midominio.com', preview: null });
    },
  });

  describeCase('ajustes (e2e)', {
    que: 'queda auditado QUE ajuste cambio, pero nunca su valor',
    espera: 'registro settings.update con la clave como recurso y sin la API key en ningun campo',
    ejecutar: () => auditLogs(t, { where: { action: 'settings.update', resourceId: 'mail.resendApiKey' } }),
    verificar: (logs) => {
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe(adminId);
      expect(JSON.stringify(logs)).not.toContain(API_KEY);
    },
    describirObtenido: (logs) => `${logs.length} registro(s)`,
  });

  describeCase('ajustes (e2e)', {
    que: 'el correo de prueba va al propio admin y avisa si la configuracion falla',
    espera: 'ok:true al correo del admin; con el servidor fallando, ok:false con el motivo y sin la clave',
    ejecutar: async () => {
      const bien = await admin('post')('/api/admin/settings/mail/test');
      t.mail.failNext = true;
      const mal = await admin('post')('/api/admin/settings/mail/test');
      t.mail.failNext = false;
      return { bien, mal };
    },
    verificar: ({ bien, mal }) => {
      expect(bien.status).toBe(200);
      expect(bien.body).toEqual({ ok: true, to: 'admin-ajustes@correo.com', error: null });
      expect(t.mail.sent.some((m) => m.to === 'admin-ajustes@correo.com' && m.template.name === 'test-email')).toBe(true);
      expect(mal.body.ok).toBe(false);
      expect(mal.body.error).toContain('Authentication failed');
      expect(JSON.stringify(mal.body)).not.toContain(API_KEY);
    },
    describirObtenido: ({ bien, mal }) => `bien ${bien.body.ok}, mal ${mal.body.ok} (${mal.body.error})`,
  });

  describeCase('ajustes (e2e)', {
    que: 'guardar o quitar un ajuste pide haber confirmado el segundo factor hace poco',
    espera: '403 RECENT_TWO_FACTOR_REQUIRED con la sesion vencida; tras re-verificar, 200 y el ajuste queda quitado',
    ejecutar: async () => {
      await t.prisma.session.updateMany({ where: { userId: adminId, revokedAt: null }, data: { strongAuthAt: new Date(Date.now() - 10 * 60_000) } });
      const vencida = await admin('delete')('/api/admin/settings/mail.resendApiKey');
      await admin('post')('/api/auth/reverify/code').send({ code: totp(secret, 30) });
      const quitada = await admin('delete')('/api/admin/settings/mail.resendApiKey');
      return { vencida, quitada, leida: await t.app.get(SettingsService).get('mail.resendApiKey') };
    },
    verificar: ({ vencida, quitada, leida }) => {
      expect(vencida.status).toBe(403);
      expect(vencida.body.code).toBe('RECENT_TWO_FACTOR_REQUIRED');
      expect(quitada.status).toBe(200);
      expect(quitada.body).toMatchObject({ configured: false, preview: null });
      expect(leida).toBeUndefined();
    },
    describirObtenido: ({ vencida, quitada }) => `vencida ${vencida.status} (${vencida.body.code}), tras confirmar ${quitada.status}`,
  });
});
