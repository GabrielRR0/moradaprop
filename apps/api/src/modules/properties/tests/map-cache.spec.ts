import { describeCase } from '../../../../test/support/describe-case';
import { snapBox } from '../utils/bounding-box';
import { cacheKey } from '../utils/cache-key';

describe('cacheKey', () => {
  describeCase('properties', {
    que: 'los mismos filtros dan la misma clave aunque cambie el orden o haya campos vacios',
    espera: 'claves iguales; filtros distintos = claves distintas',
    ejecutar: () => ({
      a: cacheKey('map', { zoom: 10, state: 'Zulia', q: undefined }),
      b: cacheKey('map', { state: 'Zulia', zoom: 10, q: '' }),
      c: cacheKey('map', { state: 'Aragua', zoom: 10 }),
    }),
    verificar: ({ a, b, c }) => {
      expect(a).toBe(b);
      expect(a).not.toBe(c);
    },
    describirObtenido: ({ a }) => a,
  });

  describeCase('properties', {
    que: 'busqueda y mapa no comparten claves',
    espera: 'prefijos distintos',
    ejecutar: () => [cacheKey('search', { state: 'Zulia' }), cacheKey('map', { state: 'Zulia' })],
    verificar: ([search, map]) => expect(search).not.toBe(map),
  });
});

describe('snapBox', () => {
  describeCase('properties', {
    que: 'dos cuadros casi iguales (difieren en decimales) quedan identicos tras ajustarlos',
    espera: 'mismo cuadro; el ajustado contiene al original',
    ejecutar: () => {
      const a = snapBox({ swLat: 10.4971, swLng: -66.8483, neLat: 10.5121, neLng: -66.8311 }, 14);
      const b = snapBox({ swLat: 10.4973, swLng: -66.8481, neLat: 10.5119, neLng: -66.8312 }, 14);
      return { a, b };
    },
    verificar: ({ a, b }) => {
      expect(a).toEqual(b);
      expect(a.swLat).toBeLessThanOrEqual(10.4971);
      expect(a.neLat).toBeGreaterThanOrEqual(10.5121);
      expect(a.swLng).toBeLessThanOrEqual(-66.8483);
      expect(a.neLng).toBeGreaterThanOrEqual(-66.8311);
    },
    describirObtenido: ({ a }) => JSON.stringify(a),
  });

  describeCase('properties', {
    que: 'con un cuadro incompleto (o ninguno) no inventa uno',
    espera: 'la consulta queda igual',
    ejecutar: () => snapBox({ swLat: 10.5, swLng: -66.9 }, 8), // cuadro incompleto
    verificar: (r) => expect(r).toEqual({ swLat: 10.5, swLng: -66.9 }),
  });
});
