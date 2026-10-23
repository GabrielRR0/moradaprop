import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { requestOf, responseOf } from './request-of';

/** ThrottlerGuard que tambien entiende GraphQL (donde la peticion vive dentro del contexto de Apollo). */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    return {
      req: requestOf(context) as unknown as Record<string, unknown>,
      res: responseOf(context) as Record<string, unknown>,
    };
  }
}
