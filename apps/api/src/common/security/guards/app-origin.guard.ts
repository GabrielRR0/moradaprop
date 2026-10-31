import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppConfig } from '@/config';
import { CryptoService } from '../../crypto';
import { SKIP_APP_CHECK_KEY } from '../decorators';
import { requestOf } from '../request-of';
import type { AppClient } from '../types';

/**
 * Solo nuestras apps pueden llamar al API:
 *  - Si la peticion trae Origin (navegador), debe estar en la lista blanca de CORS.
 *  - Debe traer X-App-Client (web|mobile) y X-App-Key con la clave de esa app.
 * Es una capa mas, no la unica: ninguna cabecera es infalsificable.
 */
@Injectable()
export class AppOriginGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfig,
    private readonly crypto: CryptoService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = requestOf(context);
    if (!request) return false; // contexto desconocido: se niega

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_APP_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const origin = request.headers.origin;
    if (origin && !this.config.security.corsAllowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origen no permitido');
    }

    const client = String(request.headers['x-app-client'] ?? '') as AppClient;
    const key = String(request.headers['x-app-key'] ?? '');
    const expected = this.config.security.clientKeys[client];

    if (!expected || !key || !this.crypto.safeEqual(key, expected)) {
      throw new ForbiddenException('Cliente no autorizado');
    }

    request.appClient = client;
    return true;
  }
}
