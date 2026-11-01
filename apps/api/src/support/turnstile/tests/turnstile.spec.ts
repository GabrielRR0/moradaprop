import { describeCase } from '@test/support/describe-case';
import { TurnstileService } from '../turnstile.service';

const config = { security: { turnstile: { secretKey: 'clave-secreta-de-prueba' } } } as never;

const respuesta = (cuerpo: unknown, ok = true, status = 200) => ({ ok, status, json: async () => cuerpo }) as unknown as Response;

describe('TurnstileService: validar el widget con Cloudflare', () => {
  const original = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterAll(() => {
    global.fetch = original;
  });

  describeCase('turnstile', {
    que: 'un token que Cloudflare acepta es valido, y se le manda la clave secreta, el token y la IP',
    espera: "'valid'; la peticion va a siteverify con secret, response y remoteip",
    ejecutar: async () => {
      fetchMock.mockResolvedValue(respuesta({ success: true }));
      const resultado = await new TurnstileService(config).verify('token-bueno', '200.1.2.3');
      const [url, init] = fetchMock.mock.calls[0] as [string, { body: URLSearchParams }];
      return { resultado, url, cuerpo: Object.fromEntries(init.body.entries()) };
    },
    verificar: ({ resultado, url, cuerpo }) => {
      expect(resultado).toBe('valid');
      expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
      expect(cuerpo).toEqual({ secret: 'clave-secreta-de-prueba', response: 'token-bueno', remoteip: '200.1.2.3' });
    },
  });

  describeCase('turnstile', {
    que: 'un token que Cloudflare rechaza (falso, vencido o repetido) es invalido',
    espera: "'invalid'",
    ejecutar: async () => {
      fetchMock.mockResolvedValue(respuesta({ success: false, 'error-codes': ['timeout-or-duplicate'] }));
      return new TurnstileService(config).verify('token-usado');
    },
    verificar: (resultado) => expect(resultado).toBe('invalid'),
  });

  describeCase('turnstile', {
    que: 'un token vacio o gigante se rechaza sin llamar a Cloudflare',
    espera: "'invalid' y ninguna peticion",
    ejecutar: async () => {
      const servicio = new TurnstileService(config);
      return { vacio: await servicio.verify(''), largo: await servicio.verify('x'.repeat(2049)), llamadas: fetchMock.mock.calls.length };
    },
    verificar: (r) => expect(r).toEqual({ vacio: 'invalid', largo: 'invalid', llamadas: 0 }),
  });

  describeCase('turnstile', {
    que: 'si no se puede preguntar a Cloudflare (red caida, error 500 o nuestra clave secreta mal puesta) no se acusa al usuario',
    espera: "'unavailable' en los tres casos",
    ejecutar: async () => {
      const servicio = new TurnstileService(config);
      fetchMock.mockRejectedValueOnce(new Error('red caida'));
      const red = await servicio.verify('token');
      fetchMock.mockResolvedValueOnce(respuesta({}, false, 500));
      const servidor = await servicio.verify('token');
      fetchMock.mockResolvedValueOnce(respuesta({ success: false, 'error-codes': ['invalid-input-secret'] }));
      const clave = await servicio.verify('token');
      return { red, servidor, clave };
    },
    verificar: (r) => expect(r).toEqual({ red: 'unavailable', servidor: 'unavailable', clave: 'unavailable' }),
  });

  describeCase('turnstile', {
    que: 'sin IP conocida no se manda remoteip',
    espera: 'el cuerpo no trae remoteip',
    ejecutar: async () => {
      fetchMock.mockResolvedValue(respuesta({ success: true }));
      await new TurnstileService(config).verify('token', 'unknown');
      const [, init] = fetchMock.mock.calls[0] as [string, { body: URLSearchParams }];
      return Object.fromEntries(init.body.entries());
    },
    verificar: (cuerpo) => expect(cuerpo).toEqual({ secret: 'clave-secreta-de-prueba', response: 'token' }),
  });
});
