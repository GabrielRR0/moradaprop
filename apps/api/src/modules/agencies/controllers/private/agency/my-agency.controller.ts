import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AgencyGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { UpdateAgencyDto } from '@/modules/agencies/contracts/dto/update-agency.dto';
import type { MyAgencyResource } from '@/modules/agencies/contracts/resources';
import { AgenciesService } from '@/modules/agencies/services/agencies.service';

/** Perfil de la agencia. La agencia siempre sale de la cuenta del token: ninguna ruta recibe un agencyId. */
@AgencyGroup()
@ApiTags('agencies')
@Controller('me')
export class MyAgencyController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  me(@CurrentUser() user: AuthUserContext): Promise<MyAgencyResource> {
    return this.agenciesService.me(user.id);
  }

  @Patch()
  update(@Body() dto: UpdateAgencyDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<MyAgencyResource> {
    return this.agenciesService.update(user.id, dto, ctx);
  }
}
