/** Un evento de auditoria como lo ve el panel admin, con ip, user agent y metadata ya descifrados. */
export interface AuditLogResource {
  id: string;
  action: string;
  userId: string | null;
  resource: string | null;
  resourceId: string | null;
  ip: string | null;
  userAgent: string | null;
  /** Datos extra del evento; las contrasenas, tokens y secretos ya vienen redactados. */
  metadata: unknown;
  createdAt: Date;
  user: { id: string; email: string; name: string } | null;
}

/** Pagina de eventos de auditoria. */
export interface AuditLogListResource {
  items: AuditLogResource[];
  total: number;
  page: number;
  limit: number;
}
