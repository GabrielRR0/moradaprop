import type { Env } from '../env';

export const securityConfig = (env: Env) => ({
  trustProxy: env.trustProxy,
  threatMode: env.threatMode,
  corsAllowedOrigins: env.corsAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Claves de cifrado de campos: "v1:clave,v2:clave". Si falta, v1 = ENCRYPTION_KEY. */
  encryption: {
    keys: env.encryptionKeys || `v1:${env.encryptionKey}`,
    activeVersion: env.encryptionActiveVersion,
  },
  clientKeys: {
    web: env.appClientKeyWeb,
    mobile: env.appClientKeyMobile,
  },
});
