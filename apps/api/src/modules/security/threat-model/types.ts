import { DbSupport } from '@/support/db';

/** Categorias del modelo STRIDE (Microsoft). Cada mini modulo declara de cual es. */
export type StrideLetter = 'S' | 'T' | 'R' | 'I' | 'D' | 'E';

export const STRIDE_NAMES: Record<StrideLetter, string> = {
  S: 'Spoofing (suplantacion)',
  T: 'Tampering (manipulacion)',
  R: 'Repudiation (repudio)',
  I: 'Information disclosure (filtracion)',
  D: 'Denial of service (denegacion de servicio)',
  E: 'Elevation of privilege (escalada de privilegios)',
};

/** off: no vigila · monitor: detecta y registra · enforce: ademas bloquea por tiempo al atacante. */
export type ThreatMode = 'off' | 'monitor' | 'enforce';

/** Quien hizo algo sospechoso. */
export interface ThreatSubject {
  ip?: string;
  userId?: string;
  roles?: DbSupport.Role[];
}

/** Lo que se sabe de una respuesta ya enviada (lo que ven los escudos). */
export interface ResponseFacts extends ThreatSubject {
  status: number;
  method: string;
  path: string;
}

/**
 * ESCUDO: mini modulo que vigila trafico. Es una descripcion, no codigo con efectos:
 * si en `windowSec` segundos el mismo sujeto cumple `limit` veces, el modelo actua.
 * Se agrega creando su archivo en shields/ y sumandolo a shields/index.ts.
 */
export interface ThreatShield {
  readonly id: string;
  readonly stride: StrideLetter;
  readonly description: string;
  /** Defensas que YA existen para esta amenaza (solo documentacion que se muestra en el panel). */
  readonly protectedBy: readonly string[];
  readonly limit: number;
  readonly windowSec: number;
  readonly blockMinutes: number;
  /** ¿Esta respuesta cuenta como un hecho? Sin esto, el escudo solo se alimenta con `report()`. */
  matches?(facts: ResponseFacts): boolean;
}

/** Archivo que se va a revisar. */
export interface FileFacts {
  buffer: Buffer;
  filename?: string;
  mimetype?: string;
}

/**
 * REVISION DE ARCHIVO: mini modulo que inspecciona un archivo subido antes de guardarlo.
 * Se agrega creando su archivo en file-checks/ y sumandolo a file-checks/index.ts.
 */
export interface FileCheck {
  readonly id: string;
  readonly stride: StrideLetter;
  readonly description: string;
  /** Devuelve el motivo si hay que rechazar el archivo, o null si esta bien. Si no puede revisar, lanza error. */
  inspect(file: FileFacts): Promise<string | null> | string | null;
}
