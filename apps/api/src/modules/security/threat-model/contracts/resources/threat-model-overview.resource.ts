import type { StrideLetter, ThreatMode } from '../../types';

/** Un escudo del modelo de amenazas (`matches`, que es codigo, no sale). */
export interface ThreatShieldResource {
  id: string;
  stride: StrideLetter;
  strideName: string;
  description: string;
  /** Defensas que YA existen para esta amenaza. */
  protectedBy: readonly string[];
  /** Si en `windowSec` segundos el mismo sujeto cumple `limit` veces, el modelo actua. */
  limit: number;
  windowSec: number;
  blockMinutes: number;
}

/** Una revision de archivo (`inspect`, que es codigo, no sale). */
export interface FileCheckResource {
  id: string;
  stride: StrideLetter;
  strideName: string;
  description: string;
}

/** Mapa del modelo de amenazas para el panel admin: modo, escudos por letra STRIDE y revisiones de archivo. */
export interface ThreatModelOverviewResource {
  mode: ThreatMode;
  shields: ThreatShieldResource[];
  fileChecks: FileCheckResource[];
}
