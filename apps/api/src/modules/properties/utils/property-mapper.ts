import type { StorageProvider } from '@/common/storage';
import { DbSupport } from '@/support/db';
import type { PropertyCardResource, PropertyDetailResource, PropertyImageResource } from '../contracts/resources';

/** Una sola imagen (la portada) para tarjetas y listados. */
export const cardInclude = {
  images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1 },
} satisfies DbSupport.Prisma.PropertyInclude;

/** Galeria completa + quien la publica. */
export const detailInclude = {
  images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }] },
  agency: { select: { id: true, name: true, logoUrl: true, phone: true, whatsapp: true } },
  owner: { select: { id: true, name: true, avatarUrl: true, phone: true } },
  assignedAgent: { select: { phone: true } },
} satisfies DbSupport.Prisma.PropertyInclude;

type CardRow = DbSupport.Prisma.PropertyGetPayload<{ include: typeof cardInclude }>;
type DetailRow = DbSupport.Prisma.PropertyGetPayload<{ include: typeof detailInclude }>;
type ImageRow = CardRow['images'][number];

const toImage = (image: ImageRow, storage: StorageProvider): PropertyImageResource => ({
  id: image.id,
  isCover: image.isCover,
  position: image.position,
  thumb: storage.publicUrl(image.thumbKey),
  medium: storage.publicUrl(image.mediumKey),
  hd: storage.publicUrl(image.hdKey),
});

/** Campos comunes de tarjeta. Nunca incluye ownerUserId, assignedAgentId ni claves de storage. */
export function toCard(property: CardRow, storage: StorageProvider): PropertyCardResource {
  return {
    id: property.id,
    title: property.title,
    type: property.type,
    status: property.status,
    // "En Proceso de Reserva": la propiedad reservada no desaparece, se marca.
    inReservation: property.status === 'RESERVADA',
    acceptsVisits: property.acceptsVisits,
    priceAmount: Number(property.priceAmount),
    currency: property.currency,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpots: property.parkingSpots,
    areaM2: property.areaM2 === null ? null : Number(property.areaM2),
    state: property.state,
    municipality: property.municipality,
    urbanization: property.urbanization,
    latitude: property.latitude,
    longitude: property.longitude,
    hasGenerator: property.hasGenerator,
    hasWaterTank: property.hasWaterTank,
    hasFiberOptic: property.hasFiberOptic,
    hasSecurity: property.hasSecurity,
    cover: property.images[0] ? toImage(property.images[0], storage) : null,
    publishedAt: property.publishedAt,
  };
}

export function toDetail(
  property: DetailRow,
  storage: StorageProvider,
  extras: { isFavorite: boolean; canManage: boolean; hasScheduledVisit: boolean; whatsapp: string | null },
): PropertyDetailResource {
  return {
    ...toCard({ ...property, images: property.images.slice(0, 1) }, storage),
    description: property.description,
    address: property.address,
    furnished: property.furnished,
    petsAllowed: property.petsAllowed,
    images: property.images.map((image) => toImage(image, storage)),
    publishedBy: property.agency
      ? { type: 'agency' as const, id: property.agency.id, name: property.agency.name, logoUrl: property.agency.logoUrl }
      : { type: 'owner' as const, id: property.owner.id, name: property.owner.name, logoUrl: property.owner.avatarUrl },
    isFavorite: extras.isFavorite,
    hasScheduledVisit: extras.hasScheduledVisit,
    whatsapp: extras.whatsapp,
    canManage: extras.canManage,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}
