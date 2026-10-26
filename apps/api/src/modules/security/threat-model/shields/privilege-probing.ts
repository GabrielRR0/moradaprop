import type { ThreatShield } from '../types';

/** E: muchos 403 = alguien prueba rutas de admin o de otro rol. */
export const privilegeProbing: ThreatShield = {
  id: 'privilege-probing',
  stride: 'E',
  description: 'Muchos 403 seguidos: prueba de rutas de administracion o de otro rol.',
  protectedBy: [
    'RolesGuard: @Roles y @RequireTwoFactor',
    'AdminGroup (rol ADMIN + 2FA)',
    'los DTO nunca aceptan role ni userId',
  ],
  limit: 10,
  windowSec: 300,
  blockMinutes: 30,
  matches: (facts) => facts.status === 403,
};
