import type { RiskLevel } from './types';

/**
 * TABLA UNICA del riesgo de inicio de sesion: el unico lugar donde se cambian los puntos, los umbrales
 * y los tiempos (como rate-limits.ts con los limites de peticiones). Son valores iniciales: se afinan en
 * modo `monitor` mirando los eventos `risk.assessed` antes de activar `enforce`.
 */
export const RISK_POLICY = {
  /** Puntos de cada senal. Negativo = resta riesgo. */
  points: {
    newCountry: 50,
    newNetwork: 20,
    unconfirmedDevice: 40,
    impossibleTravel: 40,
    recentFailures: 20,
    confirmedDevice: -40,
  },
  /** Desde cuantos puntos el inicio de sesion es MEDIO (avisa) o ALTO (exige segundo factor). */
  mediumFrom: 30,
  highFrom: 60,
  /** "Otro pais en menos de N horas que el ultimo inicio de sesion". */
  travelWindowHours: 6,
  /** "N fallos de clave en la ultima hora" (desde cualquier IP). */
  failures: { threshold: 3, windowMinutes: 60 },
  device: {
    /** Un dispositivo vence tras estos dias sin usarse (se renueva en cada inicio de sesion). */
    ttlDays: 30,
    /** Maximo de dispositivos activos por usuario; al pasarse se retiran los mas viejos sin confirmar. */
    maxPerUser: 20,
  },
  /** Cuantos paises y redes distintos se recuerdan por usuario (los mas recientes). */
  footprintsPerKind: 100,
  /** Segundo factor fallido en un inicio de sesion ALTO: a los N fallos se bloquea la cuenta. */
  stepUp: { maxFailures: 3, windowMinutes: 30, lockMinutes: 30 },
} as const;

export function levelOf(score: number): RiskLevel {
  if (score >= RISK_POLICY.highFrom) return 'HIGH';
  if (score >= RISK_POLICY.mediumFrom) return 'MEDIUM';
  return 'LOW';
}
