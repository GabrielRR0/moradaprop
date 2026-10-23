/** Opciones de los filtros del mapa. Cada opción tiene un `id` (texto) y lo que se lee en pantalla. */

export interface FilterOption {
  id: string;
  label: string;
}

/** Los servicios que se filtran con un toque (los que más importan en Venezuela). */
export const AMENITY_FILTERS: Array<{
  key: 'hasGenerator' | 'hasWaterTank' | 'hasFiberOptic' | 'hasSecurity';
  label: string;
}> = [
  { key: 'hasGenerator', label: 'Planta eléctrica' },
  { key: 'hasWaterTank', label: 'Agua constante' },
  { key: 'hasFiberOptic', label: 'Fibra óptica' },
  { key: 'hasSecurity', label: 'Vigilancia' },
];

/** Precio máximo: el id es el monto en dólares, o "any" para no limitar. */
export const PRICE_OPTIONS: FilterOption[] = [
  { id: 'any', label: 'Cualquier precio' },
  { id: '150', label: 'Hasta $150' },
  { id: '300', label: 'Hasta $300' },
  { id: '500', label: 'Hasta $500' },
  { id: '800', label: 'Hasta $800' },
  { id: '1200', label: 'Hasta $1.200' },
  { id: '2000', label: 'Hasta $2.000' },
];

/** Mínimo de habitaciones: el id es el número, o "any". */
export const BEDROOM_OPTIONS: FilterOption[] = [
  { id: 'any', label: 'Cualquiera' },
  { id: '1', label: '1 o más' },
  { id: '2', label: '2 o más' },
  { id: '3', label: '3 o más' },
  { id: '4', label: '4 o más' },
];

/** Orden de la lista: el id es el mismo que entiende el API. */
export const SORT_OPTIONS: FilterOption[] = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
];

/** Convierte el id de una opción numérica ("any" o "500") en número o undefined. */
export function optionToNumber(id: string): number | undefined {
  return id === 'any' ? undefined : Number(id);
}
