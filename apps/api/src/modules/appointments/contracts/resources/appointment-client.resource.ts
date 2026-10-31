import type { DbSupport } from '@/support/db';

/** La propiedad de la cita, resumida. */
export interface AppointmentPropertyResource {
  id: string;
  title: string;
  status: DbSupport.PropertyStatus;
  /** Urbanización y municipio, ya unidos en un texto. */
  location: string;
  /** Miniatura de la portada, o null si no tiene fotos. */
  thumb: string | null;
}

/** Lo que ve el CLIENTE: su solicitud y la respuesta, sin datos internos del dueño. */
export interface AppointmentClientResource {
  id: string;
  type: DbSupport.AppointmentType;
  status: DbSupport.AppointmentStatus;
  /** Fecha de la visita; null en un apartado. */
  scheduledAt: Date | null;
  message: string | null;
  preferredChannel: DbSupport.ContactChannel;
  /** Mensaje de quien respondió. */
  responseNote: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  property: AppointmentPropertyResource;
}

/** Página de solicitudes del cliente. */
export interface AppointmentClientListResource {
  items: AppointmentClientResource[];
  total: number;
  page: number;
  limit: number;
}
