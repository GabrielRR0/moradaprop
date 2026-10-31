import type { RequestContext } from '@/common/security/types';
import type { RiskVerdict } from '../types';
import { deviceLabel } from './device-label';

/** Lo que se anota en la auditoria de un inicio de sesion medido: nivel, puntos, motivos, pais y dispositivo. */
export function riskMetadata(verdict: RiskVerdict, context: RequestContext, extra: Record<string, unknown>) {
  const { assessment, device, country } = verdict;
  return {
    level: assessment.level,
    score: assessment.score,
    mode: assessment.mode,
    reasons: assessment.reasons,
    country,
    device: device?.label ?? deviceLabel(context.userAgent),
    ...extra,
  };
}
