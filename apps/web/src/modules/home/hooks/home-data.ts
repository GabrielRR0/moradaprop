/** Datos de ejemplo del inicio. Cuando haya API, la lista de propiedades vendrá de ahí. */

export interface HomeListing {
  id: number;
  title: string;
  place: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  /** Etiqueta sobre la foto ("Nuevo", "Destacado"). */
  badge: string;
  amenities: string[];
}

export const HOME_LISTINGS: HomeListing[] = [
  {
    id: 1,
    title: 'Apartamento moderno con vista',
    place: 'Los Palos Grandes, Caracas',
    price: '$450',
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    badge: 'Nuevo',
    amenities: ['Planta eléctrica', 'Fibra óptica'],
  },
  {
    id: 2,
    title: 'Casa familiar con jardín',
    place: 'La Lagunita, Caracas',
    price: '$1.200',
    bedrooms: 4,
    bathrooms: 3,
    area: 240,
    badge: 'Destacado',
    amenities: ['Vigilancia', 'Tanque de agua'],
  },
  {
    id: 3,
    title: 'Anexo acogedor y luminoso',
    place: 'El Cafetal, Caracas',
    price: '$280',
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    badge: 'Nuevo',
    amenities: ['Fibra óptica'],
  },
  {
    id: 4,
    title: 'Penthouse con terraza',
    place: 'Altamira, Caracas',
    price: '$1.800',
    bedrooms: 3,
    bathrooms: 3,
    area: 210,
    badge: 'Destacado',
    amenities: ['Planta eléctrica', 'Vigilancia'],
  },
  {
    id: 5,
    title: 'Apartamento céntrico',
    place: 'Chacao, Caracas',
    price: '$390',
    bedrooms: 2,
    bathrooms: 1,
    area: 70,
    badge: 'En proceso de reserva',
    amenities: ['Tanque de agua'],
  },
  {
    id: 6,
    title: 'Estudio amoblado',
    place: 'Las Mercedes, Caracas',
    price: '$320',
    bedrooms: 1,
    bathrooms: 1,
    area: 38,
    badge: 'Nuevo',
    amenities: ['Fibra óptica', 'Planta eléctrica'],
  },
];

/** Los cuatro filtros rápidos del buscador. */
export const QUICK_FILTERS = ['Planta eléctrica', 'Agua constante', 'Fibra óptica', 'Vigilancia'];
