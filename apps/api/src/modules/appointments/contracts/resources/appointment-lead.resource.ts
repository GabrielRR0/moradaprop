import type { DbSupport } from '@/support/db';
import type { AppointmentClientResource } from './appointment-client.resource';

/** Datos de contacto de quien pidió la cita. Solo los ve quien gestiona la propiedad. */
export interface AppointmentContactResource {
  name: string;
  phone: string | null;
  email: string;
  channel: DbSupport.ContactChannel;
}

/** Lo que ve QUIEN GESTIONA la propiedad: la solicitud más los datos de contacto del solicitante (el lead). */
export interface AppointmentLeadResource extends AppointmentClientResource {
  contact: AppointmentContactResource;
}

/** Página de leads. */
export interface AppointmentLeadListResource {
  items: AppointmentLeadResource[];
  total: number;
  page: number;
  limit: number;
}
