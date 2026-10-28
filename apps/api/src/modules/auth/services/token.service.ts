import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig } from '../../../config';
import { CryptoService } from '../../../common/crypto';
import { PrismaService } from '../../../common/prisma';
import type { AccessTokenPayload, TwoFactorChallengePayload } from '../../../common/security/types';
import { JwtSupport } from '../../../support/jwt';
import {
  AccessRiskService,
  PasskeyService,
  SecondFactorService,
  SecurityService,
  SessionVault,
  UserVault,
  type LoginTrust,
  type RiskLevel,
  type SecondFactorStatus,
} from '../../security';
import { toPublicUser, type AuthTokens, type RequestContext } from '../utils/auth-context';
import { DbSupport } from '../../../support/db';

const INVALID_SESSION = 'Sesion invalida o vencida';

/**
 * Margen para el doble uso legitimo: dos pestañas (o un reintento de red) pueden refrescar a la vez con el
 * mismo token. Un token rotado hace menos de esto solo se rechaza; pasado el margen, reusarlo = posible robo.
 */
const REUSE_GRACE_MS = 10_000;

/** Access tokens (JWT corto) y sesiones con refresh token rotativo. */
@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtSupport.Signer,
    private readonly crypto: CryptoService,
    private readonly config: AppConfig,
    private readonly security: SecurityService,
    private readonly vault: UserVault,
    private readonly sessionVault: SessionVault,
    private readonly risk: AccessRiskService,
    private readonly passkeys: PasskeyService,
    private readonly secondFactor: SecondFactorService,
  ) {}

  /**
   * Crea una sesion nueva (refresh token) y su primer access token. `trust` trae el dispositivo y pais que
   * definio el analisis de riesgo (access-risk): la sesion queda atada a ese dispositivo.
   */
  async startSession(user: DbSupport.User, context: RequestContext, twoFactorVerified: boolean, trust?: LoginTrust): Promise<AuthTokens> {
    const refreshToken = this.crypto.randomToken();
    const session = await this.prisma.session.create({
      data: this.sessionVault.encode({
        userId: user.id,
        refreshTokenHash: this.crypto.hashToken(refreshToken),
        ip: context.ip,
        userAgent: context.userAgent?.slice(0, 300),
        twoFactorVerified,
        deviceId: trust?.deviceId ?? null,
        country: trust?.country ?? context.country ?? null,
        expiresAt: this.refreshExpiry(),
      }),
    });

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const { accessToken, enrollment } = await this.issueAccess(user, session.id, twoFactorVerified);
    return { user: toPublicUser(user), accessToken, refreshToken, deviceToken: trust?.deviceSecret, enrollment };
  }

  /**
   * Rota el refresh token. Si llega uno ya usado hace mas de REUSE_GRACE_MS (posible robo), se cierran
   * TODAS las sesiones del usuario. La rotacion es atomica: si dos peticiones llegan a la vez con el mismo
   * token, solo una gana y la otra recibe 401 sin cerrar nada (el cliente reintenta con el token nuevo).
   */
  async refresh(rawToken: string, context: RequestContext): Promise<AuthTokens> {
    const found = await this.prisma.session.findUnique({
      where: { refreshTokenHash: this.crypto.hashToken(rawToken) },
      include: { user: true },
    });
    if (!found) throw new UnauthorizedException(INVALID_SESSION);
    const session = { ...found, user: this.vault.decode(found.user) };

    if (session.revokedAt) {
      const justRotated = Date.now() - session.revokedAt.getTime() < REUSE_GRACE_MS;
      if (!justRotated) await this.revokeAll(session.userId);
      throw new UnauthorizedException(INVALID_SESSION);
    }
    if (session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    await this.security.assertNotBlocked({ ip: context.ip, userId: session.userId, email: session.user.email });

    // Defensa del robo de refresh token: la sesion solo se renueva desde su dispositivo (ver access-risk).
    const verdict = await this.risk.checkRefresh(
      { id: session.id, userId: session.userId, deviceId: session.deviceId, country: session.country },
      context,
    );
    if (verdict === 'revoke') {
      await this.prisma.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const nextToken = this.crypto.randomToken();
    const next = await this.prisma.$transaction(async (tx) => {
      // Solo gana quien logra revocar la sesion todavia activa; el que llega segundo (count 0) pierde.
      const { count } = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (count === 0) return null;
      return tx.session.create({
        data: this.sessionVault.encode({
          userId: session.userId,
          refreshTokenHash: this.crypto.hashToken(nextToken),
          ip: context.ip,
          userAgent: context.userAgent?.slice(0, 300),
          twoFactorVerified: session.twoFactorVerified,
          deviceId: session.deviceId,
          country: context.country ?? session.country,
          expiresAt: this.refreshExpiry(),
        }),
      });
    });

    if (!next) throw new UnauthorizedException(INVALID_SESSION);

    const { accessToken, enrollment } = await this.issueAccess(session.user, next.id, session.twoFactorVerified);
    return { user: toPublicUser(session.user), accessToken, refreshToken: nextToken, enrollment };
  }

  /** Marca la sesion como verificada con 2FA y devuelve un access token actualizado. */
  async markTwoFactorVerified(user: DbSupport.User, sessionId: string): Promise<string> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { twoFactorVerified: true } });
    return this.signAccess(user, sessionId, true);
  }

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
  private async issueAccess(
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

  async revoke(rawToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: this.crypto.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Cierra todas las sesiones del usuario (opcionalmente conserva una). */
  async revokeAll(userId: string, exceptSessionId?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: exceptSessionId ? { not: exceptSessionId } : undefined },
      data: { revokedAt: new Date() },
    });
  }

  listSessions(userId: string, currentSessionId: string) {
    return this.prisma.session
      .findMany({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastUsedAt: 'desc' },
        select: { id: true, ip: true, userAgent: true, createdAt: true, lastUsedAt: true },
      })
      .then((sessions) => sessions.map((s) => ({ ...this.sessionVault.decode(s), current: s.id === currentSessionId })));
  }

  /** Solo se puede cerrar una sesion propia (el userId viene del token). */
  async revokeOwnSession(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.auth.refreshTtlDays * 24 * 60 * 60 * 1000);
  }
}
