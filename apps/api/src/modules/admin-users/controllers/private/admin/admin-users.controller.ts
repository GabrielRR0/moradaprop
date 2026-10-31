import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RecentTwoFactor, RequestInfo } from '@/common/security/decorators';
import { AdminGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { ListUsersQueryDto } from '@/modules/admin-users/contracts/dto/list-users-query.dto';
import { SetUserStatusDto } from '@/modules/admin-users/contracts/dto/set-user-status.dto';
import type { AdminUserListResource, UserStatusChangedResource } from '@/modules/admin-users/contracts/resources';
import { AdminUsersService } from '@/modules/admin-users/services/admin-users.service';

/** Gestion de usuarios: solo administradores (con 2FA). */
@AdminGroup()
@ApiTags('admin / usuarios')
@Controller()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto): Promise<AdminUserListResource> {
    return this.adminUsersService.list(query);
  }

  // Accion sensible: el admin debe haber confirmado su segundo factor hace pocos minutos.
  @RecentTwoFactor()
  @Patch(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserStatusDto,
    @CurrentUser() admin: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<UserStatusChangedResource> {
    return this.adminUsersService.setStatus(admin.id, id, dto, ctx);
  }
}
