import type { Env } from '../env';

export const securityConfig = (env: Env) => ({
  trustProxy: env.trustProxy,
  threatMode: env.threatMode,
  riskMode: env.riskMode,
  secondFactorMode: env.secondFactorMode,
  /** Prefijo de las rutas de administracion (/api/<prefijo>/...). */
  adminApiPrefix: env.adminApiPrefix,
  /** Passkeys (WebAuthn): el sitio al que quedan atadas y los origenes que se aceptan. */
  webauthn: {
    rpId: env.webauthnRpId,
    origins: env.webauthnOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  corsAllowedOrigins: env.corsAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Claves de cifrado de campos: "v1:clave,v2:clave". Si falta, v1 = ENCRYPTION_KEY. */
  encryption: {
    keys: env.encryptionKeys || `v1:${env.encryptionKey}`,
    activeVersion: env.encryptionActiveVersion,
  },
  /** "No soy un robot" (Cloudflare Turnstile). Un solo interruptor: la web lee `enabled` y `siteKey` por GET /auth/human-check. */
  turnstile: {
    enabled: env.turnstileEnabled,
    siteKey: env.turnstileSiteKey,
    /** Solo para el servidor: valida cada respuesta. */
    secretKey: env.turnstileSecretKey,
  },
  clientKeys: {
    web: env.appClientKeyWeb,
    mobile: env.appClientKeyMobile,
  },
});
