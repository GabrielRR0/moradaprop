import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { ChangePasswordDto } from '@/modules/users/contracts/dto/change-password.dto';
import { UpdateProfileDto } from '@/modules/users/contracts/dto/update-profile.dto';
import type { PasswordChangedResource, UserProfileResource } from '@/modules/users/contracts/resources';
import { UsersService } from '@/modules/users/services/users.service';

/** Todas las rutas actuan sobre el usuario del token: nunca reciben un userId. */
@AuthGroup()
@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AllowWithoutSecondFactor()
  @Get('me')
  me(@CurrentUser() user: AuthUserContext): Promise<UserProfileResource> {
    return this.usersService.me(user.id);
  }

  @Patch('me')
  update(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<UserProfileResource> {
    return this.usersService.updateProfile(user.id, dto, ctx);
  }

  @HttpCode(200)
  @Post('me/password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PasswordChangedResource> {
    return this.usersService.changePasswordFor(user.id, user.sessionId, dto, ctx);
  }

  @HttpCode(200)
  @Post('me/become-owner')
  becomeOwner(@CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<UserProfileResource> {
    return this.usersService.becomeOwner(user.id, ctx);
  }
}
