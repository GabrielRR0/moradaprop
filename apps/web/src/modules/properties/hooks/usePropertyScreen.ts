import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { toast } from '@/lib/toast';
import { VISIT_SLOTS } from './property-data';
import { usePropertyBooking } from './usePropertyBooking';

/** Ficha en escritorio: lo común más la hora de la visita, "Apartar" y las propiedades parecidas. */
export function usePropertyScreen() {
  const booking = usePropertyBooking('chip');
  const [slotIndex, setSlotIndex] = useState(1);

  return {
    ...booking,
    favoriteButtonClass: classIf('heart', booking.isFavorite),

    visitSlots: VISIT_SLOTS.map((time, index) => ({
      label: time,
      className: classIf('slot', index === slotIndex),
      choose: () => setSlotIndex(index),
    })),
    // Texto del botón: "Solicitar visita · Mañana 10:30"
    visitSummary: `${booking.selectedDayName} ${VISIT_SLOTS[slotIndex]}`,
    reserve: () => toast('Propiedad apartada. El agente te contactará para confirmar.'),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type PropertyScreenView = ReturnType<typeof usePropertyScreen>;
