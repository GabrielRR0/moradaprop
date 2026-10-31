import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/common/prisma';
import { RECENT_TWO_FACTOR_KEY } from '@/common/security/decorators';
import { requestOf } from '@/common/security/request-of';
import { SECOND_FACTOR_POLICY } from '../policy';

const MINUTE_MS = 60_000;

/**
 * Guard global (despues de RolesGuard): las rutas con @RecentTwoFactor() piden que la sesion haya comprobado su segundo
 * factor hace menos de SECOND_FACTOR_POLICY.recentMinutes. El dato se lee de la base (Session.strongAuthAt), no del token:
 * asi una verificacion nueva vale al instante y un token viejo no la hereda.
 */
@Injectable()
export class RecentTwoFactorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needsRecent = this.reflector.getAllAndOverride<boolean>(RECENT_TWO_FACTOR_KEY, [context.getHandler(), context.getClass()]);
    if (!needsRecent) return true;

    const user = requestOf(context)?.user;
    if (!user) throw new ForbiddenException('Acceso denegado');

    const session = await this.prisma.session.findUnique({ where: { id: user.sessionId }, select: { strongAuthAt: true } });
    const limit = Date.now() - SECOND_FACTOR_POLICY.recentMinutes * MINUTE_MS;
    if (session?.strongAuthAt && session.strongAuthAt.getTime() >= limit) return true;

    throw new ForbiddenException({
      message: 'Confirma tu identidad otra vez para esta accion',
      code: 'RECENT_TWO_FACTOR_REQUIRED',
    });
  }
}
