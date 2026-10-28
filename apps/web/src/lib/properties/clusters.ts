import type { MapMarker, PointMarker } from './types';

/** Desde este zoom (escala del API) se muestra cada propiedad por separado. */
const POINTS_FROM_ZOOM = 15;
const MAX_POINTS_WITHOUT_CLUSTER = 30;

/**
 * Agrupa pines por cuadricula, igual que `clusterPoints` del backend (apps/api .../utils/clusters.ts).
 * Solo lo usan los datos de ejemplo: con el API real el agrupamiento lo hace el servidor.
 */
export function clusterPoints(points: PointMarker[], zoom: number): MapMarker[] {
  if (zoom >= POINTS_FROM_ZOOM || points.length <= MAX_POINTS_WITHOUT_CLUSTER) return points;

  const cell = 360 / 2 ** zoom / 6;
  const cells = new Map<string, PointMarker[]>();
  for (const point of points) {
    const key = `${Math.floor(point.latitude / cell)}:${Math.floor(point.longitude / cell)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(point);
    else cells.set(key, [point]);
  }

  return [...cells.values()].map((group): MapMarker => {
    if (group.length === 1) return group[0];
    const lat = group.reduce((sum, p) => sum + p.latitude, 0) / group.length;
    const lng = group.reduce((sum, p) => sum + p.longitude, 0) / group.length;
    return {
      kind: 'cluster',
      count: group.length,
      latitude: lat,
      longitude: lng,
      ids: group.length <= 50 ? group.map((p) => p.id) : [],
      minPrice: Math.min(...group.map((p) => p.priceAmount)),
    };
  });
}
