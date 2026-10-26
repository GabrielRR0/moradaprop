import type { ThreatShield } from '../types';

/**
 * R: el repudio ("yo no hice eso") no se frena bloqueando a nadie: se evita dejando constancia.
 * Este escudo es solo documentacion en el panel; no cuenta nada. La defensa es el modulo audit
 * (y cada bloqueo o archivo rechazado de este modelo tambien queda auditado con IP y usuario).
 */
export const auditTrail: ThreatShield = {
  id: 'audit-trail',
  stride: 'R',
  description: 'Toda accion importante y toda deteccion queda registrada con quien, desde donde y cuando.',
  protectedBy: ['audit: @Audit y AuditService.log', 'eventos threat.detected, threat.file.rejected y access.denied'],
  limit: 1,
  windowSec: 1,
  blockMinutes: 0,
};
