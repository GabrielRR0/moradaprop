import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppConfig } from '../../../config';
import { GEO_LOCATOR, type GeoLocator } from './geo-locator';

/** Codigos que el CDN usa para 'no se sabe' (XX) y 'red Tor' (T1): sirven para bloquear, no para decir donde esta alguien. */
const NOT_A_PLACE = new Set(['XX', 'T1']);

/** Pais de cada peticion. Dos preguntas distintas, porque confiar en la cabecera tiene distinto costo segun para que. */
@Injectable()
export class GeoService {
  constructor(
    private readonly config: AppConfig,
    @Inject(GEO_LOCATOR) private readonly locator: GeoLocator,
  ) {}

  /**
   * Pais que DICE la peticion, sin comprobar de donde viene la cabecera. Sirve para BLOQUEAR: falsificarla
   * no le da nada al atacante (no mandarla ya equivale a no tener pais).
   */
  claimedCountry(request: Pick<Request, 'headers'>): string | null {
    return this.locator.country(request.headers);
  }

  /**
   * Pais en el que se puede CONFIAR, para decidir si un inicio de sesion es raro. Solo existe con
   * TRUST_PROXY=true (el API esta detras de un CDN/proxy de confianza); si no, cualquiera podria mandar
   * la cabecera con el pais de su victima y pasar por "habitual". Sin eso: null (pais desconocido).
   */
  countryOf(request: Pick<Request, 'headers'>): string | null {
    if (!this.config.security.trustProxy) return null;
    const country = this.claimedCountry(request);
    return country && !NOT_A_PLACE.has(country) ? country : null;
  }
}
