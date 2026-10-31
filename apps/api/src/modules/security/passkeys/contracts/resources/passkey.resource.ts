/** Una passkey del usuario (el material criptografico nunca sale). */
export interface PasskeyResource {
  id: string;
  label: string;
  /** Esta sincronizada en la nube del proveedor (iCloud, Google...). */
  backedUp: boolean;
  transports: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface PasskeyListResource {
  items: PasskeyResource[];
}

/** Respuesta de renombrar una passkey. */
export interface PasskeyRenamedResource {
  id: string;
  label: string;
}

/** Respuesta de registrar una passkey nueva. */
export interface PasskeyRegisteredResource {
  id: string;
  label: string;
  backedUp: boolean;
}
