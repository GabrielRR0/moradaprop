import type { DbSupport } from '@/support/db';

/** El usuario que se devuelve al iniciar sesion. Nunca incluye hashes ni secretos. */
export interface AuthUserResource {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: DbSupport.Role[];
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  /** Tiene contraseña propia (false si entra solo con Google o con passkey). */
  hasPassword: boolean;
}
