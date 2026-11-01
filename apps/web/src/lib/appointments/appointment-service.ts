import { api } from '@/lib/api';
import type { AppointmentPage, AppointmentSummary, AppointmentType, PropertyAvailability, Thread } from './types';

const BASE = '/appointments';

/** Lo que cada opcion de disponibilidad manda a `PATCH /properties/:id/status`. */
const AVAILABILITY: Record<PropertyAvailability, { status: 'PUBLICADA' | 'RESERVADA'; acceptsVisits?: boolean }> = {
  free: { status: 'PUBLICADA' },
  'reserved-open': { status: 'RESERVADA', acceptsVisits: true },
  'reserved-closed': { status: 'RESERVADA', acceptsVisits: false },
};

/**
 * Llamadas del API de solicitudes y su conversacion. La conversacion NO es en tiempo real:
 * las pantallas piden de nuevo (boton "Recargar") cuando quieren ver si hay algo nuevo.
 */
export const appointmentService = {
  /** El cliente le escribe al anunciante. El primer mensaje abre la conversacion. */
  create(input: { propertyId: string; type: AppointmentType; message?: string }): Promise<AppointmentSummary> {
    // La conversacion vive en la plataforma y los avisos van por correo: no hace falta pedir telefono.
    return api(BASE, { method: 'POST', json: { ...input, preferredChannel: 'EMAIL' } });
  },

  /** Lo que yo pedi (como cliente). */
  mine(propertyId?: string): Promise<AppointmentPage> {
    const query = new URLSearchParams({ limit: '50' });
    if (propertyId) query.set('propertyId', propertyId);
    return api(`${BASE}/mine?${query}`);
  },

  /** Lo que recibo (como dueno, agencia o agente). */
  received(): Promise<AppointmentPage> {
    return api(`${BASE}/received?limit=50`);
  },

  thread(id: string): Promise<Thread> {
    return api(`${BASE}/${id}`);
  },

  send(id: string, body: string): Promise<Thread> {
    return api(`${BASE}/${id}/messages`, { method: 'POST', json: { body } });
  },

  /** Corrige un mensaje propio de texto; el servidor solo lo permite hasta 3 minutos despues de enviarlo. */
  editMessage(id: string, messageId: string, body: string): Promise<Thread> {
    return api(`${BASE}/${id}/messages/${messageId}`, { method: 'PATCH', json: { body } });
  },

  /** Quien gestiona ofrece fechas (ISO) y el cliente acepta una. */
  propose(id: string, slots: string[], note?: string): Promise<Thread> {
    return api(`${BASE}/${id}/slots`, { method: 'POST', json: { slots, note: note || undefined } });
  },

  accept(id: string, slotId: string): Promise<Thread> {
    return api(`${BASE}/${id}/slots/${slotId}/accept`, { method: 'PATCH' });
  },

  cancel(id: string): Promise<AppointmentSummary> {
    return api(`${BASE}/${id}/cancel`, { method: 'PATCH' });
  },

  close(id: string): Promise<AppointmentSummary> {
    return api(`${BASE}/${id}/close`, { method: 'PATCH' });
  },

  /** Quien gestiona deja la propiedad disponible, reservada con citas o reservada del todo. */
  setAvailability(propertyId: string, availability: PropertyAvailability): Promise<unknown> {
    return api(`/properties/${propertyId}/status`, { method: 'PATCH', json: AVAILABILITY[availability] });
  },
};
