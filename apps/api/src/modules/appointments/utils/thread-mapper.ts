import type { StorageProvider } from '@/common/storage';
import { DbSupport } from '@/support/db';
import type { AppointmentThreadResource } from '../contracts/resources';
import { propertySelect, toPropertySummary } from './appointment-mapper';
import { editDeadline, isOpen, type Side } from './conversation';

/** Todo lo que necesita la pantalla de la conversacion: la cita, quien publica la propiedad y los mensajes con sus fechas. */
export const threadInclude = {
  property: { select: { ...propertySelect, agency: { select: { name: true } }, owner: { select: { name: true } } } },
  client: { select: { id: true, name: true, email: true } },
  messages: { orderBy: { createdAt: 'asc' }, include: { slots: { orderBy: { startsAt: 'asc' } } } },
} satisfies DbSupport.Prisma.AppointmentInclude;

export type ThreadRow = DbSupport.Prisma.AppointmentGetPayload<{ include: typeof threadInclude }>;

/** Puede editarlo quien lo escribio, si es texto normal, la conversacion sigue abierta y no pasaron 3 minutos. */
function editableUntil(message: ThreadRow['messages'][number], row: ThreadRow, side: Side, now: Date): Date | null {
  const mine = (message.authorId === row.clientId) === (side === 'client');
  const deadline = editDeadline(message.createdAt);
  return mine && message.kind === 'TEXTO' && isOpen(row.status) && deadline > now ? deadline : null;
}

/** La conversacion ya descifrada, como la ve `side`. El contacto del interesado solo lo ve quien gestiona. */
export function toThread(row: ThreadRow, side: Side, storage: StorageProvider): AppointmentThreadResource {
  const now = new Date();
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    scheduledAt: row.scheduledAt,
    viewer: side,
    counterpart: side === 'client' ? (row.property.agency?.name ?? row.property.owner.name) : row.contactName,
    open: isOpen(row.status),
    property: toPropertySummary(row.property, storage),
    contact:
      side === 'manager'
        ? { name: row.contactName, phone: row.contactPhone, email: row.client.email, channel: row.preferredChannel }
        : null,
    serverTime: now,
    messages: row.messages.map((message) => ({
      id: message.id,
      kind: message.kind,
      body: message.body,
      fromClient: message.authorId === row.clientId,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      editableUntil: editableUntil(message, row, side, now),
      slots: message.slots.map((slot) => ({ id: slot.id, startsAt: slot.startsAt, status: slot.status })),
    })),
  };
}
