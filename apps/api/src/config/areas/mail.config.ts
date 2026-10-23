import type { Env } from '../env';

export const mailConfig = (env: Env) => ({
  host: env.mailHost,
  port: env.mailPort,
  user: env.mailUser,
  password: env.mailPassword,
  from: env.mailFrom,
});
