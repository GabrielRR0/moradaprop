import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipAppCheck } from '@/common/security/decorators';
import { PublicGroup } from '@/common/security/groups';
import type { HealthResource } from '../../contracts/resources';
import { HealthService } from '../../services/health.service';

/** Publica y sin cabeceras de app: la usan balanceadores y monitoreo. */
@PublicGroup()
@SkipAppCheck()
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): HealthResource {
    return this.healthService.check();
  }
}
