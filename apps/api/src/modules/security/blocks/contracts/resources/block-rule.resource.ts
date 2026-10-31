import type { DbSupport } from '@/support/db';

/** Una regla de bloqueo (IP, rango, pais, usuario, correo...) con su motivo y vencimiento. */
export interface BlockRuleResource {
  id: string;
  type: DbSupport.BlockType;
  value: string;
  reason: string | null;
  createdBy: string | null;
  /** Fecha en que deja de aplicar; null si es permanente. */
  expiresAt: Date | null;
  createdAt: Date;
}
