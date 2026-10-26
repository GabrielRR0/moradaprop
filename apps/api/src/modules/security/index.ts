// Archivo padre de la seguridad: lo UNICO que el resto de la app puede importar de este modulo.
// Los mini modulos (blocks, ownership, threat-model) son privados: se exponen aqui lo que haga falta.
export { SecurityModule } from './security.module';
export { securityRoutes } from './security.routes';

// blocks: bloqueos de IP, pais, usuario, correo...
export { SecurityService, BlockGuard } from './blocks';

// encryption: cifrado de campos en reposo e indice ciego
export { FieldCipher, BlindIndexService, UserVault, SocialAccountVault, SessionVault, AppointmentVault, AgencyVault, type BlindNormalizer, type EncryptedField, type UserPersonalData } from './encryption';

// ownership: este usuario puede tocar este recurso
export { OwnershipService, ACCESS_DENIED_ACTION, type ResourcePolicy } from './ownership';

// threat-model: escudos STRIDE y revision de archivos
export { ThreatModelService, threatObserver, type FileCheck, type FileFacts, type ThreatShield, type ThreatSubject } from './threat-model';
