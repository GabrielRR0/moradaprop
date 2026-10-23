/** Datos de ejemplo de la ficha de propiedad (días y horas de visita, y propiedades parecidas). */

export interface VisitDay {
  /** Nombre corto del día ("Hoy", "Sáb"). */
  name: string;
  /** Número del día del mes. */
  number: string;
}

export const VISIT_DAYS: VisitDay[] = [
  { name: 'Hoy', number: '22' },
  { name: 'Mañana', number: '23' },
  { name: 'Sáb', number: '24' },
  { name: 'Dom', number: '25' },
  { name: 'Lun', number: '26' },
];

export const VISIT_SLOTS = ['9:00', '10:30', '15:00', '16:30'];

export const SIMILAR_PROPERTIES = [
  {
    price: '$520',
    title: 'Apartamento con balcón',
    place: 'Campo Alegre',
    specs: '3 hab · 2 baños',
  },
  { price: '$390', title: 'Apartamento céntrico', place: 'Chacao', specs: '2 hab · 1 baño' },
  { price: '$480', title: 'Apartamento luminoso', place: 'Altamira', specs: '2 hab · 2 baños' },
];
