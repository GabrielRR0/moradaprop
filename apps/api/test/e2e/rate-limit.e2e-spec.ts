import { describeCase } from '../support/describe-case';
import { createTestApp, type TestApp } from '../support/test-app';

describe('Rate limit (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  describeCase('rate limit (e2e)', {
    que: 'las rutas sensibles (grupo Guest) permiten 10 intentos por minuto y luego responden 429',
    espera: '10 respuestas 401 y la numero 11 es 429',
    ejecutar: async () => {
      const estados: number[] = [];
      for (let i = 0; i < 11; i++) {
        estados.push((await t.web('post')('/api/auth/login').send({ email: `x${i}@correo.com`, password: 'Incorrecta1' })).status);
      }
      return estados;
    },
    verificar: (estados) => {
      expect(estados.slice(0, 10).every((s) => s === 401)).toBe(true);
      expect(estados[10]).toBe(429);
    },
    describirObtenido: (estados) => estados.join(','),
  });

  describeCase('rate limit (e2e)', {
    que: 'el limite es por ruta: otra ruta del mismo cliente sigue disponible',
    espera: 'GET /api/health responde 200 aunque el login este limitado',
    ejecutar: async () => (await t.web('get')('/api/health')).status,
    verificar: (status) => expect(status).toBe(200),
  });
});
