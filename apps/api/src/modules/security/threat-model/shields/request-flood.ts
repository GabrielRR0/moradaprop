import type { ThreatShield } from '../types';

/** D: seguir pidiendo despues de recibir 429 = ignora el limite a proposito. */
export const requestFlood: ThreatShield = {
  id: 'request-flood',
  stride: 'D',
  description: 'Muchos 429 seguidos: insiste a pesar del limite de peticiones.',
  protectedBy: ['rate limit por grupo de rutas (rate-limits.ts)', 'limites de subida e importacion', 'cache de un solo vuelo'],
  limit: 30,
  windowSec: 300,
  blockMinutes: 15,
  matches: (facts) => facts.status === 429,
};
