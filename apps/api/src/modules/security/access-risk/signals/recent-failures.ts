import { RISK_POLICY } from '../policy';
import type { RiskSignal } from '../types';

/** La cuenta acumula fallos de clave en la ultima hora (desde cualquier IP): alguien la esta probando. */
export const recentFailures: RiskSignal = {
  id: 'recent-failures',
  description: 'Varios fallos de clave recientes en esta cuenta.',
  evaluate: (ctx) =>
    ctx.failedLoginsLastHour >= RISK_POLICY.failures.threshold
      ? { points: RISK_POLICY.points.recentFailures, reason: `${ctx.failedLoginsLastHour} fallos de clave en la ultima hora` }
      : null,
};
