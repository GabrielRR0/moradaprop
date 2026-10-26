import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_WITHOUT_SECOND_FACTOR_KEY, IS_PUBLIC_KEY } from '../../../../common/security/decorators';
import { requestOf } from '../../../../common/security/request-of';
import { SecondFactorService } from '../services/second-factor.service';

/**
 * Guard global (despues de JwtAuthGuard y RolesGuard): una cuenta que debe activar passkey o 2FA y no lo hizo solo
 * puede usar las rutas marcadas con @AllowWithoutSecondFactor() (ver su perfil, activar un factor, cerrar sesion).
 * El resto responde 403 SECOND_FACTOR_ENROLLMENT_REQUIRED. Las rutas publicas (buscar propiedades) no se tocan.
 */
@Injectable()
export class SecondFactorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly secondFactor: SecondFactorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = requestOf(context)?.user;
    if (!user?.enroll) return true; // el token no trae la marca: nada que bloquear

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    if (this.reflector.getAllAndOverride<boolean>(ALLOW_WITHOUT_SECOND_FACTOR_KEY, targets)) return true;

    // La marca viene del token (hasta 15 min de antiguedad): si acaba de activar un factor, se le deja pasar sin esperar.
    if (await this.secondFactor.hasFactor(user.id)) return true;

    throw new ForbiddenException({
      message: 'Para seguir debes activar la verificacion en dos pasos (passkey o app autenticadora)',
      code: 'SECOND_FACTOR_ENROLLMENT_REQUIRED',
    });
  }
}
