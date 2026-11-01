import type { StorageProvider } from '@/common/storage';
import { DbSupport } from '@/support/db';
import type { AppointmentClientResource, AppointmentLeadResource, AppointmentPropertyResource } from '../contracts/resources';
import type { Side } from './conversation';

/** Lo que se lee de la propiedad en toda cita (la conversacion le suma quien la publica). */
export const propertySelect = {
  id: true,
  title: true,
  status: true,
  acceptsVisits: true,
  municipality: true,
  urbanization: true,
  images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { thumbKey: true } },
} satisfies DbSupport.Prisma.PropertySelect;

export const appointmentInclude = {
  property: { select: propertySelect },
  client: { select: { id: true, name: true, email: true } },
  // Solo el ultimo mensaje: alimenta la vista previa y el aviso de "nuevo" de la bandeja.
  messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, kind: true, body: true, authorId: true, createdAt: true } },
} satisfies DbSupport.Prisma.AppointmentInclude;

type Row = DbSupport.Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;
type PropertyRow = DbSupport.Prisma.PropertyGetPayload<{ select: typeof propertySelect }>;

export const toPropertySummary = (property: PropertyRow, storage: StorageProvider): AppointmentPropertyResource => ({
  id: property.id,
  title: property.title,
  status: property.status,
  acceptsVisits: property.acceptsVisits,
  location: [property.urbanization, property.municipality].filter(Boolean).join(', '),
  thumb: property.images[0] ? storage.publicUrl(property.images[0].thumbKey) : null,
});

/** Hay un mensaje de la otra parte que esta persona todavia no abrio. */
function isUnread(row: Row, side: Side): boolean {
  const last = row.messages[0];
  if (!last) return false;
  const fromClient = last.authorId === row.clientId;
  const seen = side === 'client' ? row.clientSeenAt : row.managerSeenAt;
  const incoming = side === 'client' ? !fromClient : fromClient;
  return incoming && (!seen || last.createdAt > seen);
}

const toBase = (row: Row, storage: StorageProvider, side: Side): AppointmentClientResource => {
  const last = row.messages[0];
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    scheduledAt: row.scheduledAt,
    message: row.message,
    preferredChannel: row.preferredChannel,
    responseNote: row.responseNote,
    respondedAt: row.respondedAt,
    createdAt: row.createdAt,
    lastMessage: last ? { kind: last.kind, body: last.body, at: last.createdAt, fromClient: last.authorId === row.clientId } : null,
    unread: isUnread(row, side),
    property: toPropertySummary(row.property, storage),
  };
};

/** Lo que ve el CLIENTE: su solicitud y la respuesta, sin datos internos del dueno. */
export const toClientView = (row: Row, storage: StorageProvider): AppointmentClientResource => toBase(row, storage, 'client');

/** Lo que ve QUIEN GESTIONA la propiedad: ademas, los datos de contacto del solicitante (el lead). */
export const toLeadView = (row: Row, storage: StorageProvider): AppointmentLeadResource => ({
  ...toBase(row, storage, 'manager'),
  contact: {
    name: row.contactName,
    phone: row.contactPhone,
    email: row.client.email,
    channel: row.preferredChannel,
  },
});
