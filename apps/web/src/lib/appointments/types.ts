/** Tipos de las solicitudes y su conversacion. Reflejan `/api/appointments` (fechas como texto ISO). */

/** Lo que el cliente quiere al escribirle al anunciante. RESERVA es el apartado. */
export type AppointmentType = 'INTERES' | 'PREGUNTA' | 'VISITA' | 'RESERVA';

export type AppointmentStatus = 'PENDIENTE' | 'ABIERTA' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA';

export type MessageKind = 'TEXTO' | 'PROPUESTA' | 'ACUERDO';
export type SlotStatus = 'PROPUESTA' | 'ACEPTADA' | 'DESCARTADA';

export interface AppointmentProperty {
  id: string;
  title: string;
  status: 'PUBLICADA' | 'RESERVADA' | 'ALQUILADA' | 'PAUSADA';
  /** false = reservada del todo: ya no recibe solicitudes. */
  acceptsVisits: boolean;
  location: string;
  thumb: string | null;
}

export interface AppointmentPreview {
  kind: MessageKind;
  /** El texto; en un ACUERDO es la fecha acordada en ISO. */
  body: string;
  at: string;
  fromClient: boolean;
}

/** Una solicitud en la bandeja (la de quien pidio y la de quien recibe tienen la misma forma). */
export interface AppointmentSummary {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  /** Fecha de la visita ya acordada. */
  scheduledAt: string | null;
  lastMessage: AppointmentPreview | null;
  /** Hay algo nuevo que esta persona todavia no abrio. */
  unread: boolean;
  property: AppointmentProperty;
  /** Solo lo ve quien gestiona la propiedad. */
  contact?: { name: string; phone: string | null; email: string };
}

export interface AppointmentPage {
  items: AppointmentSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface Slot {
  id: string;
  startsAt: string;
  status: SlotStatus;
}

export interface ThreadMessage {
  id: string;
  kind: MessageKind;
  body: string;
  fromClient: boolean;
  createdAt: string;
  /** Cuándo se editó por última vez; null si nunca. */
  editedAt: string | null;
  /** Hasta cuándo quien consulta puede editarlo (3 minutos desde que lo envió); null si no puede. */
  editableUntil: string | null;
  /** Solo en una PROPUESTA. */
  slots: Slot[];
}

/** La conversacion completa, vista por el cliente o por quien gestiona la propiedad. */
export interface Thread {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string | null;
  /** Hora del servidor al armar la respuesta (para contar los 3 minutos de edición con su reloj, no el del usuario). */
  serverTime: string;
  viewer: 'client' | 'manager';
  /** Con quien se habla. */
  counterpart: string;
  /** Se puede seguir escribiendo. */
  open: boolean;
  property: AppointmentProperty;
  /** Datos del interesado: solo quien gestiona la propiedad. */
  contact: { name: string; phone: string | null; email: string } | null;
  messages: ThreadMessage[];
}

/** Estado en el que quien gestiona deja la propiedad desde la conversacion. */
export type PropertyAvailability = 'free' | 'reserved-open' | 'reserved-closed';
