import { useState } from 'react';
import { toast } from '@/lib/toast';
import { LEADS, LEAD_COLORS, LEAD_STAGES } from './agency-data';
import { initialsOf } from './agency-style';

/**
 * Los interesados y su etapa, compartido por escritorio y teléfono.
 * Cada lead avanza una etapa a la vez con su botón; al pasar de la última sale del tablero.
 */
export function useLeadsBoard() {
  const [leads, setLeads] = useState(LEADS);

  function advanceLead(leadId: number) {
    setLeads(leads.map((lead) => (lead.id === leadId ? { ...lead, stage: lead.stage + 1 } : lead)));
    toast('Lead avanzado a la siguiente etapa');
  }

  /** Los leads de una etapa, listos para dibujar (opcionalmente solo los de un agente). */
  function leadsInStage(stageIndex: number, agentName?: string) {
    const isLastStage = stageIndex === LEAD_STAGES.length - 1;
    return leads
      .filter((lead) => lead.stage === stageIndex && (!agentName || lead.agentName === agentName))
      .map((lead, index) => ({
        id: lead.id,
        name: lead.name,
        initials: initialsOf(lead.name),
        color: LEAD_COLORS[lead.id % LEAD_COLORS.length],
        propertyTitle: lead.propertyTitle,
        price: lead.price,
        place: lead.place,
        message: lead.message,
        when: lead.when,
        agentName: lead.agentName,
        delay: `${index * 60}ms`,
        advanceLabel: isLastStage ? 'Cerrar' : LEAD_STAGES[stageIndex].advanceLabel,
        advance: () => advanceLead(lead.id),
      }));
  }

  return { leadsInStage };
}
