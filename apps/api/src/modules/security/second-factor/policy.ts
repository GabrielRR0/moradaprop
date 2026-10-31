import { DbSupport } from '@/support/db';

/** Quien debe tener passkey o 2FA, y cuanto tiempo tienen para activarlo. Un solo lugar para cambiarlo. */
export const SECOND_FACTOR_POLICY = {
  /** Roles que manejan datos o dinero de otros: obligatorio. Los clientes: recomendado, no obligatorio. */
  requiredRoles: [DbSupport.Role.ADMIN, DbSupport.Role.OWNER, DbSupport.Role.AGENCY] as readonly DbSupport.Role[],
  /** Roles que deben activarlo YA (sin plazo de gracia). */
  immediateRoles: [DbSupport.Role.ADMIN] as readonly DbSupport.Role[],
  /**
   * Dias de gracia para cuentas que ya existian (o que reciben el rol despues, ej. "ser dueño"): se cuentan desde que se
   * emite su proximo token. Las cuentas NUEVAS de dueño o agencia nacen sin plazo (se les exige desde el primer ingreso).
   */
  graceDays: 7,
} as const;
