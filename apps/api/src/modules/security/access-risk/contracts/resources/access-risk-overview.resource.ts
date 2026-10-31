import type { RiskMode } from '../../types';

/** Mapa del sistema de riesgo de inicio de sesion para el panel admin: modo, puntos, umbrales y senales. */
export interface AccessRiskOverviewResource {
  mode: RiskMode;
  /** Desde cuantos puntos el inicio de sesion es MEDIO (avisa) o ALTO (exige segundo factor). */
  thresholds: { mediumFrom: number; highFrom: number };
  /** Puntos de cada senal; negativo resta riesgo. */
  points: Record<string, number>;
  travelWindowHours: number;
  failures: { threshold: number; windowMinutes: number };
  device: { ttlDays: number; maxPerUser: number };
  stepUp: { maxFailures: number; windowMinutes: number; lockMinutes: number };
  signals: Array<{ id: string; description: string }>;
}
