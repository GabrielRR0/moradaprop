import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  resource: string;
}

/** Marca una ruta para que el interceptor global registre la accion en AuditLog si tiene exito. */
export const Audit = (action: string, resource: string) =>
  SetMetadata(AUDIT_KEY, { action, resource } satisfies AuditMetadata);
