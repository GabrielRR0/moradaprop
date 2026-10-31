import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/security/decorators';
import { requestOf } from '@/common/security/request-of';
import type { AppRequest } from '@/common/security/types';
import { SecurityService } from '@/modules/security';
import { TokenService } from '../services/sign-in/token.service';

/** Guard global: toda ruta exige token salvo las marcadas con @Public() (grupos Public/Guest). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly security: SecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = requestOf(context);
    if (!request) return false; // contexto desconocido: se niega

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');

    if (isPublic) {
      // Ruta publica: si trae un token valido se identifica al usuario (ej. ver su propiedad pausada).
      // Un token invalido o vencido no la rompe: se trata como visitante.
      if (scheme === 'Bearer' && token) await this.attachUser(request, token).catch(() => undefined);
      return true;
    }

    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Token requerido');

    await this.attachUser(request, token);
    return true;
  }

  private async attachUser(request: AppRequest, token: string) {
    const payload = await this.tokens.verifyAccess(token);
    await this.security.assertNotBlocked({ ip: request.ip, userId: payload.sub });

    request.user = {
      id: payload.sub,
      roles: payload.roles,
      sessionId: payload.sid,
      twoFactor: payload.twoFactor,
      enroll: payload.enroll,
    };
  }
}
