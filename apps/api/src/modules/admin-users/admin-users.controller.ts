import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '../../common/security/decorators';
import { AdminGroup } from '../../common/security/groups';
import type { AuthUser, RequestContext } from '../../common/security/types';
import { ListUsersQueryDto, SetUserStatusDto } from './dto/admin-users.dto';
import { AdminUsersService } from './services/admin-users.service';

@ApiTags('admin / usuarios')
@AdminGroup()
@Controller()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.adminUsersService.list(query);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserStatusDto,
    @CurrentUser() admin: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    return this.adminUsersService.setStatus(admin.id, id, dto, ctx);
  }
}
