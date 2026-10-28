import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AccessRiskService,
  PasskeyService,
  SecurityService,
  type AuthenticationCredentialDto,
  type PasskeyStepUpOptionsDto,
  type PasskeyStepUpVerifyDto,
} from '../../security';
import type { LoginResult, RequestContext } from '../utils/auth-context';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { UserAccountService } from './user-account.service';
import { DbSupport } from '../../../support/db';

/**
 * Entrar con passkey (huella, Face ID, Windows Hello). La verificacion de la firma vive en security/passkeys;
 * aqui se decide que pasa con el usuario verificado: la sesion se crea por el mismo camino de siempre
 * (`LoginService.finishLogin`), con el segundo factor ya cumplido.
 */
@Injectable()
export class PasskeyLoginService {
  constructor(
    private readonly passkeys: PasskeyService,
    private readonly login: LoginService,
    private readonly tokens: TokenService,
    private readonly accounts: UserAccountService,
    private readonly security: SecurityService,
    private readonly risk: AccessRiskService,
  ) {}

  /** Entrar sin escribir correo ni clave: el dispositivo ofrece sus passkeys y la elegida dice quien es. */
  loginOptions() {
    return this.passkeys.authenticationOptions('LOGIN');
  }

  async loginVerify(credential: AuthenticationCredentialDto, context: RequestContext): Promise<LoginResult> {
    await this.security.assertNotBlocked({ ip: context.ip });
    const { userId } = await this.passkeys.verifyAuthentication(credential, 'LOGIN', undefined, context);
    const user = await this.userOrFail(userId);
    // Una passkey no se adivina: aunque la cuenta este en pausa por intentos de clave fallidos, el dueño con su
    // huella entra (y entrar limpia ese bloqueo). Asi un atacante no puede dejar a la victima fuera a proposito.
    return this.login.finishLogin(user, context, true);
  }

  /** Segundo paso con passkey despues de /auth/login (cuando el inicio de sesion es muy raro). */
  async stepUpOptions(dto: PasskeyStepUpOptionsDto) {
    const { sub } = await this.tokens.verifyTwoFactorChallenge(dto.challengeToken);
    return this.passkeys.authenticationOptions('STEP_UP', sub);
  }

  async stepUpVerify(dto: PasskeyStepUpVerifyDto, context: RequestContext): Promise<LoginResult> {
    const { sub, risk } = await this.tokens.verifyTwoFactorChallenge(dto.challengeToken);
    const user = await this.userOrFail(sub);
    this.login.assertNotLocked(user);

    try {
      await this.passkeys.verifyAuthentication(dto.credential, 'STEP_UP', sub, context);
    } catch (error) {
      // Fallar la passkey en un inicio muy raro cuenta igual que fallar el codigo del 2FA.
      if (risk === 'HIGH' && this.risk.mode === 'enforce') await this.risk.stepUpFailed(user, context);
      throw error;
    }
    return this.login.finishLogin(user, context, true);
  }

  private async userOrFail(userId: string): Promise<DbSupport.User> {
    const user = await this.accounts.findById(userId);
    if (!user) throw new UnauthorizedException('Passkey invalida');
    return user;
  }
}
