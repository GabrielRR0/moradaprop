import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, RequestInfo } from '../../common/security/decorators';
import { AuthGroup, RoleGroup } from '../../common/security/groups';
import type { AuthUser, RequestContext } from '../../common/security/types';
import { AcceptInvitationDto, InviteAgentDto, UpdateAgencyDto } from './dto/agencies.dto';
import { AgenciesService } from './services/agencies.service';

/** La agencia siempre sale de la cuenta del token: ninguna ruta recibe un agencyId. */
@ApiTags('agencies')
@Controller()
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @RoleGroup(Role.AGENCY)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.agenciesService.me(user.id);
  }

  @RoleGroup(Role.AGENCY)
  @Patch('me')
  update(@Body() dto: UpdateAgencyDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.agenciesService.update(user.id, dto, ctx);
  }

  @RoleGroup(Role.AGENCY)
  @Post('me/members/invite')
  invite(@Body() dto: InviteAgentDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.agenciesService.invite(user.id, dto.email, ctx);
  }

  @RoleGroup(Role.AGENCY)
  @HttpCode(204)
  @Delete('me/members/:memberId')
  async removeMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    await this.agenciesService.removeMember(user.id, memberId, ctx);
  }

  /** Cualquier usuario con sesion (aun sin rol AGENCY: lo recibe al aceptar). */
  @AuthGroup()
  @HttpCode(200)
  @Post('invitations/accept')
  accept(@Body() dto: AcceptInvitationDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.agenciesService.acceptInvitation(user.id, dto.token, ctx);
  }
}
