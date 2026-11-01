/** Tipos del mapa y de las propiedades. Reflejan las respuestas de `GET /api/properties` y `/map`. */

export type PropertyStatus = 'PUBLICADA' | 'RESERVADA' | 'ALQUILADA' | 'PAUSADA';
export type Currency = 'USD' | 'VES';

export interface PropertyCover {
  thumb: string;
  medium: string;
  hd: string;
}

/** Tarjeta de propiedad (lo que muestran la lista y la ficha flotante). */
export interface PropertyCard {
  id: string;
  title: string;
  type: string;
  status: PropertyStatus;
  inReservation: boolean;
  /** false = reservada del todo: ya no recibe consultas ni citas (si el API no lo dice, se asume que si). */
  acceptsVisits?: boolean;
  priceAmount: number;
  currency: Currency;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  areaM2: number | null;
  state: string;
  municipality: string;
  urbanization: string | null;
  latitude: number;
  longitude: number;
  hasGenerator: boolean;
  hasWaterTank: boolean;
  hasFiberOptic: boolean;
  hasSecurity: boolean;
  cover: PropertyCover | null;
  publishedAt: string | null;
}

/** Foto de la galeria (la portada es la de `isCover`). */
export interface PropertyImage extends PropertyCover {
  id: string;
  isCover: boolean;
  position: number;
}

/** Ficha completa: la tarjeta mas lo que solo se ve al abrir la propiedad (`GET /api/properties/:id`). */
export interface PropertyDetail extends PropertyCard {
  description: string | null;
  address: string | null;
  furnished: boolean;
  petsAllowed: boolean;
  images: PropertyImage[];
  /** Ya hay una visita acordada (no se dice el dia). */
  hasScheduledVisit?: boolean;
  /** WhatsApp del anunciante; el API solo lo entrega con sesion. */
  whatsapp?: string | null;
  /** Solo si hay sesion. */
  isFavorite?: boolean;
  canManage?: boolean;
}

export interface PropertyPage {
  items: PropertyCard[];
  total: number;
  page: number;
  limit: number;
}

/** Caja visible del mapa (esquina suroeste y noreste). */
export interface Bounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

/** Un pin del mapa: una propiedad suelta. */
export interface PointMarker {
  kind: 'point';
  id: string;
  latitude: number;
  longitude: number;
  priceAmount: number;
  currency: Currency;
  status: PropertyStatus;
}

/** Un grupo de propiedades cercanas (se ve como un círculo con el número). */
export interface ClusterMarker {
  kind: 'cluster';
  count: number;
  latitude: number;
  longitude: number;
  ids: string[];
  minPrice: number;
}

export type MapMarker = PointMarker | ClusterMarker;

export interface MapResult {
  zoom: number;
  total: number;
  truncated: boolean;
  markers: MapMarker[];
}

/** Vista del mapa: centro y zoom de MapLibre. */
export interface MapView {
  lat: number;
  lng: number;
  zoom: number;
}
