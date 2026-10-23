import { STEP_DATA, STEP_DONE, STEP_ROLE } from './register-data';
import { useRegisterFlow } from './useRegisterFlow';

/** Registro en el teléfono: el flujo común más el botón de abajo (Continuar / Crear cuenta / Verificar). */
export function useRegisterMobileScreen() {
  const flow = useRegisterFlow();
  const { role, step } = flow;

  let nextLabel = 'Verificar';
  if (step === STEP_ROLE) nextLabel = 'Continuar';
  if (step === STEP_DATA) nextLabel = 'Crear cuenta';

  return {
    ...flow,
    doneText: role.shortDoneText,
    showFooter: step < STEP_DONE,
    canGoBack: step > STEP_ROLE,
    nextLabel,
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type RegisterMobileScreenView = ReturnType<typeof useRegisterMobileScreen>;
