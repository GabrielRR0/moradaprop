import { RISK_POLICY } from '../policy';
import type { RiskSignal } from '../types';

/** Entra desde un pais en el que esta cuenta nunca habia entrado (y el pais se conoce). */
export const newCountry: RiskSignal = {
  id: 'new-country',
  description: 'Pais en el que la cuenta nunca habia iniciado sesion.',
  evaluate: (ctx) =>
    ctx.hasHistory && ctx.country && !ctx.knownCountries.has(ctx.country)
      ? { points: RISK_POLICY.points.newCountry, reason: `pais nuevo (${ctx.country})` }
      : null,
};
