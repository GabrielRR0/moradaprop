import { RISK_POLICY } from '../policy';
import type { RiskSignal } from '../types';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Otro pais en pocas horas desde el ultimo inicio de sesion. No se aplica con un dispositivo confirmado: el
 * mismo equipo puede encender una VPN en cualquier momento, y eso no es "viajar".
 */
export const impossibleTravel: RiskSignal = {
  id: 'impossible-travel',
  description: 'Pais distinto al del ultimo inicio de sesion, en muy pocas horas y desde un dispositivo no confirmado.',
  evaluate: (ctx) => {
    if (ctx.device?.confirmed || !ctx.country || !ctx.lastLogin?.country) return null;
    if (ctx.lastLogin.country === ctx.country) return null;
    const hours = (ctx.now.getTime() - ctx.lastLogin.at.getTime()) / HOUR_MS;
    return hours < RISK_POLICY.travelWindowHours
      ? { points: RISK_POLICY.points.impossibleTravel, reason: `${ctx.lastLogin.country} -> ${ctx.country} en ${Math.max(0, Math.round(hours * 10) / 10)} h` }
      : null;
  },
};
