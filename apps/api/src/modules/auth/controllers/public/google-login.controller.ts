import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppConfig } from '@/config';
import { Client, RequestInfo } from '@/common/security/decorators';
import { GuestGroup } from '@/common/security/groups';
import type { AppClient } from '@/common/security/types';
import { GoogleLinkConfirmDto, GoogleTokenDto } from '../../contracts/dto/google.dto';
import type { LoginResponseResource } from '../../contracts/resources';
import { AuthService } from '../../services/auth.service';
import type { RequestContext } from '../../utils/auth-context';
import { cookieSettings, respondWithLogin, type CookieSettings } from '../../utils/auth-response';

/** Entrar con Google. Vincular o desvincular una cuenta ya existente esta en private/user/google-account. */
@GuestGroup()
@ApiTags('auth')
@Controller('google')
export class GoogleLoginController {
  private readonly cookie: CookieSettings;

  constructor(
    private readonly authService: AuthService,
    config: AppConfig,
  ) {
    this.cookie = cookieSettings(config);
  }

  @HttpCode(200)
  @Post()
  async google(
    @Body() dto: GoogleTokenDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    return respondWithLogin(res, client, await this.authService.googleLogin(dto.idToken, ctx), this.cookie);
  }

  /** El correo de Google ya tenia cuenta: se confirma con el codigo que llego al correo. */
  @HttpCode(200)
  @Post('link/confirm')
  async confirmLink(
    @Body() dto: GoogleLinkConfirmDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    const result = await this.authService.googleConfirmLink(dto.idToken, dto.code, ctx);
    return respondWithLogin(res, client, result, this.cookie);
  }
}
