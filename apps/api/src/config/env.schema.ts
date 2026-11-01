import { z } from 'zod';

/**
 * Valida las variables de entorno CRUDAS (con sus nombres reales del .env).
 * Si falta alguna obligatoria, la app no arranca y dice cual es.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('Portal de Alquileres'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),
  /** memory = cache y rate limit dentro del proceso (1 servidor); redis = compartidos entre servidores */
  CACHE_DRIVER: z.enum(['memory', 'redis']).default('memory'),
  /** Segundos que se cachean mapa y busquedas publicas. 0 = sin cache. */
  CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(300).default(10),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  /** Cifra secretos en reposo (ej. TOTP del 2FA). Minimo 32 caracteres. */
  ENCRYPTION_KEY: z.string().min(32),
  /** Claves de cifrado de campos en reposo, versionadas: "v1:clave,v2:clave" (cada una minimo 32 caracteres). Vacio = v1 es ENCRYPTION_KEY. */
  ENCRYPTION_KEYS: z.string().default(''),
  /** Version con la que se cifra lo nuevo. Vacio = la ultima de ENCRYPTION_KEYS. */
  ENCRYPTION_ACTIVE_VERSION: z.string().default(''),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.coerce.number().int().default(1025),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().default('no-reply@localhost'),

  STORAGE_PROVIDER: z.enum(['local', 'supabase']).default('local'),
  /** Carpeta de archivos cuando STORAGE_PROVIDER=local */
  STORAGE_LOCAL_DIR: z.string().default('uploads'),
  /** URL publica del API: con ella se arman los enlaces a /uploads en modo local */
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  /** 'true' cuando el API esta detras de un proxy/CDN (Nginx, Cloudflare): usa la IP real del cliente */
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  /** Modelo de amenazas: 'off' no vigila; 'monitor' solo registra; 'enforce' ademas bloquea (por tiempo) a quien ataca */
  THREAT_MODE: z.enum(['off', 'monitor', 'enforce']).default('monitor'),
  /** Riesgo de inicio de sesion (ubicacion y dispositivo): 'off' no mide; 'monitor' mide, audita y avisa; 'enforce' ademas exige verificacion y niega */
  RISK_MODE: z.enum(['off', 'monitor', 'enforce']).default('monitor'),
  /** Segundo factor obligatorio para admin, duenos y agencias: 'off' no mide; 'monitor' mide y avisa; 'enforce' ademas bloquea hasta que activen passkey o 2FA */
  SECOND_FACTOR_MODE: z.enum(['off', 'monitor', 'enforce']).default('monitor'),
  /**
   * Prefijo de las rutas de administracion: /api/<prefijo>/users, /audit, /security, /settings. Por defecto "admin" (solo
   * desarrollo): en produccion debe ser un nombre propio y poco obvio (ver production-guard.ts).
   */
  ADMIN_API_PREFIX: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{2,39}$/, 'usa 3 a 40 caracteres: minusculas, numeros y guiones')
    .default('admin'),
  /** Passkeys (WebAuthn): dominio del sitio (sin https://) al que quedan atadas las passkeys. En produccion, el dominio real */
  WEBAUTHN_RP_ID: z.string().min(1).default('localhost'),
  /** Passkeys: origenes exactos desde los que se aceptan (la web), separados por coma. En produccion, https://tu-dominio */
  WEBAUTHN_ORIGINS: z.string().default('http://localhost:3000'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  APP_CLIENT_KEY_WEB: z.string().default('dev-web-client-key'),
  APP_CLIENT_KEY_MOBILE: z.string().default('dev-mobile-client-key'),

  /**
   * Verificacion "no soy un robot" (Cloudflare Turnstile) en registro, login, recuperar clave y reenvio de codigos.
   * UN SOLO INTERRUPTOR para API y web: la web le pregunta a la API si esta activo y con que clave publica (GET /auth/human-check).
   * Con 'true' hacen falta las dos claves (el arranque falla si faltan).
   */
  TURNSTILE_ENABLED: z.enum(['true', 'false']).default('false'),
  /** Clave PUBLICA del widget (la ve el navegador). */
  TURNSTILE_SITE_KEY: z.string().default(''),
  /** Clave SECRETA con la que la API valida cada respuesta. Nunca viaja a la web. */
  TURNSTILE_SECRET_KEY: z.string().default(''),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
});

export type RawEnv = z.infer<typeof envSchema>;
