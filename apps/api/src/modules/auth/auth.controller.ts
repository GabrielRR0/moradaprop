import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppConfig } from '../../config';
import { AllowWithoutSecondFactor, Client, CurrentUser, RequestInfo } from '../../common/security/decorators';
import { AuthGroup, GuestGroup } from '../../common/security/groups';
import type { AppClient, AuthUserContext } from '../../common/security/types';
import { EmailCodeDto, EmailDto } from './dto/email-code.dto';
import { GoogleLinkConfirmDto, GoogleTokenDto } from './dto/google.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  TwoFactorChallengeDto,
  TwoFactorConfirmDto,
  TwoFactorDisableDto,
  TwoFactorLoginDto,
} from './dto/two-factor.dto';
import { AuthService } from './services/auth.service';
import type { RequestContext } from './utils/auth-context';
import {
  clearRefreshCookie,
  REFRESH_COOKIE,
  respondWithLogin,
  respondWithTokens,
  type CookieSettings,
} from './utils/auth-response';

/** Controller delgado: toda la logica vive en AuthService y sus services hijos. */
@ApiTags('auth')
@Controller()
export class AuthController {
  private readonly cookie: CookieSettings;

  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfig,
  ) {
    this.cookie = { secure: config.app.isProduction, maxAgeDays: config.auth.refreshTtlDays };
  }

  // ---------------- Registro y verificacion ----------------

  @GuestGroup()
  @Post('register')
  register(@Body() dto: RegisterDto, @RequestInfo() ctx: RequestContext) {
    return this.authService.register(dto, ctx);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('verify-email')
  async verifyEmail(
    @Body() dto: EmailCodeDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    return respondWithLogin(res, client, await this.authService.verifyEmail(dto.email, dto.code, ctx), this.cookie);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('resend-code')
  resendCode(@Body() dto: EmailDto) {
    return this.authService.resendVerification(dto.email);
  }

  // ---------------- Login ----------------

  @GuestGroup()
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    return respondWithLogin(res, client, await this.authService.login(dto, ctx), this.cookie);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('login/2fa')
  async loginTwoFactor(
    @Body() dto: TwoFactorLoginDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.twoFactorLogin(dto.challengeToken, dto.code, ctx);
    return respondWithLogin(res, client, result, this.cookie);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('login/2fa/email-code')
  twoFactorEmailCode(@Body() dto: TwoFactorChallengeDto) {
    return this.authService.twoFactorEmailCode(dto.challengeToken);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = client === 'mobile' ? dto.refreshToken : (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    return respondWithTokens(res, client, await this.authService.refresh(token ?? '', ctx), this.cookie);
  }

  // ---------------- Sesiones ----------------

  @AuthGroup()
  @AllowWithoutSecondFactor()
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

  @AuthGroup()
  @AllowWithoutSecondFactor()
  @HttpCode(204)
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthUserContext, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(user.id);
    clearRefreshCookie(res, this.cookie.secure);
  }

  @AuthGroup()
  @AllowWithoutSecondFactor()
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUserContext) {
    return this.authService.sessions(user.id, user.sessionId);
  }

  @AuthGroup()
  @AllowWithoutSecondFactor()
  @HttpCode(204)
  @Delete('sessions/:id')
  async revokeSession(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string) {
    await this.authService.revokeSession(user.id, id);
  }

  // ---------------- Contrasena ----------------

  @GuestGroup()
  @HttpCode(200)
  @Post('password/forgot')
  forgotPassword(@Body() dto: EmailDto, @RequestInfo() ctx: RequestContext) {
    return this.authService.forgotPassword(dto.email, ctx);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto, @RequestInfo() ctx: RequestContext) {
    return this.authService.resetPassword(dto, ctx);
  }

  // ---------------- 2FA ----------------

  @AuthGroup()
  @AllowWithoutSecondFactor()
  @HttpCode(200)
  @Post('2fa/setup')
  twoFactorSetup(@CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    return this.authService.twoFactorSetup(user.id, ctx);
  }

  @AuthGroup()
  @AllowWithoutSecondFactor()
  @HttpCode(200)
  @Post('2fa/confirm')
  twoFactorConfirm(@Body() dto: TwoFactorConfirmDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    return this.authService.twoFactorConfirm(user.id, user.sessionId, dto.code, ctx);
  }

  @AuthGroup()
  @HttpCode(200)
  @Post('2fa/disable')
  twoFactorDisable(@Body() dto: TwoFactorDisableDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    return this.authService.twoFactorDisable(user.id, user.sessionId, dto.password, dto.code, ctx);
  }

  @AuthGroup()
  @HttpCode(200)
  @Post('2fa/backup-codes')
  twoFactorBackupCodes(@Body() dto: TwoFactorDisableDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    return this.authService.twoFactorBackupCodes(user.id, dto.password, dto.code, ctx);
  }

  // ---------------- Google ----------------

  @GuestGroup()
  @HttpCode(200)
  @Post('google')
  async google(
    @Body() dto: GoogleTokenDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    return respondWithLogin(res, client, await this.authService.googleLogin(dto.idToken, ctx), this.cookie);
  }

  @GuestGroup()
  @HttpCode(200)
  @Post('google/link/confirm')
  async googleConfirmLink(
    @Body() dto: GoogleLinkConfirmDto,
    @RequestInfo() ctx: RequestContext,
    @Client() client: AppClient,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleConfirmLink(dto.idToken, dto.code, ctx);
    return respondWithLogin(res, client, result, this.cookie);
  }

  @AuthGroup()
  @HttpCode(200)
  @Post('google/link')
  googleLink(@Body() dto: GoogleTokenDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    return this.authService.googleLink(user.id, dto.idToken, ctx);
  }

  @AuthGroup()
  @Delete('google')
  googleUnlink(@CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    return this.authService.googleUnlink(user.id, ctx);
  }
}
