import type { User } from '@prisma/client';
import type { RequestContext } from '../../../common/security/types';
import type { SecondFactorStatus } from '../../security';

export type { RequestContext };

/** Usuario que se devuelve al cliente: nunca incluye hashes ni secretos. */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    emailVerified: Boolean(user.emailVerifiedAt),
    twoFactorEnabled: user.twoFactorEnabled,
    hasPassword: Boolean(user.passwordHash),
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;

/** Resultado de un inicio de sesion completo. */
export interface AuthTokens {
  user: PublicUser;
  accessToken: string;
  /** Token crudo: el controller lo pone en cookie (web) o en el body (mobile). */
  refreshToken: string;
  /** Secreto de un dispositivo NUEVO (access-risk): cookie device_token en web, body en mobile. */
  deviceToken?: string;
  /** Si debe activar passkey o 2FA, hasta cuando, y si esta limitado (security/second-factor). */
  enrollment?: SecondFactorStatus;
}

/** Resultado de login: sesion lista, o falta el segundo paso. */
export type LoginResult =
  | { twoFactorRequired: false; tokens: AuthTokens }
  | {
      twoFactorRequired: true;
      challengeToken: string;
      methods: Array<'passkey' | 'totp' | 'backup' | 'email'>;
      /** true si el segundo paso se pide porque el inicio de sesion es inusual (pais, red o dispositivo nuevos). */
      unusual?: boolean;
    };

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
