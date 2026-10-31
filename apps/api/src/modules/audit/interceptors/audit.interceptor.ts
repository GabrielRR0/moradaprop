import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';
import type { AppRequest } from '@/common/security/types';
import { AUDIT_KEY, type AuditMetadata } from '../decorators/audit.decorator';
import { AuditService } from '../services/audit.service';

/** Registra en AuditLog las rutas marcadas con @Audit(...) cuando terminan bien. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMetadata | undefined>(AUDIT_KEY, context.getHandler());
    if (!meta || context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<AppRequest>();

    return next.handle().pipe(
      tap((result) => {
        const resultId = (result as { id?: unknown } | null)?.id;
        const paramId = request.params?.id;
        void this.audit.log({
          action: meta.action,
          resource: meta.resource,
          userId: request.user?.id,
          resourceId: typeof paramId === 'string' ? paramId : typeof resultId === 'string' ? resultId : undefined,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: { method: request.method, path: request.path, body: request.body },
        });
      }),
    );
  }
}
