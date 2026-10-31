import type { MapMarker } from '../../utils/clusters';

/** Pines del mapa: sueltos si el zoom es alto, agrupados en clusters si está lejos. */
export interface PropertyMapResource {
  zoom: number;
  /** Cantidad de propiedades leídas para esta vista. */
  total: number;
  /** True si había más propiedades que el tope y la lista quedó cortada. */
  truncated: boolean;
  markers: MapMarker[];
}
