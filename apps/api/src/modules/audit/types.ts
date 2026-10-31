/**
 * Lo que auditoria necesita para mostrar el usuario de cada evento (correo y nombre estan cifrados en la DB).
 * Auditoria define la interfaz y quien sabe descifrar (security/encryption) la provee: asi audit no importa security.
 */
export const AUDIT_USER_DECODER = Symbol('AUDIT_USER_DECODER');

/** Cifrado de los campos del propio registro de auditoria (ip, userAgent y metadata). */
export const AUDIT_FIELD_CIPHER = Symbol('AUDIT_FIELD_CIPHER');

/** Indice ciego de la IP de cada evento (para filtrar por IP sin guardarla en claro). */
export const AUDIT_IP_INDEX = Symbol('AUDIT_IP_INDEX');

export interface AuditIpIndex {
  hash(ip: string): string;
}

export interface AuditFieldCipher {
  encrypt(field: `${string}.${string}`, plain: string): string;
  decrypt(field: `${string}.${string}`, payload: string): string;
}

export interface AuditUserDecoder {
  decode<T extends { email?: string | null; name?: string | null }>(row: T): T;
}
