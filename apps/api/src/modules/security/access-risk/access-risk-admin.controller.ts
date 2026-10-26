import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGroup } from '../../../common/security/groups';
import { AccessRiskService } from './services/access-risk.service';

@ApiTags('admin / riesgo de inicio de sesion')
@AdminGroup()
@Controller()
export class AccessRiskAdminController {
  constructor(private readonly risk: AccessRiskService) {}

  /** Mapa del sistema: modo, puntos, umbrales y senales. */
  @Get()
  overview() {
    return this.risk.describe();
  }
}
