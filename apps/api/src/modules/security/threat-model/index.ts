// Archivo padre del modulo: lo unico que otros modulos pueden importar.
export { ThreatModelModule } from './threat-model.module';
export { ThreatModelService } from './services/threat-model.service';
export { threatObserver } from './middleware/threat-observer';
export type { FileCheck, FileFacts, ThreatShield, ThreatSubject, StrideLetter } from './types';
