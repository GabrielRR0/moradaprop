import { classIf } from '@/lib/classes';
import { photoTint } from '@/lib/properties';
import { usePropertyBooking } from './usePropertyBooking';

/** Ficha en el teléfono: lo común más el carrusel de fotos (o una foto de reemplazo si no hay). */
export function usePropertyMobileScreen() {
  const booking = usePropertyBooking('day');
  const photos = booking.property?.photos ?? [];

  return {
    ...booking,
    favoriteButtonClass: classIf('round', booking.isFavorite),
    photoTiles: photos.length
      ? photos.map((src, index) => ({ src, tint: photoTint(index) }))
      : [{ src: null, tint: photoTint(0) }],
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type PropertyMobileScreenView = ReturnType<typeof usePropertyMobileScreen>;
