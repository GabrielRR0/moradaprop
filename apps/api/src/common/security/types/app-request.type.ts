import type { Request } from 'express';
import type { AuthUserContext } from './auth-user-context.type';

export type AppClient = 'web' | 'mobile';

/** Peticion de Express con lo que le agregan los guards: usuario, pais y app de origen. */
export interface AppRequest extends Request {
  user?: AuthUserContext;
  /** Pais de confianza de la peticion (modules/security/geo); null si no se sabe. */
  country?: string | null;
  appClient?: AppClient;
}
