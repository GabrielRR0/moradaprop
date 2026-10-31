import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig } from '@/config';
import type { AccessTokenPayload, TwoFactorChallengePayload } from '@/common/security/types';
import { JwtSupport } from '@/support/jwt';
import { PasskeyService, SecondFactorService, type RiskLevel, type SecondFactorStatus } from '@/modules/security';
import { DbSupport } from '@/support/db';

/** Firma y verifica los JWT: el access token y el token corto del segundo paso. Las sesiones estan en session.service. */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtSupport.Signer,
    private readonly config: AppConfig,
    private readonly passkeys: PasskeyService,
    private readonly secondFactor: SecondFactorService,
  ) {}

  /**
   * El claim `twoFactor` significa: esta sesion verifico un factor fuerte Y la cuenta todavia lo tiene (2FA activo o
   * al menos una passkey). Si despues quita el factor, el claim se cae en el siguiente token.
   */
  async signAccess(user: DbSupport.User, sessionId: string, twoFactorVerified: boolean): Promise<string> {
    return (await this.issueAccess(user, sessionId, twoFactorVerified)).accessToken;
  }

  /**
   * Emite el access token y el estado del segundo factor de la cuenta. Si debe activar passkey o 2FA y no lo hizo (y el
   * modo es enforce), el token lleva `enroll: true` y solo abre las rutas de enrolamiento (SecondFactorGuard).
   */
  async issueAccess(
    user: DbSupport.User,
    sessionId: string,
    twoFactorVerified: boolean,
  ): Promise<{ accessToken: string; enrollment: SecondFactorStatus }> {
    const hasPasskey = user.twoFactorEnabled ? false : await this.passkeys.hasAny(user.id);
    const enrollment = await this.secondFactor.status(user, { hasPasskey });
    const payload: AccessTokenPayload = {
      sub: user.id,
      roles: user.roles,
      sid: sessionId,
      twoFactor: twoFactorVerified && (user.twoFactorEnabled || hasPasskey),
      ...(enrollment.blocked ? { enroll: true } : {}),
      type: 'access',
    };
    const accessToken = await this.jwt.sign(payload, {
      secret: this.config.auth.jwtAccessSecret,
      expiresIn: this.config.auth.jwtAccessExpiresIn,
    });
    return { accessToken, enrollment };
  }

  verifyAccess(token: string): Promise<AccessTokenPayload> {
    return this.jwt
      .verify<AccessTokenPayload>(token, this.config.auth.jwtAccessSecret)
      .then((payload) => {
        if (payload.type !== 'access') throw new Error('tipo de token incorrecto');
        return payload;
      })
      .catch(() => {
        throw new UnauthorizedException('Token invalido o vencido');
      });
  }

  signTwoFactorChallenge(userId: string, risk?: RiskLevel): Promise<string> {
    const payload: TwoFactorChallengePayload = { sub: userId, type: '2fa-challenge', risk };
    return this.jwt.sign(payload, {
      secret: this.config.auth.jwtAccessSecret,
      expiresIn: this.config.auth.twoFactorChallengeTtl,
    });
  }

  verifyTwoFactorChallenge(token: string): Promise<TwoFactorChallengePayload> {
    return this.jwt
      .verify<TwoFactorChallengePayload>(token, this.config.auth.jwtAccessSecret)
      .then((payload) => {
        if (payload.type !== '2fa-challenge') throw new Error('tipo de token incorrecto');
        return payload;
      })
      .catch(() => {
        throw new UnauthorizedException('El paso de verificacion vencio, inicia sesion otra vez');
      });
  }
}
