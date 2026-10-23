// Archivo padre del modulo: lo unico que otros modulos pueden importar.
export { AuditModule } from './audit.module';
export { AuditService, type AuditEntry } from './services/audit.service';
export { Audit } from './decorators/audit.decorator';
