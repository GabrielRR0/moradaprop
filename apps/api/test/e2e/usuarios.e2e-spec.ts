import { describeCase } from '../support/describe-case';
import { createAdmin, loginAdmin, registerVerified } from '../support/auth-helpers';
import { createTestApp, PASSWORD, type TestApp } from '../support/test-app';

const NUEVA = 'NuevaClave789';

describe('Usuarios: perfil, contrasena y administracion (e2e)', () => {
  let t: TestApp;
  let ana = { userId: '', accessToken: '', refreshCookie: '' };
  let beto = { userId: '', accessToken: '', refreshCookie: '' };
  let adminToken = '';
  let adminId = '';

  const como = (token: () => string) => (method: 'get' | 'post' | 'patch') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token()}`);
  const a = como(() => ana.accessToken);
  const admin = como(() => adminToken);

  beforeAll(async () => {
    t = await createTestApp();
    ana = await registerVerified(t, 'ana@correo.com');
    beto = await registerVerified(t, 'beto@correo.com');
    const creado = await createAdmin(t, 'admin@correo.com', true);
    adminId = creado.userId;
    adminToken = await loginAdmin(t, 'admin@correo.com', creado.secret);
  });
  afterAll(() => t.close());

  // ---------- Perfil ----------

  describeCase('perfil (e2e)', {
    que: 'GET /me devuelve el perfil del token sin hashes ni secretos',
    espera: '200 con el correo y roles; sin passwordHash, twoFactorSecret ni refresh tokens',
    ejecutar: async () => a('get')('/api/users/me'),
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('ana@correo.com');
      expect(res.body.hasPassword).toBe(true);
      const json = JSON.stringify(res.body);
      for (const prohibido of ['passwordHash', 'twoFactorSecret', 'failedLogins', 'refreshToken']) expect(json).not.toContain(prohibido);
    },
    describirObtenido: (res) => `${res.status}, campos: ${Object.keys(res.body).join(', ')}`,
  });

  describeCase('perfil (e2e)', {
    que: 'sin sesion no hay perfil',
    espera: '401',
    ejecutar: async () => (await t.web('get')('/api/users/me')).status,
    verificar: (status) => expect(status).toBe(401),
  });

  describeCase('perfil (e2e)', {
    que: 'editar el perfil solo permite nombre y telefono: roles, correo y estado se rechazan',
    espera: '200 al cambiar el nombre; 400 al mandar roles, email o status',
    ejecutar: async () => ({
      ok: await a('patch')('/api/users/me').send({ name: 'Ana Maria', phone: '+584141112233' }),
      roles: (await a('patch')('/api/users/me').send({ roles: ['ADMIN'] })).status,
      email: (await a('patch')('/api/users/me').send({ email: 'otro@correo.com' })).status,
      estado: (await a('patch')('/api/users/me').send({ status: 'ACTIVE' })).status,
      enBase: await t.prisma.user.findUniqueOrThrow({ where: { email: 'ana@correo.com' } }),
    }),
    verificar: ({ ok, roles, email, estado, enBase }) => {
      expect(ok.status).toBe(200);
      expect(ok.body.name).toBe('Ana Maria');
      expect([roles, email, estado]).toEqual([400, 400, 400]);
      expect(enBase.roles).toEqual(['CLIENT']); // el intento de volverse ADMIN no tuvo efecto
    },
    describirObtenido: ({ roles, enBase }) => `intento de roles: ${roles}; roles en la base: ${JSON.stringify(enBase.roles)}`,
  });

  describeCase('perfil (e2e)', {
    que: 'un telefono invalido se rechaza',
    espera: '400',
    ejecutar: async () => (await a('patch')('/api/users/me').send({ phone: 'abc' })).status,
    verificar: (status) => expect(status).toBe(400),
  });

  describeCase('perfil (e2e)', {
    que: 'pasar a dueno directo agrega el rol OWNER una sola vez y nunca ADMIN',
    espera: '200 con rol OWNER; la segunda vez 409',
    ejecutar: async () => {
      const primera = await a('post')('/api/users/me/become-owner');
      const segunda = await a('post')('/api/users/me/become-owner');
      const enBase = await t.prisma.user.findUniqueOrThrow({ where: { email: 'ana@correo.com' } });
      return { primera: primera.status, segunda: segunda.status, roles: enBase.roles };
    },
    verificar: ({ primera, segunda, roles }) => {
      expect([primera, segunda]).toEqual([200, 409]);
      expect(roles).toEqual(['CLIENT', 'OWNER']);
    },
  });

  // ---------- Cambio de contrasena ----------

  describeCase('cambiar contrasena (e2e)', {
    que: 'exige la contrasena actual correcta, una nueva distinta y que cumpla la politica',
    espera: '403 con actual incorrecta; 400 si es igual; 400 si es debil',
    ejecutar: async () => ({
      incorrecta: (await a('post')('/api/users/me/password').send({ currentPassword: 'Incorrecta1', newPassword: NUEVA })).status,
      sinActual: (await a('post')('/api/users/me/password').send({ newPassword: NUEVA })).status,
      igual: (await a('post')('/api/users/me/password').send({ currentPassword: PASSWORD, newPassword: PASSWORD })).status,
      debil: (await a('post')('/api/users/me/password').send({ currentPassword: PASSWORD, newPassword: 'corta' })).status,
    }),
    verificar: (r) => expect(r).toEqual({ incorrecta: 403, sinActual: 403, igual: 400, debil: 400 }),
  });

  describeCase('cambiar contrasena (e2e)', {
    que: 'al cambiarla se cierran las DEMAS sesiones pero la actual sigue; la clave vieja deja de servir',
    espera: '200; el refresh de otra sesion falla; la sesion actual sigue; login con la vieja 401 y con la nueva 200',
    ejecutar: async () => {
      // Segunda sesion de Ana (otro dispositivo)
      const otra = await t.web('post')('/api/auth/login').send({ email: 'ana@correo.com', password: PASSWORD });
      const cookieOtra = ((otra.headers['set-cookie'] as unknown as string[])[0] ?? '').split(';')[0];

      const cambio = await a('post')('/api/users/me/password').send({ currentPassword: PASSWORD, newPassword: NUEVA });
      return {
        cambio: cambio.status,
        otraSesion: (await t.web('post')('/api/auth/refresh').set('Cookie', cookieOtra).send({})).status,
        sesionActual: (await a('get')('/api/users/me')).status,
        vieja: (await t.web('post')('/api/auth/login').send({ email: 'ana@correo.com', password: PASSWORD })).status,
        nueva: (await t.web('post')('/api/auth/login').send({ email: 'ana@correo.com', password: NUEVA })).status,
      };
    },
    verificar: (r) => expect(r).toEqual({ cambio: 200, otraSesion: 401, sesionActual: 200, vieja: 401, nueva: 200 }),
  });

  describeCase('cambiar contrasena (e2e)', {
    que: 'una cuenta creada solo con Google puede definir su primera contrasena sin la actual',
    espera: '200 y despues puede entrar con correo y contrasena',
    ejecutar: async () => {
      const soloGoogle = await t.prisma.user.create({ data: { email: 'google@correo.com', name: 'Solo Google', emailVerifiedAt: new Date() } });
      const token = await t.app.get((await import('../../src/modules/auth')).TokenService).signAccess(soloGoogle, 'sesion-falsa', false);
      const res = await t.web('post')('/api/users/me/password').set('Authorization', `Bearer ${token}`).send({ newPassword: NUEVA });
      const login = await t.web('post')('/api/auth/login').send({ email: 'google@correo.com', password: NUEVA });
      return [res.status, login.status];
    },
    verificar: (estados) => expect(estados).toEqual([200, 200]),
  });

  // ---------- Administracion de usuarios ----------

  describeCase('admin usuarios (e2e)', {
    que: 'un usuario normal no entra al panel de usuarios',
    espera: '403 al listar y al suspender',
    ejecutar: async () => [
      (await a('get')('/api/admin/users')).status,
      (await a('patch')(`/api/admin/users/${beto.userId}/status`).send({ status: 'SUSPENDED' })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([403, 403]),
  });

  describeCase('admin usuarios (e2e)', {
    que: 'el admin lista y busca usuarios sin ver hashes ni secretos',
    espera: 'busqueda "beto" devuelve 1; ningun campo sensible',
    ejecutar: async () => ({ todos: await admin('get')('/api/admin/users'), buscado: await admin('get')('/api/admin/users?q=beto') }),
    verificar: ({ todos, buscado }) => {
      expect(todos.body.total).toBeGreaterThanOrEqual(4);
      expect(buscado.body.items.map((u: { email: string }) => u.email)).toEqual(['beto@correo.com']);
      const json = JSON.stringify(todos.body);
      for (const prohibido of ['passwordHash', 'twoFactorSecret']) expect(json).not.toContain(prohibido);
    },
    describirObtenido: ({ todos, buscado }) => `total ${todos.body.total}; busqueda "beto": ${buscado.body.total}`,
  });

  describeCase('admin usuarios (e2e)', {
    que: 'suspender cierra las sesiones del usuario y le impide volver a entrar; reactivar lo permite',
    espera: 'suspendido: refresh 401 y login 403; reactivado: login 200; queda en la auditoria',
    ejecutar: async () => {
      const suspender = await admin('patch')(`/api/admin/users/${beto.userId}/status`).send({ status: 'SUSPENDED', reason: 'abuso' });
      const suspendido = {
        refresh: (await t.web('post')('/api/auth/refresh').set('Cookie', beto.refreshCookie).send({})).status,
        login: (await t.web('post')('/api/auth/login').send({ email: 'beto@correo.com', password: PASSWORD })).status,
      };
      await admin('patch')(`/api/admin/users/${beto.userId}/status`).send({ status: 'ACTIVE' });
      const reactivado = (await t.web('post')('/api/auth/login').send({ email: 'beto@correo.com', password: PASSWORD })).status;
      const auditoria = await t.prisma.auditLog.findMany({ where: { action: { startsWith: 'admin.user.' } }, orderBy: { createdAt: 'asc' } });
      return { suspender: suspender.status, suspendido, reactivado, acciones: auditoria.map((e) => e.action), quien: auditoria[0]?.userId };
    },
    verificar: ({ suspender, suspendido, reactivado, acciones, quien }) => {
      expect(suspender).toBe(200);
      expect(suspendido).toEqual({ refresh: 401, login: 403 });
      expect(reactivado).toBe(200);
      expect(acciones).toEqual(['admin.user.suspended', 'admin.user.reactivated']);
      expect(quien).toBe(adminId);
    },
    describirObtenido: ({ suspendido, reactivado, acciones }) => `suspendido: ${JSON.stringify(suspendido)}; reactivado: ${reactivado}; auditoria: ${acciones.join(', ')}`,
  });

  describeCase('admin usuarios (e2e)', {
    que: 'suspender corta el acceso AL INSTANTE: el access token que el usuario ya tenia deja de servir; reactivar lo devuelve',
    espera: 'tras suspender: 403 con el token viejo; tras reactivar: 200',
    ejecutar: async () => {
      const con = (token: string) => t.web('get')('/api/users/me').set('Authorization', `Bearer ${token}`);
      const antes = (await con(beto.accessToken)).status;
      await admin('patch')(`/api/admin/users/${beto.userId}/status`).send({ status: 'SUSPENDED' });
      const suspendido = (await con(beto.accessToken)).status;
      await admin('patch')(`/api/admin/users/${beto.userId}/status`).send({ status: 'ACTIVE' });
      const reactivado = (await con(beto.accessToken)).status;
      return { antes, suspendido, reactivado };
    },
    verificar: (r) => expect(r).toEqual({ antes: 200, suspendido: 403, reactivado: 200 }),
  });

  describeCase('admin usuarios (e2e)', {
    que: 'un admin no puede suspenderse a si mismo ni usar un estado inventado; un id inexistente da 404',
    espera: '400, 400 y 404',
    ejecutar: async () => [
      (await admin('patch')(`/api/admin/users/${adminId}/status`).send({ status: 'SUSPENDED' })).status,
      (await admin('patch')(`/api/admin/users/${beto.userId}/status`).send({ status: 'BORRADO' })).status,
      (await admin('patch')('/api/admin/users/00000000-0000-4000-8000-000000000000/status').send({ status: 'SUSPENDED' })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 400, 404]),
  });
});
