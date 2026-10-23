import type { Env } from '../env';

export const databaseConfig = (env: Env) => ({
  url: env.databaseUrl,
  directUrl: env.directUrl ?? env.databaseUrl,
  redisUrl: env.redisUrl,
});
