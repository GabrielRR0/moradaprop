import type { DbSupport } from '@/support/db';

/** Cuenta social vinculada (por ejemplo Google). */
export interface UserSocialAccountResource {
  provider: string;
  email: string | null;
}

/** Agencia a la que pertenece el usuario, con su rol dentro de ella. */
export interface UserAgencyMembershipResource {
  role: DbSupport.AgencyMemberRole;
  agency: { id: string; name: string; logoUrl: string | null };
}

/** Perfil del usuario del token. Nunca incluye hashes ni secretos. */
export interface UserProfileResource {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: DbSupport.Role[];
  twoFactorEnabled: boolean;
  createdAt: Date;
  /** Su correo ya fue verificado. */
  emailVerified: boolean;
  /** Tiene contraseña propia (false si entra solo con una cuenta social). */
  hasPassword: boolean;
  socialAccounts: UserSocialAccountResource[];
  agencyMembers: UserAgencyMembershipResource[];
}
