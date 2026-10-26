import { RISK_POLICY } from '../policy';
import type { RiskSignal } from '../types';

/** No presenta un dispositivo confirmado (nunca verificado con segundo factor, o desconocido). */
export const unconfirmedDevice: RiskSignal = {
  id: 'unconfirmed-device',
  description: 'El navegador o la app no es un dispositivo confirmado de la cuenta.',
  evaluate: (ctx) =>
    ctx.hasHistory && !ctx.device?.confirmed
      ? { points: RISK_POLICY.points.unconfirmedDevice, reason: ctx.device ? 'dispositivo sin confirmar' : 'dispositivo nuevo' }
      : null,
};
