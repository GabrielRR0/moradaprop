import type { DbSupport } from '@/support/db';

/** Un miembro del equipo. `user` es null mientras la invitación no se ha aceptado. */
export interface AgencyMemberResource {
  id: string;
  role: DbSupport.AgencyMemberRole;
  invitationStatus: DbSupport.InvitationStatus;
  invitedEmail: string;
  createdAt: Date;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}
