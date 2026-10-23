import type { User } from '@prisma/client';
import type { RequestContext } from '../../../common/security/types';

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
}

/** Resultado de login: sesion lista, o falta el segundo paso. */
export type LoginResult =
  | { twoFactorRequired: false; tokens: AuthTokens }
  | { twoFactorRequired: true; challengeToken: string; methods: Array<'totp' | 'backup' | 'email'> };

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
