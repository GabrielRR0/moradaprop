export interface PasskeyUser {
  id: string;
  email: string;
  name: string;
}

/** De donde viene la peticion (para la auditoria). */
export interface PasskeyContext {
  ip?: string;
  userAgent?: string;
}
