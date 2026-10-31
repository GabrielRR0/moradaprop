import type { DbSupport } from '@/support/db';
import type { AgencyMemberResource } from './agency-member.resource';
import type { AgencyPlanResource, AgencyResource } from './agency.resource';

/** La agencia del usuario con su equipo y el uso de su plan. */
export interface MyAgencyResource {
  agency: AgencyResource;
  /** Rol de quien consulta dentro de la agencia. */
  myRole: DbSupport.AgencyMemberRole;
  plan: AgencyPlanResource;
  members: AgencyMemberResource[];
}
