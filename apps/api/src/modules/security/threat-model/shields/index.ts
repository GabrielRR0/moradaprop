import type { ThreatShield } from '../types';
import { accountTakeoverAttempt } from './account-takeover-attempt';
import { auditTrail } from './audit-trail';
import { credentialGuessing } from './credential-guessing';
import { idEnumeration } from './id-enumeration';
import { maliciousUpload } from './malicious-upload';
import { massRegistration } from './mass-registration';
import { payloadTampering } from './payload-tampering';
import { privilegeProbing } from './privilege-probing';
import { requestFlood } from './request-flood';

/**
 * LISTA DE ESCUDOS. Agregar uno: crea su archivo en esta carpeta y sumalo aqui.
 * Quitar uno: borra su linea (y su archivo). Nada mas depende de ellos.
 */
export const SHIELDS: readonly ThreatShield[] = [
  credentialGuessing, // S
  massRegistration, // S (cuentas falsas)
  accountTakeoverAttempt, // S (toma de cuenta)
  payloadTampering, // T
  maliciousUpload, // T (archivos)
  auditTrail, // R
  idEnumeration, // I
  requestFlood, // D
  privilegeProbing, // E
];
