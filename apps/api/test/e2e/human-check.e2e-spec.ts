import { describeCase } from '../support/describe-case';
import { overrideEnv } from '../support/env-helpers';
import { createTestApp, PASSWORD, type FakeTurnstile, type TestApp } from '../support/test-app';

const TOKEN_HEADER = 'x-turnstile-token';
const cuenta = (email: string) => ({ email, password: PASSWORD, name: 'Usuario Prueba', accountType: 'CLIENT' });

/** Cloudflare falso: "bueno-N" vale una sola vez, "caido" simula que no responde, cualquier otro es invalido. */
function fakeCloudflare(): FakeTurnstile {
  const usados = new Set<string>();
  return {
    verify: async (token) => {
      if (token === 'caido') return 'unavailable';
      if (!token.startsWith('bueno-') || usados.has(token)) return 'invalid';
      usados.add(token);
      return 'valid';
    },
  };
}

describe('Turnstile apagado (el valor por defecto) (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  describeCase('human-check (e2e)', {
    que: 'con TURNSTILE_ENABLED=false la web lo sabe y ninguna ruta pide la verificacion',
    espera: '{enabled:false, siteKey:null}; registrarse y pedir un codigo funcionan sin cabecera',
    ejecutar: async () => ({
      config: (await t.web('get')('/api/auth/human-check')).body,
      registro: (await t.web('post')('/api/auth/register').send(cuenta('apagado@correo.com'))).status,
      reenvio: (await t.web('post')('/api/auth/resend-code').send({ email: 'apagado@correo.com' })).status,
    }),
    verificar: ({ config, registro, reenvio }) => {
      expect(config).toEqual({ enabled: false, siteKey: null });
      expect(registro).toBe(201);
      expect(reenvio).toBe(200);
    },
  });
});

/**
 * Levanta una app con Turnstile encendido (y Cloudflare falso) para un bloque de pruebas. Cada bloque usa su propia app
 * porque el limite de uso de las rutas sensibles (10 por minuto y por IP) tambien corre en las pruebas.
 */
function conTurnstileEncendido(nombre: string, definir: (app: () => TestApp, bueno: () => string) => void) {
  describe(`Turnstile encendido: ${nombre} (e2e)`, () => {
    const claves = { TURNSTILE_ENABLED: 'true', TURNSTILE_SITE_KEY: 'clave-publica-de-prueba', TURNSTILE_SECRET_KEY: 'clave-secreta-de-prueba' };
    let restaurar: Array<() => void> = [];
    let t: TestApp;
    let n = 0;
    /** Un token bueno nuevo cada vez (cada uno vale una sola vez). */
    const bueno = () => `bueno-${nombre}-${++n}`;

    beforeAll(async () => {
      restaurar = Object.entries(claves).map(([clave, valor]) => overrideEnv(clave, valor));
      t = await createTestApp({ turnstile: fakeCloudflare() });
    });
    afterAll(async () => {
      restaurar.forEach((volver) => volver());
      await t.close();
    });

    definir(() => t, bueno);
  });
}

conTurnstileEncendido('la puerta', (app, bueno) => {
  describeCase('human-check (e2e)', {
    que: 'la web puede preguntar si esta activo y recibe solo la clave publica, nunca la secreta',
    espera: '{enabled:true, siteKey publica}; en la respuesta no aparece la clave secreta',
    ejecutar: async () => (await app().web('get')('/api/auth/human-check')).text,
    verificar: (texto) => {
      expect(JSON.parse(texto)).toEqual({ enabled: true, siteKey: 'clave-publica-de-prueba' });
      expect(texto).not.toContain('clave-secreta-de-prueba');
    },
  });

  describeCase('human-check (e2e)', {
    que: 'registro, login, recuperar clave y reenvio de codigo exigen la verificacion',
    espera: '403 HUMAN_CHECK_REQUIRED en las cuatro rutas sin la cabecera',
    ejecutar: async () => {
      const rutas: Array<[string, object]> = [
        ['/api/auth/register', cuenta('sin-token@correo.com')],
        ['/api/auth/login', { email: 'sin-token@correo.com', password: PASSWORD }],
        ['/api/auth/resend-code', { email: 'sin-token@correo.com' }],
        ['/api/auth/password/forgot', { email: 'sin-token@correo.com' }],
      ];
      const respuestas = [];
      for (const [ruta, cuerpo] of rutas) respuestas.push(await app().web('post')(ruta).send(cuerpo));
      return respuestas.map((r) => [r.status, r.body.code]);
    },
    verificar: (r) => expect(r).toEqual(Array(4).fill([403, 'HUMAN_CHECK_REQUIRED'])),
  });

  describeCase('human-check (e2e)', {
    que: 'un token falso se rechaza y uno bueno deja pasar; el mismo token no sirve dos veces',
    espera: 'falso 403 HUMAN_CHECK_FAILED; bueno 201; el mismo otra vez 403 HUMAN_CHECK_FAILED',
    ejecutar: async () => {
      const falso = await app().web('post')('/api/auth/register').set(TOKEN_HEADER, 'inventado').send(cuenta('a@correo.com'));
      const token = bueno();
      const primera = await app().web('post')('/api/auth/register').set(TOKEN_HEADER, token).send(cuenta('b@correo.com'));
      const repetido = await app().web('post')('/api/auth/register').set(TOKEN_HEADER, token).send(cuenta('c@correo.com'));
      return { falso: [falso.status, falso.body.code], primera: primera.status, repetido: [repetido.status, repetido.body.code] };
    },
    verificar: (r) => expect(r).toEqual({ falso: [403, 'HUMAN_CHECK_FAILED'], primera: 201, repetido: [403, 'HUMAN_CHECK_FAILED'] }),
  });
});

conTurnstileEncendido('el resto', (app, bueno) => {
  describeCase('human-check (e2e)', {
    que: 'con un token bueno las otras rutas siguen su curso normal (la verificacion solo es la puerta)',
    espera: 'login con credenciales falsas 401 (no 403); reenvio 200; recuperar clave 200',
    ejecutar: async () => ({
      login: (await app().web('post')('/api/auth/login').set(TOKEN_HEADER, bueno()).send({ email: 'nadie@correo.com', password: PASSWORD })).status,
      reenvio: (await app().web('post')('/api/auth/resend-code').set(TOKEN_HEADER, bueno()).send({ email: 'nadie@correo.com' })).status,
      recuperar: (await app().web('post')('/api/auth/password/forgot').set(TOKEN_HEADER, bueno()).send({ email: 'nadie@correo.com' })).status,
    }),
    verificar: (r) => expect(r).toEqual({ login: 401, reenvio: 200, recuperar: 200 }),
  });

  describeCase('human-check (e2e)', {
    que: 'si Cloudflare no responde, se niega el acceso con su propio codigo (para que la web deje reintentar)',
    espera: '503 HUMAN_CHECK_UNAVAILABLE',
    ejecutar: async () => {
      const res = await app().web('post')('/api/auth/register').set(TOKEN_HEADER, 'caido').send(cuenta('d@correo.com'));
      return [res.status, res.body.code];
    },
    verificar: (r) => expect(r).toEqual([503, 'HUMAN_CHECK_UNAVAILABLE']),
  });

  describeCase('human-check (e2e)', {
    que: 'el resto de rutas no se ve afectado: salud, busqueda publica y verificar el correo no piden el token',
    espera: '200 en salud y busqueda; verificar-email responde por su propia validacion, no por la verificacion (403)',
    ejecutar: async () => ({
      salud: (await app().web('get')('/api/health')).status,
      busqueda: (await app().web('get')('/api/properties')).status,
      verificar: (await app().web('post')('/api/auth/verify-email').send({ email: 'nadie@correo.com', code: '000000' })).status,
    }),
    verificar: ({ salud, busqueda, verificar }) => {
      expect(salud).toBe(200);
      expect(busqueda).toBe(200);
      expect(verificar).not.toBe(403);
    },
  });
});
