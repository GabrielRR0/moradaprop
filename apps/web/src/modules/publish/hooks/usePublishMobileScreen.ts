import { LAST_STEP } from './publish-data';
import { makePhotoTiles, usePublishForm } from './usePublishForm';

/** Publicar en el teléfono: el formulario común más la barra de avance de arriba. */
export function usePublishMobileScreen() {
  const form = usePublishForm();
  const { step } = form;

  return {
    ...form,
    // Seis rayitas: de color de marca hasta el paso actual, grises después
    progressBars: Array.from({ length: LAST_STEP }, (_, index) => ({
      color: index + 1 <= step ? 'var(--ac)' : 'var(--line)',
    })),
    photoTiles: makePhotoTiles(6, 4),
    nextLabel: step === LAST_STEP ? 'Publicar' : 'Continuar',
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type PublishMobileScreenView = ReturnType<typeof usePublishMobileScreen>;
