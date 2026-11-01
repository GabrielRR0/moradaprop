import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppConfig } from '@/config';
import { Client, RequestInfo, RequireHumanCheck } from '@/common/security/decorators';
import { GuestGroup } from '@/common/security/groups';
import type { AppClient } from '@/common/security/types';
import { LoginDto } from '../../contracts/dto/login.dto';
import { RefreshDto } from '../../contracts/dto/refresh.dto';
import { TwoFactorChallengeDto, TwoFactorLoginDto } from '../../contracts/dto/two-factor.dto';
import type { AuthSessionMobileResource, AuthSessionResource, LoginResponseResource, MessageResource } from '../../contracts/resources';
import { AuthService } from '../../services/auth.service';
import type { RequestContext } from '../../utils/auth-context';
import { cookieSettings, REFRESH_COOKIE, respondWithLogin, respondWithTokens, type CookieSettings } from '../../utils/auth-response';

/** Iniciar sesion (con contrasena y segundo paso) y renovar el token. Sin sesion, con limite estricto de uso. */
@GuestGroup()
@ApiTags('auth')
@Controller()
export class LoginController {
  private readonly cookie: CookieSettings;

  constructor(
    private readonly authService: AuthService,
    config: AppConfig,
  ) {
    this.cookie = cookieSettings(config);
  }

  @RequireHumanCheck()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    return respondWithLogin(res, client, await this.authService.login(dto, ctx), this.cookie);
  }

  @HttpCode(200)
  @Post('login/2fa')
  async loginTwoFactor(
    @Body() dto: TwoFactorLoginDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    const result = await this.authService.twoFactorLogin(dto.challengeToken, dto.code, ctx);
    return respondWithLogin(res, client, result, this.cookie);
  }

  @HttpCode(200)
  @Post('login/2fa/email-code')
  twoFactorEmailCode(@Body() dto: TwoFactorChallengeDto): Promise<MessageResource> {
    return this.authService.twoFactorEmailCode(dto.challengeToken);
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionResource | AuthSessionMobileResource> {
    const token = client === 'mobile' ? dto.refreshToken : (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    return respondWithTokens(res, client, await this.authService.refresh(token ?? '', ctx), this.cookie);
  }
}
