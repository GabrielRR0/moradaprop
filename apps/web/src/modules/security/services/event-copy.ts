import type { SecurityEvent } from '@/lib/api-types';

/**
 * Como se presenta cada aviso de seguridad (docs/FRONTEND-SEGURIDAD.md, seccion 9).
 * El texto del servidor (`title`) solo se usa si llega un tipo que aun no conocemos.
 */
export type EventSeverity = 'info' | 'alert';

export interface EventCopy {
  severity: EventSeverity;
  text: string;
}

const where = (event: SecurityEvent) =>
  [event.country, event.device].filter(Boolean).join(' · ') || 'un lugar desconocido';

const ALERTS: Record<string, string> = {
  'risk.denied': 'Bloqueamos un intento de entrar a tu cuenta.',
  'risk.stepup.failed': 'Hubo intentos fallidos de verificación y bloqueamos la cuenta un rato.',
  'risk.account.locked': 'Hubo intentos fallidos de verificación y bloqueamos la cuenta un rato.',
  'risk.factor.denied':
    'Alguien intentó cambiar tus métodos de verificación desde un dispositivo no confirmado.',
  'risk.session.revoked': 'Cerramos una sesión por seguridad.',
  'risk.passkey.cloned': 'Desactivamos una passkey porque detectamos una posible copia.',
};

export function describeEvent(event: SecurityEvent): EventCopy {
  const alert = ALERTS[event.type];
  if (alert) return { severity: 'alert', text: alert };
  switch (event.type) {
    case 'risk.assessed':
      return {
        severity: 'info',
        text: `Nuevo inicio de sesión desde ${where(event)}. ¿Fuiste tú?`,
      };
    case 'risk.stepup.passed':
      return { severity: 'info', text: 'Verificaste tu identidad en un inicio de sesión inusual.' };
    case 'risk.device.confirmed':
      return { severity: 'info', text: `Dispositivo confirmado: ${event.device ?? 'este equipo'}.` };
    case 'risk.passkey.registered':
      return { severity: 'info', text: 'Se agregó una passkey a tu cuenta.' };
    case 'risk.passkey.revoked':
      return { severity: 'info', text: 'Se quitó una passkey de tu cuenta.' };
    default:
      return { severity: event.level === 'HIGH' ? 'alert' : 'info', text: event.title };
  }
}

/** "hace 5 min", "hace 2 h", "hace 3 días" */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'justo ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
}
