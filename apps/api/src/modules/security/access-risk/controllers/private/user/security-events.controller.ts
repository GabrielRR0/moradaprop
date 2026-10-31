import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext } from '@/common/security/types';
import type { SecurityEventListResource } from '@/modules/security/access-risk/contracts/resources';
import { SecurityEventsService } from '@/modules/security/access-risk/services/events/security-events.service';

@AuthGroup()
@ApiTags('auth / historial de seguridad')
@Controller('security-events')
export class SecurityEventsController {
  constructor(private readonly events: SecurityEventsService) {}

  /** Ultimos avisos de seguridad de MI cuenta (inicios de sesion raros, bloqueos, dispositivos). */
  @AllowWithoutSecondFactor()
  @Get()
  async list(@CurrentUser() user: AuthUserContext): Promise<SecurityEventListResource> {
    return { items: await this.events.list(user.id) };
  }
}
