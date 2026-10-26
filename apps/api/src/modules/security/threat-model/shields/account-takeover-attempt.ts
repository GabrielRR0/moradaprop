import type { ThreatShield } from '../types';

/**
 * S: alguien que ya conoce la clave de una cuenta falla el segundo factor una y otra vez desde un inicio de sesion
 * raro. No cuenta respuestas: lo alimenta access-risk con `report('account-takeover-attempt', { ip })` cuando una
 * cuenta se bloquea por fallos de segundo factor. Bloquea la IP del atacante, nunca a la victima.
 */
export const accountTakeoverAttempt: ThreatShield = {
  id: 'account-takeover-attempt',
  stride: 'S',
  description: 'Intento de tomar una cuenta: segundo factor fallido repetidamente desde un lugar raro.',
  protectedBy: [
    'access-risk: pais, red y dispositivo nuevos exigen segundo factor',
    'bloqueo temporal de la cuenta tras 3 fallos',
    'bloqueos por IP del modelo de amenazas',
  ],
  limit: 3,
  windowSec: 3600,
  blockMinutes: 120,
};
