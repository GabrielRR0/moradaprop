import { Injectable } from '@nestjs/common';
import { loadEnv, type Env } from './env';
import {
  appConfig,
  authConfig,
  cacheConfig,
  databaseConfig,
  googleConfig,
  mailConfig,
  securityConfig,
  storageConfig,
} from './areas';

/**
 * Unica puerta de entrada a la configuracion. Los services lo inyectan
 * y piden `config.auth.jwtAccessExpiresIn`, nunca el nombre de la variable.
 */
@Injectable()
export class AppConfig {
  readonly app: ReturnType<typeof appConfig>;
  readonly database: ReturnType<typeof databaseConfig>;
  readonly auth: ReturnType<typeof authConfig>;
  readonly cache: ReturnType<typeof cacheConfig>;
  readonly mail: ReturnType<typeof mailConfig>;
  readonly storage: ReturnType<typeof storageConfig>;
  readonly security: ReturnType<typeof securityConfig>;
  readonly google: ReturnType<typeof googleConfig>;

  constructor(env: Env = loadEnv()) {
    this.app = appConfig(env);
    this.database = databaseConfig(env);
    this.auth = authConfig(env);
    this.cache = cacheConfig(env);
    this.mail = mailConfig(env);
    this.storage = storageConfig(env);
    this.security = securityConfig(env);
    this.google = googleConfig(env);
  }
}
