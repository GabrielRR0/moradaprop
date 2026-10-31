import { Module } from '@nestjs/common';
import { GoogleIdentitySupport } from '@/support/google-identity';
import { JwtSupport } from '@/support/jwt';
import { SecurityModule } from '@/modules/security';
import { GoogleLoginController } from './controllers/public/google-login.controller';
import { LoginController } from './controllers/public/login.controller';
import { PasskeyLoginController } from './controllers/public/passkey-login.controller';
import { PasswordRecoveryController } from './controllers/public/password-recovery.controller';
import { RegistrationController } from './controllers/public/registration.controller';
import { GoogleAccountController } from './controllers/private/user/google-account.controller';
import { SessionsController } from './controllers/private/user/sessions.controller';
import { ReverifyController } from './controllers/private/user/reverify.controller';
import { TwoFactorController } from './controllers/private/user/two-factor.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google/google-auth.service';
import { LoginService } from './services/sign-in/login.service';
import { PasskeyLoginService } from './services/sign-in/passkey-login.service';
import { PasswordResetService } from './services/password/password-reset.service';
import { RegisterService } from './services/registration/register.service';
import { SessionService } from './services/sign-in/session.service';
import { TokenService } from './services/sign-in/token.service';
import { ReverifyService } from './services/two-factor/reverify.service';
import { TwoFactorLoginService } from './services/two-factor/two-factor-login.service';
import { TwoFactorSetupService } from './services/two-factor/two-factor-setup.service';
import { TwoFactorVerifier } from './services/two-factor/two-factor-verifier.service';
import { UserAccountService } from './services/account/user-account.service';
import { VerificationCodeService } from './services/registration/verification-code.service';
import { VerifyEmailService } from './services/registration/verify-email.service';

@Module({
  imports: [JwtSupport.Module, SecurityModule],
  // Sin rutas con ":id" que choquen entre controllers: cada uno cuelga de su propio prefijo.
  controllers: [
    RegistrationController,
    LoginController,
    PasswordRecoveryController,
    GoogleLoginController,
    PasskeyLoginController,
    SessionsController,
    TwoFactorController,
    ReverifyController,
    GoogleAccountController,
  ],
  providers: [
    AuthService,
    RegisterService,
    VerifyEmailService,
    LoginService,
    PasskeyLoginService,
    TokenService,
    SessionService,
    TwoFactorSetupService,
    TwoFactorLoginService,
    TwoFactorVerifier,
    ReverifyService,
    PasswordResetService,
    GoogleAuthService,
    GoogleIdentitySupport.Verifier,
    UserAccountService,
    VerificationCodeService,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
