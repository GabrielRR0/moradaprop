import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { AGENTS, PROPERTIES } from './agency-data';
import { photoTint } from './agency-style';
import { DAILY_VISITS, KPIS, RANGE_OPTIONS } from './dashboard-data';
import { useTodayTasks } from './useTodayTasks';

/** Resumen en escritorio: números grandes, gráfico de visitas, tareas de hoy, top de propiedades y equipo. */
export function useDashboardScreen() {
  const tasks = useTodayTasks(false);
  const [days, setDays] = useState(14);

  const kpis = KPIS.map((kpi, index) => ({
    label: kpi.label,
    value: kpi.value,
    note: kpi.note,
    icon: kpi.icon,
    delay: `${index * 80}ms`,
  }));

  // Gráfico: las barras son más altas mientras más visitas hubo ese día (la más alta llena el espacio)
  const visibleVisits = DAILY_VISITS.slice(-days);
  const mostVisits = Math.max(...visibleVisits);
  const chartBars = visibleVisits.map((visits, index) => ({
    height: `${Math.round((visits / mostVisits) * 100)}%`,
    className: index === visibleVisits.length - 1 ? 'bar hi' : 'bar',
    tooltip: `${visits} visitas`,
  }));

  const rangeButtons = RANGE_OPTIONS.map((option) => ({
    label: `${option} días`,
    className: classIf('seg', option === days),
    choose: () => setDays(option),
  }));

  // Las 4 propiedades con más visitas
  const topProperties = [...PROPERTIES]
    .sort((a, b) => b.views - a.views)
    .slice(0, 4)
    .map((property, index) => ({
      title: property.title,
      place: property.place,
      agent: AGENTS.find((agent) => agent.id === property.agentId)?.name ?? '',
      views: property.views,
      messages: property.messages,
      tint: photoTint(12 + index * 5),
    }));

  const teamPreview = AGENTS.map((agent) => ({
    name: agent.name,
    initials: agent.initials,
    role: agent.role,
    propertyCount: `${agent.propertyCount} prop.`,
    color: agent.color,
  }));

  return {
    ...tasks,
    kpis,
    chartBars,
    rangeButtons,
    rangeStartLabel: `Hace ${days} días`,
    topProperties,
    teamPreview,
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type DashboardScreenView = ReturnType<typeof useDashboardScreen>;
