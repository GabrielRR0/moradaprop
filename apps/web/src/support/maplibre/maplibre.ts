// Unico lugar donde se importa `maplibre-gl` (y su CSS).
import 'maplibre-gl/dist/maplibre-gl.css';

export type { Map, Marker, StyleSpecification } from 'maplibre-gl';

/** La libreria completa (clases `Map`, `Marker`, `AttributionControl`, `setWorkerUrl`...). */
export type Library = typeof import('maplibre-gl');

/** Carga la libreria bajo demanda: pesa mucho y solo la necesita la pantalla del mapa. */
export const load = (): Promise<Library> => import('maplibre-gl');
