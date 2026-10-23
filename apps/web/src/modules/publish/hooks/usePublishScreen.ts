import { LAST_STEP, STEP_NAMES, STEP_TIPS } from './publish-data';
import { makePhotoTiles, usePublishForm } from './usePublishForm';

/** Publicar en escritorio: el formulario común más la lista de pasos y el medidor de calidad. */
export function usePublishScreen() {
  const form = usePublishForm();
  const { step, quality } = form;

  // La lista de pasos de la izquierda: hecho (con ✓), actual o pendiente
  const stepList = STEP_NAMES.map((name, index) => {
    const number = index + 1;
    const isDone = number < step;
    let className = 'st';
    if (number === step) className = 'st act';
    else if (isDone) className = 'st done';
    return {
      name,
      badge: isDone ? '✓' : String(number),
      className,
      goTo: () => form.goToStep(number),
    };
  });

  return {
    ...form,
    stepList,
    photoTiles: makePhotoTiles(4, 5),
    nextLabel: step === LAST_STEP ? 'Publicar propiedad' : 'Continuar',
    tip: STEP_TIPS[step - 1],
    // Círculo del medidor: 176 es el contorno completo; se "descubre" según la calidad
    ringOffset: Math.round(176 - (176 * quality) / 100),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type PublishScreenView = ReturnType<typeof usePublishScreen>;
