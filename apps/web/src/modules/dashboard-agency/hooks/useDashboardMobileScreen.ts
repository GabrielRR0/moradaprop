import { KPIS } from './dashboard-data';
import { useTodayTasks } from './useTodayTasks';

/** Resumen en el teléfono: los cuatro números grandes y las tareas de hoy. */
export function useDashboardMobileScreen() {
  const tasks = useTodayTasks(true);

  const kpis = KPIS.map((kpi, index) => ({
    label: kpi.shortLabel,
    value: kpi.value,
    note: kpi.shortNote,
    delay: `${index * 70}ms`,
  }));

  return { ...tasks, kpis };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type DashboardMobileScreenView = ReturnType<typeof useDashboardMobileScreen>;
