import type { DbSupport } from '@/support/db';

/** Usuario autenticado, sacado SIEMPRE del token (nunca del body ni de la URL). */
export interface AuthUserContext {
  id: string;
  roles: DbSupport.Role[];
  /** id de la sesion (refresh token) a la que pertenece este access token */
  sessionId: string;
  /** true si el usuario tiene 2FA activo y lo paso en esta sesion */
  twoFactor: boolean;
  /** true si debe activar passkey o 2FA y todavia no lo hizo: solo puede usar las rutas de enrolamiento (security/second-factor) */
  enroll?: boolean;
}
