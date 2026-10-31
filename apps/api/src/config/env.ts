import { envSchema } from './env.schema';
import { assertProductionSafe } from './production-guard';

/** Valida y devuelve el entorno ya mapeado a nombres internos. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env) {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variables de entorno invalidas o faltantes:\n${detalle}`);
  }

  const raw = parsed.data;
  assertProductionSafe(raw); // en produccion no arranca con claves de desarrollo

  // Si una variable cambia de nombre, solo se edita este mapeo.
  return {
    nodeEnv: raw.NODE_ENV,
    appName: raw.APP_NAME,
    port: raw.PORT,
    frontendUrl: raw.FRONTEND_URL,

    databaseUrl: raw.DATABASE_URL,
    directUrl: raw.DIRECT_URL,
    cacheDriver: raw.CACHE_DRIVER,
    cacheTtlSeconds: raw.CACHE_TTL_SECONDS,
    redisUrl: raw.REDIS_URL,

    jwtAccessSecret: raw.JWT_ACCESS_SECRET,
    jwtRefreshSecret: raw.JWT_REFRESH_SECRET,
    encryptionKey: raw.ENCRYPTION_KEY,
    encryptionKeys: raw.ENCRYPTION_KEYS,
    encryptionActiveVersion: raw.ENCRYPTION_ACTIVE_VERSION,
    jwtAccessExpiresIn: raw.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresIn: raw.JWT_REFRESH_EXPIRES_IN,

    mailHost: raw.MAIL_HOST,
    mailPort: raw.MAIL_PORT,
    mailUser: raw.MAIL_USER,
    mailPassword: raw.MAIL_PASSWORD,
    mailFrom: raw.MAIL_FROM,

    storageProvider: raw.STORAGE_PROVIDER,
    storageLocalDir: raw.STORAGE_LOCAL_DIR,
    apiPublicUrl: raw.API_PUBLIC_URL,
    supabaseUrl: raw.SUPABASE_URL,
    supabaseServiceKey: raw.SUPABASE_SERVICE_KEY,

    trustProxy: raw.TRUST_PROXY === 'true',
    threatMode: raw.THREAT_MODE,
    riskMode: raw.RISK_MODE,
    secondFactorMode: raw.SECOND_FACTOR_MODE,
    adminApiPrefix: raw.ADMIN_API_PREFIX,
    webauthnRpId: raw.WEBAUTHN_RP_ID,
    webauthnOrigins: raw.WEBAUTHN_ORIGINS,
    corsAllowedOrigins: raw.CORS_ALLOWED_ORIGINS,
    appClientKeyWeb: raw.APP_CLIENT_KEY_WEB,
    appClientKeyMobile: raw.APP_CLIENT_KEY_MOBILE,

    googleClientId: raw.GOOGLE_CLIENT_ID,
    googleClientSecret: raw.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: raw.GOOGLE_CALLBACK_URL,
  };
}

export type Env = ReturnType<typeof loadEnv>;
