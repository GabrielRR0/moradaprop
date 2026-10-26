export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** off: no mide · monitor: mide, audita y avisa, no estorba · enforce: ademas exige segundo factor y niega. */
export type RiskMode = 'off' | 'monitor' | 'enforce';

/** Lo que se sabe de un inicio de sesion para puntuarlo. */
export interface RiskContext {
  now: Date;
  /** Pais de confianza (CDN con TRUST_PROXY=true) o null si no se sabe. */
  country: string | null;
  /** HMAC de la red /24 (IPv4) o /48 (IPv6), o null si la IP no es valida. Nunca la IP. */
  network: string | null;
  /** Dispositivo que presento el cliente (valido, de este usuario y sin vencer), o null. */
  device: { id: string; confirmed: boolean } | null;
  /** false = la cuenta no tiene ningun inicio de sesion previo: este es la linea base y no hay con que comparar. */
  hasHistory: boolean;
  knownCountries: ReadonlySet<string>;
  knownNetworks: ReadonlySet<string>;
  /** Pais y hora del ultimo inicio de sesion completo. */
  lastLogin: { country: string | null; at: Date } | null;
  failedLoginsLastHour: number;
}

/**
 * SENAL: mini modulo que puntua un aspecto del inicio de sesion. Se agrega creando su archivo en signals/
 * y sumandolo a signals/index.ts; los puntos viven en policy.ts.
 */
export interface RiskSignal {
  readonly id: string;
  readonly description: string;
  /** Puntos que suma (o resta) a este inicio de sesion, o null si no aplica. */
  evaluate(ctx: RiskContext): { points: number; reason: string } | null;
}

export interface RiskReason {
  signal: string;
  points: number;
  reason: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  mode: RiskMode;
  reasons: RiskReason[];
}

/** Dispositivo ya conocido que presento el cliente. */
export interface KnownDevice {
  id: string;
  label: string;
  confirmed: boolean;
}

/** Resultado de medir un inicio de sesion: lo que el login necesita para decidir. */
export interface RiskVerdict {
  assessment: RiskAssessment;
  device: KnownDevice | null;
  country: string | null;
  /** HMAC de la red de esta peticion (para recordarla tras un inicio de sesion completo). */
  network: string | null;
  hasHistory: boolean;
}

/** Que hace el login despues de medir. */
export interface LoginTrust {
  deviceId: string | null;
  /** Secreto nuevo del dispositivo, solo si se registro uno en este inicio de sesion (el cliente lo guarda). */
  deviceSecret?: string;
  country: string | null;
}
