import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SecurityModule } from '../security';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { LoginService } from './services/login.service';
import { PasswordResetService } from './services/password-reset.service';
import { RegisterService } from './services/register.service';
import { TokenService } from './services/token.service';
import { TwoFactorService } from './services/two-factor.service';
import { UserAccountService } from './services/user-account.service';
import { VerificationCodeService } from './services/verification-code.service';
import { VerifyEmailService } from './services/verify-email.service';

@Module({
  // JwtModule sin secreto global: cada firma/verificacion pasa su secreto (access o challenge).
  imports: [JwtModule.register({}), SecurityModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterService,
    VerifyEmailService,
    LoginService,
    TokenService,
    TwoFactorService,
    PasswordResetService,
    GoogleAuthService,
    UserAccountService,
    VerificationCodeService,
    JwtAuthGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard],
})
export class AuthModule {}
