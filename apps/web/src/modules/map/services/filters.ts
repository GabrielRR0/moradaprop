import type { Bounds } from './types';

/** Cómo se ordena la lista: más reciente, precio de menor a mayor o de mayor a menor. */
export type SortOrder = 'recent' | 'price_asc' | 'price_desc';

/** Filtros de búsqueda. Tienen los mismos nombres que acepta el API (`SearchPropertiesDto`). */
export interface PropertyFilters {
  q?: string;
  state?: string;
  municipality?: string;
  type?: string;
  currency?: 'USD' | 'VES';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  hasGenerator?: boolean;
  hasWaterTank?: boolean;
  hasFiberOptic?: boolean;
  hasSecurity?: boolean;
  sort?: SortOrder;
}

// ---------------------------------------------------------------- Filtros -> URL / API

function addText(params: URLSearchParams, name: string, value: string | undefined) {
  if (value) params.set(name, value);
}

function addNumber(params: URLSearchParams, name: string, value: number | undefined) {
  if (value !== undefined) params.set(name, String(value));
}

function addFlag(params: URLSearchParams, name: string, value: boolean | undefined) {
  if (value) params.set(name, 'true');
}

/** Parámetros de la URL (y del API) para estos filtros. Solo se escribe lo que tiene valor. */
export function filtersToParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  addText(params, 'q', filters.q);
  addText(params, 'state', filters.state);
  addText(params, 'municipality', filters.municipality);
  addText(params, 'type', filters.type);
  addNumber(params, 'minPrice', filters.minPrice);
  addNumber(params, 'maxPrice', filters.maxPrice);
  addNumber(params, 'bedrooms', filters.bedrooms);
  addNumber(params, 'bathrooms', filters.bathrooms);
  addNumber(params, 'parkingSpots', filters.parkingSpots);
  addFlag(params, 'hasGenerator', filters.hasGenerator);
  addFlag(params, 'hasWaterTank', filters.hasWaterTank);
  addFlag(params, 'hasFiberOptic', filters.hasFiberOptic);
  addFlag(params, 'hasSecurity', filters.hasSecurity);
  if (filters.currency === 'VES') params.set('currency', 'VES');
  if (filters.sort && filters.sort !== 'recent') params.set('sort', filters.sort);
  return params;
}

// ---------------------------------------------------------------- URL -> filtros

function readText(params: URLSearchParams, name: string): string | undefined {
  return params.get(name) || undefined;
}

function readNumber(params: URLSearchParams, name: string): number | undefined {
  const text = params.get(name);
  if (text === null || text === '') return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

function readFlag(params: URLSearchParams, name: string): boolean | undefined {
  return params.get(name) === 'true' ? true : undefined;
}

/** Los filtros que vienen en la URL (lo que no se entiende se ignora). */
export function filtersFromParams(params: URLSearchParams): PropertyFilters {
  const sort = params.get('sort');
  return cleanFilters({
    q: readText(params, 'q'),
    state: readText(params, 'state'),
    municipality: readText(params, 'municipality'),
    type: readText(params, 'type'),
    minPrice: readNumber(params, 'minPrice'),
    maxPrice: readNumber(params, 'maxPrice'),
    bedrooms: readNumber(params, 'bedrooms'),
    bathrooms: readNumber(params, 'bathrooms'),
    parkingSpots: readNumber(params, 'parkingSpots'),
    hasGenerator: readFlag(params, 'hasGenerator'),
    hasWaterTank: readFlag(params, 'hasWaterTank'),
    hasFiberOptic: readFlag(params, 'hasFiberOptic'),
    hasSecurity: readFlag(params, 'hasSecurity'),
    currency: params.get('currency') === 'VES' ? 'VES' : undefined,
    sort: sort === 'price_asc' || sort === 'price_desc' ? sort : undefined,
  });
}

/** Quita los filtros vacíos (undefined, false o texto vacío) para que no cuenten como activos. */
export function cleanFilters(filters: PropertyFilters): PropertyFilters {
  const clean: PropertyFilters = {};
  for (const [name, value] of Object.entries(filters)) {
    if (value !== undefined && value !== false && value !== '') {
      Object.assign(clean, { [name]: value });
    }
  }
  return clean;
}

/** Cuántos filtros hay activos (el numerito de "Más filtros"). El texto y el orden no cuentan. */
export function countActiveFilters(filters: PropertyFilters): number {
  const checks = [
    filters.state,
    filters.municipality,
    filters.type,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
    filters.parkingSpots,
    filters.hasGenerator,
    filters.hasWaterTank,
    filters.hasFiberOptic,
    filters.hasSecurity,
  ];
  return checks.filter((value) => value !== undefined && value !== false && value !== '').length;
}

/** Agrega la caja del mapa (esquina suroeste y noreste) a los parámetros. */
export function boundsToParams(params: URLSearchParams, bounds?: Bounds) {
  if (!bounds) return;
  params.set('swLat', bounds.swLat.toFixed(5));
  params.set('swLng', bounds.swLng.toFixed(5));
  params.set('neLat', bounds.neLat.toFixed(5));
  params.set('neLng', bounds.neLng.toFixed(5));
}
