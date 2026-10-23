import type { Env } from '../env';

export const storageConfig = (env: Env) => ({
  provider: env.storageProvider,
  localDir: env.storageLocalDir,
  publicBaseUrl: env.apiPublicUrl.replace(/\/$/, ''),
  supabaseUrl: env.supabaseUrl,
  supabaseServiceKey: env.supabaseServiceKey,
});
