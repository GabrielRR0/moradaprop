import { BadRequestException } from '@nestjs/common';
import type { AuthUserContext } from '@/common/security/types';
import type { DbSupport } from '@/support/db';

/** Quien mira la conversacion: el cliente que la pidio o quien gestiona la propiedad. */
export type Side = 'client' | 'manager';

/** Estados en los que todavia se puede escribir. */
export const OPEN_STATUSES: DbSupport.AppointmentStatus[] = ['PENDIENTE', 'ABIERTA', 'CONFIRMADA'];

/** Tope de mensajes por conversacion (evita que se use como canal de spam). */
export const MAX_MESSAGES = 200;

/** Cuanto tiempo despues de enviado puede su autor editar un mensaje. */
export const EDIT_WINDOW_MS = 3 * 60 * 1000;

/** Maximo de dias hacia adelante para una fecha de visita. */
export const MAX_DAYS_AHEAD = 90;

export const sideOf = (user: AuthUserContext, appointment: { clientId: string }): Side => (appointment.clientId === user.id ? 'client' : 'manager');

/** Hasta cuando se puede editar un mensaje enviado en `createdAt`. */
export const editDeadline = (createdAt: Date): Date => new Date(createdAt.getTime() + EDIT_WINDOW_MS);

export const isOpen = (status: DbSupport.AppointmentStatus): boolean => OPEN_STATUSES.includes(status);

export function assertOpen(status: DbSupport.AppointmentStatus): void {
  if (!isOpen(status)) throw new BadRequestException('Esta conversacion ya esta cerrada');
}

/** Una fecha de visita debe ser futura y estar dentro de los proximos 90 dias. */
export function assertVisitDate(date: Date): void {
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Fecha invalida');
  if (date.getTime() <= Date.now()) throw new BadRequestException('La fecha de la visita debe ser futura');
  if (date.getTime() > Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    throw new BadRequestException(`La visita debe ser dentro de los proximos ${MAX_DAYS_AHEAD} dias`);
  }
}

/**
 * Lo que cambia en la cita cuando alguien escribe: sube en la bandeja, queda vista por quien escribio
 * y, si responde quien gestiona la propiedad por primera vez, pasa de PENDIENTE a ABIERTA.
 */
export function touch(side: Side, status: DbSupport.AppointmentStatus, respondedAt: Date | null): DbSupport.Prisma.AppointmentUpdateInput {
  const now = new Date();
  return {
    lastMessageAt: now,
    ...(side === 'client' ? { clientSeenAt: now } : { managerSeenAt: now }),
    ...(side === 'manager' && status === 'PENDIENTE' ? { status: 'ABIERTA' as const, respondedAt: respondedAt ?? now } : {}),
  };
}
