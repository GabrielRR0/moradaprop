import { describeCase } from '../../../../../test/support/describe-case';
import type { AppConfig } from '../../../../config';
import { CdnHeaderLocator } from '../cdn-header.locator';
import { GeoService } from '../geo.service';

const servicio = (trustProxy: boolean) => new GeoService({ security: { trustProxy } } as unknown as AppConfig, new CdnHeaderLocator());
const peticion = (headers: Record<string, string>) => ({ headers });

describe('geo', () => {
  describeCase('geo', {
    que: 'lee el pais de las cabeceras del CDN (cualquiera de las tres, en mayuscula)',
    espera: 've -> VE, x-vercel-ip-country y x-country-code tambien; sin cabecera -> null; texto raro -> null',
    ejecutar: () => {
      const geo = servicio(true);
      return [
        geo.claimedCountry(peticion({ 'cf-ipcountry': 've' })),
        geo.claimedCountry(peticion({ 'x-vercel-ip-country': 'CA' })),
        geo.claimedCountry(peticion({ 'x-country-code': 'FR' })),
        geo.claimedCountry(peticion({})),
        geo.claimedCountry(peticion({ 'cf-ipcountry': 'Venezuela' })),
      ];
    },
    verificar: (r) => expect(r).toEqual(['VE', 'CA', 'FR', null, null]),
  });

  describeCase('geo', {
    que: 'sin TRUST_PROXY el pais "de confianza" no existe (la cabecera se puede falsificar)',
    espera: 'countryOf = null, pero claimedCountry (para bloquear) sigue leyendo la cabecera',
    ejecutar: () => {
      const geo = servicio(false);
      const req = peticion({ 'cf-ipcountry': 'VE' });
      return { confianza: geo.countryOf(req), declarado: geo.claimedCountry(req) };
    },
    verificar: (r) => expect(r).toEqual({ confianza: null, declarado: 'VE' }),
  });

  describeCase('geo', {
    que: 'con TRUST_PROXY, los codigos XX (desconocido) y T1 (Tor) no cuentan como pais para el riesgo, pero SI se pueden bloquear',
    espera: 'countryOf null para XX y T1; claimedCountry los devuelve; un pais real pasa',
    ejecutar: () => {
      const geo = servicio(true);
      const xx = peticion({ 'cf-ipcountry': 'XX' });
      const t1 = peticion({ 'cf-ipcountry': 'T1' });
      return {
        confianza: [geo.countryOf(xx), geo.countryOf(t1), geo.countryOf(peticion({ 'cf-ipcountry': 'VE' }))],
        declarado: [geo.claimedCountry(xx), geo.claimedCountry(t1)],
      };
    },
    verificar: (r) => expect(r).toEqual({ confianza: [null, null, 'VE'], declarado: ['XX', 'T1'] }),
  });
});
