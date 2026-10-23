import type { Env } from '../env';

export const cacheConfig = (env: Env) => ({
  /** memory = dentro del proceso; redis = compartida entre servidores */
  driver: env.cacheDriver,
  /** Segundos que se guarda una respuesta cacheada. 0 = desactivada. */
  ttlSeconds: env.cacheTtlSeconds,
});
