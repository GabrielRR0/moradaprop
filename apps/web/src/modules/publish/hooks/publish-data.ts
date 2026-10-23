/** Opciones y textos del formulario de publicar. Para cambiar una opción se edita aquí. */

export const STEP_NAMES = [
  'Tipo',
  'Ubicación',
  'Detalles',
  'Servicios',
  'Fotos',
  'Precio y publicar',
];
export const LAST_STEP = STEP_NAMES.length;

/** Consejo que se muestra junto al medidor de calidad, según el paso. */
export const STEP_TIPS = [
  'Elige el tipo para empezar.',
  'Ubica bien el pin en el mapa.',
  'Agrega una descripción corta.',
  'Activa los servicios que tengas.',
  'Sube al menos 8 fotos.',
  'Todo listo para publicar.',
];

export interface PropertyTypeOption {
  name: string;
  icon: string;
}

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  {
    name: 'Apartamento',
    icon: 'M4 21V5l8-2v18M12 7h8v14M8 9h.01M8 13h.01M8 17h.01M16 11h.01M16 15h.01',
  },
  { name: 'Casa', icon: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6' },
  { name: 'Anexo', icon: 'M4 20V9l8-5 8 5v11zM9 20v-6h6v6' },
  { name: 'Habitación', icon: 'M3 18v-7a3 3 0 013-3h12a3 3 0 013 3v7M3 15h18M7 8V6h4v2' },
  {
    name: 'Local',
    icon: 'M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0M10 20v-5h4v5',
  },
  { name: 'Terreno', icon: 'M3 20h18M5 20l4-9 3 5 3-8 4 12' },
];

export interface AmenityOption {
  id: string;
  name: string;
  hint: string;
  icon: string;
}

/** Los servicios que más preguntan los inquilinos en Venezuela. */
export const AMENITIES: AmenityOption[] = [
  {
    id: 'generator',
    name: 'Planta eléctrica',
    hint: 'Respaldo cuando se va la luz',
    icon: 'M13 2L4 14h7l-1 8 9-12h-7z',
  },
  {
    id: 'water',
    name: 'Agua constante',
    hint: 'Tanque o hidroneumático',
    icon: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  },
  {
    id: 'fiber',
    name: 'Fibra óptica',
    hint: 'Internet de alta velocidad',
    icon: 'M2 9a15 15 0 0120 0M5 12.5a10.5 10.5 0 0114 0M8.5 16a5.5 5.5 0 017 0M12 19.5h.01',
  },
  {
    id: 'security',
    name: 'Vigilancia 24 horas',
    hint: 'Conjunto o edificio con seguridad',
    icon: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z',
  },
];
