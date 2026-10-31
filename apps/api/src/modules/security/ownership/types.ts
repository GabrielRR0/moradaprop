import type { AuthUserContext } from '@/common/security/types';

/**
 * Regla de pertenencia de UN tipo de recurso (cita, propiedad, importacion...).
 * Cada modulo escribe la suya junto a sus datos; OwnershipService la aplica igual en todos.
 */
export interface ResourcePolicy<T> {
  /** Nombre del recurso para la auditoria ('Appointment'). */
  readonly resource: string;
  /** Mensaje 404. Tambien es lo que ve quien no tiene permiso, salvo que se defina `forbidden`. */
  readonly notFound: string;
  /**
   * Si se define, quien existe pero no tiene permiso recibe 403 con este mensaje.
   * Solo para recursos cuyo id ya es publico (ej. propiedades); para el resto no lo definas:
   * asi nadie puede confirmar que un id ajeno existe.
   */
  readonly forbidden?: string;
  /** Carga el recurso por id, SIN filtrar por usuario. */
  find(id: string): Promise<T | null>;
  /** ¿Puede este usuario hacer `action` sobre este recurso? Una accion desconocida debe devolver false. */
  can(user: AuthUserContext, entity: T, action: string): boolean | Promise<boolean>;
}
