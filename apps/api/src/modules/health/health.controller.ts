import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipAppCheck } from '../../common/security/decorators';
import { PublicGroup } from '../../common/security/groups';
import { HealthService } from './services/health.service';

@ApiTags('health')
@PublicGroup()
@SkipAppCheck()
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
