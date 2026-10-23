export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  priceAmount: number;
  currency: string;
  status: string;
}

export type MapMarker =
  | { kind: 'point'; point: MapPoint }
  | { kind: 'cluster'; count: number; latitude: number; longitude: number; ids: string[]; minPrice: number };

/** Desde este zoom se muestra cada propiedad por separado. */
export const POINTS_FROM_ZOOM = 15;
/** Si hay pocos resultados tampoco se agrupa. */
const MAX_POINTS_WITHOUT_CLUSTER = 30;

/**
 * Agrupa pines por cuadricula: mientras mas lejos el zoom, mas grande la celda.
 * Es la version "simple" (sin PostGIS): cuando haya miles de propiedades, esta funcion se
 * reemplaza por ST_ClusterDBSCAN / ST_SnapToGrid y nada fuera de este archivo cambia.
 */
export function clusterPoints(points: MapPoint[], zoom: number): MapMarker[] {
  if (zoom >= POINTS_FROM_ZOOM || points.length <= MAX_POINTS_WITHOUT_CLUSTER) {
    return points.map((point) => ({ kind: 'point', point }));
  }

  // Celda en grados: a zoom 1 ~ 45 grados, se reduce a la mitad por cada nivel. ~60px por celda.
  const cell = 360 / 2 ** zoom / 6;
  const cells = new Map<string, MapPoint[]>();
  for (const point of points) {
    const key = `${Math.floor(point.latitude / cell)}:${Math.floor(point.longitude / cell)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(point);
    else cells.set(key, [point]);
  }

  return [...cells.values()].map((group): MapMarker => {
    if (group.length === 1) return { kind: 'point', point: group[0] };
    const sum = group.reduce((acc, p) => ({ lat: acc.lat + p.latitude, lng: acc.lng + p.longitude }), { lat: 0, lng: 0 });
    return {
      kind: 'cluster',
      count: group.length,
      latitude: sum.lat / group.length,
      longitude: sum.lng / group.length,
      ids: group.length <= 50 ? group.map((p) => p.id) : [],
      minPrice: Math.min(...group.map((p) => p.priceAmount)),
    };
  });
}
