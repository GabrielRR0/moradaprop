import type { Request } from 'express';
import type { Role } from '@prisma/client';

/** Usuario autenticado, sacado SIEMPRE del token (nunca del body ni de la URL). */
export interface AuthUser {
  id: string;
  roles: Role[];
  /** id de la sesion (refresh token) a la que pertenece este access token */
  sessionId: string;
  /** true si el usuario tiene 2FA activo y lo paso en esta sesion */
  twoFactor: boolean;
}

export type AppClient = 'web' | 'mobile';

export interface AppRequest extends Request {
  user?: AuthUser;
  appClient?: AppClient;
}

/** Contenido del access token. */
export interface AccessTokenPayload {
  sub: string;
  roles: Role[];
  sid: string;
  twoFactor: boolean;
  type: 'access';
}

/** Token corto que prueba que la contrasena fue correcta y falta el segundo paso. */
export interface TwoFactorChallengePayload {
  sub: string;
  type: '2fa-challenge';
}

/** Datos de la peticion que los services necesitan (sesiones, auditoria, bloqueos). */
export interface RequestContext {
  ip: string;
  userAgent?: string;
}
