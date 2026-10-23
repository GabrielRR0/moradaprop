/**
 * Datos de ejemplo de la inmobiliaria (equipo, propiedades y leads).
 * Mientras no haya API, todas las pantallas del panel leen de aquí.
 */

// ---------------------------------------------------------------- Equipo

export const ROLE_ADMIN = 'Administrador';
export const ROLE_AGENT = 'Agente';

/** Cuántos agentes permite el plan. */
export const MAX_AGENTS = 5;

export interface Agent {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  email: string;
  propertyCount: number;
  activeLeads: number;
}

export const AGENTS: Agent[] = [
  {
    id: 'andrea',
    name: 'Andrea',
    initials: 'AN',
    color: 'var(--ac)',
    role: ROLE_ADMIN,
    email: 'andrea@[dominio].com',
    propertyCount: 18,
    activeLeads: 6,
  },
  {
    id: 'luis',
    name: 'Luis',
    initials: 'LU',
    color: '#0E8A5F',
    role: ROLE_AGENT,
    email: 'luis@[dominio].com',
    propertyCount: 14,
    activeLeads: 4,
  },
  {
    id: 'marta',
    name: 'Marta',
    initials: 'MA',
    color: '#C2410C',
    role: ROLE_AGENT,
    email: 'marta@[dominio].com',
    propertyCount: 10,
    activeLeads: 5,
  },
];

export function findAgent(id: string): Agent {
  return AGENTS.find((agent) => agent.id === id) ?? AGENTS[0];
}

/** Qué puede hacer un agente (lo que no se marca "Sí" es solo del administrador). */
export const AGENT_PERMISSIONS = [
  { label: 'Ver y editar sus propiedades', agentCan: true },
  { label: 'Ver todas las propiedades', agentCan: false },
  { label: 'Responder sus leads', agentCan: true },
  { label: 'Importar desde Excel', agentCan: false },
  { label: 'Invitar y quitar agentes', agentCan: false },
  { label: 'Ver reportes de todo el equipo', agentCan: false },
];

// ---------------------------------------------------------------- Propiedades

/** Estados de una propiedad y su color (la lista también es el orden en que se van cambiando). */
export const PROPERTY_STATUSES = [
  { name: 'Publicada', color: '#1F9D55' },
  { name: 'Reservada', color: '#D98A00' },
  { name: 'Alquilada', color: '#6B7488' },
  { name: 'Pausada', color: '#D64545' },
];

export interface AgencyProperty {
  id: number;
  title: string;
  code: string;
  place: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  status: string;
  agentId: string;
  views: number;
  messages: number;
}

export const PROPERTIES: AgencyProperty[] = [
  {
    id: 1,
    title: 'Apartamento moderno con vista',
    code: 'P-1042',
    place: 'Los Palos Grandes',
    price: '$450',
    bedrooms: 2,
    bathrooms: 2,
    status: 'Publicada',
    agentId: 'andrea',
    views: 412,
    messages: 18,
  },
  {
    id: 2,
    title: 'Penthouse con terraza',
    code: 'P-1043',
    place: 'Altamira',
    price: '$1.800',
    bedrooms: 3,
    bathrooms: 3,
    status: 'Publicada',
    agentId: 'luis',
    views: 358,
    messages: 12,
  },
  {
    id: 3,
    title: 'Casa familiar con jardín',
    code: 'P-1038',
    place: 'La Lagunita',
    price: '$1.200',
    bedrooms: 4,
    bathrooms: 3,
    status: 'Reservada',
    agentId: 'andrea',
    views: 301,
    messages: 9,
  },
  {
    id: 4,
    title: 'Estudio amoblado',
    code: 'P-1051',
    place: 'Las Mercedes',
    price: '$320',
    bedrooms: 1,
    bathrooms: 1,
    status: 'Publicada',
    agentId: 'marta',
    views: 266,
    messages: 11,
  },
  {
    id: 5,
    title: 'Anexo acogedor y luminoso',
    code: 'P-1027',
    place: 'El Cafetal',
    price: '$280',
    bedrooms: 1,
    bathrooms: 1,
    status: 'Alquilada',
    agentId: 'luis',
    views: 190,
    messages: 6,
  },
  {
    id: 6,
    title: 'Apartamento céntrico',
    code: 'P-1033',
    place: 'Chacao',
    price: '$390',
    bedrooms: 2,
    bathrooms: 1,
    status: 'Pausada',
    agentId: 'marta',
    views: 144,
    messages: 3,
  },
  {
    id: 7,
    title: 'Apartamento con balcón',
    code: 'P-1060',
    place: 'Campo Alegre',
    price: '$520',
    bedrooms: 3,
    bathrooms: 2,
    status: 'Publicada',
    agentId: 'andrea',
    views: 128,
    messages: 5,
  },
  {
    id: 8,
    title: 'Local esquina comercial',
    code: 'P-1019',
    place: 'Sabana Grande',
    price: '$900',
    bedrooms: 0,
    bathrooms: 1,
    status: 'Reservada',
    agentId: 'luis',
    views: 97,
    messages: 4,
  },
];

// ---------------------------------------------------------------- Leads (interesados)

/** Etapas del tablero. `tabName` es el nombre corto que usa el teléfono. */
export const LEAD_STAGES = [
  { name: 'Nuevos', tabName: 'Nuevos', color: '#D98A00', advanceLabel: 'Marcar contactado' },
  {
    name: 'Contactados',
    tabName: 'Contactados',
    color: 'var(--ac)',
    advanceLabel: 'Agendar visita',
  },
  { name: 'Visita agendada', tabName: 'Visita', color: '#0E8A5F', advanceLabel: 'Pasar a reserva' },
  { name: 'En reserva', tabName: 'Reserva', color: '#C2410C', advanceLabel: 'Marcar alquilada' },
];

/** Una persona interesada. `stage` es la posición en LEAD_STAGES; al pasar de la última sale del tablero. */
export interface Lead {
  id: number;
  name: string;
  propertyTitle: string;
  price: string;
  place: string;
  message: string;
  when: string;
  agentName: string;
  stage: number;
}

export const LEADS: Lead[] = [
  {
    id: 1,
    name: 'Carlos P.',
    propertyTitle: 'Apartamento moderno con vista',
    price: '$450',
    place: 'Los Palos Grandes',
    message: '¿Sigue disponible? Me interesa visitarlo.',
    when: 'Hace 12 min',
    agentName: 'Andrea',
    stage: 0,
  },
  {
    id: 2,
    name: 'Daniela R.',
    propertyTitle: 'Estudio amoblado',
    price: '$320',
    place: 'Las Mercedes',
    message: '¿Incluye internet y condominio?',
    when: 'Hace 40 min',
    agentName: 'Marta',
    stage: 0,
  },
  {
    id: 3,
    name: 'Jesús M.',
    propertyTitle: 'Penthouse con terraza',
    price: '$1.800',
    place: 'Altamira',
    message: 'Buenas, ¿aceptan mascotas?',
    when: 'Hace 2 h',
    agentName: 'Luis',
    stage: 0,
  },
  {
    id: 4,
    name: 'Valentina G.',
    propertyTitle: 'Casa familiar con jardín',
    price: '$1.200',
    place: 'La Lagunita',
    message: 'Gracias por la info, lo converso en casa.',
    when: 'Ayer',
    agentName: 'Andrea',
    stage: 1,
  },
  {
    id: 5,
    name: 'Ricardo S.',
    propertyTitle: 'Apartamento con balcón',
    price: '$520',
    place: 'Campo Alegre',
    message: '¿Se puede ver el fin de semana?',
    when: 'Ayer',
    agentName: 'Andrea',
    stage: 1,
  },
  {
    id: 6,
    name: 'Mariana L.',
    propertyTitle: 'Apartamento céntrico',
    price: '$390',
    place: 'Chacao',
    message: 'Confirmo la visita de hoy.',
    when: 'Hoy 10:00',
    agentName: 'Marta',
    stage: 2,
  },
  {
    id: 7,
    name: 'Andrés F.',
    propertyTitle: 'Estudio amoblado',
    price: '$320',
    place: 'Las Mercedes',
    message: 'Nos vemos mañana a las 15:30.',
    when: 'Mañana 15:30',
    agentName: 'Marta',
    stage: 2,
  },
  {
    id: 8,
    name: 'Gabriela T.',
    propertyTitle: 'Casa familiar con jardín',
    price: '$1.200',
    place: 'La Lagunita',
    message: 'Listos para apartar. ¿Cómo hacemos el pago?',
    when: 'Hace 3 días',
    agentName: 'Andrea',
    stage: 3,
  },
];

/** Colores de los círculos con las iniciales de cada interesado. */
export const LEAD_COLORS = ['#5B4BE8', '#0E8A5F', '#C2410C', '#2563EB', '#B83280'];

// ---------------------------------------------------------------- Importar desde Excel

/** Filas del archivo que no se pudieron leer y cómo corregirlas. */
export const IMPORT_ERRORS = [
  {
    row: 7,
    message: 'Falta el precio',
    propertyName: 'Apartamento en Campo Alegre',
    placeholder: 'Ej: 450',
  },
  {
    row: 15,
    message: 'Municipio no reconocido',
    propertyName: 'Casa en "Chakao"',
    placeholder: 'Chacao',
  },
  {
    row: 22,
    message: 'Habitaciones debe ser un número',
    propertyName: 'Anexo en El Cafetal',
    placeholder: 'Ej: 2',
  },
  {
    row: 31,
    message: 'No se pudo ubicar en el mapa',
    propertyName: 'Local en Sabana Grande',
    placeholder: 'Dirección o referencia',
  },
];

/** Filas del archivo de ejemplo que ya estaban bien (de 48, 4 tienen error). */
export const IMPORT_READY_ROWS = 44;
