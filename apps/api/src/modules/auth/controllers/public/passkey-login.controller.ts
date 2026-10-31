import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppConfig } from '@/config';
import { Client, RequestInfo } from '@/common/security/decorators';
import { GuestGroup } from '@/common/security/groups';
import type { AppClient } from '@/common/security/types';
import { PasskeyLoginDto, PasskeyStepUpOptionsDto, PasskeyStepUpVerifyDto, type PasskeyAuthenticationOptionsResource } from '@/modules/security';
import type { LoginResponseResource } from '../../contracts/resources';
import { PasskeyLoginService } from '../../services/sign-in/passkey-login.service';
import type { RequestContext } from '../../utils/auth-context';
import { cookieSettings, respondWithLogin, type CookieSettings } from '../../utils/auth-response';

/** Entrar con passkey (huella, Face ID, Windows Hello). Mis passkeys (agregar, listar, quitar) estan en security/passkeys. */
@GuestGroup()
@ApiTags('auth / passkeys')
@Controller('passkeys')
export class PasskeyLoginController {
  private readonly cookie: CookieSettings;

  constructor(
    private readonly passkeyLogin: PasskeyLoginService,
    config: AppConfig,
  ) {
    this.cookie = cookieSettings(config);
  }

  /** Paso 1: opciones para `navigator.credentials.get()`; sin correo ni clave. */
  @HttpCode(200)
  @Post('login/options')
  loginOptions(): Promise<PasskeyAuthenticationOptionsResource> {
    return this.passkeyLogin.loginOptions();
  }

  /** Paso 2: la firma del dispositivo. Entrega la sesion (cookie en web, body en mobile). */
  @HttpCode(200)
  @Post('login/verify')
  async loginVerify(
    @Body() dto: PasskeyLoginDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    return respondWithLogin(res, client, await this.passkeyLogin.loginVerify(dto.credential, ctx), this.cookie);
  }

  /** Segundo paso con passkey cuando /auth/login devolvio un desafio (methods incluye "passkey"). */
  @HttpCode(200)
  @Post('step-up/options')
  stepUpOptions(@Body() dto: PasskeyStepUpOptionsDto): Promise<PasskeyAuthenticationOptionsResource> {
    return this.passkeyLogin.stepUpOptions(dto);
  }

  @HttpCode(200)
  @Post('step-up/verify')
  async stepUpVerify(
    @Body() dto: PasskeyStepUpVerifyDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseResource> {
    return respondWithLogin(res, client, await this.passkeyLogin.stepUpVerify(dto, ctx), this.cookie);
  }
}
