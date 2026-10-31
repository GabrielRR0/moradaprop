import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGroup } from '@/common/security/groups';
import type { AccessRiskOverviewResource } from '@/modules/security/access-risk/contracts/resources';
import { AccessRiskService } from '@/modules/security/access-risk/services/access-risk.service';

@AdminGroup()
@ApiTags('admin / riesgo de inicio de sesion')
@Controller()
export class AccessRiskAdminController {
  constructor(private readonly risk: AccessRiskService) {}

  /** Mapa del sistema: modo, puntos, umbrales y senales. */
  @Get()
  overview(): AccessRiskOverviewResource {
    return this.risk.describe();
  }
}
