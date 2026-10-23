import { STEP_DONE } from './register-data';
import { useRegisterFlow } from './useRegisterFlow';

/** Registro en escritorio: el flujo común más el panel de color de la izquierda. */
export function useRegisterScreen() {
  const flow = useRegisterFlow();
  const { role, step } = flow;

  return {
    ...flow,

    // Panel de la izquierda: cambia según el perfil
    headline: role.headline,
    subtitle: role.subtitle,
    benefit1: role.benefits[0],
    benefit2: role.benefits[1],
    benefit3: role.benefits[2],

    // Pantalla final
    doneText: role.doneText,

    // "Paso 2 de 3" sobre el formulario
    stepLabel: step === STEP_DONE ? 'Listo' : `Paso ${step} de 3`,
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type RegisterScreenView = ReturnType<typeof useRegisterScreen>;
