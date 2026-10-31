import { describeCase } from '@/../test/support/describe-case';
import { clusterPoints, POINTS_FROM_ZOOM, type MapPoint } from '../utils/clusters';

const punto = (i: number, lat: number, lng: number): MapPoint => ({
  id: `p${i}`, latitude: lat, longitude: lng, priceAmount: 100 + i, currency: 'USD', status: 'PUBLICADA',
});
// 60 propiedades en una manzana de Caracas
const manzana = Array.from({ length: 60 }, (_, i) => punto(i, 10.49 + (i % 6) * 0.0003, -66.85 + Math.floor(i / 6) * 0.0003));
const lejos = [punto(100, 10.49, -66.85), punto(101, 10.16, -68.0), punto(102, 10.65, -71.6)];

describe('clusterPoints', () => {
  describeCase('properties', {
    que: 'alejado, agrupa propiedades cercanas en un solo cluster con su cantidad y precio minimo',
    espera: 'las 60 propiedades de una manzana forman 1 cluster de 60 con minPrice 100',
    ejecutar: () => clusterPoints(manzana, 8),
    verificar: (marcadores) => {
      expect(marcadores).toHaveLength(1);
      expect(marcadores[0]).toMatchObject({ kind: 'cluster', count: 60, minPrice: 100 });
    },
    describirObtenido: (m) => `${m.length} marcador: ${JSON.stringify({ ...m[0], ids: undefined })}`,
  });

  describeCase('properties', {
    que: 'cerca (zoom alto) o con pocos resultados, muestra cada propiedad como pin suelto',
    espera: `zoom ${POINTS_FROM_ZOOM}: 60 pines; pocas propiedades a zoom bajo: tambien pines`,
    ejecutar: () => ({ cerca: clusterPoints(manzana, POINTS_FROM_ZOOM), pocas: clusterPoints(lejos, 4) }),
    verificar: ({ cerca, pocas }) => {
      expect(cerca).toHaveLength(60);
      expect(cerca.every((m) => m.kind === 'point')).toBe(true);
      expect(pocas).toHaveLength(3);
    },
  });

  describeCase('properties', {
    que: 'propiedades lejanas entre si no se mezclan en el mismo grupo',
    espera: 'Caracas y Valencia quedan en grupos distintos a zoom 8',
    ejecutar: () => clusterPoints([...manzana, punto(200, 10.16, -68.0), punto(201, 10.1601, -68.0001)], 8),
    verificar: (marcadores) => {
      expect(marcadores.length).toBeGreaterThanOrEqual(2);
      const total = marcadores.reduce((suma, m) => suma + (m.kind === 'cluster' ? m.count : 1), 0);
      expect(total).toBe(62); // ninguna propiedad se pierde
    },
    describirObtenido: (m) => `${m.length} marcadores`,
  });
});
