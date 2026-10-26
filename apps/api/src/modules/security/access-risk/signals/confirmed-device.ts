import { RISK_POLICY } from '../policy';
import type { RiskSignal } from '../types';

/** El dispositivo es uno que el usuario ya verifico con segundo factor: la mejor senal de que es el dueño (resta riesgo). */
export const confirmedDevice: RiskSignal = {
  id: 'confirmed-device',
  description: 'Dispositivo confirmado de la cuenta (resta riesgo).',
  evaluate: (ctx) =>
    ctx.device?.confirmed ? { points: RISK_POLICY.points.confirmedDevice, reason: 'dispositivo confirmado' } : null,
};
