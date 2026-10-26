import type { ThreatShield } from '../types';

/** S: muchas respuestas 401 desde el mismo lugar = alguien prueba claves o tokens ajenos. */
export const credentialGuessing: ThreatShield = {
  id: 'credential-guessing',
  stride: 'S',
  description: 'Muchos 401 seguidos: prueba de claves, tokens falsos o robados.',
  protectedBy: [
    'auth: bloqueo de cuenta por intentos (lockedUntil)',
    'rate limit sensible (10/min)',
    'refresh token rotativo con deteccion de reuso',
  ],
  limit: 20,
  windowSec: 300,
  blockMinutes: 15,
  matches: (facts) => facts.status === 401,
};
