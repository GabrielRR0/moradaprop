import { Injectable } from '@nestjs/common';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import type { AuthTokens, LoginResult, RequestContext } from '../utils/auth-context';
import { GoogleAuthService, type GoogleLoginResult } from './google-auth.service';
import { LoginService } from './login.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterService } from './register.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { VerifyEmailService } from './verify-email.service';

/** Fachada: el controller solo llama a este service, que delega en los services hijos. */
@Injectable()
export class AuthService {
  constructor(
    private readonly registerService: RegisterService,
    private readonly verifyEmailService: VerifyEmailService,
    private readonly loginService: LoginService,
    private readonly tokens: TokenService,
    private readonly twoFactor: TwoFactorService,
    private readonly passwordReset: PasswordResetService,
    private readonly google: GoogleAuthService,
  ) {}

  // Registro y verificacion
  register(dto: RegisterDto, context: RequestContext) {
    return this.registerService.register(dto, context);
  }
  resendVerification(email: string) {
    return this.registerService.resendVerification(email);
  }
  verifyEmail(email: string, code: string, context: RequestContext): Promise<LoginResult> {
    return this.verifyEmailService.verify(email, code, context);
  }

  // Login y sesiones
  login(dto: LoginDto, context: RequestContext): Promise<LoginResult> {
    return this.loginService.login(dto, context);
  }
  refresh(refreshToken: string, context: RequestContext): Promise<AuthTokens> {
    return this.tokens.refresh(refreshToken, context);
  }
  logout(refreshToken: string | undefined) {
    return refreshToken ? this.tokens.revoke(refreshToken) : Promise.resolve();
  }
  logoutAll(userId: string) {
    return this.tokens.revokeAll(userId);
  }
  sessions(userId: string, currentSessionId: string) {
    return this.tokens.listSessions(userId, currentSessionId);
  }
  revokeSession(userId: string, sessionId: string) {
    return this.tokens.revokeOwnSession(userId, sessionId);
  }

  // Contrasena
  forgotPassword(email: string, context: RequestContext) {
    return this.passwordReset.forgot(email, context);
  }
  resetPassword(dto: ResetPasswordDto, context: RequestContext) {
    return this.passwordReset.reset(dto, context);
  }

  // 2FA
  twoFactorLogin(challengeToken: string, code: string, context: RequestContext): Promise<LoginResult> {
    return this.twoFactor.completeLogin(challengeToken, code, context);
  }
  twoFactorEmailCode(challengeToken: string) {
    return this.twoFactor.sendEmailCode(challengeToken);
  }
  twoFactorSetup(userId: string) {
    return this.twoFactor.setup(userId);
  }
  twoFactorConfirm(userId: string, sessionId: string, code: string, context: RequestContext) {
    return this.twoFactor.confirm(userId, sessionId, code, context);
  }
  twoFactorDisable(userId: string, sessionId: string, password: string | undefined, code: string, context: RequestContext) {
    return this.twoFactor.disable(userId, sessionId, password, code, context);
  }
  twoFactorBackupCodes(userId: string, password: string | undefined, code: string, context: RequestContext) {
    return this.twoFactor.regenerateBackupCodes(userId, password, code, context);
  }

  // Google
  googleLogin(idToken: string, context: RequestContext): Promise<GoogleLoginResult> {
    return this.google.loginWithGoogle(idToken, context);
  }
  googleConfirmLink(idToken: string, code: string, context: RequestContext): Promise<GoogleLoginResult> {
    return this.google.confirmLink(idToken, code, context);
  }
  googleLink(userId: string, idToken: string, context: RequestContext) {
    return this.google.linkToUser(userId, idToken, context);
  }
  googleUnlink(userId: string, context: RequestContext) {
    return this.google.unlink(userId, context);
  }
}
