import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { REQUIRE_TWO_FACTOR_KEY, ROLES_KEY } from '../decorators';
import { requestOf } from '../request-of';

/** Aplica @Roles(...) y @RequireTwoFactor() sobre el usuario ya autenticado. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    const needsTwoFactor = this.reflector.getAllAndOverride<boolean>(REQUIRE_TWO_FACTOR_KEY, targets);
    if (!roles?.length && !needsTwoFactor) return true;

    const user = requestOf(context)?.user;
    if (!user) throw new ForbiddenException('Acceso denegado');

    if (roles?.length && !roles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException('No tienes permiso para esta accion');
    }
    if (needsTwoFactor && !user.twoFactor) {
      throw new ForbiddenException({ message: 'Se requiere verificacion en dos pasos', code: 'TWO_FACTOR_REQUIRED' });
    }
    return true;
  }
}
