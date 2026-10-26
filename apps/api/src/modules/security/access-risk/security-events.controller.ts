import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser } from '../../../common/security/decorators';
import { AuthGroup } from '../../../common/security/groups';
import type { AuthUser } from '../../../common/security/types';
import { SecurityEventsService } from './services/security-events.service';

@ApiTags('auth / historial de seguridad')
@AuthGroup()
@Controller('security-events')
export class SecurityEventsController {
  constructor(private readonly events: SecurityEventsService) {}

  /** Ultimos avisos de seguridad de MI cuenta (inicios de sesion raros, bloqueos, dispositivos). */
  @Get()
  @AllowWithoutSecondFactor()
  async list(@CurrentUser() user: AuthUser) {
    return { items: await this.events.list(user.id) };
  }
}
