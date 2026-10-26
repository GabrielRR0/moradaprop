import { RISK_POLICY } from '../policy';
import type { RiskSignal } from '../types';

/** Entra desde una red (/24 o /48) que esta cuenta no habia usado. */
export const newNetwork: RiskSignal = {
  id: 'new-network',
  description: 'Red (rango de IP) desde la que la cuenta nunca habia iniciado sesion.',
  evaluate: (ctx) =>
    ctx.hasHistory && ctx.network && !ctx.knownNetworks.has(ctx.network)
      ? { points: RISK_POLICY.points.newNetwork, reason: 'red nueva' }
      : null,
};
