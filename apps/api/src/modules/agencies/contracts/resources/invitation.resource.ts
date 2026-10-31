import type { DbSupport } from '@/support/db';

/** Respuesta de invitar a un agente. */
export interface InvitationSentResource {
  /** Id del miembro (la invitación pendiente). */
  id: string;
  email: string;
  status: DbSupport.InvitationStatus;
}

/** Respuesta de aceptar una invitación. */
export interface InvitationAcceptedResource {
  message: string;
}
