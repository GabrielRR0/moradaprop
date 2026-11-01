import type { DbSupport } from '@/support/db';

/** La propiedad de la cita, resumida. */
export interface AppointmentPropertyResource {
  id: string;
  title: string;
  status: DbSupport.PropertyStatus;
  /** false = reservada del todo: ya no recibe solicitudes. */
  acceptsVisits: boolean;
  /** Urbanización y municipio, ya unidos en un texto. */
  location: string;
  /** Miniatura de la portada, o null si no tiene fotos. */
  thumb: string | null;
}

/** Vista previa del último mensaje, para la bandeja. */
export interface AppointmentPreviewResource {
  kind: DbSupport.MessageKind;
  /** El texto; en un ACUERDO es la fecha acordada en ISO. */
  body: string;
  at: Date;
  /** true si lo escribió el cliente (así cada pantalla sabe si fue "tú" o "el otro"). */
  fromClient: boolean;
}

/** Lo que ve el CLIENTE: su solicitud y la respuesta, sin datos internos del dueño. */
export interface AppointmentClientResource {
  id: string;
  type: DbSupport.AppointmentType;
  status: DbSupport.AppointmentStatus;
  /** Fecha de la visita ya acordada; null mientras no haya una. */
  scheduledAt: Date | null;
  message: string | null;
  preferredChannel: DbSupport.ContactChannel;
  /** Mensaje de quien respondió. */
  responseNote: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  /** Último mensaje de la conversación, o null si no hay. */
  lastMessage: AppointmentPreviewResource | null;
  /** Hay algo nuevo que esta persona todavía no abrió. */
  unread: boolean;
  property: AppointmentPropertyResource;
}

/** Página de solicitudes del cliente. */
export interface AppointmentClientListResource {
  items: AppointmentClientResource[];
  total: number;
  page: number;
  limit: number;
}
