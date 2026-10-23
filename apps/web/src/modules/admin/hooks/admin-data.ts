/** Anuncios de ejemplo que espera revisar el administrador. */

export interface ReviewCheck {
  label: string;
  /** true = la revisión automática no encontró problema. */
  passed: boolean;
  /** Qué se encontró cuando no pasó. */
  problem?: string;
}

export interface ReviewListing {
  id: number;
  title: string;
  place: string;
  price: string;
  author: string;
  when: string;
  /** Resumen corto que se ve en la cola ("Todo en orden", "Pocas fotos"…). */
  summary: string;
  checks: ReviewCheck[];
}

const PHOTOS = 'Fotos nítidas y sin marcas de agua';
const PRICE = 'Precio dentro del rango de la zona';
const CONTACT = 'Sin teléfono ni correo en el texto';
const LOCATION = 'Ubicación coincide con la zona indicada';

export const REVIEW_QUEUE: ReviewListing[] = [
  {
    id: 1,
    title: 'Casa familiar con jardín',
    place: 'La Lagunita',
    price: '$1.200',
    author: 'Particular · Carlos',
    when: 'Hace 8 min',
    summary: 'Precio alto para la zona',
    checks: [
      { label: PHOTOS, passed: true },
      { label: PRICE, passed: false, problem: 'Un 38% sobre el promedio' },
      { label: CONTACT, passed: true },
      { label: LOCATION, passed: true },
    ],
  },
  {
    id: 2,
    title: 'Apartamento amoblado',
    place: 'Chacao',
    price: '$480',
    author: 'Inmobiliaria [Nombre]',
    when: 'Hace 21 min',
    summary: 'Todo en orden',
    checks: [
      { label: PHOTOS, passed: true },
      { label: PRICE, passed: true },
      { label: CONTACT, passed: true },
      { label: LOCATION, passed: true },
    ],
  },
  {
    id: 3,
    title: 'Local comercial esquina',
    place: 'Sabana Grande',
    price: '$900',
    author: 'Particular · Luisa',
    when: 'Hace 1 h',
    summary: 'Contacto en el texto',
    checks: [
      { label: PHOTOS, passed: true },
      { label: PRICE, passed: true },
      { label: CONTACT, passed: false, problem: 'Hay un número en la descripción' },
      { label: LOCATION, passed: true },
    ],
  },
  {
    id: 4,
    title: 'Anexo con terraza',
    place: 'El Cafetal',
    price: '$300',
    author: 'Particular · Pedro',
    when: 'Hace 2 h',
    summary: 'Pocas fotos',
    checks: [
      { label: PHOTOS, passed: false, problem: 'Solo 2 fotos' },
      { label: PRICE, passed: true },
      { label: CONTACT, passed: true },
      { label: LOCATION, passed: true },
    ],
  },
  {
    id: 5,
    title: 'Penthouse con vista',
    place: 'Altamira',
    price: '$1.900',
    author: 'Inmobiliaria [Nombre]',
    when: 'Hace 3 h',
    summary: 'Todo en orden',
    checks: [
      { label: PHOTOS, passed: true },
      { label: PRICE, passed: true },
      { label: CONTACT, passed: true },
      { label: LOCATION, passed: true },
    ],
  },
];

/** Cuántos anuncios más hay esperando además de los de ejemplo de la cola. */
export const OTHER_PENDING = 7;

export interface LogEntry {
  what: string;
  who: string;
  when: string;
  color: string;
}

/** Movimientos anteriores de la auditoría. */
export const PAST_LOG: LogEntry[] = [
  { what: 'Aprobado: Estudio amoblado', who: 'Moderador 2', when: 'hace 12 min', color: '#1F9D55' },
  { what: 'Bloqueo de IP creado', who: 'Moderador 1', when: 'hace 40 min', color: '#D64545' },
  { what: 'Rechazado: anuncio duplicado', who: 'Moderador 2', when: 'hace 1 h', color: '#D64545' },
  {
    what: 'Cuenta de inmobiliaria verificada',
    who: 'Moderador 1',
    when: 'hace 2 h',
    color: 'var(--ac)',
  },
  {
    what: 'Cambios pedidos: Local en Las Mercedes',
    who: 'Moderador 2',
    when: 'hace 3 h',
    color: '#D98A00',
  },
];

/** Las tres decisiones que puede tomar el administrador y el color con que quedan en la auditoría. */
export const VERDICTS = {
  approved: { word: 'Aprobado', color: '#1F9D55' },
  rejected: { word: 'Rechazado', color: '#D64545' },
  changes: { word: 'Cambios pedidos', color: '#D98A00' },
};
