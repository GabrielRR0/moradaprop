import { useTeamMembers } from './useTeamMembers';

/** Equipo en el teléfono: la lista común y el formulario de invitar. */
export function useTeamMobileScreen() {
  return useTeamMembers();
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type TeamMobileScreenView = ReturnType<typeof useTeamMobileScreen>;
