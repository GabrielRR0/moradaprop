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
  /** Tiene una visita ya acordada (no se dice el dia: solo que alguien ya la va a ver). */
  hasScheduledVisit: boolean;
  /** WhatsApp del anunciante para escribirle directo; solo se entrega a quien tiene sesion (null si no la hay o no tiene). */
  whatsapp: string | null;
  /** Quien consulta puede editarla o gestionarla. */
  canManage: boolean;
  createdAt: Date;
  updatedAt: Date;
}
