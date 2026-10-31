import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public, RequireTwoFactor, Roles } from '../decorators';
import { limitPerMinute, RATE_LIMITS } from '../rate-limits';
import { DbSupport } from '../../../support/db';

/**
 * GRUPOS DE RUTAS: cada grupo junta los decoradores de acceso y de limite de uso.
 *
 * Para agregar un middleware a un grupo, editas SOLO este archivo:
 * suma el decorador a la lista de `applyDecorators` del grupo.
 * Los guards globales (origen de la app, bloqueos, throttle, JWT, roles) se registran
 * en global-guards.module.ts y leen la metadata que ponen estos decoradores.
 *
 * Uso en un controller:   @AuthGroup()   |   @GuestGroup()   |   @AdminGroup()
 */

const perMinute = (limit: number) => Throttle(limitPerMinute(limit));

/** Publica y abierta a cualquiera (listados, fichas). Throttle suave. */
export const PublicGroup = () => applyDecorators(Public(), perMinute(RATE_LIMITS.public));

/** Publica pero sensible (login, registro, reset, codigos). Throttle estricto. */
export const GuestGroup = () => applyDecorators(Public(), perMinute(RATE_LIMITS.sensitive));

/** Exige token. Cualquier usuario autenticado. */
export const AuthGroup = () => applyDecorators(ApiBearerAuth(), perMinute(RATE_LIMITS.authenticated));

/** Exige token y que el usuario tenga 2FA activo y verificado. */
export const TwoFactorGroup = () => applyDecorators(AuthGroup(), RequireTwoFactor());

/** Exige token y alguno de los roles indicados. */
export const RoleGroup = (...roles: DbSupport.Role[]) => applyDecorators(AuthGroup(), Roles(...roles));

/** Quienes publican y gestionan propiedades: propietario, agencia y admin. */
export const PublisherGroup = () => RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN);

/** Panel de administracion: rol ADMIN y 2FA obligatorio. */
export const AdminGroup = () => applyDecorators(RoleGroup(DbSupport.Role.ADMIN), RequireTwoFactor());
