import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGroup } from '../../../common/security/groups';
import { ThreatModelService } from './services/threat-model.service';

@ApiTags('admin / modelo de amenazas')
@AdminGroup()
@Controller()
export class ThreatModelController {
  constructor(private readonly threats: ThreatModelService) {}

  /** Mapa del modelo: modo, escudos por letra STRIDE y revisiones de archivo. */
  @Get()
  overview() {
    return this.threats.describe();
  }
}
