import type { Env } from '../env';

export const securityConfig = (env: Env) => ({
  trustProxy: env.trustProxy,
  corsAllowedOrigins: env.corsAllowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  clientKeys: {
    web: env.appClientKeyWeb,
    mobile: env.appClientKeyMobile,
  },
});
