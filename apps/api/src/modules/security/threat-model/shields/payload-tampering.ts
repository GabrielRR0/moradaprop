import type { ThreatShield } from '../types';

/** T: muchos 400 = alguien manipula cuerpos y parametros buscando una validacion floja. */
export const payloadTampering: ThreatShield = {
  id: 'payload-tampering',
  stride: 'T',
  description: 'Muchos 400 seguidos: payloads manipulados, campos extra o valores fuera de rango.',
  protectedBy: ['ValidationPipe estricto (whitelist + forbidNonWhitelisted)', 'DTO con limites', 'JWT firmado'],
  limit: 40,
  windowSec: 300,
  blockMinutes: 10,
  matches: (facts) => facts.status === 400,
};
