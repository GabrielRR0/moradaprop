import { Module } from '@nestjs/common';
import { GoogleIdentity } from '../../support/google-identity';
import { JwtSignerModule } from '../../support/jwt';
import { SecurityModule } from '../security';
import { AuthController } from './auth.controller';
import { PasskeyLoginController } from './passkey-login.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { LoginService } from './services/login.service';
import { PasskeyLoginService } from './services/passkey-login.service';
import { PasswordResetService } from './services/password-reset.service';
import { RegisterService } from './services/register.service';
import { TokenService } from './services/token.service';
import { TwoFactorService } from './services/two-factor.service';
import { UserAccountService } from './services/user-account.service';
import { VerificationCodeService } from './services/verification-code.service';
import { VerifyEmailService } from './services/verify-email.service';

@Module({
  imports: [JwtSignerModule, SecurityModule],
  controllers: [AuthController, PasskeyLoginController],
  providers: [
    AuthService,
    RegisterService,
    VerifyEmailService,
    LoginService,
    PasskeyLoginService,
    TokenService,
    TwoFactorService,
    PasswordResetService,
    GoogleAuthService,
    GoogleIdentity,
    UserAccountService,
    VerificationCodeService,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
