import { AppConfig } from '../../src/config';
import { PrismaService } from '../../src/common/prisma';
import { describeCase } from '../support/describe-case';
import { seedProperty } from '../support/property-helpers';
import { registerVerified } from '../support/auth-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

describe('Rendimiento y proteccion de endpoints publicos (e2e)', () => {
  let t: TestApp;
  let consultas = 0;

  beforeAll(async () => {
    t = await createTestApp();
    const { userId } = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    for (let i = 0; i < 5; i++) await seedProperty(t, userId, { title: `Propiedad ${i}`, latitude: 10.49 + i * 0.001 });

    // Se enciende la cache solo en esta suite y se cuentan las consultas reales a la tabla Property.
    Object.assign(t.app.get(AppConfig).cache, { ttlSeconds: 30 });
    const prisma = t.app.get(PrismaService);
    const original = prisma.property.findMany.bind(prisma.property);
    (prisma.property as unknown as { findMany: unknown }).findMany = (...args: Parameters<typeof original>) => {
      consultas++;
      return original(...args);
    };
  });
  afterAll(() => t.close());

  describeCase('cache del mapa (e2e)', {
    que: '60 clientes piden el mismo mapa a la vez: la base se consulta UNA sola vez',
    espera: '60 respuestas 200 con los mismos datos y 1 consulta a la base',
    ejecutar: async () => {
      consultas = 0;
      const url = '/api/properties/map?zoom=12&swLat=10.40&swLng=-66.95&neLat=10.60&neLng=-66.75';
      const respuestas = await Promise.all(Array.from({ length: 60 }, () => t.web('get')(url)));
      return { estados: new Set(respuestas.map((r) => r.status)), totales: new Set(respuestas.map((r) => r.body.total)), consultas };
    },
    verificar: ({ estados, totales, consultas: n }) => {
      expect([...estados]).toEqual([200]);
      expect([...totales]).toEqual([5]);
      expect(n).toBe(1);
    },
    describirObtenido: ({ estados, consultas: n }) => `60 peticiones -> estados ${[...estados].join(',')}, consultas a la base: ${n}`,
  });

  describeCase('cache del mapa (e2e)', {
    que: 'cuadros del mapa casi iguales comparten la misma cache (se ajustan a una cuadricula)',
    espera: 'dos usuarios con cuadros distintos en decimales = 0 consultas nuevas',
    ejecutar: async () => {
      await t.web('get')('/api/properties/map?zoom=14&swLat=10.4971&swLng=-66.8483&neLat=10.5121&neLng=-66.8311');
      consultas = 0;
      await t.web('get')('/api/properties/map?zoom=14&swLat=10.4973&swLng=-66.8481&neLat=10.5119&neLng=-66.8312');
      return consultas;
    },
    verificar: (n) => expect(n).toBe(0),
    describirObtenido: (n) => `consultas nuevas a la base: ${n}`,
  });

  describeCase('cache de busqueda (e2e)', {
    que: 'repetir una busqueda no consulta la base; cambiar un filtro si',
    espera: 'misma busqueda = 0 consultas; otro filtro = 2 (listado y conteo)',
    ejecutar: async () => {
      await t.web('get')('/api/properties?bedrooms=2');
      consultas = 0;
      await t.web('get')('/api/properties?bedrooms=2');
      const repetida = consultas;
      await t.web('get')('/api/properties?bedrooms=1');
      return { repetida, distinta: consultas };
    },
    verificar: ({ repetida, distinta }) => {
      expect(repetida).toBe(0);
      expect(distinta).toBeGreaterThan(0);
    },
  });

  describeCase('cabeceras HTTP (e2e)', {
    que: 'busqueda y mapa son cacheables por navegador/CDN; la ficha no',
    espera: 'Cache-Control public en busqueda y mapa; ninguna en la ficha',
    ejecutar: async () => {
      const id = (await t.prisma.property.findFirstOrThrow()).id;
      return {
        busqueda: (await t.web('get')('/api/properties')).headers['cache-control'],
        mapa: (await t.web('get')('/api/properties/map')).headers['cache-control'],
        ficha: (await t.web('get')(`/api/properties/${id}`)).headers['cache-control'],
      };
    },
    verificar: ({ busqueda, mapa, ficha }) => {
      expect(busqueda).toContain('public');
      expect(busqueda).toContain('max-age=10'); // CacheSupport.POLICIES.search.browserSeconds
      expect(mapa).toContain('stale-while-revalidate');
      expect(ficha).toBeUndefined();
    },
    describirObtenido: ({ busqueda, ficha }) => `busqueda: "${busqueda}"; ficha: ${ficha}`,
  });

  describeCase('cabeceras HTTP (e2e)', {
    que: 'las respuestas grandes viajan comprimidas (gzip) cuando el cliente lo acepta',
    espera: 'content-encoding gzip en una busqueda',
    ejecutar: async () => (await t.web('get')('/api/properties?limit=50').set('Accept-Encoding', 'gzip')).headers['content-encoding'],
    verificar: (encoding) => expect(encoding).toBe('gzip'),
  });

  describeCase('proteccion de paginacion (e2e)', {
    que: 'no se puede pedir una pagina absurda ni un mapa con zoom fuera de rango',
    espera: '400 para page=100000, page=51 y zoom=99; page=50 es valida',
    ejecutar: async () => [
      (await t.web('get')('/api/properties?page=100000')).status,
      (await t.web('get')('/api/properties?page=51')).status,
      (await t.web('get')('/api/properties/map?zoom=99')).status,
      (await t.web('get')('/api/properties?page=50')).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 400, 400, 200]),
  });
});
