import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { requestOf } from '../../../../common/security/request-of';
import { BlockCheckService } from '../services/block-check.service';

/** Cabeceras que suelen poner CDNs/proxies con el pais de la IP. */
const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code'];

/** Corta peticiones desde IPs, rangos o paises bloqueados antes de llegar a cualquier ruta. */
@Injectable()
export class BlockGuard implements CanActivate {
  constructor(private readonly blockCheck: BlockCheckService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = requestOf(context);
    if (!request) return false; // contexto desconocido: se niega

    const header = COUNTRY_HEADERS.map((name) => request.headers[name]).find(Boolean);

    await this.blockCheck.assertNotBlocked({
      ip: request.ip,
      country: typeof header === 'string' ? header : undefined,
    });
    return true;
  }
}
