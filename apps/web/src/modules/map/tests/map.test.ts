import { describe, expect, it } from 'vitest';
import { clusterPoints } from '../../../lib/properties/clusters';
import { countActiveFilters, filtersFromParams, filtersToParams } from '../../../lib/properties/filters';
import { MOCK_PROPERTIES } from '../../../lib/properties/mock-data';
import { mockMap, mockSearch } from '../../../lib/properties/mock-search';
import { formatPrice, pinPrice, specsOf } from '../../../lib/properties/format';
import { suggestPlaces } from '../utils/places';

describe('filtros <-> URL', () => {
  it('ida y vuelta sin perder datos', () => {
    // espera: los mismos filtros despues de pasar por la URL
    const filters = {
      maxPrice: 500,
      bedrooms: 2,
      hasGenerator: true,
      hasSecurity: true,
      q: 'Altamira',
    };
    const back = filtersFromParams(filtersToParams(filters));
    expect(back).toEqual(filters);
  });

  it('cuenta solo los filtros que cambian el resultado', () => {
    expect(countActiveFilters({ q: 'x', sort: 'price_asc' })).toBe(0);
    expect(countActiveFilters({ maxPrice: 300, bedrooms: 1, hasFiberOptic: true })).toBe(3);
  });
});

describe('datos de ejemplo', () => {
  it('hay unas 60 propiedades repartidas por Venezuela', () => {
    expect(MOCK_PROPERTIES.length).toBeGreaterThanOrEqual(55);
    expect(new Set(MOCK_PROPERTIES.map((p) => p.state)).size).toBeGreaterThanOrEqual(8);
  });

  it('filtra por servicio y por precio igual que el API', () => {
    const page = mockSearch({ hasGenerator: true, maxPrice: 400 }, undefined, 1, 100);
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.every((p) => p.hasGenerator && p.priceAmount <= 400)).toBe(true);
  });

  it('respeta la caja del mapa', () => {
    const caracas = { swLat: 10.4, swLng: -67.0, neLat: 10.6, neLng: -66.7 };
    const result = mockSearch({}, caracas, 1, 100);
    expect(result.items.every((p) => p.state === 'Miranda')).toBe(true);
  });

  it('agrupa lejos y separa cerca', () => {
    const far = mockMap({}, undefined, 6);
    const near = mockMap({}, undefined, 16);
    expect(far.markers.some((m) => m.kind === 'cluster')).toBe(true);
    expect(near.markers.every((m) => m.kind === 'point')).toBe(true);
    const counted = far.markers.reduce((n, m) => n + (m.kind === 'cluster' ? m.count : 1), 0);
    expect(counted).toBe(far.total);
  });

  it('pocos puntos no se agrupan', () => {
    const points = MOCK_PROPERTIES.slice(0, 5).map((p) => ({
      kind: 'point' as const,
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      priceAmount: p.priceAmount,
      currency: p.currency,
      status: p.status,
    }));
    expect(clusterPoints(points, 5)).toHaveLength(5);
  });
});

describe('buscador de zonas', () => {
  it('sugiere por nombre sin importar tildes ni mayusculas', () => {
    expect(suggestPlaces('merida')[0]?.label).toContain('Mérida');
    expect(suggestPlaces('MARACAI')[0]?.label).toBe('Maracaibo');
    expect(suggestPlaces('a')).toEqual([]);
  });
});

describe('formato', () => {
  it('precios y fichas', () => {
    expect(formatPrice(1200)).toBe('$1.200');
    expect(formatPrice(900, 'VES')).toBe('Bs. 900');
    expect(pinPrice(15000)).toBe('$15k');
    expect(specsOf({ bedrooms: 0, bathrooms: 1, areaM2: 70 } as never)).toBe('1 baño · 70 m²');
  });
});
