/** Datos de ejemplo del resumen (los números grandes, las visitas por día y las tareas de hoy). */

export interface Kpi {
  label: string;
  value: string;
  /** Frase de apoyo bajo el número (la versión de escritorio es más larga). */
  note: string;
  shortNote: string;
  shortLabel: string;
  icon: string;
}

export const KPIS: Kpi[] = [
  {
    label: 'Propiedades activas',
    shortLabel: 'Propiedades activas',
    value: '42',
    note: '3 por vencer esta semana',
    shortNote: '3 por vencer',
    icon: 'M3 11l9-8 9 8M5 10v10h14V10',
  },
  {
    label: 'Interesados nuevos',
    shortLabel: 'Interesados nuevos',
    value: '7',
    note: 'Responde en menos de 1 hora',
    shortNote: 'Responde pronto',
    icon: 'M21 12a9 9 0 01-13.4 7.8L3 21l1.3-4.4A9 9 0 1121 12z',
  },
  {
    label: 'Visitas agendadas',
    shortLabel: 'Visitas hoy',
    value: '2',
    note: 'Hoy 10:00 y 15:30',
    shortNote: '10:00 y 15:30',
    icon: 'M8 2v4M16 2v4M3 10h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
  },
  {
    label: 'En proceso de reserva',
    shortLabel: 'En reserva',
    value: '5',
    note: '1 lista para marcar alquilada',
    shortNote: '1 lista para cerrar',
    icon: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6zM9 12l2 2 4-4',
  },
];

/** Visitas a los anuncios, un número por día (el último es hoy). */
export const DAILY_VISITS = [
  38, 52, 44, 61, 70, 58, 66, 74, 49, 83, 91, 77, 88, 96, 72, 64, 80, 90, 55, 68, 79, 85, 60, 73,
  92, 87, 69, 76, 94, 100,
];

/** Cuántos días se pueden ver en el gráfico. */
export const RANGE_OPTIONS = [7, 14, 30];

/** Tareas del día (la versión del teléfono es un poco más corta). */
export const TODAY_TASKS = [
  { label: 'Responder 7 interesados nuevos', shortLabel: 'Responder 7 interesados' },
  { label: 'Confirmar visita de las 10:00', shortLabel: 'Confirmar visita de las 10:00' },
  { label: 'Agregar fotos a 5 propiedades', shortLabel: 'Agregar fotos a 5 propiedades' },
  { label: 'Renovar 3 anuncios por vencer', shortLabel: 'Renovar 3 anuncios por vencer' },
];
