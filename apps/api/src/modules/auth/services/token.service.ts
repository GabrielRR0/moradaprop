import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { AppConfig } from '../../../config';
import { CryptoService } from '../../../common/crypto';
import { PrismaService } from '../../../common/prisma';
import type { AccessTokenPayload, TwoFactorChallengePayload } from '../../../common/security/types';
import { SecurityService, SessionVault, UserVault } from '../../security';
import { toPublicUser, type AuthTokens, type RequestContext } from '../utils/auth-context';

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
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly config: AppConfig,
    private readonly security: SecurityService,
    private readonly vault: UserVault,
    private readonly sessionVault: SessionVault,
  ) {}

  /** Crea una sesion nueva (refresh token) y su primer access token. */
  async startSession(user: User, context: RequestContext, twoFactorVerified: boolean): Promise<AuthTokens> {
    const refreshToken = this.crypto.randomToken();
    const session = await this.prisma.session.create({
      data: this.sessionVault.encode({
        userId: user.id,
        refreshTokenHash: this.crypto.hashToken(refreshToken),
        ip: context.ip,
        userAgent: context.userAgent?.slice(0, 300),
        twoFactorVerified,
        expiresAt: this.refreshExpiry(),
      }),
    });

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return {
      user: toPublicUser(user),
      accessToken: await this.signAccess(user, session.id, twoFactorVerified),
      refreshToken,
    };
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
          expiresAt: this.refreshExpiry(),
        }),
      });
    });

    if (!next) throw new UnauthorizedException(INVALID_SESSION);

    return {
      user: toPublicUser(session.user),
      accessToken: await this.signAccess(session.user, next.id, session.twoFactorVerified),
      refreshToken: nextToken,
    };
  }

  /** Marca la sesion como verificada con 2FA y devuelve un access token actualizado. */
  async markTwoFactorVerified(user: User, sessionId: string): Promise<string> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { twoFactorVerified: true } });
    return this.signAccess(user, sessionId, true);
  }

  signAccess(user: User, sessionId: string, twoFactorVerified: boolean): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      roles: user.roles,
      sid: sessionId,
      twoFactor: user.twoFactorEnabled && twoFactorVerified,
      type: 'access',
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.auth.jwtAccessSecret,
      expiresIn: this.config.auth.jwtAccessExpiresIn as never,
    });
  }

  verifyAccess(token: string): Promise<AccessTokenPayload> {
    return this.jwt
      .verifyAsync<AccessTokenPayload>(token, { secret: this.config.auth.jwtAccessSecret })
      .then((payload) => {
        if (payload.type !== 'access') throw new Error('tipo de token incorrecto');
        return payload;
      })
      .catch(() => {
        throw new UnauthorizedException('Token invalido o vencido');
      });
  }

  signTwoFactorChallenge(userId: string): Promise<string> {
    const payload: TwoFactorChallengePayload = { sub: userId, type: '2fa-challenge' };
    return this.jwt.signAsync(payload, {
      secret: this.config.auth.jwtAccessSecret,
      expiresIn: this.config.auth.twoFactorChallengeTtl as never,
    });
  }

  verifyTwoFactorChallenge(token: string): Promise<TwoFactorChallengePayload> {
    return this.jwt
      .verifyAsync<TwoFactorChallengePayload>(token, { secret: this.config.auth.jwtAccessSecret })
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
