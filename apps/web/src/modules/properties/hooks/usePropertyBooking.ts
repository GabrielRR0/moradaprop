import { useState } from 'react';
import { toast } from '@/lib/toast';
import { VISIT_DAYS } from './property-data';

/**
 * Lo que se puede hacer en la ficha, compartido por escritorio y teléfono:
 * guardar en favoritos, elegir el día de la visita y pedirla.
 * `dayClass` es la clase base de los botones de día ("chip" en escritorio, "day" en teléfono).
 */
export function usePropertyBooking(dayClass: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [dayIndex, setDayIndex] = useState(1);

  function toggleFavorite() {
    setIsFavorite(!isFavorite);
    toast(isFavorite ? 'Quitada de favoritos' : 'Guardada en favoritos');
  }

  return {
    // Corazón: se llena y toma el color de marca cuando está guardada
    favoriteFill: isFavorite ? 'currentColor' : 'none',
    favoriteColor: isFavorite ? 'var(--ac-ink)' : 'var(--text)',
    isFavorite,
    toggleFavorite,

    visitDays: VISIT_DAYS.map((day, index) => ({
      name: day.name,
      number: day.number,
      className: index === dayIndex ? `${dayClass} on` : dayClass,
      choose: () => setDayIndex(index),
    })),
    selectedDayName: VISIT_DAYS[dayIndex].name,
    requestVisit: () => toast('Solicitud de visita enviada. El agente te confirmará.'),
  };
}
