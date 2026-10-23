import type { MapView } from '../services/types';

/**
 * Lugares de Venezuela para el buscador del mapa: estados, ciudades y zonas conocidas.
 * Es una lista fija (centro y zoom de MapLibre) mientras el API no tenga buscador de ubicaciones.
 */
export interface Place {
  label: string;
  hint: string;
  kind: 'state' | 'city' | 'zone';
  view: MapView;
}

const state = (label: string, lat: number, lng: number, zoom: number): Place => ({
  label,
  hint: 'Estado',
  kind: 'state',
  view: { lat, lng, zoom },
});
const city = (label: string, hint: string, lat: number, lng: number, zoom = 12): Place => ({
  label,
  hint,
  kind: 'city',
  view: { lat, lng, zoom },
});
const zone = (label: string, hint: string, lat: number, lng: number): Place => ({
  label,
  hint,
  kind: 'zone',
  view: { lat, lng, zoom: 14.5 },
});

export const PLACES: Place[] = [
  city('Caracas', 'Distrito Capital', 10.4806, -66.9036, 11.2),
  city('Maracaibo', 'Zulia', 10.6544, -71.6406),
  city('Valencia', 'Carabobo', 10.162, -68.0077),
  city('Barquisimeto', 'Lara', 10.0678, -69.3467),
  city('Maracay', 'Aragua', 10.2469, -67.5958),
  city('Mérida', 'Mérida', 8.5897, -71.1561),
  city('San Cristóbal', 'Táchira', 7.7669, -72.225),
  city('Puerto Ordaz', 'Bolívar', 8.2965, -62.7165),
  city('Ciudad Bolívar', 'Bolívar', 8.1222, -63.5497),
  city('Barcelona', 'Anzoátegui', 10.1362, -64.6862),
  city('Lechería', 'Anzoátegui', 10.1894, -64.6919),
  city('Puerto La Cruz', 'Anzoátegui', 10.2141, -64.6325),
  city('Porlamar', 'Nueva Esparta', 10.9577, -63.8497),
  city('Maturín', 'Monagas', 9.7457, -63.1832),
  city('Cumaná', 'Sucre', 10.4535, -64.1818),
  city('Los Teques', 'Miranda', 10.3446, -67.0434),
  city('Coro', 'Falcón', 11.4045, -69.6734),
  city('Barinas', 'Barinas', 8.6226, -70.2075),
  city('San Felipe', 'Yaracuy', 10.3399, -68.7425),
  city('Valera', 'Trujillo', 9.3178, -70.6036),
  city('Guanare', 'Portuguesa', 9.0418, -69.7421),
  city('San Fernando de Apure', 'Apure', 7.8878, -67.4724),
  city('Puerto Ayacucho', 'Amazonas', 5.6639, -67.6236),
  city('Cabimas', 'Zulia', 10.3996, -71.4561),
  zone('Altamira', 'Chacao, Caracas', 10.5009, -66.8467),
  zone('Los Palos Grandes', 'Chacao, Caracas', 10.4969, -66.8477),
  zone('La Castellana', 'Chacao, Caracas', 10.4972, -66.853),
  zone('Las Mercedes', 'Baruta, Caracas', 10.483, -66.861),
  zone('Prados del Este', 'Baruta, Caracas', 10.456, -66.864),
  zone('La Lagunita', 'El Hatillo, Caracas', 10.429, -66.82),
  zone('Sabana Grande', 'Libertador, Caracas', 10.4915, -66.8745),
  zone('Prebo', 'Valencia', 10.2, -68.0),
  zone('Naguanagua', 'Carabobo', 10.254, -68.0),
  zone('Las Delicias', 'Maracay', 10.26, -67.6),
  zone('Bella Vista', 'Maracaibo', 10.655, -71.63),
  zone('Pampatar', 'Nueva Esparta', 10.995, -63.8),
  state('Distrito Capital', 10.49, -66.9, 11),
  state('Miranda', 10.3, -66.4, 9),
  state('La Guaira', 10.6, -66.93, 10),
  state('Carabobo', 10.2, -68.0, 9.5),
  state('Aragua', 10.2, -67.4, 9.2),
  state('Zulia', 10.4, -71.6, 8),
  state('Lara', 10.0, -69.5, 8.5),
  state('Mérida (estado)', 8.6, -71.15, 9),
  state('Táchira', 7.8, -72.2, 9),
  state('Anzoátegui', 9.0, -64.2, 7.8),
  state('Bolívar', 6.5, -63.0, 6.6),
  state('Nueva Esparta', 11.0, -64.0, 9.5),
  state('Falcón', 11.1, -69.9, 8),
  state('Sucre', 10.4, -63.2, 8.5),
  state('Monagas', 9.4, -63.0, 8),
  state('Barinas', 8.4, -70.0, 8),
  state('Portuguesa', 9.1, -69.3, 8.5),
  state('Trujillo', 9.4, -70.4, 9),
  state('Yaracuy', 10.3, -68.7, 9),
  state('Cojedes', 9.4, -68.4, 8.5),
  state('Guárico', 8.8, -66.4, 7.8),
  state('Apure', 7.2, -68.7, 7.4),
  state('Amazonas', 5.7, -66.0, 6.6),
  state('Delta Amacuro', 8.9, -61.7, 7.8),
];

const norm = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Sugerencias para lo que escribe la persona (empieza por... primero, luego contiene...). */
export function suggestPlaces(text: string, limit = 6): Place[] {
  const q = norm(text);
  if (q.length < 2) return [];
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of PLACES) {
    const label = norm(place.label);
    if (label.startsWith(q)) starts.push(place);
    else if (label.includes(q) || norm(place.hint).includes(q)) contains.push(place);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Vista inicial del mapa: Caracas (donde esta la mayor parte de la oferta). */
export const DEFAULT_VIEW: MapView = { lat: 10.4806, lng: -66.8977, zoom: 11.2 };

/** Limites de Venezuela con un margen (el mapa no deja irse a otro continente). */
export const VENEZUELA_BOUNDS: [[number, number], [number, number]] = [
  [-76.5, -1.5],
  [-56.5, 15.5],
];
