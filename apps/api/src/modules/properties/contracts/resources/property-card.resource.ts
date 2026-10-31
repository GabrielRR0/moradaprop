import type { DbSupport } from '@/support/db';
import type { PropertyImageResource } from './property-image.resource';

/** Tarjeta de propiedad: lo que se muestra en listados, favoritos y "mis propiedades". */
export interface PropertyCardResource {
  id: string;
  title: string;
  type: DbSupport.PropertyType;
  status: DbSupport.PropertyStatus;
  /** True si está reservada: sigue visible pero se marca "En proceso de reserva". */
  inReservation: boolean;
  priceAmount: number;
  currency: DbSupport.Currency;
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
  /** Foto de portada, o null si no tiene fotos. */
  cover: PropertyImageResource | null;
  publishedAt: Date | null;
}
