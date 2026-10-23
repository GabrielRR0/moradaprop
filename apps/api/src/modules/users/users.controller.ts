import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '../../common/security/decorators';
import { AuthGroup } from '../../common/security/groups';
import type { AuthUser, RequestContext } from '../../common/security/types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './services/users.service';

/** Todas las rutas actuan sobre el usuario del token: nunca reciben un userId. */
@ApiTags('users')
@AuthGroup()
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.me(user.id);
  }

  @Patch('me')
  update(@Body() dto: UpdateProfileDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.usersService.updateProfile(user.id, dto, ctx);
  }

  @HttpCode(200)
  @Post('me/password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.usersService.changePasswordFor(user.id, user.sessionId, dto, ctx);
  }

  @HttpCode(200)
  @Post('me/become-owner')
  becomeOwner(@CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.usersService.becomeOwner(user.id, ctx);
  }
}
