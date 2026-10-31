// Archivo padre de la capa config: el resto de la app solo importa desde aqui.
export { AppConfig } from './app-config';
export { ConfigModule } from './config.module';
export { loadEnv } from './env';
export { adminApiPrefix } from './admin-api-prefix';
export type { Env } from './env';
