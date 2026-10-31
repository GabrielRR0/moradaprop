import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuditService } from '@/modules/audit';
import { PasskeyService, SECOND_FACTOR_POLICY, type AuthenticationCredentialDto, type PasskeyAuthenticationOptionsResource } from '@/modules/security';
import type { AuthUserContext } from '@/common/security/types';
import type { ReverifyResource } from '../../contracts/resources';
import type { RequestContext } from '../../utils/auth-context';
import { UserAccountService } from '../account/user-account.service';
import { LoginService } from '../sign-in/login.service';
import { SessionService } from '../sign-in/session.service';
import { TwoFactorVerifier } from './two-factor-verifier.service';

const MINUTE_MS = 60_000;

/**
 * Volver a comprobar el segundo factor con la sesion ya abierta, para las acciones sensibles (@RecentTwoFactor).
 * Solo vale un factor fuerte: codigo de la app, codigo de respaldo o passkey. El codigo por correo no, porque quien
 * tomo el correo del admin no debe poder confirmar acciones con el.
 */
@Injectable()
export class ReverifyService {
  constructor(
    private readonly accounts: UserAccountService,
    private readonly verifier: TwoFactorVerifier,
    private readonly passkeys: PasskeyService,
    private readonly sessions: SessionService,
    private readonly login: LoginService,
    private readonly audit: AuditService,
  ) {}

  async withCode(user: AuthUserContext, code: string, context: RequestContext): Promise<ReverifyResource> {
    const account = await this.accounts.findById(user.id);
    if (!account) throw new UnauthorizedException('Sesion invalida');
    this.login.assertNotLocked(account);
    try {
      await this.verifier.verifyAnyCode(account, code, false);
    } catch (error) {
      await this.login.registerFailure(account, context);
      throw error;
    }
    return this.confirm(user, 'code', context);
  }

  passkeyOptions(user: AuthUserContext): Promise<PasskeyAuthenticationOptionsResource> {
    return this.passkeys.authenticationOptions('STEP_UP', user.id);
  }

  async withPasskey(user: AuthUserContext, credential: AuthenticationCredentialDto, context: RequestContext): Promise<ReverifyResource> {
    await this.passkeys.verifyAuthentication(credential, 'STEP_UP', user.id, context);
    return this.confirm(user, 'passkey', context);
  }

  private async confirm(user: AuthUserContext, method: 'code' | 'passkey', context: RequestContext): Promise<ReverifyResource> {
    const at = await this.sessions.markStrongAuth(user.sessionId);
    await this.audit.log({ action: 'auth.reverify', userId: user.id, ip: context.ip, userAgent: context.userAgent, metadata: { method } });
    return { validUntil: new Date(at.getTime() + SECOND_FACTOR_POLICY.recentMinutes * MINUTE_MS).toISOString() };
  }
}
