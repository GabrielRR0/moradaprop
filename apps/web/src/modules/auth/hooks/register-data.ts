/** Textos y opciones del registro. Para cambiar un mensaje se edita aquí, no en la lógica. */

export interface RegisterRole {
  id: string;
  /** Tarjeta de la primera pantalla. */
  title: string;
  /** Título corto (teléfono). */
  shortTitle: string;
  description: string;
  /** Versión corta de la descripción (teléfono). */
  shortDescription: string;
  icon: string;
  /** Título del formulario de datos. */
  dataTitle: string;
  /** Mensaje de la pantalla final y su botón. */
  doneText: string;
  shortDoneText: string;
  doneButton: string;
  doneLink: string;
  /** Panel de color de la izquierda (escritorio). */
  headline: string;
  subtitle: string;
  benefits: string[];
}

export const ROLES: RegisterRole[] = [
  {
    id: 'client',
    title: 'Busco dónde vivir',
    shortTitle: 'Busco dónde vivir',
    description: 'Explora el mapa y guarda tus favoritos.',
    shortDescription: 'Explora y guarda favoritos',
    icon: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-3.5-3.5',
    dataTitle: 'Tus datos',
    doneText: 'Ya puedes guardar favoritos y crear alertas de búsqueda.',
    shortDoneText: 'Ya puedes guardar favoritos y crear alertas de búsqueda.',
    doneButton: 'Explorar propiedades',
    doneLink: '/mapa',
    headline: 'Encuentra el lugar donde quieres vivir',
    subtitle: 'Guarda favoritos, crea alertas y escribe directo al dueño por WhatsApp.',
    benefits: [
      'Alertas cuando salga algo nuevo',
      'Favoritos en todos tus dispositivos',
      'Contacto directo, sin intermediarios',
    ],
  },
  {
    id: 'owner',
    title: 'Tengo una propiedad',
    shortTitle: 'Tengo una propiedad',
    description: 'La publicas tú mismo en unos minutos.',
    shortDescription: 'La publicas tú mismo',
    icon: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
    dataTitle: 'Tus datos',
    doneText: 'Ahora publica tu primera propiedad. Te guiamos paso a paso.',
    shortDoneText: 'Ahora publica tu primera propiedad. Te guiamos paso a paso.',
    doneButton: 'Publicar mi propiedad',
    doneLink: '/publicar',
    headline: 'Alquila tu propiedad sin complicarte',
    subtitle: 'Publícala paso a paso en minutos y recibe interesados por WhatsApp.',
    benefits: [
      'Formulario guiado, sin tecnicismos',
      'Fotos optimizadas automáticamente',
      'Tú decides cuándo pausarla o alquilarla',
    ],
  },
  {
    id: 'agency',
    title: 'Soy una inmobiliaria',
    shortTitle: 'Soy inmobiliaria',
    description: 'Inventario grande, equipo y reportes.',
    shortDescription: 'Inventario, equipo y reportes',
    icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01',
    dataTitle: 'Datos de tu inmobiliaria',
    doneText:
      'Tu espacio de trabajo está listo. Importa tu inventario o invita a tu primer agente.',
    shortDoneText: 'Tu espacio está listo. Publica tu primera propiedad o invita a tu equipo.',
    doneButton: 'Ir a mi panel',
    doneLink: '/panel',
    headline: 'Administra todo tu inventario en un solo lugar',
    subtitle: 'Importa desde Excel, invita a tu equipo y atiende cada interesado a tiempo.',
    benefits: [
      'Importación masiva desde Excel',
      'Cuentas para cada agente de tu equipo',
      'Leads y citas ordenados en un tablero',
    ],
  },
];

/** Pasos del registro. */
export const STEP_ROLE = 1;
export const STEP_DATA = 2;
export const STEP_CODE = 3;
export const STEP_DONE = 4;

/** Nombre de la fuerza de la contraseña: la posición es cuántos requisitos cumple (0 a 4). */
export const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
