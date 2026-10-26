import { Module } from '@nestjs/common';
import { ThreatModelModule } from '../threat-model';
import { AccessRiskAdminController } from './access-risk-admin.controller';
import { DevicesController } from './devices.controller';
import { SecurityEventsController } from './security-events.controller';
import { AccessRiskService } from './services/access-risk.service';
import { DeviceRegistryService } from './services/device-registry.service';
import { FootprintService } from './services/footprint.service';
import { RiskAssessorService } from './services/risk-assessor.service';
import { SecurityEventsService } from './services/security-events.service';

/** Rutas de usuario (/api/auth/devices y /api/auth/security-events). */
@Module({
  imports: [ThreatModelModule],
  controllers: [DevicesController, SecurityEventsController],
  providers: [FootprintService, DeviceRegistryService, RiskAssessorService, AccessRiskService, SecurityEventsService],
  exports: [AccessRiskService],
})
export class AccessRiskModule {}

/** Panel admin (/api/admin/security/access-risk). Aparte porque cada modulo se monta en una sola ruta. */
@Module({
  imports: [AccessRiskModule],
  controllers: [AccessRiskAdminController],
})
export class AccessRiskAdminModule {}
