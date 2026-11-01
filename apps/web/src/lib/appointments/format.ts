import type { AppointmentStatus, AppointmentType, MessageKind, PropertyAvailability, Thread } from './types';

/** Textos y formatos de las solicitudes, en un solo lugar para que bandeja, conversacion y ficha digan lo mismo. */

export const TYPE_LABEL: Record<AppointmentType, string> = {
  INTERES: 'Interesado',
  PREGUNTA: 'Pregunta',
  VISITA: 'Visita',
  RESERVA: 'Apartado',
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDIENTE: 'Esperando respuesta',
  ABIERTA: 'En conversación',
  CONFIRMADA: 'Visita acordada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Cerrada',
};

/** Color de la etiqueta de estado: ok (verde), wait (ambar), off (gris). */
export const STATUS_TONE: Record<AppointmentStatus, 'ok' | 'wait' | 'off' | 'brand'> = {
  PENDIENTE: 'wait',
  ABIERTA: 'brand',
  CONFIRMADA: 'ok',
  RECHAZADA: 'off',
  CANCELADA: 'off',
  COMPLETADA: 'off',
};

const SLOT = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const TIME = new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit' });
const SHORT = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Martes 5 de noviembre · 3:00 p. m." */
export function formatSlot(iso: string): string {
  const date = new Date(iso);
  return `${cap(SLOT.format(date))} · ${TIME.format(date)}`;
}

/** "mar 5 nov" */
export const formatDayShort = (iso: string): string => SHORT.format(new Date(iso));

export const formatTime = (iso: string): string => TIME.format(new Date(iso));

/** "hace 5 min", "ayer", "hace 3 días". Mientras mas viejo, menos preciso. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'ayer' : `hace ${days} días`;
}

/** Lo que dice la bandeja como vista previa del ultimo mensaje. */
export function previewOf(kind: MessageKind, body: string): string {
  if (kind === 'PROPUESTA') return 'Te propuso fechas para la visita';
  if (kind === 'ACUERDO') return `Visita acordada: ${formatSlot(body)}`;
  return body;
}

/** La propiedad esta disponible, reservada con citas o reservada del todo (segun lo que muestra la conversacion). */
export function availabilityOf(property: Thread['property']): PropertyAvailability {
  if (property.status !== 'RESERVADA') return 'free';
  return property.acceptsVisits ? 'reserved-open' : 'reserved-closed';
}

/** Mensajes de apoyo para empezar rapido (el cliente toca una y se escribe sola). */
export const STARTERS: Record<Exclude<AppointmentType, 'RESERVA'>, string[]> = {
  INTERES: ['Hola, me interesa esta propiedad. ¿Sigue disponible?', 'Me interesa. ¿Cuándo podría verla?'],
  PREGUNTA: ['¿Está incluido el mantenimiento en el precio?', '¿Aceptan mascotas?', '¿Qué requisitos piden para alquilar?'],
  VISITA: ['Quisiera visitarla. ¿Qué días tienen disponibles?', 'Puedo ir entre semana por la tarde.'],
};

/**
 * Milisegundos que le quedan a una ventana que termina en `until` (ISO). `skew` corrige la diferencia entre el reloj
 * del servidor y el de este dispositivo (hora del servidor menos hora local al recibirla), asi la cuenta no depende de que el reloj local este bien.
 */
export const msLeft = (until: string, skew = 0, now = Date.now()): number => Math.max(0, Date.parse(until) - (now + skew));

/** "2:41" a partir de milisegundos (siempre minutos y segundos). */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const DAY_HEADER = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' });

/** Encabezado de un grupo de mensajes: "Hoy", "Ayer" o "5 de noviembre". */
export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, now)) return 'Hoy';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return sameDay(date, yesterday) ? 'Ayer' : DAY_HEADER.format(date);
}
