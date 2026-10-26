import type { ThreatShield } from '../types';

/** T: archivos rechazados por file-checks/ (virus, ejecutables, nombres peligrosos). No cuenta respuestas: lo alimenta `report()`. */
export const maliciousUpload: ThreatShield = {
  id: 'malicious-upload',
  stride: 'T',
  description: 'Varios archivos rechazados por seguridad: intento de subir malware o ejecutables.',
  protectedBy: [
    'file-checks/ (ejecutables disfrazados, nombres peligrosos)',
    'common/files (magic bytes, macros, zip-bombs)',
    'imagenes re-encodeadas con sharp',
    'bucket privado para originales',
  ],
  limit: 3,
  windowSec: 600,
  blockMinutes: 60,
};
