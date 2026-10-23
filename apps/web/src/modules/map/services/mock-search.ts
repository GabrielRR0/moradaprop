import { clusterPoints } from './clusters';
import type { PropertyFilters } from './filters';
import { MOCK_PROPERTIES } from './mock-data';
import type { Bounds, MapResult, PointMarker, PropertyCard, PropertyPage } from './types';

const norm = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Mismos filtros que `buildWhere` del backend, sobre los datos de ejemplo. */
function matches(p: PropertyCard, f: PropertyFilters, bounds?: Bounds): boolean {
  if (p.status !== 'PUBLICADA' && p.status !== 'RESERVADA') return false;
  if (f.state && norm(p.state) !== norm(f.state)) return false;
  if (f.municipality && norm(p.municipality) !== norm(f.municipality)) return false;
  if (f.type && p.type !== f.type) return false;
  if (f.minPrice !== undefined && p.priceAmount < f.minPrice) return false;
  if (f.maxPrice !== undefined && p.priceAmount > f.maxPrice) return false;
  if (f.bedrooms !== undefined && p.bedrooms < f.bedrooms) return false;
  if (f.bathrooms !== undefined && p.bathrooms < f.bathrooms) return false;
  if (f.parkingSpots !== undefined && p.parkingSpots < f.parkingSpots) return false;
  if (f.hasGenerator && !p.hasGenerator) return false;
  if (f.hasWaterTank && !p.hasWaterTank) return false;
  if (f.hasFiberOptic && !p.hasFiberOptic) return false;
  if (f.hasSecurity && !p.hasSecurity) return false;
  if (f.q) {
    const haystack = norm(`${p.title} ${p.urbanization ?? ''} ${p.municipality}`);
    if (!haystack.includes(norm(f.q))) return false;
  }
  if (bounds) {
    if (p.latitude < bounds.swLat || p.latitude > bounds.neLat) return false;
    if (p.longitude < bounds.swLng || p.longitude > bounds.neLng) return false;
  }
  return true;
}

function sorted(items: PropertyCard[], sort: PropertyFilters['sort']): PropertyCard[] {
  const copy = [...items];
  if (sort === 'price_asc') return copy.sort((a, b) => a.priceAmount - b.priceAmount);
  if (sort === 'price_desc') return copy.sort((a, b) => b.priceAmount - a.priceAmount);
  return copy.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function mockSearch(
  filters: PropertyFilters,
  bounds: Bounds | undefined,
  page: number,
  limit: number,
): PropertyPage {
  const all = sorted(
    MOCK_PROPERTIES.filter((p) => matches(p, filters, bounds)),
    filters.sort,
  );
  return { items: all.slice((page - 1) * limit, page * limit), total: all.length, page, limit };
}

export function mockMap(
  filters: PropertyFilters,
  bounds: Bounds | undefined,
  zoom: number,
): MapResult {
  const points: PointMarker[] = MOCK_PROPERTIES.filter((p) => matches(p, filters, bounds)).map(
    (p) => ({
      kind: 'point',
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      priceAmount: p.priceAmount,
      currency: p.currency,
      status: p.status,
    }),
  );
  return { zoom, total: points.length, truncated: false, markers: clusterPoints(points, zoom) };
}

export function mockDetail(id: string): PropertyCard | null {
  return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
}
