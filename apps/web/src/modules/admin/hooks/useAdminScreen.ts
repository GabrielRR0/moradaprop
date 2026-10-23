import { useState } from 'react';
import { toast } from '@/lib/toast';
import {
  OTHER_PENDING,
  PAST_LOG,
  REVIEW_QUEUE,
  VERDICTS,
  type LogEntry,
  type ReviewListing,
} from './admin-data';

const GREEN = '#1F9D55';
const AMBER = '#D98A00';

/** Fondo y texto de la etiqueta de la cola: verde si todo está bien, ámbar si hay algo que mirar. */
function summaryStyle(isClean: boolean): string {
  const color = isClean ? GREEN : AMBER;
  const strength = isClean ? 16 : 18;
  return `background:color-mix(in srgb, ${color} ${strength}%, var(--surf)); color:color-mix(in srgb, ${color} 75%, var(--text))`;
}

function tint(id: number): string {
  return `background:color-mix(in srgb, var(--ac) ${10 + id * 4}%, var(--surf2))`;
}

/** Moderación: la cola de anuncios por revisar, el detalle del elegido y las decisiones. */
export function useAdminScreen() {
  const [selectedId, setSelectedId] = useState(1);
  const [reviewedIds, setReviewedIds] = useState<number[]>([]);
  const [newLog, setNewLog] = useState<LogEntry[]>([]);

  const waiting = REVIEW_QUEUE.filter((listing) => !reviewedIds.includes(listing.id));
  // Si el elegido ya se revisó, se muestra el primero que quede
  const current: ReviewListing | undefined = waiting.find((l) => l.id === selectedId) ?? waiting[0];

  const queue = waiting.map((listing, index) => ({
    id: listing.id,
    title: listing.title,
    author: listing.author,
    when: listing.when,
    summary: listing.summary,
    summaryStyle: summaryStyle(listing.checks.every((check) => check.passed)),
    className: listing.id === current?.id ? 'q sel' : 'q',
    tint: tint(listing.id),
    delay: `${index * 60}ms`,
    choose: () => setSelectedId(listing.id),
  }));

  // La revisión automática del anuncio elegido: una fila por cada cosa que se revisó
  const currentChecks = (current?.checks ?? []).map((check) => ({
    label: check.label,
    note: check.passed ? 'Correcto' : (check.problem ?? ''),
    badgeColor: check.passed ? GREEN : AMBER,
    icon: check.passed ? 'M5 12l5 5 9-10' : 'M12 7v6M12 17h.01',
  }));

  function decide(verdict: { word: string; color: string }) {
    if (!current) return;
    toast(`${verdict.word}: ${current.title}`, verdict === VERDICTS.rejected ? 'warn' : 'ok');
    setReviewedIds([...reviewedIds, current.id]);
    setNewLog([
      { what: `${verdict.word}: ${current.title}`, who: 'Tú', when: 'ahora', color: verdict.color },
      ...newLog,
    ]);
  }

  return {
    pendingCount: waiting.length + OTHER_PENDING,
    queue,
    queueIsEmpty: waiting.length === 0,

    hasCurrent: current !== undefined,
    // El anuncio elegido (vacío cuando no queda ninguno por revisar)
    current: {
      title: current?.title ?? '',
      place: current?.place ?? '',
      price: current?.price ?? '',
      author: current?.author ?? '',
      when: current?.when ?? '',
      tint: tint(current?.id ?? 0),
    },
    currentChecks,

    approve: () => decide(VERDICTS.approved),
    askChanges: () => decide(VERDICTS.changes),
    reject: () => decide(VERDICTS.rejected),

    log: [...newLog, ...PAST_LOG].slice(0, 7),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type AdminScreenView = ReturnType<typeof useAdminScreen>;
