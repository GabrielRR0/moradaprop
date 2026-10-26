import type { NextFunction, Request, Response } from 'express';
import type { AppRequest } from '../../../common/security/types';
import type { GeoService } from './geo.service';

/**
 * Middleware de Express: deja el pais de confianza en `request.country` para que `@RequestInfo()` lo
 * entregue a los services (sesiones, riesgo de login). Se registra en bootstrap/configure-app.ts.
 */
export function geoLocate(geo: GeoService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as AppRequest).country = geo.countryOf(req);
    next();
  };
}
