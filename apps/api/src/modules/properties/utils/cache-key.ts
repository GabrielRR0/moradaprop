/**
 * Clave de cache para una busqueda: los mismos filtros siempre dan la misma clave,
 * sin importar el orden en que llegaron ni los que vienen vacios.
 *   cacheKey('map', { zoom: 10, state: 'Zulia' })  ->  'properties:map:{"state":"Zulia","zoom":10}'
 */
export function cacheKey(kind: 'search' | 'map', filters: object): string {
  const clean = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return `properties:${kind}:${JSON.stringify(Object.fromEntries(clean))}`;
}
