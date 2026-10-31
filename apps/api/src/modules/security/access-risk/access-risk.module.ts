import { Module } from '@nestjs/common';
import { ThreatModelModule } from '@/modules/security/threat-model';
import { AccessRiskAdminController } from './controllers/private/admin/access-risk-admin.controller';
import { DevicesController } from './controllers/private/user/devices.controller';
import { SecurityEventsController } from './controllers/private/user/security-events.controller';
import { AccessRiskService } from './services/access-risk.service';
import { DeviceRegistryService } from './services/devices/device-registry.service';
import { FootprintService } from './services/assessment/footprint.service';
import { RiskAssessorService } from './services/assessment/risk-assessor.service';
import { SecurityEventsService } from './services/events/security-events.service';
import { LoginTrustService } from './services/login/login-trust.service';
import { RefreshGuardService } from './services/login/refresh-guard.service';
import { StepUpService } from './services/login/step-up.service';

/** Rutas de usuario (/api/auth/devices y /api/auth/security-events). */
@Module({
  imports: [ThreatModelModule],
  controllers: [DevicesController, SecurityEventsController],
  providers: [
    FootprintService,
    DeviceRegistryService,
    RiskAssessorService,
    LoginTrustService,
    RefreshGuardService,
    StepUpService,
    AccessRiskService,
    SecurityEventsService,
  ],
  exports: [AccessRiskService],
})
export class AccessRiskModule {}

/** Panel admin (/api/admin/security/access-risk). Aparte porque cada modulo se monta en una sola ruta. */
@Module({
  imports: [AccessRiskModule],
  controllers: [AccessRiskAdminController],
})
export class AccessRiskAdminModule {}
