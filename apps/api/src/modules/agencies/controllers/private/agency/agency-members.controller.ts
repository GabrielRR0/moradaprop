import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AgencyGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { InviteAgentDto } from '@/modules/agencies/contracts/dto/invite-agent.dto';
import type { InvitationSentResource } from '@/modules/agencies/contracts/resources';
import { AgenciesService } from '@/modules/agencies/services/agencies.service';

/** Equipo de la agencia: invitar y quitar agentes. Solo el administrador de la agencia puede (lo valida el service). */
@AgencyGroup()
@ApiTags('agencies')
@Controller('me/members')
export class AgencyMembersController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post('invite')
  invite(@Body() dto: InviteAgentDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<InvitationSentResource> {
    return this.agenciesService.invite(user.id, dto.email, ctx);
  }

  @HttpCode(204)
  @Delete(':memberId')
  async remove(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ) {
    await this.agenciesService.removeMember(user.id, memberId, ctx);
  }
}
