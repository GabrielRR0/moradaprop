/** Datos de la agencia. Razón social, RIF y teléfonos se guardan cifrados y salen ya descifrados. */
export interface AgencyResource {
  id: string;
  name: string;
  legalName: string | null;
  rif: string | null;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
}

/** Uso del plan: límites (no editables por la agencia) y lo que lleva consumido. */
export interface AgencyPlanResource {
  maxProperties: number;
  maxAgents: number;
  /** Propiedades publicadas a nombre de la agencia. */
  properties: number;
  /** Agentes en el equipo (sin contar al administrador). */
  agents: number;
}
