import { classIf } from '@/lib/classes';
import { usePropertyBooking } from './usePropertyBooking';

/** Ficha en el teléfono: lo común más las cuatro fotos del carrusel. */
export function usePropertyMobileScreen() {
  const booking = usePropertyBooking('day');

  return {
    ...booking,
    favoriteButtonClass: classIf('round', booking.isFavorite),
    photoTiles: [0, 1, 2, 3].map((index) => ({
      tint: `background:color-mix(in srgb, var(--ac) ${14 + index * 5}%, var(--surf2))`,
    })),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type PropertyMobileScreenView = ReturnType<typeof usePropertyMobileScreen>;
