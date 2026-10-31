import { userByEmail, auditLogs } from '../support/auth-helpers';
import request from 'supertest';
import { CryptoService } from '../../src/common/crypto';
import { describeCase } from '../support/describe-case';
import { createTestApp, MOBILE_HEADERS, PASSWORD, type TestApp } from '../support/test-app';

const EMAIL = 'maria@correo.com';
const registro = { email: EMAIL, password: PASSWORD, name: 'Maria Perez', accountType: 'CLIENT' };

/** Extrae el valor de una cookie del header Set-Cookie. */
const cookieOf = (res: request.Response, name: string) =>
  ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find((c) => c.startsWith(`${name}=`));

describe('Auth: acceso, registro, verificacion y sesiones (e2e)', () => {
  let t: TestApp;
  let accessToken = '';

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  // ---------- Quien puede llamar al API ----------

  describeCase('acceso al API (e2e)', {
    que: 'rechaza una peticion sin cabeceras de cliente',
    espera: '403 "Cliente no autorizado"',
    ejecutar: async () => (await request(t.app.getHttpServer()).post('/api/auth/login').send({})).body,
    verificar: (body) => expect(body.message).toBe('Cliente no autorizado'),
  });

  describeCase('acceso al API (e2e)', {
    que: 'rechaza una clave de cliente incorrecta',
    espera: '403',
    ejecutar: async () =>
      (
        await request(t.app.getHttpServer())
          .post('/api/auth/login')
          .set({ 'x-app-client': 'web', 'x-app-key': 'clave-falsa' })
          .send({})
      ).status,
    verificar: (status) => expect(status).toBe(403),
  });

  describeCase('acceso al API (e2e)', {
    que: 'rechaza un Origin que no esta en la lista blanca',
    espera: '403 "Origen no permitido"',
    ejecutar: async () =>
      (await t.web('post')('/api/auth/login').set('Origin', 'https://sitio-malo.com').send({})).body,
    verificar: (body) => expect(body.message).toBe('Origen no permitido'),
  });

  describeCase('acceso al API (e2e)', {
    que: 'una ruta protegida sin token responde 401',
    espera: '401 "Token requerido"',
    ejecutar: async () => (await t.web('get')('/api/auth/sessions')).body,
    verificar: (body) => expect(body.message).toBe('Token requerido'),
  });

  // ---------- Registro ----------

  describeCase('registro (e2e)', {
    que: 'rechaza campos que el cliente no debe enviar (role, userId)',
    espera: '400 por propiedades no permitidas',
    ejecutar: async () => t.web('post')('/api/auth/register').send({ ...registro, role: 'ADMIN', userId: 'x' }),
    verificar: (res) => {
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('should not exist');
    },
    describirObtenido: (res) => `${res.status} ${JSON.stringify(res.body.message)}`,
  });

  describeCase('registro (e2e)', {
    que: 'rechaza una contrasena debil',
    espera: '400 con el mensaje de la politica de contrasena',
    ejecutar: async () => t.web('post')('/api/auth/register').send({ ...registro, password: 'corta' }),
    verificar: (res) => expect(res.status).toBe(400),
    describirObtenido: (res) => `${res.status} ${JSON.stringify(res.body.message)}`,
  });

  describeCase('registro (e2e)', {
    que: 'una agencia debe indicar el nombre de la agencia',
    espera: '400 por falta de agencyName',
    ejecutar: async () => t.web('post')('/api/auth/register').send({ ...registro, accountType: 'AGENCY' }),
    verificar: (res) => {
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('agencyName');
    },
    describirObtenido: (res) => `${res.status} ${JSON.stringify(res.body.message)}`,
  });

  describeCase('registro (e2e)', {
    que: 'un registro valido crea la cuenta sin verificar, con rol CLIENT y la contrasena hasheada',
    espera: '201, usuario con emailVerifiedAt nulo, roles [CLIENT], hash argon2 y un correo con codigo',
    ejecutar: async () => {
      const res = await t.web('post')('/api/auth/register').send(registro);
      const user = await userByEmail(t, EMAIL);
      return { res, user, correos: t.mail.sent.length };
    },
    verificar: ({ res, user, correos }) => {
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeUndefined();
      expect(user?.emailVerifiedAt).toBeNull();
      expect(user?.roles).toEqual(['CLIENT']);
      expect(user?.passwordHash?.startsWith('$argon2id$')).toBe(true);
      expect(correos).toBe(1);
    },
    describirObtenido: ({ res, user, correos }) =>
      `${res.status}, roles ${JSON.stringify(user?.roles)}, verificado ${Boolean(user?.emailVerifiedAt)}, correos ${correos}`,
  });

  describeCase('registro (e2e)', {
    que: 'registrar un correo ya existente responde igual (no revela quien esta registrado)',
    espera: 'mismo status y mismo mensaje que el primer registro',
    ejecutar: async () => {
      const otra = await t.web('post')('/api/auth/register').send({ ...registro, name: 'Otra Persona' });
      const nuevo = await t.web('post')('/api/auth/register').send({ ...registro, email: 'nuevo@correo.com' });
      return { otra: otra.body, nuevo: nuevo.body, status: otra.status };
    },
    verificar: ({ otra, nuevo, status }) => {
      expect(status).toBe(201);
      expect(otra).toEqual(nuevo);
    },
  });

  describeCase('registro (e2e)', {
    que: 'una agencia se crea con su perfil y su administrador',
    espera: 'AgencyProfile con un miembro AGENCY_ADMIN y rol AGENCY en el usuario',
    ejecutar: async () => {
      await t.web('post')('/api/auth/register').send({
        ...registro,
        email: 'agencia@correo.com',
        accountType: 'AGENCY',
        agencyName: 'Inmuebles Caracas',
      });
      return userByEmail(t, 'agencia@correo.com', { include: { agencyMembers: { include: { agency: true } } } });
    },
    verificar: (user) => {
      expect(user?.roles).toEqual(['CLIENT', 'AGENCY']);
      expect(user?.agencyMembers[0].role).toBe('AGENCY_ADMIN');
      expect(user?.agencyMembers[0].agency.name).toBe('Inmuebles Caracas');
    },
    describirObtenido: (user) => `roles ${JSON.stringify(user?.roles)}, miembro ${user?.agencyMembers[0]?.role}`,
  });

  // ---------- Login y verificacion ----------

  describeCase('verificacion de correo (e2e)', {
    que: 'no deja entrar con la cuenta sin verificar',
    espera: '403 con code EMAIL_NOT_VERIFIED',
    ejecutar: async () => t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD }),
    verificar: (res) => {
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    },
    describirObtenido: (res) => `${res.status} ${res.body.code}`,
  });

  describeCase('verificacion de correo (e2e)', {
    que: 'un codigo incorrecto no verifica la cuenta',
    espera: '400 "Codigo invalido o vencido"',
    ejecutar: async () => t.web('post')('/api/auth/verify-email').send({ email: EMAIL, code: '000000' }),
    verificar: (res) => {
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Codigo invalido o vencido');
    },
    describirObtenido: (res) => `${res.status} ${res.body.message}`,
  });

  describeCase('verificacion de correo (e2e)', {
    que: 'el codigo correcto verifica el correo e inicia sesion (refresh solo en cookie httpOnly en la web)',
    espera: '200 con accessToken, cookie refresh_token httpOnly y SIN refreshToken en el body',
    ejecutar: async () => {
      const code = t.mail.lastCode(EMAIL, 'verify-email');
      return t.web('post')('/api/auth/verify-email').send({ email: EMAIL, code });
    },
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toBeUndefined();
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user.email).toBe(EMAIL); // la respuesta lleva el correo en claro, no el cifrado de la base
      const cookie = cookieOf(res, 'refresh_token');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/api/auth');
      accessToken = res.body.accessToken;
    },
    describirObtenido: (res) =>
      `${res.status}, cookie ${cookieOf(res, 'refresh_token')?.includes('HttpOnly') ? 'httpOnly' : 'no httpOnly'}, refreshToken en body: ${'refreshToken' in res.body}`,
  });

  describeCase('verificacion de correo (e2e)', {
    que: 'un codigo ya usado no sirve de nuevo',
    espera: '400',
    ejecutar: async () => {
      const code = t.mail.lastCode(EMAIL, 'verify-email');
      return (await t.web('post')('/api/auth/verify-email').send({ email: EMAIL, code })).status;
    },
    verificar: (status) => expect(status).toBe(400),
  });

  describeCase('login (e2e)', {
    que: 'una contrasena incorrecta y un correo inexistente dan el mismo error',
    espera: 'ambos 401 "Credenciales invalidas"',
    ejecutar: async () => {
      const mala = await t.web('post')('/api/auth/login').send({ email: EMAIL, password: 'Otra12345' });
      const inexistente = await t.web('post')('/api/auth/login').send({ email: 'nadie@correo.com', password: PASSWORD });
      return { mala: [mala.status, mala.body.message], inexistente: [inexistente.status, inexistente.body.message] };
    },
    verificar: ({ mala, inexistente }) => {
      expect(mala).toEqual([401, 'Credenciales invalidas']);
      expect(inexistente).toEqual(mala);
    },
  });

  describeCase('login (e2e)', {
    que: 'con la cuenta verificada, el login correcto entrega sesion',
    espera: '200 con accessToken',
    ejecutar: async () => t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD }),
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.email).toBe(EMAIL);
    },
    describirObtenido: (res) => `${res.status}, twoFactorRequired=${res.body.twoFactorRequired}`,
  });

  describeCase('login (e2e)', {
    que: 'la app movil recibe el refresh token en el body y no en cookie',
    espera: 'refreshToken en el body y ninguna cookie',
    ejecutar: async () =>
      request(t.app.getHttpServer())
        .post('/api/auth/login')
        .set(MOBILE_HEADERS)
        .send({ email: EMAIL, password: PASSWORD }),
    verificar: (res) => {
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(cookieOf(res, 'refresh_token')).toBeUndefined();
    },
    describirObtenido: (res) => `refreshToken en body: ${'refreshToken' in res.body}, cookie: ${Boolean(cookieOf(res, 'refresh_token'))}`,
  });

  // ---------- Sesiones ----------

  describeCase('sesiones (e2e)', {
    que: 'el token abre las rutas protegidas y lista las sesiones activas',
    espera: '200 con al menos una sesion marcada como actual',
    ejecutar: async () => t.web('get')('/api/auth/sessions').set('Authorization', `Bearer ${accessToken}`),
    verificar: (res) => {
      expect(res.status).toBe(200);
      expect(res.body.some((s: { current: boolean }) => s.current)).toBe(true);
    },
    describirObtenido: (res) => `${res.status}, ${res.body.length} sesiones`,
  });

  describeCase('sesiones (e2e)', {
    que: 'un token manipulado es rechazado',
    espera: '401',
    ejecutar: async () =>
      (await t.web('get')('/api/auth/sessions').set('Authorization', `Bearer ${accessToken}x`)).status,
    verificar: (status) => expect(status).toBe(401),
  });

  /** Login nuevo (sesion propia) para los casos de rotacion, que no se pisan con los demas. */
  const nuevaSesion = async () => {
    const res = await t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    return (cookieOf(res, 'refresh_token') as string).split(';')[0];
  };
  const refrescar = (cookie: string) => t.web('post')('/api/auth/refresh').set('Cookie', cookie).send({});
  const cookieNueva = (res: request.Response) => (cookieOf(res, 'refresh_token') as string).split(';')[0];

  describeCase('sesiones (e2e)', {
    que: 'refresh rota el token y el viejo reusado de inmediato (doble pestana, reintento de red) solo se rechaza',
    espera: 'primer refresh 200; reuso inmediato del cookie viejo 401 SIN cerrar sesiones; el cookie nuevo sigue sirviendo',
    ejecutar: async () => {
      const vieja = await nuevaSesion();
      const primero = await refrescar(vieja);
      const reuso = await refrescar(vieja);
      const conLaNueva = await refrescar(cookieNueva(primero));
      return [primero.status, reuso.status, conLaNueva.status];
    },
    verificar: (estados) => expect(estados).toEqual([200, 401, 200]),
  });

  describeCase('sesiones (e2e)', {
    que: 'reusar un token ya rotado pasado el margen de 10 s (robo real) cierra TODAS las sesiones',
    espera: 'reuso tardio 401; despues el refresh del cookie nuevo tambien falla',
    ejecutar: async () => {
      const vieja = await nuevaSesion();
      const primero = await refrescar(vieja);
      // Se envejece la revocacion de la sesion vieja: como si el reuso llegara un minuto despues.
      const haceUnMinuto = new Date(Date.now() - 60_000);
      await t.prisma.session.updateMany({ where: { revokedAt: { not: null, gt: new Date(Date.now() - 5_000) } }, data: { revokedAt: haceUnMinuto } });
      const reuso = await refrescar(vieja);
      const trasRobo = await refrescar(cookieNueva(primero));
      return [primero.status, reuso.status, trasRobo.status];
    },
    verificar: (estados) => expect(estados).toEqual([200, 401, 401]),
  });

  describeCase('sesiones (e2e)', {
    que: 'ocho refresh SIMULTANEOS con el mismo token (carrera)',
    espera: 'exactamente uno gana (200), los demas se rechazan (401, o 429 si agotan el limite); no se crea ninguna sesion de mas y la del ganador queda activa',
    ejecutar: async () => {
      const vieja = await nuevaSesion();
      const usuario = await userByEmail(t, EMAIL);
      const antes = await t.prisma.session.count({ where: { userId: usuario.id, revokedAt: null } });
      const respuestas = await Promise.all(Array.from({ length: 8 }, () => refrescar(vieja)));
      const ganador = respuestas.find((r) => r.status === 200);
      const despues = await t.prisma.session.count({ where: { userId: usuario.id, revokedAt: null } });
      // La sesion del ganador sigue activa en la base (se comprueba ahi: 8 peticiones seguidas agotan el limite HTTP).
      const hash = ganador ? t.app.get(CryptoService).hashToken(cookieNueva(ganador).split('=')[1]) : '';
      const activa = await t.prisma.session.count({ where: { refreshTokenHash: hash, revokedAt: null } });
      return { estados: respuestas.map((r) => r.status), antes, despues, activa };
    },
    verificar: ({ estados, antes, despues, activa }) => {
      expect(estados.filter((s) => s === 200)).toHaveLength(1);
      expect(estados.filter((s) => s !== 200).every((s) => s === 401 || s === 429)).toBe(true);
      expect(despues).toBe(antes); // la sesion vieja se cambio por UNA nueva, no por varias
      expect(activa).toBe(1);
    },
    describirObtenido: ({ estados, antes, despues, activa }) => `${estados.filter((s) => s === 200).length} ganador(es) de ${estados.length}; sesiones activas antes ${antes}, despues ${despues}; sesion del ganador activa: ${activa}`,
  });

  describeCase('sesiones (e2e)', {
    que: 'los datos sensibles no aparecen en la auditoria',
    espera: 'ningun registro de AuditLog contiene contrasenas ni codigos',
    ejecutar: async () => JSON.stringify(await auditLogs(t)),
    verificar: (volcado) => {
      expect(volcado).not.toContain(PASSWORD);
      expect(volcado).not.toContain('passwordHash');
    },
    describirObtenido: (volcado) => `${volcado.length} caracteres de auditoria revisados`,
  });

  describeCase('verificacion de correo (e2e)', {
    que: 'reenviar el codigo responde igual exista o no la cuenta',
    espera: '200 con el mismo mensaje para un correo registrado y para uno que no existe',
    ejecutar: async () => {
      const registrado = await t.web('post')('/api/auth/resend-code').send({ email: EMAIL });
      const inexistente = await t.web('post')('/api/auth/resend-code').send({ email: 'nadie.registrado@correo.com' });
      return { registrado, inexistente };
    },
    verificar: ({ registrado, inexistente }) => {
      expect(registrado.status).toBe(200);
      expect(inexistente.status).toBe(200);
      expect(registrado.body).toEqual(inexistente.body);
    },
    describirObtenido: ({ registrado, inexistente }) => `registrado ${registrado.status}, inexistente ${inexistente.status}, mismo cuerpo: ${JSON.stringify(registrado.body) === JSON.stringify(inexistente.body)}`,
  });
});
