import type { StorageProvider } from '@/common/storage';
import { DbSupport } from '@/support/db';
import type { AppointmentClientResource, AppointmentLeadResource } from '../contracts/resources';

export const appointmentInclude = {
  property: {
    select: {
      id: true,
      title: true,
      status: true,
      municipality: true,
      urbanization: true,
      images: { orderBy: [{ isCover: 'desc' }, { position: 'asc' }], take: 1, select: { thumbKey: true } },
    },
  },
  client: { select: { id: true, name: true, email: true } },
} satisfies DbSupport.Prisma.AppointmentInclude;

type Row = DbSupport.Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

const toBase = (row: Row, storage: StorageProvider): AppointmentClientResource => ({
  id: row.id,
  type: row.type,
  status: row.status,
  scheduledAt: row.scheduledAt,
  message: row.message,
  preferredChannel: row.preferredChannel,
  responseNote: row.responseNote,
  respondedAt: row.respondedAt,
  createdAt: row.createdAt,
  property: {
    id: row.property.id,
    title: row.property.title,
    status: row.property.status,
    location: [row.property.urbanization, row.property.municipality].filter(Boolean).join(', '),
    thumb: row.property.images[0] ? storage.publicUrl(row.property.images[0].thumbKey) : null,
  },
});

/** Lo que ve el CLIENTE: su solicitud y la respuesta, sin datos internos del dueno. */
export const toClientView = (row: Row, storage: StorageProvider): AppointmentClientResource => toBase(row, storage);

/** Lo que ve QUIEN GESTIONA la propiedad: ademas, los datos de contacto del solicitante (el lead). */
export const toLeadView = (row: Row, storage: StorageProvider): AppointmentLeadResource => ({
  ...toBase(row, storage),
  contact: {
    name: row.contactName,
    phone: row.contactPhone,
    email: row.client.email,
    channel: row.preferredChannel,
  },
});
