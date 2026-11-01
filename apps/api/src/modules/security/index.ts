// Archivo padre de la seguridad: lo UNICO que el resto de la app puede importar de este modulo.
// Los mini modulos (blocks, ownership, threat-model) son privados: se exponen aqui lo que haga falta.
export { SecurityModule } from './security.module';
export { securityRoutes } from './security.routes';

// access-risk: ¿es raro este inicio de sesion? (pais, red, dispositivo) y dispositivos de confianza
export { AccessRiskService, accessRiskRoutes, type LoginTrust, type RiskLevel, type RiskMode, type RiskVerdict, type SessionRef } from './access-risk';

// blocks: bloqueos de IP, pais, usuario, correo...
export { SecurityService, BlockGuard } from './blocks';

// encryption: cifrado de campos en reposo e indice ciego
export { FieldCipher, BlindIndexService, UserVault, SocialAccountVault, SessionVault, AppointmentVault, AppointmentMessageVault, ReplyTemplateVault, AgencyVault, type BlindNormalizer, type EncryptedField, type UserPersonalData } from './encryption';

// geo: pais de cada peticion (CDN)
export { GeoService, geoLocate } from './geo';

// ownership: este usuario puede tocar este recurso
export { OwnershipService, ACCESS_DENIED_ACTION, type ResourcePolicy } from './ownership';

// passkeys: huella / Face ID / Windows Hello (WebAuthn)
export {
  PasskeyService,
  passkeysRoutes,
  AuthenticationCredentialDto,
  PasskeyLoginDto,
  PasskeyStepUpOptionsDto,
  PasskeyStepUpVerifyDto,
} from './passkeys';

// second-factor: passkey o 2FA obligatorio para admin, duenos y agencias
export { SecondFactorService, SecondFactorGuard, RecentTwoFactorGuard, SECOND_FACTOR_POLICY, secondFactorRoutes, type SecondFactorMode, type SecondFactorStatus } from './second-factor';

// threat-model: escudos STRIDE y revision de archivos
export { ThreatModelService, threatObserver, type FileCheck, type FileFacts, type ThreatShield, type ThreatSubject } from './threat-model';
export type { PasskeyAuthenticationOptionsResource } from './passkeys';
