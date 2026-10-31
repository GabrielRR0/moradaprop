import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGroup } from '@/common/security/groups';
import type { ThreatModelOverviewResource } from '@/modules/security/threat-model/contracts/resources';
import { ThreatModelService } from '@/modules/security/threat-model/services/threat-model.service';

@AdminGroup()
@ApiTags('admin / modelo de amenazas')
@Controller()
export class ThreatModelController {
  constructor(private readonly threats: ThreatModelService) {}

  /** Mapa del modelo: modo, escudos por letra STRIDE y revisiones de archivo. */
  @Get()
  overview(): ThreatModelOverviewResource {
    return this.threats.describe();
  }
}
