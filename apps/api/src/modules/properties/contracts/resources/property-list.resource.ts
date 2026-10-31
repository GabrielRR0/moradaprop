import type { PropertyCardResource } from './property-card.resource';

/** Listado paginado de tarjetas (búsqueda y "mis propiedades"). */
export interface PropertyListResource {
  items: PropertyCardResource[];
  /** Total de resultados en todas las páginas. */
  total: number;
  page: number;
  limit: number;
}
