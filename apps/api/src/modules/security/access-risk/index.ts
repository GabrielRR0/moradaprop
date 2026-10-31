// Archivo padre del mini modulo: lo unico que sus hermanos dentro de security pueden importar.
export { AccessRiskModule, AccessRiskAdminModule } from './access-risk.module';
export { accessRiskRoutes } from './access-risk.routes';
export { AccessRiskService } from './services/access-risk.service';
export type { LoginTrust, RiskLevel, RiskMode, RiskVerdict, SessionRef } from './types';
