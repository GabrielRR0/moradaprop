import type { ThreatShield } from '../types';

/**
 * S: crear muchas cuentas desde un mismo lugar (identidades falsas para analizar tokens, hacer spam o scraping).
 * No cuenta respuestas: lo alimenta RegisterService con `report('mass-registration', { ip })` por cada cuenta nueva.
 */
export const massRegistration: ThreatShield = {
  id: 'mass-registration',
  stride: 'S',
  description: 'Muchas cuentas nuevas desde la misma IP en poco tiempo.',
  protectedBy: [
    'registro: el correo debe verificarse con un codigo',
    'rate limit sensible (10/min por IP)',
    'bloqueos por correo y por dominio de correo (admin)',
  ],
  limit: 8,
  windowSec: 3600,
  blockMinutes: 120,
};
