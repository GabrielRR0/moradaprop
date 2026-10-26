import { hashPassword } from '../../src/common/password';
import { createAdmin, createUserRow, jwtPayload, userByEmail } from '../support/auth-helpers';
import { describeCase } from '../support/describe-case';
import { overrideEnv } from '../support/env-helpers';
import { FakeAuthenticator } from '../support/fake-authenticator';
import { cookieDe, lugares, type Lugar } from '../support/lugares';
import { createTestApp, PASSWORD, totp, type TestApp } from '../support/test-app';

/**
 * Segundo factor (passkey o 2FA) obligatorio para admin, dueños y agencias (security/second-factor).
 * Con enforce, quien debe activarlo y no lo hizo solo puede usar las rutas de enrolamiento.
 */
let t: TestApp;
const { pedir, crearCuenta, login } = lugares(() => t);

const lugar = (n: number, extra: Partial<Lugar> = {}): Lugar => ({ ip: `190.${n}.${n}.${n}`, country: 'VE', ...extra });
const DAY = 24 * 60 * 60 * 1000;
const PK = '/api/auth/passkeys';
const BLOQUEADO = { status: 403, code: 'SECOND_FACTOR_ENROLLMENT_REQUIRED' };

const resumen = (res: { status: number; body: { code?: string } }) => ({ status: res.status, code: res.body.code });

/** Registra una passkey completa con la cuenta y el dispositivo dados. */
async function registrarPasskey(auth: FakeAuthenticator, donde: Lugar, token: string) {
  const opciones = await pedir('post', `${PK}/register/options`, donde, { password: PASSWORD }, token);
  if (opciones.status !== 200) return opciones;
  auth.userHandle = Buffer.from(opciones.body.user.id, 'base64url');
  return pedir('post', `${PK}/register/verify`, donde, { credential: auth.create({ challenge: opciones.body.challenge }) }, token);
}
const autenticador = () => new FakeAuthenticator({ rpId: 'localhost', origin: 'http://localhost:3000' });

/** Cuenta existente creada directo en la base (como las de antes de esta funcion). */
async function cuentaExistente(email: string, roles: Array<'CLIENT' | 'OWNER' | 'AGENCY' | 'ADMIN'>, secondFactorRequiredFrom: Date | null) {
  await createUserRow(t, {
    email,
    name: 'Cuenta Existente',
    roles,
    passwordHash: await hashPassword(PASSWORD),
    emailVerifiedAt: new Date(),
    ...(secondFactorRequiredFrom ? { secondFactorRequiredFrom } : {}),
  });
  return (await userByEmail(t, email)).id;
}

describe('Segundo factor obligatorio: modo enforce (e2e)', () => {
  let restaurarEnv: Array<() => void> = [];
  /** El dueño nuevo que atraviesa los primeros casos. */
  let dueno: { token: string; device: string; refresh: string; donde: Lugar };

  beforeAll(async () => {
    restaurarEnv = [overrideEnv('SECOND_FACTOR_MODE', 'enforce'), overrideEnv('RISK_MODE', 'enforce'), overrideEnv('TRUST_PROXY', 'true')];
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.prisma.blockRule.deleteMany();
    restaurarEnv.forEach((restaurar) => restaurar());
    await t.close();
  });

  describeCase('segundo factor (e2e)', {
    que: 'una cuenta NUEVA de dueño, recien verificada y sin passkey ni 2FA',
    espera: 'la respuesta lo avisa (enrollment.blocked) y el token lleva enroll; solo abre las rutas de enrolamiento; el resto da 403 SECOND_FACTOR_ENROLLMENT_REQUIRED; las rutas publicas siguen abiertas',
    ejecutar: async () => {
      const cuenta = await crearCuenta('dueno@correo.com', lugar(10), 'OWNER');
      const donde = lugar(10, { device: cuenta.device });
      dueno = { token: cuenta.token, device: cuenta.device as string, refresh: cuenta.refresh as string, donde };
      const get = (url: string) => pedir('get', url, donde, undefined, cuenta.token).then(resumen);
      return {
        enrollment: cuenta.res.body.enrollment,
        claims: jwtPayload(cuenta.token),
        permitidas: [
          await get('/api/users/me'),
          await get('/api/auth/second-factor'),
          await get('/api/auth/sessions'),
          await get('/api/auth/devices'),
          await get('/api/auth/security-events'),
          await get(PK),
        ],
        opciones: (await pedir('post', `${PK}/register/options`, donde, { password: PASSWORD }, cuenta.token)).status,
        bloqueadas: [await get('/api/properties/mine'), await get('/api/appointments/received'), await get('/api/properties/favorites')],
        publicaSinToken: (await pedir('get', '/api/properties', donde)).status,
        publicaConToken: (await pedir('get', '/api/properties', donde, undefined, cuenta.token)).status,
      };
    },
    verificar: ({ enrollment, claims, permitidas, opciones, bloqueadas, publicaSinToken, publicaConToken }) => {
      expect(enrollment).toMatchObject({ mode: 'enforce', required: true, hasFactor: false, mustEnrollNow: true, blocked: true, recommended: false });
      expect(claims.enroll).toBe(true);
      expect(permitidas.map((p) => p.status)).toEqual([200, 200, 200, 200, 200, 200]);
      expect(opciones).toBe(200);
      expect(bloqueadas).toEqual([BLOQUEADO, BLOQUEADO, BLOQUEADO]);
      expect([publicaSinToken, publicaConToken]).toEqual([200, 200]);
    },
    describirObtenido: ({ enrollment, bloqueadas }) => `blocked=${enrollment.blocked}; ${bloqueadas.map((b) => `${b.status} ${b.code}`).join(' | ')}`,
  });

  describeCase('segundo factor (e2e)', {
    que: 'ese dueño registra una passkey con el MISMO token que ya tenia',
    espera: 'el token viejo funciona de inmediato (el guard confirma en la base); al renovar, el token nuevo ya no lleva enroll y enrollment.blocked es false',
    ejecutar: async () => {
      const registro = await registrarPasskey(autenticador(), dueno.donde, dueno.token);
      const conTokenViejo = await pedir('get', '/api/properties/mine', dueno.donde, undefined, dueno.token);
      const estado = await pedir('get', '/api/auth/second-factor', dueno.donde, undefined, dueno.token);
      const renovado = await pedir('post', '/api/auth/refresh', { ...dueno.donde, refresh: dueno.refresh, device: dueno.device }, {});
      return { registro: registro.status, conTokenViejo: conTokenViejo.status, estado: estado.body, renovado, claims: jwtPayload(renovado.body.accessToken ?? 'a.e30.b') };
    },
    verificar: ({ registro, conTokenViejo, estado, renovado, claims }) => {
      expect(registro).toBe(201);
      expect(conTokenViejo).toBe(200);
      expect(estado).toMatchObject({ required: true, hasFactor: true, mustEnrollNow: false, blocked: false });
      expect(renovado.status).toBe(200);
      expect(renovado.body.enrollment).toMatchObject({ hasFactor: true, blocked: false });
      expect(claims.enroll).toBeUndefined();
    },
    describirObtenido: ({ registro, conTokenViejo, renovado }) => `registro ${registro}; token viejo ${conTokenViejo}; renovado ${renovado.status}`,
  });

  describeCase('segundo factor (e2e)', {
    que: 'otro dueño nuevo lo activa con la app autenticadora (2FA)',
    espera: 'setup y confirm estan permitidos; el token que devuelve confirm ya no lleva enroll y abre las rutas de dueño',
    ejecutar: async () => {
      const cuenta = await crearCuenta('dueno2@correo.com', lugar(20), 'OWNER');
      const donde = lugar(20, { device: cuenta.device });
      const antes = await pedir('get', '/api/properties/mine', donde, undefined, cuenta.token);
      const setup = await pedir('post', '/api/auth/2fa/setup', donde, {}, cuenta.token);
      const confirmar = await pedir('post', '/api/auth/2fa/confirm', donde, { code: totp(setup.body.secret) }, cuenta.token);
      const despues = await pedir('get', '/api/properties/mine', donde, undefined, confirmar.body.accessToken);
      return { antes: resumen(antes), setup: setup.status, confirmar: confirmar.status, claims: jwtPayload(confirmar.body.accessToken ?? 'a.e30.b'), despues: despues.status };
    },
    verificar: ({ antes, setup, confirmar, claims, despues }) => {
      expect(antes).toEqual(BLOQUEADO);
      expect([setup, confirmar]).toEqual([200, 200]);
      expect(claims.enroll).toBeUndefined();
      expect(claims.twoFactor).toBe(true);
      expect(despues).toBe(200);
    },
  });

  describeCase('segundo factor (e2e)', {
    que: 'una cuenta que YA existia (dueño) dentro de su plazo de gracia, y luego con el plazo vencido',
    espera: 'dentro del plazo: entra normal y se le dice hasta cuando; vencido: queda limitada',
    ejecutar: async () => {
      const limite = new Date(Date.now() + 5 * DAY);
      const id = await cuentaExistente('antiguo@correo.com', ['CLIENT', 'OWNER'], limite);
      const donde = lugar(30);
      const primera = await login('antiguo@correo.com', donde);
      const dentro = await pedir('get', '/api/properties/mine', donde, undefined, primera.body.accessToken);

      await t.prisma.user.update({ where: { id }, data: { secondFactorRequiredFrom: new Date(Date.now() - 60_000) } });
      const device = cookieDe(primera, 'device_token');
      const segunda = await login('antiguo@correo.com', { ...donde, device });
      const vencido = await pedir('get', '/api/properties/mine', donde, undefined, segunda.body.accessToken);
      return { limite, primera: primera.body.enrollment, dentro: dentro.status, segunda: segunda.body.enrollment, vencido: resumen(vencido) };
    },
    verificar: ({ limite, primera, dentro, segunda, vencido }) => {
      expect(primera).toMatchObject({ required: true, mustEnrollNow: false, blocked: false, graceEndsAt: limite.toISOString() });
      expect(dentro).toBe(200);
      expect(segunda).toMatchObject({ mustEnrollNow: true, blocked: true });
      expect(vencido).toEqual(BLOQUEADO);
    },
  });

  describeCase('segundo factor (e2e)', {
    que: 'el plazo empieza solo al primer token si la cuenta no tenia fecha (dueño: 7 dias; admin: de inmediato)',
    espera: 'dueño: fecha guardada a 7 dias y no bloquea; admin sin factor: queda limitado en el acto, y con 2FA no',
    ejecutar: async () => {
      const duenoId = await cuentaExistente('sinfecha@correo.com', ['CLIENT', 'OWNER'], null);
      const adminId = await cuentaExistente('admin-sin@correo.com', ['CLIENT', 'ADMIN'], null);
      const { secret } = await createAdmin(t, 'admin-con@correo.com', true);

      const d = await login('sinfecha@correo.com', lugar(40));
      const a = await login('admin-sin@correo.com', lugar(41));
      const adminBloqueado = await pedir('get', '/api/appointments/mine', lugar(41), undefined, a.body.accessToken);

      const desafio = await login('admin-con@correo.com', lugar(42));
      const c = await pedir('post', '/api/auth/login/2fa', lugar(42), { challengeToken: desafio.body.challengeToken, code: totp(secret) });
      return {
        dueno: d.body.enrollment,
        guardadoDueno: ((await t.prisma.user.findUniqueOrThrow({ where: { id: duenoId } })).secondFactorRequiredFrom as Date).getTime() - Date.now(),
        admin: a.body.enrollment,
        adminBloqueado: resumen(adminBloqueado),
        guardadoAdmin: ((await t.prisma.user.findUniqueOrThrow({ where: { id: adminId } })).secondFactorRequiredFrom as Date).getTime() - Date.now(),
        adminConDosFactores: c.body.enrollment,
      };
    },
    verificar: ({ dueno, guardadoDueno, admin, adminBloqueado, guardadoAdmin, adminConDosFactores }) => {
      expect(dueno).toMatchObject({ required: true, mustEnrollNow: false, blocked: false });
      expect(guardadoDueno).toBeGreaterThan(6.99 * DAY);
      expect(guardadoDueno).toBeLessThan(7.01 * DAY);
      expect(admin).toMatchObject({ required: true, mustEnrollNow: true, blocked: true });
      expect(Math.abs(guardadoAdmin)).toBeLessThan(60_000);
      expect(adminBloqueado).toEqual(BLOQUEADO);
      expect(adminConDosFactores).toMatchObject({ hasFactor: true, blocked: false });
    },
    describirObtenido: ({ dueno, admin }) => `dueño blocked=${dueno.blocked}; admin sin factor blocked=${admin.blocked}`,
  });

  describeCase('segundo factor (e2e)', {
    que: 'un cliente (rol que no lo exige)',
    espera: 'nunca se bloquea; el estado dice "recommended" para que el frontend le sugiera activarlo',
    ejecutar: async () => {
      const cuenta = await crearCuenta('cliente@correo.com', lugar(50), 'CLIENT');
      const mias = await pedir('get', '/api/appointments/mine', lugar(50, { device: cuenta.device }), undefined, cuenta.token);
      return { enrollment: cuenta.res.body.enrollment, claims: jwtPayload(cuenta.token), mias: mias.status };
    },
    verificar: ({ enrollment, claims, mias }) => {
      expect(enrollment).toMatchObject({ required: false, hasFactor: false, mustEnrollNow: false, blocked: false, recommended: true, graceEndsAt: null });
      expect(claims.enroll).toBeUndefined();
      expect(mias).toBe(200);
    },
  });

  describeCase('segundo factor (e2e)', {
    que: 'el dueño de la passkey quita su ULTIMO factor',
    espera: 'se permite (con dispositivo confirmado); en el siguiente token vuelve a quedar limitado',
    ejecutar: async () => {
      const lista = await pedir('get', PK, dueno.donde, undefined, dueno.token);
      const quitar = await pedir('delete', `${PK}/${lista.body.items[0].id}`, dueno.donde, undefined, dueno.token);
      const renovado = await pedir('post', '/api/auth/refresh', { ...dueno.donde, refresh: cookieDe(await login('dueno@correo.com', dueno.donde), 'refresh_token'), device: dueno.device }, {});
      const mias = await pedir('get', '/api/properties/mine', dueno.donde, undefined, renovado.body.accessToken);
      return { quitar: quitar.status, enrollment: renovado.body.enrollment, mias: resumen(mias) };
    },
    verificar: ({ quitar, enrollment, mias }) => {
      expect(quitar).toBe(204);
      expect(enrollment).toMatchObject({ hasFactor: false, mustEnrollNow: true, blocked: true });
      expect(mias).toEqual(BLOQUEADO);
    },
  });
});

describe('Segundo factor obligatorio: modo monitor (e2e)', () => {
  let restaurarEnv: Array<() => void> = [];

  beforeAll(async () => {
    restaurarEnv = [overrideEnv('SECOND_FACTOR_MODE', 'monitor'), overrideEnv('RISK_MODE', 'monitor'), overrideEnv('TRUST_PROXY', 'true')];
    t = await createTestApp();
  });
  afterAll(async () => {
    restaurarEnv.forEach((restaurar) => restaurar());
    await t.close();
  });

  describeCase('segundo factor monitor (e2e)', {
    que: 'en monitor un dueño nuevo sin factor NO se bloquea, pero el estado lo avisa',
    espera: 'enrollment.mustEnrollNow true y blocked false; el token no lleva enroll; sus rutas funcionan',
    ejecutar: async () => {
      const cuenta = await crearCuenta('monitor@correo.com', lugar(60), 'OWNER');
      const mias = await pedir('get', '/api/properties/mine', lugar(60, { device: cuenta.device }), undefined, cuenta.token);
      return { enrollment: cuenta.res.body.enrollment, claims: jwtPayload(cuenta.token), mias: mias.status };
    },
    verificar: ({ enrollment, claims, mias }) => {
      expect(enrollment).toMatchObject({ mode: 'monitor', required: true, mustEnrollNow: true, blocked: false });
      expect(claims.enroll).toBeUndefined();
      expect(mias).toBe(200);
    },
  });
});
