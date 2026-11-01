import { classIf } from '@/lib/classes';
import { usePropertyBooking } from './usePropertyBooking';

/** Ficha en escritorio: lo común más el estilo del corazón. */
export function usePropertyScreen() {
  const booking = usePropertyBooking();

  return {
    ...booking,
    favoriteButtonClass: classIf('heart', booking.isFavorite),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type PropertyScreenView = ReturnType<typeof usePropertyScreen>;
