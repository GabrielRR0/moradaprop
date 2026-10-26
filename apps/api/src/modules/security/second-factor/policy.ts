import { Role } from '@prisma/client';

/** Quien debe tener passkey o 2FA, y cuanto tiempo tienen para activarlo. Un solo lugar para cambiarlo. */
export const SECOND_FACTOR_POLICY = {
  /** Roles que manejan datos o dinero de otros: obligatorio. Los clientes: recomendado, no obligatorio. */
  requiredRoles: [Role.ADMIN, Role.OWNER, Role.AGENCY] as readonly Role[],
  /** Roles que deben activarlo YA (sin plazo de gracia). */
  immediateRoles: [Role.ADMIN] as readonly Role[],
  /**
   * Dias de gracia para cuentas que ya existian (o que reciben el rol despues, ej. "ser dueño"): se cuentan desde que se
   * emite su proximo token. Las cuentas NUEVAS de dueño o agencia nacen sin plazo (se les exige desde el primer ingreso).
   */
  graceDays: 7,
} as const;
