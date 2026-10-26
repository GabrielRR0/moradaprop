import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AppRequest } from '../../../../common/security/types';
import type { ThreatModelService } from '../services/threat-model.service';

const logger = new Logger('ThreatObserver');

/**
 * Middleware de Express que mira CADA respuesta cuando termina (incluidas las que cortan los guards:
 * 401, 403, 429) y se la pasa al modelo. Nunca cambia ni retrasa la respuesta: observa y listo.
 */
export function threatObserver(threats: ThreatModelService) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      const { user } = req as AppRequest; // lo pone JwtAuthGuard, ya disponible al terminar
      threats
        .observe({
          status: res.statusCode,
          method: req.method,
          path: req.originalUrl.split('?')[0],
          ip: req.ip,
          userId: user?.id,
          roles: user?.roles,
        })
        .catch((error: Error) => logger.warn(`No se pudo evaluar la respuesta: ${error.message}`));
    });
    next();
  };
}
