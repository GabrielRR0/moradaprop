import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import { requestOf } from '../request-of';
import type { AppRequest, AuthUserContext, RequestContext } from '../types';
import { DbSupport } from '@/support/db';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const REQUIRE_TWO_FACTOR_KEY = 'requireTwoFactor';
export const SKIP_APP_CHECK_KEY = 'skipAppCheck';
export const ALLOW_WITHOUT_SECOND_FACTOR_KEY = 'allowWithoutSecondFactor';

/** La ruta no exige token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
/** La ruta exige alguno de estos roles. */
export const Roles = (...roles: DbSupport.Role[]) => SetMetadata(ROLES_KEY, roles);
/** La ruta exige 2FA activo y verificado en la sesion. */
export const RequireTwoFactor = () => SetMetadata(REQUIRE_TWO_FACTOR_KEY, true);
/**
 * La ruta se puede usar aunque la cuenta deba activar passkey o 2FA y aun no lo haya hecho (las de enrolamiento: ver el
 * perfil, activar un factor, cerrar sesion). Todas las demas se bloquean con SECOND_FACTOR_ENROLLMENT_REQUIRED.
 */
export const AllowWithoutSecondFactor = () => SetMetadata(ALLOW_WITHOUT_SECOND_FACTOR_KEY, true);
/** La ruta no exige cabeceras de cliente (solo health). */
export const SkipAppCheck = () => SetMetadata(SKIP_APP_CHECK_KEY, true);

/** Usuario del token. Usalo en vez de recibir `userId` por body o URL. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUserContext => {
  return (requestOf(ctx) as AppRequest).user as AuthUserContext;
});

/** IP del cliente (respeta `trust proxy` de Express). */
export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return (requestOf(ctx) as AppRequest).ip ?? 'unknown';
});

/** User-Agent del cliente. */
export const UserAgent = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  return (requestOf(ctx) as AppRequest).headers['user-agent'];
});

export const DEVICE_COOKIE = 'device_token';
export const DEVICE_HEADER = 'x-device-token';

/** IP, User-Agent, pais y dispositivo juntos, listos para pasar a los services (sesiones, auditoria, bloqueos, riesgo). */
export const RequestInfo = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestContext => {
  const request = requestOf(ctx) as AppRequest;
  const header = request.headers[DEVICE_HEADER];
  const deviceToken = request.cookies?.[DEVICE_COOKIE] ?? (typeof header === 'string' ? header : undefined);
  return {
    ip: request.ip ?? 'unknown',
    userAgent: request.headers['user-agent'],
    country: request.country,
    deviceToken: typeof deviceToken === 'string' && deviceToken ? deviceToken.slice(0, 200) : undefined,
  };
});

/** App que hace la peticion (web o mobile), validada por AppOriginGuard. */
export const Client = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return (requestOf(ctx) as AppRequest).appClient;
});
