import { Injectable } from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';
import type { GeoLocator } from './geo-locator';

/** Cabeceras que ponen los CDN/proxies con el pais de la IP del visitante. */
const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code'];

/** Pais segun el CDN. Sin geolocalizacion propia: sin CDN delante no hay pais (null). */
@Injectable()
export class CdnHeaderLocator implements GeoLocator {
  country(headers: IncomingHttpHeaders): string | null {
    const raw = COUNTRY_HEADERS.map((name) => headers[name]).find((value) => typeof value === 'string' && value);
    const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
    // Se devuelve tal cual (incluidos los codigos especiales de Cloudflare, "XX" y "T1"): bloquear Tor es un uso valido.
    return /^[A-Z0-9]{2}$/.test(code) ? code : null;
  }
}
