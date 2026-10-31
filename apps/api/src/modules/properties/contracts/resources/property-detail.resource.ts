import type { PropertyCardResource } from './property-card.resource';
import type { PropertyImageResource } from './property-image.resource';

/** Quién publica la propiedad: una agencia o un propietario particular. */
export interface PropertyPublisherResource {
  type: 'agency' | 'owner';
  id: string;
  name: string;
  logoUrl: string | null;
}

/** Ficha completa: la tarjeta más descripción, galería, quién publica y qué puede hacer quien la ve. */
export interface PropertyDetailResource extends PropertyCardResource {
  description: string;
  address: string | null;
  furnished: boolean;
  petsAllowed: boolean;
  images: PropertyImageResource[];
  publishedBy: PropertyPublisherResource;
  /** La tiene en favoritos quien consulta (false si no hay sesión). */
  isFavorite: boolean;
  /** Quien consulta puede editarla o gestionarla. */
  canManage: boolean;
  createdAt: Date;
  updatedAt: Date;
}
