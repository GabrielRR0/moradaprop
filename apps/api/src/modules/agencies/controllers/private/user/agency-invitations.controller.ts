import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { AcceptInvitationDto } from '@/modules/agencies/contracts/dto/accept-invitation.dto';
import type { InvitationAcceptedResource } from '@/modules/agencies/contracts/resources';
import { AgenciesService } from '@/modules/agencies/services/agencies.service';

/** Cualquier usuario con sesion (aun sin rol AGENCY: lo recibe al aceptar). */
@AuthGroup()
@ApiTags('agencies')
@Controller('invitations')
export class AgencyInvitationsController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @HttpCode(200)
  @Post('accept')
  accept(@Body() dto: AcceptInvitationDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<InvitationAcceptedResource> {
    return this.agenciesService.acceptInvitation(user.id, dto.token, ctx);
  }
}
