import type { PropertyFiltersDto } from '../contracts/dto/search-properties.dto';
import { DbSupport } from '@/support/db';

/** Estados que aparecen en busquedas publicas: la reservada sigue visible con su insignia. */
export const PUBLIC_SEARCH_STATUSES: DbSupport.PropertyStatus[] = [DbSupport.PropertyStatus.PUBLICADA, DbSupport.PropertyStatus.RESERVADA];

/** La alquilada ya no se ofrece, pero su ficha sigue abierta (enlaces compartidos). */
export const PUBLIC_DETAIL_STATUSES: DbSupport.PropertyStatus[] = [...PUBLIC_SEARCH_STATUSES, DbSupport.PropertyStatus.ALQUILADA];

/** Filtros publicos (busqueda y mapa) convertidos al "where" de Prisma. */
export function buildPropertyWhere(f: PropertyFiltersDto): DbSupport.Prisma.PropertyWhereInput {
  const hasPrice = f.minPrice !== undefined || f.maxPrice !== undefined;
  const insensitive = (value: string) => ({ equals: value, mode: 'insensitive' as const });

  return {
    status: { in: PUBLIC_SEARCH_STATUSES },
    state: f.state ? insensitive(f.state) : undefined,
    municipality: f.municipality ? insensitive(f.municipality) : undefined,
    urbanization: f.urbanization ? { contains: f.urbanization, mode: 'insensitive' } : undefined,
    type: f.type,
    // El rango de precio solo tiene sentido dentro de una moneda: USD por defecto.
    currency: f.currency ?? (hasPrice ? 'USD' : undefined),
    priceAmount: hasPrice ? { gte: f.minPrice, lte: f.maxPrice } : undefined,
    bedrooms: f.bedrooms === undefined ? undefined : { gte: f.bedrooms },
    bathrooms: f.bathrooms === undefined ? undefined : { gte: f.bathrooms },
    parkingSpots: f.parkingSpots === undefined ? undefined : { gte: f.parkingSpots },
    // Una amenity se filtra solo cuando se pide (true); false significa "me da igual".
    hasGenerator: f.hasGenerator ? true : undefined,
    hasWaterTank: f.hasWaterTank ? true : undefined,
    hasFiberOptic: f.hasFiberOptic ? true : undefined,
    hasSecurity: f.hasSecurity ? true : undefined,
    latitude: f.swLat !== undefined && f.neLat !== undefined ? { gte: f.swLat, lte: f.neLat } : undefined,
    longitude: f.swLng !== undefined && f.neLng !== undefined ? { gte: f.swLng, lte: f.neLng } : undefined,
    OR: f.q
      ? [
          { title: { contains: f.q, mode: 'insensitive' } },
          { description: { contains: f.q, mode: 'insensitive' } },
          { urbanization: { contains: f.q, mode: 'insensitive' } },
          { municipality: { contains: f.q, mode: 'insensitive' } },
        ]
      : undefined,
  };
}
