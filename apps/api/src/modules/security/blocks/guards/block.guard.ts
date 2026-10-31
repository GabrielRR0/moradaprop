import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { requestOf } from '@/common/security/request-of';
import { GeoService } from '@/modules/security/geo';
import { BlockCheckService } from '../services/block-check.service';

/** Corta peticiones desde IPs, rangos o paises bloqueados antes de llegar a cualquier ruta. */
@Injectable()
export class BlockGuard implements CanActivate {
  constructor(
    private readonly blockCheck: BlockCheckService,
    private readonly geo: GeoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = requestOf(context);
    if (!request) return false; // contexto desconocido: se niega

    await this.blockCheck.assertNotBlocked({
      ip: request.ip,
      country: this.geo.claimedCountry(request) ?? undefined,
    });
    return true;
  }
}
