/** Datos de la peticion que los services necesitan (sesiones, auditoria, bloqueos). */
export interface RequestContext {
  ip: string;
  userAgent?: string;
  /** Pais de confianza (CDN con TRUST_PROXY=true), o null/undefined si no se sabe. */
  country?: string | null;
  /** Secreto del dispositivo que mando el cliente (cookie device_token o cabecera x-device-token), sin verificar. */
  deviceToken?: string;
}
