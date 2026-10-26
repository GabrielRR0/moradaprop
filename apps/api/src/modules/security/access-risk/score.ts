import { levelOf } from './policy';
import { SIGNALS } from './signals';
import type { RiskContext, RiskLevel, RiskReason, RiskSignal } from './types';

/** Suma las senales de un inicio de sesion. Pura (sin base de datos): es lo que prueban los tests de la tabla de puntos. */
export function scoreSignals(
  ctx: RiskContext,
  signals: readonly RiskSignal[] = SIGNALS,
): { score: number; level: RiskLevel; reasons: RiskReason[] } {
  const reasons: RiskReason[] = [];
  for (const signal of signals) {
    const result = signal.evaluate(ctx);
    if (result) reasons.push({ signal: signal.id, ...result });
  }
  const score = reasons.reduce((sum, r) => sum + r.points, 0);
  return { score, level: levelOf(score), reasons };
}
