import { describeCase } from '../support/describe-case';
import { createAdmin, jwtPayload, loginAdmin, registerVerified } from '../support/auth-helpers';
import { createTestApp, PASSWORD, type TestApp } from '../support/test-app';

describe('Admin: bloqueos y auditoria (e2e)', () => {
  let t: TestApp;
  let userToken = '';
  let userId = '';
  let adminToken = '';
  let adminId = '';
  let reglaPais = '';

  const admin = (method: 'get' | 'post' | 'delete') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${adminToken}`);

  beforeAll(async () => {
    t = await createTestApp();
    ({ accessToken: userToken, userId } = await registerVerified(t, 'cliente@correo.com'));

    const sinDosFa = await createAdmin(t, 'admin-sin2fa@correo.com', false);
    const conDosFa = await createAdmin(t, 'admin@correo.com', true);
    adminId = conDosFa.userId;
    adminToken = await loginAdmin(t, 'admin@correo.com', conDosFa.secret);
    (t as unknown as { sinDosFa: typeof sinDosFa }).sinDosFa = sinDosFa;
  });
  afterAll(() => t.close());

  describeCase('permisos del panel admin (e2e)', {
    que: 'un usuario normal no puede entrar al panel de bloqueos',
    espera: '403 "No tienes permiso"',
    ejecutar: async () => t.web('get')('/api/admin/security').set('Authorization', `Bearer ${userToken}`),
    verificar: (res) => {
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('No tienes permiso para esta accion');
    },
    describirObtenido: (res) => `${res.status} ${res.body.message}`,
  });

  describeCase('permisos del panel admin (e2e)', {
    que: 'un admin SIN 2FA tampoco entra: el panel exige verificacion en dos pasos',
    espera: '403 con code TWO_FACTOR_REQUIRED',
    ejecutar: async () => {
      const token = await loginAdmin(t, 'admin-sin2fa@correo.com');
      return t.web('get')('/api/admin/security').set('Authorization', `Bearer ${token}`);
    },
    verificar: (res) => {
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TWO_FACTOR_REQUIRED');
    },
    describirObtenido: (res) => `${res.status} ${res.body.code}`,
  });

  describeCase('permisos del panel admin (e2e)', {
    que: 'un admin con 2FA verificado si entra',
    espera: '200 y su token lleva roles ADMIN y twoFactor=true',
    ejecutar: async () => ({ res: await admin('get')('/api/admin/security'), claims: jwtPayload(adminToken) }),
    verificar: ({ res, claims }) => {
      expect(res.status).toBe(200);
      expect(claims.roles).toContain('ADMIN');
      expect(claims.twoFactor).toBe(true);
    },
    describirObtenido: ({ res, claims }) => `${res.status}, roles ${JSON.stringify(claims.roles)}, twoFactor ${claims.twoFactor}`,
  });

  describeCase('bloqueos (e2e)', {
    que: 'valida el valor segun el tipo de bloqueo',
    espera: '400 para una IP, un pais y un correo invalidos',
    ejecutar: async () => {
      const probar = async (type: string, value: string) => (await admin('post')('/api/admin/security').send({ type, value })).status;
      return [await probar('IP', 'no-es-ip'), await probar('COUNTRY', 'VENEZUELA'), await probar('EMAIL', 'sin-arroba')];
    },
    verificar: (estados) => expect(estados).toEqual([400, 400, 400]),
  });

  describeCase('bloqueos (e2e)', {
    que: 'crea un bloqueo por pais y rechaza duplicados',
    espera: '201 la primera vez y 409 la segunda',
    ejecutar: async () => {
      const cuerpo = { type: 'COUNTRY', value: 'xx', reason: 'prueba' };
      const primera = await admin('post')('/api/admin/security').send(cuerpo);
      const segunda = await admin('post')('/api/admin/security').send(cuerpo);
      reglaPais = primera.body.id;
      return { primera, segunda };
    },
    verificar: ({ primera, segunda }) => {
      expect(primera.status).toBe(201);
      expect(primera.body.value).toBe('XX');
      expect(segunda.status).toBe(409);
    },
    describirObtenido: ({ primera, segunda }) => `${primera.status} (valor guardado ${primera.body.value}) y luego ${segunda.status}`,
  });

  describeCase('bloqueos (e2e)', {
    que: 'una peticion desde el pais bloqueado se corta con 403; el resto sigue funcionando',
    espera: '403 "Acceso restringido" con cabecera cf-ipcountry: XX y 200 sin ella',
    ejecutar: async () => {
      const bloqueada = await t.web('get')('/api/health').set('cf-ipcountry', 'XX');
      const normal = await t.web('get')('/api/health');
      return { bloqueada, normal };
    },
    verificar: ({ bloqueada, normal }) => {
      expect(bloqueada.status).toBe(403);
      expect(bloqueada.body.message).toBe('Acceso restringido');
      expect(normal.status).toBe(200);
    },
    describirObtenido: ({ bloqueada, normal }) => `pais bloqueado ${bloqueada.status}, otro pais ${normal.status}`,
  });

  describeCase('bloqueos (e2e)', {
    que: 'quitar el bloqueo restablece el acceso',
    espera: 'DELETE 200 y luego 200 desde ese pais',
    ejecutar: async () => {
      const borrar = await admin('delete')(`/api/admin/security/${reglaPais}`);
      const despues = await t.web('get')('/api/health').set('cf-ipcountry', 'XX');
      return [borrar.status, despues.status];
    },
    verificar: (estados) => expect(estados).toEqual([200, 200]),
  });

  describeCase('bloqueos (e2e)', {
    que: 'un correo bloqueado no puede registrarse ni un dominio completo',
    espera: '403 para el correo y para cualquier correo del dominio bloqueado',
    ejecutar: async () => {
      await admin('post')('/api/admin/security').send({ type: 'EMAIL', value: 'Spam@Correo.com' });
      await admin('post')('/api/admin/security').send({ type: 'EMAIL_DOMAIN', value: 'basura.com' });
      const registro = (email: string) =>
        t.web('post')('/api/auth/register').send({ email, password: PASSWORD, name: 'Intruso', accountType: 'CLIENT' });
      return [(await registro('spam@correo.com')).status, (await registro('cualquiera@basura.com')).status, (await registro('legitimo@correo.com')).status];
    },
    verificar: (estados) => expect(estados).toEqual([403, 403, 201]),
  });

  describeCase('bloqueos (e2e)', {
    que: 'bloquear a un usuario invalida su token en la siguiente peticion',
    espera: '200 antes del bloqueo y 403 despues',
    ejecutar: async () => {
      const antes = await t.web('get')('/api/auth/sessions').set('Authorization', `Bearer ${userToken}`);
      await admin('post')('/api/admin/security').send({ type: 'USER', value: userId });
      const despues = await t.web('get')('/api/auth/sessions').set('Authorization', `Bearer ${userToken}`);
      return [antes.status, despues.status];
    },
    verificar: (estados) => expect(estados).toEqual([200, 403]),
  });

  describeCase('auditoria (e2e)', {
    que: 'las acciones del admin quedan registradas con quien, que y desde donde',
    espera: 'eventos security.block.create con el id del admin y la IP',
    ejecutar: async () => admin('get')('/api/admin/audit?action=security.block'),
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(5);
      const evento = res.body.items.find((i: { action: string }) => i.action === 'security.block.create');
      expect(evento.userId).toBe(adminId);
      expect(evento.ip).toBeTruthy();
      expect(evento.resource).toBe('BlockRule');
    },
    describirObtenido: (res) => `${res.body.total} eventos; el ultimo: ${res.body.items[0]?.action} por ${res.body.items[0]?.user?.email}`,
  });

  describeCase('auditoria (e2e)', {
    que: 'la auditoria nunca guarda contrasenas, codigos ni tokens',
    espera: 'ni la clave ni los tokens aparecen en ningun registro; los campos sensibles salen como [REDACTADO]',
    ejecutar: async () => {
      await t.web('post')('/api/auth/login').send({ email: 'admin@correo.com', password: 'Incorrecta999' });
      return JSON.stringify(await t.prisma.auditLog.findMany());
    },
    verificar: (volcado) => {
      expect(volcado).not.toContain(PASSWORD);
      expect(volcado).not.toContain('Incorrecta999');
      expect(volcado).not.toContain(adminToken);
    },
    describirObtenido: (volcado) => `${volcado.length} caracteres revisados`,
  });
});
