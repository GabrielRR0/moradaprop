import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '../../../../common/security/types';
import { AuditService } from '../../../audit';
import type { ResourcePolicy } from '../types';

/** Accion que se registra en auditoria cuando alguien pide un recurso que no es suyo. */
export const ACCESS_DENIED_ACTION = 'access.denied';

/**
 * Unico punto donde se decide "este usuario puede tocar este recurso".
 * Los services piden el recurso con `require` en vez de buscarlo por id a mano.
 */
@Injectable()
export class OwnershipService {
  constructor(private readonly audit: AuditService) {}

  /**
   * Devuelve el recurso si el usuario puede hacer `action`; si no, lanza 404 (o 403 si la
   * politica define `forbidden`). Cada rechazo queda en auditoria (`access.denied`), que es
   * la senal para detectar a quien prueba ids ajenos.
   */
  async require<T>(
    policy: ResourcePolicy<T>,
    user: AuthUserContext,
    id: string,
    action: string,
    context?: Partial<RequestContext>,
  ): Promise<T> {
    const entity = await policy.find(id);
    if (!entity) throw new NotFoundException(policy.notFound);
    if (await policy.can(user, entity, action)) return entity;

    await this.audit.log({
      action: ACCESS_DENIED_ACTION,
      userId: user.id,
      resource: policy.resource,
      resourceId: id,
      ip: context?.ip,
      userAgent: context?.userAgent,
      metadata: { action },
    });
    throw policy.forbidden ? new ForbiddenException(policy.forbidden) : new NotFoundException(policy.notFound);
  }
}
