/**
 * POLITICAS DE CACHE: el unico lugar donde se decide cuanto dura cada respuesta.
 *
 * Para que una consulta nueva use cache:
 *   1. Agrega una politica aqui (nombre + tiempos).
 *   2. En el service:     this.cache.remember(clave, () => consulta(), CACHE_POLICIES.nombre)
 *   3. En el controller:  @HttpCache('nombre')      (solo si la respuesta es igual para todos los usuarios)
 *
 * Para cambiar cuanto dura algo, cambia el numero aqui y nada mas.
 */
export interface CachePolicy {
  /** Segundos que el SERVIDOR guarda la respuesta (Redis o memoria). */
  serverSeconds: number;
  /** Segundos que el NAVEGADOR o un CDN pueden reutilizarla sin preguntar. */
  browserSeconds: number;
  /** Segundos extra que pueden mostrar la copia vieja mientras piden una nueva (stale-while-revalidate). */
  staleSeconds: number;
}

export const CACHE_POLICIES = {
  /** Busqueda publica con filtros: igual para todos. */
  search: { serverSeconds: 10, browserSeconds: 10, staleSeconds: 30 },
  /** Pines del mapa: se consulta muchisimo y cambia poco, asi que dura un poco mas. */
  map: { serverSeconds: 15, browserSeconds: 15, staleSeconds: 45 },
  /** Alquiler tipico por estado: recorre todas las propiedades y cambia lento. */
  rentStats: { serverSeconds: 300, browserSeconds: 300, staleSeconds: 600 },
} satisfies Record<string, CachePolicy>;

export type CachePolicyName = keyof typeof CACHE_POLICIES;

/** Valor de la cabecera Cache-Control que corresponde a una politica. */
export function cacheControlOf(policy: CachePolicy): string {
  return `public, max-age=${policy.browserSeconds}, stale-while-revalidate=${policy.staleSeconds}`;
}
