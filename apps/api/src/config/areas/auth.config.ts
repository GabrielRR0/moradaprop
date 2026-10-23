import type { Env } from '../env';

export const authConfig = (env: Env) => ({
  jwtAccessSecret: env.jwtAccessSecret,
  jwtRefreshSecret: env.jwtRefreshSecret,
  jwtAccessExpiresIn: env.jwtAccessExpiresIn,
  jwtRefreshExpiresIn: env.jwtRefreshExpiresIn,
  encryptionKey: env.encryptionKey,

  // Reglas de negocio de autenticacion (no son variables de entorno)
  refreshTtlDays: 7,
  codeLength: 6,
  codeTtlMinutes: 10,
  maxCodeAttempts: 5,
  resendCooldownSeconds: 60,
  maxFailedLogins: 5,
  lockMinutes: 15,
  twoFactorChallengeTtl: '5m',
  backupCodesCount: 8,
});
