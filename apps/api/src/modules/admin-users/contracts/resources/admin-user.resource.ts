import type { DbSupport } from '@/support/db';

/** Un usuario como lo ve el panel de administracion (sin contrasena ni secretos). */
export interface AdminUserResource {
  id: string;
  email: string;
  name: string;
  roles: DbSupport.Role[];
  status: DbSupport.UserStatus;
  emailVerifiedAt: Date | null;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/** Pagina de usuarios. */
export interface AdminUserListResource {
  items: AdminUserResource[];
  total: number;
  page: number;
  limit: number;
}

/** Resultado de suspender o reactivar una cuenta. */
export interface UserStatusChangedResource {
  id: string;
  status: DbSupport.UserStatus;
}
