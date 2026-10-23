import type { Env } from '../env';

export const appConfig = (env: Env) => ({
  name: env.appName,
  nodeEnv: env.nodeEnv,
  isProduction: env.nodeEnv === 'production',
  port: env.port,
  frontendUrl: env.frontendUrl,
});
