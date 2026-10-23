import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AppRequest } from './types';

/**
 * Devuelve la peticion Express tanto en REST como en GraphQL, para que TODOS los guards
 * (origen de la app, bloqueos, JWT, roles) protejan las dos puertas por igual.
 * Si el contexto no es ninguno de los dos (ej. websockets) devuelve undefined y el guard NIEGA el acceso.
 */
export function requestOf(context: ExecutionContext): AppRequest | undefined {
  const type = context.getType<string>();
  if (type === 'http') return context.switchToHttp().getRequest<AppRequest>();
  if (type === 'graphql') return GqlExecutionContext.create(context).getContext<{ req: AppRequest }>().req;
  return undefined;
}

/** Respuesta Express (la necesita el rate limit). */
export function responseOf(context: ExecutionContext) {
  const type = context.getType<string>();
  if (type === 'graphql') return GqlExecutionContext.create(context).getContext<{ res: unknown }>().res;
  return context.switchToHttp().getResponse();
}
