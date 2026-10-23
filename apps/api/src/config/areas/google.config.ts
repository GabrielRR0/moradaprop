import type { Env } from '../env';

export const googleConfig = (env: Env) => ({
  clientId: env.googleClientId,
  clientSecret: env.googleClientSecret,
  callbackUrl: env.googleCallbackUrl,
  enabled: Boolean(env.googleClientId && env.googleClientSecret),
});
