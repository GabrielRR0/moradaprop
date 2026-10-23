import { useState } from 'react';
import { TODAY_TASKS } from './dashboard-data';

/** La lista "Para hoy" con casillas, compartida por escritorio y teléfono. `short` usa los textos cortos. */
export function useTodayTasks(short: boolean) {
  // Posiciones de las tareas ya hechas (la segunda viene hecha de ejemplo)
  const [doneIndexes, setDoneIndexes] = useState<number[]>([1]);

  function toggleTask(index: number) {
    if (doneIndexes.includes(index)) setDoneIndexes(doneIndexes.filter((other) => other !== index));
    else setDoneIndexes([...doneIndexes, index]);
  }

  return {
    todoItems: TODAY_TASKS.map((task, index) => ({
      label: short ? task.shortLabel : task.label,
      className: doneIndexes.includes(index) ? 'todo done' : 'todo',
      toggle: () => toggleTask(index),
    })),
    todosDone: doneIndexes.length,
  };
}
