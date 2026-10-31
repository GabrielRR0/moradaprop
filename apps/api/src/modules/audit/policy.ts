/** Cuanto tiempo se guarda cada cosa. Un solo lugar para cambiarlo. */
export const AUDIT_RETENTION = {
  /**
   * Eventos SIN usuario (intentos de login a cuentas que no existen, amenazas detectadas, accesos denegados...): llevan
   * IP y navegador de gente que ni siquiera tiene cuenta, asi que se borran pronto.
   */
  anonymousDays: 5,
  /** Cada cuantas horas se revisa lo vencido. */
  runEveryHours: 6,
} as const;
