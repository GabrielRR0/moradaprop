import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { LEAD_STAGES } from './agency-data';
import { useLeadsBoard } from './useLeadsBoard';

/** Leads en el teléfono: una pestaña por etapa y las tarjetas de la etapa elegida. */
export function useLeadsMobileScreen() {
  const board = useLeadsBoard();
  const [activeStage, setActiveStage] = useState(0);

  const stageTabs = LEAD_STAGES.map((stage, index) => ({
    name: stage.tabName,
    count: board.leadsInStage(index).length,
    className: classIf('chip', index === activeStage),
    choose: () => setActiveStage(index),
  }));

  const leads = board.leadsInStage(activeStage);

  return { stageTabs, leads, isEmpty: leads.length === 0 };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type LeadsMobileScreenView = ReturnType<typeof useLeadsMobileScreen>;
