import { CanActivate, ExecutionContext, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AppConfig } from '@/config';
import { TurnstileSupport } from '@/support/turnstile';
import { requestOf } from '../request-of';

/** Cabecera por la que la web manda la respuesta del widget (va en cabecera para no tocar el cuerpo de cada ruta). */
export const HUMAN_CHECK_HEADER = 'x-turnstile-token';

/**
 * Exige la verificacion "no soy un robot" (Cloudflare Turnstile) en las rutas marcadas con `@RequireHumanCheck()`.
 * - Con `TURNSTILE_ENABLED=false` no hace nada: todas las rutas se comportan como si no existiera.
 * - Con `true`, pide la cabecera `x-turnstile-token` y la valida con Cloudflare (cada token sirve una sola vez).
 * - Aplica a todos los clientes (web y mobile): no hay excepcion por cliente, porque la clave de la app mobile no es
 *   secreta y se usaria para saltarla. Cuando exista la app mobile se decidira su propia comprobacion.
 * - Si Cloudflare no responde, NIEGA el acceso (503 con su propio codigo, para que la web deje reintentar).
 */
@Injectable()
export class HumanCheckGuard implements CanActivate {
  constructor(
    private readonly config: AppConfig,
    private readonly turnstile: TurnstileSupport.Service,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.config.security.turnstile.enabled) return true;

    const request = requestOf(context);
    if (!request) throw new ForbiddenException('Acceso denegado');

    const header = request.headers[HUMAN_CHECK_HEADER];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token) {
      throw new ForbiddenException({ message: 'Confirma que eres una persona', code: 'HUMAN_CHECK_REQUIRED' });
    }

    const result = await this.turnstile.verify(token, request.ip);
    if (result === 'valid') return true;
    if (result === 'unavailable') {
      throw new ServiceUnavailableException({
        message: 'No pudimos comprobar que eres una persona. Inténtalo de nuevo en un momento.',
        code: 'HUMAN_CHECK_UNAVAILABLE',
      });
    }
    throw new ForbiddenException({ message: 'La verificación falló. Inténtalo de nuevo.', code: 'HUMAN_CHECK_FAILED' });
  }
}
