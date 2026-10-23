import { AGENT_PERMISSIONS } from './agency-data';
import { useTeamMembers } from './useTeamMembers';

/** Equipo en escritorio: la lista común más la tabla de qué puede hacer cada rol. */
export function useTeamScreen() {
  const team = useTeamMembers();

  const permissions = AGENT_PERMISSIONS.map((permission) => ({
    label: permission.label,
    agentAccess: permission.agentCan ? 'Sí' : 'No',
    agentColor: permission.agentCan ? 'var(--ac-ink)' : 'var(--muted)',
  }));

  return { ...team, permissions };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type TeamScreenView = ReturnType<typeof useTeamScreen>;
