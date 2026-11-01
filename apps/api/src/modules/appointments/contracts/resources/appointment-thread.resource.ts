import type { DbSupport } from '@/support/db';
import type { AppointmentPropertyResource } from './appointment-client.resource';
import type { AppointmentContactResource } from './appointment-lead.resource';

/** Una fecha de visita ofrecida por quien gestiona la propiedad. */
export interface AppointmentSlotResource {
  id: string;
  startsAt: Date;
  status: DbSupport.SlotStatus;
}

/** Un mensaje de la conversación. */
export interface AppointmentMessageResource {
  id: string;
  kind: DbSupport.MessageKind;
  /** El texto; en un ACUERDO es la fecha acordada en ISO. */
  body: string;
  /** true si lo escribió el cliente. */
  fromClient: boolean;
  createdAt: Date;
  /** Cuándo se editó por última vez; null si nunca. */
  editedAt: Date | null;
  /** Hasta cuándo quien consulta puede editarlo (3 minutos desde que lo envió); null si no puede. */
  editableUntil: Date | null;
  /** Solo en una PROPUESTA: las fechas ofrecidas. */
  slots: AppointmentSlotResource[];
}

/** La conversación completa de una solicitud, vista por el cliente o por quien gestiona la propiedad. */
export interface AppointmentThreadResource {
  id: string;
  type: DbSupport.AppointmentType;
  status: DbSupport.AppointmentStatus;
  /** Fecha de la visita ya acordada; null mientras no haya una. */
  scheduledAt: Date | null;
  /** Hora del servidor al armar la respuesta: la pantalla la usa para contar los 3 minutos sin depender de su propio reloj. */
  serverTime: Date;
  /** Quién la mira: define qué acciones tiene a la mano. */
  viewer: 'client' | 'manager';
  /** Con quién se habla: el anunciante (para el cliente) o el interesado (para quien gestiona). */
  counterpart: string;
  /** Se puede seguir escribiendo (no está cerrada, cancelada ni rechazada). */
  open: boolean;
  property: AppointmentPropertyResource;
  /** Datos de contacto del interesado; solo los ve quien gestiona. */
  contact: AppointmentContactResource | null;
  messages: AppointmentMessageResource[];
}
