/** Una sesion abierta del usuario. */
export interface SessionResource {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  /** Es la sesion desde la que se esta consultando. */
  current: boolean;
}
