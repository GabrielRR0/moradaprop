import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { MailSupport } from '@/support/mail';
import { AccessRiskService } from '@/modules/security';
import { DbSupport } from '@/support/db';
import type { LoginResult, RequestContext } from '../../utils/auth-context';
import { UserAccountService } from '../account/user-account.service';
import { VerificationCodeService } from '../registration/verification-code.service';
import { LoginService } from '../sign-in/login.service';
import { TokenService } from '../sign-in/token.service';
import { TwoFactorVerifier } from './two-factor-verifier.service';

/** Segundo paso del login: enviar el codigo por correo y completar el inicio de sesion con el codigo. */
@Injectable()
export class TwoFactorLoginService {
  constructor(
    private readonly tokens: TokenService,
    private readonly login: LoginService,
    private readonly verifier: TwoFactorVerifier,
    private readonly codes: VerificationCodeService,
    private readonly mail: MailSupport.Service,
    private readonly accounts: UserAccountService,
    private readonly risk: AccessRiskService,
  ) {}

  /** Envia un codigo al correo como alternativa a la app autenticadora. */
  async sendEmailCode(challengeToken: string) {
    const { sub, risk } = await this.tokens.verifyTwoFactorChallenge(challengeToken);
    // En un inicio de sesion muy raro el correo no prueba nada fuerte: solo app autenticadora o codigo de respaldo.
    if (risk === 'HIGH' && this.risk.mode === 'enforce') {
      throw new ForbiddenException('Por seguridad, en este inicio de sesion usa tu app autenticadora o un codigo de respaldo');
    }
    const user = await this.getUser(sub);
    const code = await this.codes.issue(user.id, 'TWO_FACTOR_EMAIL');
    await this.mail.send(user.email, { name: 'two-factor-code', code, minutes: this.codes.ttlMinutes });
    return { message: 'Te enviamos un codigo al correo' };
  }

  /** Completa el login con TOTP, codigo de respaldo o codigo por correo. */
  async completeLogin(challengeToken: string, code: string, context: RequestContext): Promise<LoginResult> {
    const { sub, risk } = await this.tokens.verifyTwoFactorChallenge(challengeToken);
    const strong = risk === 'HIGH' && this.risk.mode === 'enforce';
    const user = await this.getUser(sub);
    this.login.assertNotLocked(user);

    try {
      await this.verifier.verifyAnyCode(user, code, !strong);
    } catch (error) {
      await this.login.registerFailure(user, context);
      // Fallar el segundo factor en un inicio muy raro es la huella de un atacante: a los 3 fallos se bloquea.
      if (strong) await this.risk.stepUpFailed(user, context);
      throw error;
    }
    return this.login.finishLogin(user, context, true);
  }

  private async getUser(userId: string): Promise<DbSupport.User> {
    const user = await this.accounts.findById(userId);
    if (!user) throw new UnauthorizedException('Sesion invalida');
    return user;
  }
}
