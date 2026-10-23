import { STEP_PROGRESS, STEP_REVIEW, useImportFlow } from './useImportFlow';

/** Importar en el teléfono: el flujo común más las tres rayitas de avance y el botón de abajo. */
export function useImportMobileScreen() {
  const flow = useImportFlow();
  const { step, readyCount } = flow;

  return {
    ...flow,
    progress1: 'pn on',
    progress2: step >= STEP_REVIEW ? 'pn on' : 'pn',
    progress3: step >= STEP_PROGRESS ? 'pn on' : 'pn',
    showNextButton: step === STEP_REVIEW || step === STEP_PROGRESS,
    nextLabel: step === STEP_REVIEW ? `Importar ${readyCount}` : 'Ver resultado',
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type ImportMobileScreenView = ReturnType<typeof useImportMobileScreen>;
