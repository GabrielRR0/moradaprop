import type { ThreatShield } from '../types';

/** I: muchos 404 = alguien recorre ids buscando datos ajenos (un recurso ajeno responde 404, como si no existiera). */
export const idEnumeration: ThreatShield = {
  id: 'id-enumeration',
  stride: 'I',
  description: 'Muchos 404 seguidos: recorrido de ids para encontrar datos de otros.',
  protectedBy: [
    'ownership: un recurso ajeno responde 404 y se audita access.denied',
    'UUID v4 imposibles de adivinar',
    'mappers sin datos internos',
  ],
  limit: 30,
  windowSec: 300,
  blockMinutes: 30,
  // Los archivos publicos que no existen (/uploads) no cuentan: un enlace roto no es un ataque.
  matches: (facts) => facts.status === 404 && !facts.path.startsWith('/uploads'),
};
