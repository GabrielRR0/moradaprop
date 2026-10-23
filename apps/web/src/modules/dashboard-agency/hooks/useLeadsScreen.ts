import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { AGENTS, LEAD_STAGES } from './agency-data';
import { useLeadsBoard } from './useLeadsBoard';

const ALL_AGENTS = 'Todos';

/** Leads en escritorio: tablero con una columna por etapa y filtro por agente. */
export function useLeadsScreen() {
  const board = useLeadsBoard();
  const [agentFilter, setAgentFilter] = useState(ALL_AGENTS);

  const agentFilters = [ALL_AGENTS, ...AGENTS.map((agent) => agent.name)].map((name) => ({
    label: name === ALL_AGENTS ? 'Todos los agentes' : name,
    className: classIf('chip', name === agentFilter),
    choose: () => setAgentFilter(name),
  }));

  const columns = LEAD_STAGES.map((stage, index) => {
    const leads = board.leadsInStage(index, agentFilter === ALL_AGENTS ? undefined : agentFilter);
    return { title: stage.name, color: stage.color, count: leads.length, leads };
  });

  return { agentFilters, columns };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type LeadsScreenView = ReturnType<typeof useLeadsScreen>;
