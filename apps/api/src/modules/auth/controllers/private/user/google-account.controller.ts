import { Body, Controller, Delete, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { GoogleTokenDto } from '@/modules/auth/contracts/dto/google.dto';
import type { MessageResource } from '@/modules/auth/contracts/resources';
import { AuthService } from '@/modules/auth/services/auth.service';

/** Vincular o desvincular la cuenta de Google del usuario con sesion. */
@AuthGroup()
@ApiTags('auth')
@Controller('google')
export class GoogleAccountController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('link')
  link(@Body() dto: GoogleTokenDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<MessageResource> {
    return this.authService.googleLink(user.id, dto.idToken, ctx);
  }

  @Delete()
  unlink(@CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<MessageResource> {
    return this.authService.googleUnlink(user.id, ctx);
  }
}
