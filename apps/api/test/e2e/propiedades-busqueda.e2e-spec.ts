import { describeCase } from '../support/describe-case';
import { registerVerified, userByEmail } from '../support/auth-helpers';
import { seedProperty } from '../support/property-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

describe('Propiedades: busqueda, filtros y mapa (e2e)', () => {
  let t: TestApp;
  const ids: Record<string, string> = {};

  /** Titulos de los resultados de una busqueda, ordenados, para comparar facil. */
  const buscar = async (query: string) => {
    const res = await t.web('get')(`/api/properties?${query}`);
    return { res, titulos: (res.body.items ?? []).map((i: { title: string }) => i.title).sort() as string[] };
  };

  beforeAll(async () => {
    t = await createTestApp();
    const { userId } = await registerVerified(t, 'dueno@correo.com', 'OWNER');

    const crear = async (clave: string, datos: Parameters<typeof seedProperty>[2]) => {
      ids[clave] = (await seedProperty(t, userId, datos)).id;
    };
    await crear('A', { title: 'A Apto Chacao', priceAmount: 450, bedrooms: 3, urbanization: 'Los Palos Grandes', latitude: 10.5, longitude: -66.85, hasGenerator: true, hasWaterTank: true });
    await crear('B', { title: 'B Casa Valencia', type: 'CASA', priceAmount: 1200, bedrooms: 5, state: 'Carabobo', municipality: 'Valencia', latitude: 10.16, longitude: -68.0, hasFiberOptic: true, hasSecurity: true });
    await crear('C', { title: 'C Apto Maracaibo', priceAmount: 15000, currency: 'VES', bedrooms: 2, state: 'Zulia', municipality: 'Maracaibo', latitude: 10.65, longitude: -71.6, hasFiberOptic: true });
    await crear('D', { title: 'D Habitacion Chacao', type: 'HABITACION', priceAmount: 150, bedrooms: 1, latitude: 10.49, longitude: -66.84 });
    await crear('E', { title: 'E Apto reservado', priceAmount: 500, status: 'RESERVADA', latitude: 10.51, longitude: -66.86 });
    await crear('F', { title: 'F Pausada', status: 'PAUSADA' });
    await crear('G', { title: 'G Alquilada', status: 'ALQUILADA' });
  });
  afterAll(() => t.close());

  describeCase('busqueda (e2e)', {
    que: 'lista solo PUBLICADA y RESERVADA; las pausadas y alquiladas no aparecen',
    espera: 'A, B, C, D, E (F y G ausentes)',
    ejecutar: async () => (await buscar('')).titulos,
    verificar: (titulos) => expect(titulos).toEqual(['A Apto Chacao', 'B Casa Valencia', 'C Apto Maracaibo', 'D Habitacion Chacao', 'E Apto reservado']),
  });

  describeCase('busqueda (e2e)', {
    que: 'la propiedad reservada NO desaparece: se marca "En Proceso de Reserva"',
    espera: 'E aparece con status RESERVADA e inReservation=true; las demas con false',
    ejecutar: async () => {
      const { res } = await buscar('');
      return res.body.items.map((i: { title: string; inReservation: boolean; status: string }) => [i.title.charAt(0), i.status, i.inReservation]);
    },
    verificar: (filas: Array<[string, string, boolean]>) => {
      expect(filas.find((f) => f[0] === 'E')).toEqual(['E', 'RESERVADA', true]);
      expect(filas.filter((f) => f[0] !== 'E').every((f) => f[2] === false)).toBe(true);
    },
    describirObtenido: (filas) => JSON.stringify(filas.filter((f: unknown[]) => f[0] === 'E')),
  });

  describeCase('busqueda (e2e)', {
    que: 'filtra por estado sin importar mayusculas ni tildes de escritura',
    espera: 'state=MIRANDA devuelve A, D y E',
    ejecutar: async () => (await buscar('state=MIRANDA')).titulos,
    verificar: (titulos) => expect(titulos).toEqual(['A Apto Chacao', 'D Habitacion Chacao', 'E Apto reservado']),
  });

  describeCase('busqueda (e2e)', {
    que: 'el rango de precio se aplica dentro de una moneda (USD por defecto), sin mezclar VES',
    espera: '400-600 => A y E; currency=VES => solo C',
    ejecutar: async () => [(await buscar('minPrice=400&maxPrice=600')).titulos, (await buscar('currency=VES')).titulos],
    verificar: ([usd, ves]) => {
      expect(usd).toEqual(['A Apto Chacao', 'E Apto reservado']);
      expect(ves).toEqual(['C Apto Maracaibo']);
    },
  });

  describeCase('busqueda (e2e)', {
    que: 'filtra por minimo de habitaciones y por tipo',
    espera: 'bedrooms>=3 => A y B; type=HABITACION => D',
    ejecutar: async () => [(await buscar('bedrooms=3')).titulos, (await buscar('type=HABITACION')).titulos],
    verificar: ([camas, tipo]) => {
      expect(camas).toEqual(['A Apto Chacao', 'B Casa Valencia']);
      expect(tipo).toEqual(['D Habitacion Chacao']);
    },
  });

  describeCase('busqueda (e2e)', {
    que: 'filtra por amenities locales: planta electrica, tanque, fibra optica y vigilancia',
    espera: 'planta => A; tanque => A; fibra+vigilancia => B; fibra sola => B y C',
    ejecutar: async () => [
      (await buscar('hasGenerator=true')).titulos,
      (await buscar('hasWaterTank=true')).titulos,
      (await buscar('hasFiberOptic=true&hasSecurity=true')).titulos,
      (await buscar('hasFiberOptic=true')).titulos,
    ],
    verificar: ([planta, tanque, fibraYVigilancia, fibra]) => {
      expect(planta).toEqual(['A Apto Chacao']);
      expect(tanque).toEqual(['A Apto Chacao']);
      expect(fibraYVigilancia).toEqual(['B Casa Valencia']);
      expect(fibra).toEqual(['B Casa Valencia', 'C Apto Maracaibo']);
    },
  });

  describeCase('busqueda (e2e)', {
    que: 'hasGenerator=false significa "me da igual", no "sin planta"',
    espera: 'devuelve las mismas 5 propiedades que sin filtro',
    ejecutar: async () => (await buscar('hasGenerator=false')).titulos.length,
    verificar: (cantidad) => expect(cantidad).toBe(5),
  });

  describeCase('busqueda (e2e)', {
    que: 'filtra por la caja visible del mapa (bounding box) sobre Caracas',
    espera: 'A, D y E (Valencia y Maracaibo quedan fuera)',
    ejecutar: async () => (await buscar('swLat=10.3&swLng=-67.2&neLat=10.7&neLng=-66.6')).titulos,
    verificar: (titulos) => expect(titulos).toEqual(['A Apto Chacao', 'D Habitacion Chacao', 'E Apto reservado']),
  });

  describeCase('busqueda (e2e)', {
    que: 'el texto libre busca en titulo, descripcion, urbanizacion y municipio',
    espera: 'q=palos => A; q=valencia => B',
    ejecutar: async () => [(await buscar('q=palos')).titulos, (await buscar('q=valencia')).titulos],
    verificar: ([palos, valencia]) => {
      expect(palos).toEqual(['A Apto Chacao']);
      expect(valencia).toEqual(['B Casa Valencia']);
    },
  });

  describeCase('busqueda (e2e)', {
    que: 'ordena por precio y pagina los resultados',
    espera: 'de menor a mayor: D(150), A(450); limit=2 trae 2 de 5 con total 5',
    ejecutar: async () => {
      const { res } = await buscar('sort=price_asc&limit=2&page=1');
      const segunda = await buscar('sort=price_asc&limit=2&page=2');
      return { primera: res.body.items.map((i: { title: string }) => i.title.charAt(0)), total: res.body.total, segunda: segunda.res.body.items.length };
    },
    verificar: ({ primera, total, segunda }) => {
      expect(primera).toEqual(['D', 'A']);
      expect(total).toBe(5);
      expect(segunda).toBe(2);
    },
    describirObtenido: ({ primera, total, segunda }) => `pagina 1: ${primera.join(',')}; total ${total}; pagina 2 trae ${segunda}`,
  });

  describeCase('busqueda (e2e)', {
    que: 'rechaza filtros invalidos (texto donde va un numero, limite excesivo)',
    espera: '400 en ambos',
    ejecutar: async () => [(await t.web('get')('/api/properties?bedrooms=abc')).status, (await t.web('get')('/api/properties?limit=1000')).status],
    verificar: (estados) => expect(estados).toEqual([400, 400]),
  });

  describeCase('busqueda (e2e)', {
    que: 'la respuesta publica no filtra datos internos (dueno, agencia, claves de storage)',
    espera: 'ningun campo ownerUserId, agencyId, assignedAgentId ni *Key',
    ejecutar: async () => JSON.stringify((await t.web('get')(`/api/properties/${ids.A}`)).body),
    verificar: (json) => {
      for (const prohibido of ['ownerUserId', 'agencyId', 'assignedAgentId', 'originalKey', 'thumbKey', 'importJobId']) {
        expect(json).not.toContain(prohibido);
      }
    },
    describirObtenido: (json) => `${json.length} caracteres revisados`,
  });

  describeCase('detalle (e2e)', {
    que: 'la ficha de una propiedad pausada no existe para un visitante',
    espera: '404; la alquilada si abre (enlaces compartidos)',
    ejecutar: async () => [(await t.web('get')(`/api/properties/${ids.F}`)).status, (await t.web('get')(`/api/properties/${ids.G}`)).status],
    verificar: (estados) => expect(estados).toEqual([404, 200]),
  });

  describeCase('detalle (e2e)', {
    que: 'un id que no es UUID responde 400, uno inexistente 404',
    espera: '[400, 404]',
    ejecutar: async () => [
      (await t.web('get')('/api/properties/no-es-un-uuid')).status,
      (await t.web('get')('/api/properties/00000000-0000-4000-8000-000000000000')).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 404]),
  });

  describeCase('mapa (e2e)', {
    que: 'con zoom alejado y muchas propiedades agrupa los pines; al acercarse los muestra sueltos',
    espera: 'zoom 8 => menos marcadores que propiedades (con clusters); zoom 17 => un pin por propiedad',
    ejecutar: async () => {
      const dueno = await userByEmail(t, 'dueno@correo.com');
      await t.prisma.property.createMany({
        data: Array.from({ length: 40 }, (_, i) => ({
          title: `Masa ${i}`,
          description: 'Propiedad de relleno para probar el mapa y los clusters.',
          type: 'APARTAMENTO' as const,
          priceAmount: 200 + i,
          state: 'Miranda',
          municipality: 'Chacao',
          latitude: 10.49 + (i % 8) * 0.0004,
          longitude: -66.85 + Math.floor(i / 8) * 0.0004,
          ownerUserId: dueno.id,
          publishedAt: new Date(),
        })),
      });
      const lejos = await t.web('get')('/api/properties/map?zoom=8');
      const cerca = await t.web('get')('/api/properties/map?zoom=17');
      return { lejos: lejos.body, cerca: cerca.body };
    },
    verificar: ({ lejos, cerca }) => {
      expect(lejos.total).toBe(45);
      expect(lejos.markers.length).toBeLessThan(45);
      expect(lejos.markers.some((m: { kind: string }) => m.kind === 'cluster')).toBe(true);
      expect(cerca.markers).toHaveLength(45);
      expect(cerca.markers.every((m: { kind: string }) => m.kind === 'point')).toBe(true);
    },
    describirObtenido: ({ lejos, cerca }) => `zoom 8: ${lejos.markers.length} marcadores (${lejos.total} propiedades); zoom 17: ${cerca.markers.length} pines`,
  });
});
