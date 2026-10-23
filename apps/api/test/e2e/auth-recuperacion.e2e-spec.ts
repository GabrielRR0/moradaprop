import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { createTestApp, PASSWORD, type TestApp } from '../support/test-app';

const EMAIL = 'recupera@correo.com';
const NUEVA = 'NuevaClave789';

describe('Auth: recuperacion de contrasena y bloqueo de cuenta (e2e)', () => {
  let t: TestApp;
  let refreshCookieViejo = '';

  beforeAll(async () => {
    t = await createTestApp();
    const sesion = await registerVerified(t, EMAIL);
    refreshCookieViejo = sesion.refreshCookie;
    await registerVerified(t, 'bloqueada@correo.com');
  });
  afterAll(() => t.close());

  describeCase('recuperar contrasena (e2e)', {
    que: 'pedir el codigo responde igual exista o no el correo (no revela cuentas)',
    espera: 'mismo status y mensaje para un correo existente y uno inexistente',
    ejecutar: async () => {
      const real = await t.web('post')('/api/auth/password/forgot').send({ email: EMAIL });
      const falso = await t.web('post')('/api/auth/password/forgot').send({ email: 'fantasma@correo.com' });
      return { real: [real.status, real.body], falso: [falso.status, falso.body] };
    },
    verificar: ({ real, falso }) => expect(real).toEqual(falso),
  });

  describeCase('recuperar contrasena (e2e)', {
    que: 'solo se envia correo al usuario que existe',
    espera: 'un correo reset-password a la cuenta real y ninguno a la inexistente',
    ejecutar: async () => ({
      real: t.mail.sent.filter((m) => m.to === EMAIL && m.template.name === 'reset-password').length,
      falso: t.mail.sent.filter((m) => m.to === 'fantasma@correo.com').length,
    }),
    verificar: ({ real, falso }) => {
      expect(real).toBe(1);
      expect(falso).toBe(0);
    },
    describirObtenido: ({ real, falso }) => `a la real: ${real}, a la inexistente: ${falso}`,
  });

  describeCase('recuperar contrasena (e2e)', {
    que: 'pedir otro codigo enseguida respeta el cooldown de reenvio',
    espera: 'solo sigue habiendo un correo (la respuesta es generica, el segundo codigo no se emite)',
    ejecutar: async () => {
      await t.web('post')('/api/auth/password/forgot').send({ email: EMAIL });
      return t.mail.sent.filter((m) => m.to === EMAIL && m.template.name === 'reset-password').length;
    },
    verificar: (cantidad) => expect(cantidad).toBe(1),
  });

  describeCase('recuperar contrasena (e2e)', {
    que: 'un codigo incorrecto no cambia la contrasena',
    espera: '400 y la contrasena original sigue funcionando',
    ejecutar: async () => {
      const reset = await t.web('post')('/api/auth/password/reset').send({ email: EMAIL, code: '000000', newPassword: NUEVA });
      const login = await t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
      return { reset: reset.status, login: login.status };
    },
    verificar: ({ reset, login }) => expect([reset, login]).toEqual([400, 200]),
    describirObtenido: ({ reset, login }) => `reset ${reset}, login con la clave original ${login}`,
  });

  describeCase('recuperar contrasena (e2e)', {
    que: 'el codigo correcto cambia la contrasena y cierra todas las sesiones anteriores',
    espera: 'reset 200; la clave vieja falla; la nueva entra; el refresh token viejo deja de servir',
    ejecutar: async () => {
      const code = t.mail.lastCode(EMAIL, 'reset-password');
      const reset = await t.web('post')('/api/auth/password/reset').send({ email: EMAIL, code, newPassword: NUEVA });
      const vieja = await t.web('post')('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
      const nueva = await t.web('post')('/api/auth/login').send({ email: EMAIL, password: NUEVA });
      const refrescoViejo = await t.web('post')('/api/auth/refresh').set('Cookie', refreshCookieViejo).send({});
      return [reset.status, vieja.status, nueva.status, refrescoViejo.status];
    },
    verificar: (estados) => expect(estados).toEqual([200, 401, 200, 401]),
  });

  describeCase('recuperar contrasena (e2e)', {
    que: 'el mismo codigo no se puede usar dos veces',
    espera: '400',
    ejecutar: async () => {
      const code = t.mail.lastCode(EMAIL, 'reset-password');
      return (await t.web('post')('/api/auth/password/reset').send({ email: EMAIL, code, newPassword: 'OtraClave000' })).status;
    },
    verificar: (status) => expect(status).toBe(400),
  });

  describeCase('bloqueo de cuenta (e2e)', {
    que: 'tras 5 contrasenas incorrectas la cuenta se bloquea, incluso con la clave correcta',
    espera: 'cinco 401 y despues un 403 aunque la clave sea la correcta',
    ejecutar: async () => {
      const estados: number[] = [];
      for (let i = 0; i < 5; i++) {
        estados.push((await t.web('post')('/api/auth/login').send({ email: 'bloqueada@correo.com', password: 'Incorrecta1' })).status);
      }
      const correcta = await t.web('post')('/api/auth/login').send({ email: 'bloqueada@correo.com', password: PASSWORD });
      return { estados, correcta: correcta.status, mensaje: correcta.body.message };
    },
    verificar: ({ estados, correcta }) => {
      expect(estados).toEqual([401, 401, 401, 401, 401]);
      expect(correcta).toBe(403);
    },
    describirObtenido: ({ estados, correcta, mensaje }) => `${estados.join(',')} y luego ${correcta}: "${mensaje}"`,
  });

  describeCase('bloqueo de cuenta (e2e)', {
    que: 'el bloqueo queda en la auditoria',
    espera: 'existe un evento auth.account.locked para esa cuenta',
    ejecutar: async () => t.prisma.auditLog.count({ where: { action: 'auth.account.locked' } }),
    verificar: (cantidad) => expect(cantidad).toBe(1),
  });
});
