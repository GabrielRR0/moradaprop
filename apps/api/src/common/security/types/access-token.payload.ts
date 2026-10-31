import type { DbSupport } from '@/support/db';

/** Contenido del access token. */
export interface AccessTokenPayload {
  sub: string;
  roles: DbSupport.Role[];
  sid: string;
  twoFactor: boolean;
  /** Ver AuthUserContext.enroll. Solo viaja cuando es true. */
  enroll?: boolean;
  type: 'access';
}
