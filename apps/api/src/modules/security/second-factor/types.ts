export type SecondFactorMode = 'off' | 'monitor' | 'enforce';

/** Estado del segundo factor de una cuenta. Lo reciben login, refresh y `GET /auth/second-factor`. */
export interface SecondFactorStatus {
  /** off: no se mide · monitor: se mide y se avisa, no se bloquea · enforce: se bloquea. */
  mode: SecondFactorMode;
  /** Por su rol (admin, dueño o agencia) debe tener passkey o 2FA. */
  required: boolean;
  /** Ya tiene al menos una passkey o el 2FA con app autenticadora. */
  hasFactor: boolean;
  /** Ya vencio el plazo y no tiene factor: debe activarlo YA (con `enforce` esto bloquea). */
  mustEnrollNow: boolean;
  /** Hasta cuando puede activarlo (ISO). null si no aplica o ya lo tiene. */
  graceEndsAt: string | null;
  /** No es obligatorio para su rol, pero conviene que active uno (clientes). */
  recommended: boolean;
  /** Esta cuenta esta limitada a las rutas de enrolamiento (solo con `enforce`). */
  blocked: boolean;
}
