import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppConfig } from '@/config';
import { AllowWithoutSecondFactor, Client, CurrentUser } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AppClient, AuthUserContext } from '@/common/security/types';
import { RefreshDto } from '@/modules/auth/contracts/dto/refresh.dto';
import type { SessionResource } from '@/modules/auth/contracts/resources';
import { AuthService } from '@/modules/auth/services/auth.service';
import { clearRefreshCookie, cookieSettings, REFRESH_COOKIE, type CookieSettings } from '@/modules/auth/utils/auth-response';

/**
 * Cerrar sesion y administrar mis sesiones abiertas. Se pueden usar aunque la cuenta aun deba activar su
 * segundo factor (`@AllowWithoutSecondFactor`), para que siempre pueda salir.
 */
@AuthGroup()
@AllowWithoutSecondFactor()
@ApiTags('auth')
@Controller()
export class SessionsController {
  private readonly cookie: CookieSettings;

  constructor(
    private readonly authService: AuthService,
    config: AppConfig,
  ) {
    this.cookie = cookieSettings(config);
  }

  @HttpCode(204)
  @Post('logout')
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = client === 'mobile' ? dto.refreshToken : (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    await this.authService.logout(token);
    clearRefreshCookie(res, this.cookie.secure);
  }

  @HttpCode(204)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthUserContext, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(user.id);
    clearRefreshCookie(res, this.cookie.secure);
  }

  @Get('sessions')
  sessions(@CurrentUser() user: AuthUserContext): Promise<SessionResource[]> {
    return this.authService.sessions(user.id, user.sessionId);
  }

  @HttpCode(204)
  @Delete('sessions/:id')
  async revokeSession(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string) {
    await this.authService.revokeSession(user.id, id);
  }
}
