import { STEP_FILE, STEP_PROGRESS, STEP_REVIEW, useImportFlow } from './useImportFlow';

/** Importar en escritorio: el flujo común más los tres círculos de avance de arriba. */
export function useImportScreen() {
  const flow = useImportFlow();
  const { step } = flow;

  let circle2 = 'pn';
  if (step === STEP_REVIEW) circle2 = 'pn act';
  else if (step > STEP_REVIEW) circle2 = 'pn done';

  return {
    ...flow,
    // Cada círculo: pendiente ("pn"), actual ("pn act") o hecho ("pn done")
    progress1: step === STEP_FILE ? 'pn act' : 'pn done',
    progress2: circle2,
    progress3: step >= STEP_PROGRESS ? 'pn act' : 'pn',
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type ImportScreenView = ReturnType<typeof useImportScreen>;
