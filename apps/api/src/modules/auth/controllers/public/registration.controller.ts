import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppConfig } from '@/config';
import { Client, RequestInfo } from '@/common/security/decorators';
import { GuestGroup } from '@/common/security/groups';
import type { AppClient } from '@/common/security/types';
import { EmailCodeDto, EmailDto } from '../../contracts/dto/email-code.dto';
import { RegisterDto } from '../../contracts/dto/register.dto';
import type { LoginResponseResource, MessageResource } from '../../contracts/resources';
import { AuthService } from '../../services/auth.service';
import type { RequestContext } from '../../utils/auth-context';
import { cookieSettings, respondWithLogin, type CookieSettings } from '../../utils/auth-response';

/** Crear la cuenta y verificar el correo. Sin sesion, con limite estricto de uso. */
@GuestGroup()
@ApiTags('auth')
@Controller()
export class RegistrationController {
  private readonly cookie: CookieSettings;

  constructor(
    private readonly authService: AuthService,
    config: AppConfig,
  ) {
    this.cookie = cookieSettings(config);
  }

  @Post('register')
  register(@Body() dto: RegisterDto, @RequestInfo() ctx: RequestContext): Promise<MessageResource> {
    return this.authService.register(dto, ctx);
  }

  @HttpCode(200)
  @Post('verify-email')
  async verifyEmail(
    @Body() dto: EmailCodeDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    return respondWithLogin(res, client, await this.authService.verifyEmail(dto.email, dto.code, ctx), this.cookie);
  }

  @HttpCode(200)
  @Post('resend-code')
  resendCode(@Body() dto: EmailDto): Promise<MessageResource> {
    return this.authService.resendVerification(dto.email);
  }
}
