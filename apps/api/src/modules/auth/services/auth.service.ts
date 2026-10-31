import { Injectable } from '@nestjs/common';
import type { LoginDto } from '../contracts/dto/login.dto';
import type { RegisterDto } from '../contracts/dto/register.dto';
import type { ResetPasswordDto } from '../contracts/dto/reset-password.dto';
import type {
  BackupCodesResource,
  MessageResource,
  SessionResource,
  TwoFactorEnabledResource,
  TwoFactorSetupResource,
} from '../contracts/resources';
import type { AuthTokens, LoginResult, RequestContext } from '../utils/auth-context';
import { GoogleAuthService, type GoogleLoginResult } from './google/google-auth.service';
import { LoginService } from './sign-in/login.service';
import { PasswordResetService } from './password/password-reset.service';
import { RegisterService } from './registration/register.service';
import { SessionService } from './sign-in/session.service';
import { TwoFactorLoginService } from './two-factor/two-factor-login.service';
import { TwoFactorSetupService } from './two-factor/two-factor-setup.service';
import { VerifyEmailService } from './registration/verify-email.service';

/** Fachada: el controller solo llama a este service, que delega en los services hijos. */
@Injectable()
export class AuthService {
  constructor(
    private readonly registerService: RegisterService,
    private readonly verifyEmailService: VerifyEmailService,
    private readonly loginService: LoginService,
    private readonly sessionService: SessionService,
    private readonly twoFactorLoginService: TwoFactorLoginService,
    private readonly twoFactorSetupService: TwoFactorSetupService,
    private readonly passwordReset: PasswordResetService,
    private readonly google: GoogleAuthService,
  ) {}

  // Registro y verificacion
  register(dto: RegisterDto, context: RequestContext): Promise<MessageResource> {
    return this.registerService.register(dto, context);
  }
  resendVerification(email: string): Promise<MessageResource> {
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
    return this.sessionService.refresh(refreshToken, context);
  }
  logout(refreshToken: string | undefined) {
    return refreshToken ? this.sessionService.revoke(refreshToken) : Promise.resolve();
  }
  logoutAll(userId: string) {
    return this.sessionService.revokeAll(userId);
  }
  sessions(userId: string, currentSessionId: string): Promise<SessionResource[]> {
    return this.sessionService.listSessions(userId, currentSessionId);
  }
  revokeSession(userId: string, sessionId: string) {
    return this.sessionService.revokeOwnSession(userId, sessionId);
  }

  // Contrasena
  forgotPassword(email: string, context: RequestContext): Promise<MessageResource> {
    return this.passwordReset.forgot(email, context);
  }
  resetPassword(dto: ResetPasswordDto, context: RequestContext): Promise<MessageResource> {
    return this.passwordReset.reset(dto, context);
  }

  // 2FA
  twoFactorLogin(challengeToken: string, code: string, context: RequestContext): Promise<LoginResult> {
    return this.twoFactorLoginService.completeLogin(challengeToken, code, context);
  }
  twoFactorEmailCode(challengeToken: string): Promise<MessageResource> {
    return this.twoFactorLoginService.sendEmailCode(challengeToken);
  }
  twoFactorSetup(userId: string, context: RequestContext): Promise<TwoFactorSetupResource> {
    return this.twoFactorSetupService.setup(userId, context);
  }
  twoFactorConfirm(userId: string, sessionId: string, code: string, context: RequestContext): Promise<TwoFactorEnabledResource> {
    return this.twoFactorSetupService.confirm(userId, sessionId, code, context);
  }
  twoFactorDisable(userId: string, sessionId: string, password: string | undefined, code: string, context: RequestContext): Promise<MessageResource> {
    return this.twoFactorSetupService.disable(userId, sessionId, password, code, context);
  }
  twoFactorBackupCodes(userId: string, password: string | undefined, code: string, context: RequestContext): Promise<BackupCodesResource> {
    return this.twoFactorSetupService.regenerateBackupCodes(userId, password, code, context);
  }

  // Google
  googleLogin(idToken: string, context: RequestContext): Promise<GoogleLoginResult> {
    return this.google.loginWithGoogle(idToken, context);
  }
  googleConfirmLink(idToken: string, code: string, context: RequestContext): Promise<GoogleLoginResult> {
    return this.google.confirmLink(idToken, code, context);
  }
  googleLink(userId: string, idToken: string, context: RequestContext): Promise<MessageResource> {
    return this.google.linkToUser(userId, idToken, context);
  }
  googleUnlink(userId: string, context: RequestContext): Promise<MessageResource> {
    return this.google.unlink(userId, context);
  }
}
