import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig } from '@/config';
import { CryptoService } from '@/common/crypto';
import { PrismaService } from '@/common/prisma';
import { AccessRiskService, SecurityService, SessionVault, UserVault, type LoginTrust } from '@/modules/security';
import { DbSupport } from '@/support/db';
import { toPublicUser, type AuthTokens, type RequestContext } from '../../utils/auth-context';
import { TokenService } from './token.service';

const INVALID_SESSION = 'Sesion invalida o vencida';

/**
 * Margen para el doble uso legitimo: dos pestañas (o un reintento de red) pueden refrescar a la vez con el
 * mismo token. Un token rotado hace menos de esto solo se rechaza; pasado el margen, reusarlo = posible robo.
 */
const REUSE_GRACE_MS = 10_000;

/** Sesiones con refresh token rotativo: iniciar, renovar, listar y cerrar. Los JWT los firma token.service. */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: AppConfig,
    private readonly security: SecurityService,
    private readonly vault: UserVault,
    private readonly sessionVault: SessionVault,
    private readonly risk: AccessRiskService,
    private readonly tokens: TokenService,
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
        strongAuthAt: twoFactorVerified ? new Date() : null,
        deviceId: trust?.deviceId ?? null,
        country: trust?.country ?? context.country ?? null,
        expiresAt: this.refreshExpiry(),
      }),
    });

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const { accessToken, enrollment } = await this.tokens.issueAccess(user, session.id, twoFactorVerified);
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
          // La verificacion no se renueva sola: el refresh conserva la hora original.
          strongAuthAt: session.strongAuthAt,
          deviceId: session.deviceId,
          country: context.country ?? session.country,
          expiresAt: this.refreshExpiry(),
        }),
      });
    });

    if (!next) throw new UnauthorizedException(INVALID_SESSION);

    const { accessToken, enrollment } = await this.tokens.issueAccess(session.user, next.id, session.twoFactorVerified);
    return { user: toPublicUser(session.user), accessToken, refreshToken: nextToken, enrollment };
  }

  /** Marca la sesion como verificada con 2FA y devuelve un access token actualizado. */
  async markTwoFactorVerified(user: DbSupport.User, sessionId: string): Promise<string> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { twoFactorVerified: true, strongAuthAt: new Date() } });
    return this.tokens.signAccess(user, sessionId, true);
  }

  /** El segundo factor se comprobo ahora (codigo o passkey): las acciones sensibles se habilitan por unos minutos. */
  async markStrongAuth(sessionId: string): Promise<Date> {
    const strongAuthAt = new Date();
    await this.prisma.session.update({ where: { id: sessionId }, data: { strongAuthAt } });
    return strongAuthAt;
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
