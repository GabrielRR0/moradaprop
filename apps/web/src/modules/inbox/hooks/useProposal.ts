import { useState } from 'react';
import { formatSlot } from '@/lib/appointments';

/** Horas que se ofrecen para elegir (de 8:00 a 17:00). */
export const PROPOSAL_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const DAYS_AHEAD = 14;
export const MAX_SLOTS = 5;

const WEEKDAY = new Intl.DateTimeFormat('es', { weekday: 'short' });

/** Fecha y hora locales -> instante exacto (ISO) que se manda al API. */
function at(day: Date, hour: string): Date {
  const [h, m] = hour.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

/**
 * Las fechas que quien gestiona ofrece al cliente: elige un día, toca las horas que le sirven y puede
 * juntar hasta 5. Las horas que ya pasaron hoy no se pueden elegir.
 */
export function useProposal() {
  const [dayIndex, setDayIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const today = new Date();
  const days = Array.from({ length: DAYS_AHEAD }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    return { index, date, weekday: WEEKDAY.format(date).replace('.', ''), number: date.getDate() };
  });
  const day = days[dayIndex].date;

  const hours = PROPOSAL_HOURS.map((hour) => {
    const iso = at(day, hour).toISOString();
    return {
      hour,
      iso,
      past: at(day, hour).getTime() <= Date.now(),
      on: picked.includes(iso),
    };
  });

  const toggle = (iso: string) =>
    setPicked((current) => (current.includes(iso) ? current.filter((value) => value !== iso) : current.length >= MAX_SLOTS ? current : [...current, iso]));

  return {
    days,
    dayIndex,
    chooseDay: setDayIndex,
    hours,
    toggle,
    picked: [...picked].sort().map((iso) => ({ iso, label: formatSlot(iso) })),
    remove: (iso: string) => setPicked((current) => current.filter((value) => value !== iso)),
    full: picked.length >= MAX_SLOTS,
    note,
    setNote,
    reset: () => {
      setPicked([]);
      setNote('');
      setDayIndex(0);
    },
  };
}

export type ProposalView = ReturnType<typeof useProposal>;
