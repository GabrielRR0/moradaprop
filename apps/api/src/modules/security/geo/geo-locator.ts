import type { IncomingHttpHeaders } from 'node:http';

/** De donde sale el pais de una peticion. Hoy solo hay una fuente (CDN); para otra, se escribe otro GeoLocator. */
export interface GeoLocator {
  /** Codigo ISO de 2 letras en mayuscula, o null si la fuente no lo sabe. */
  country(headers: IncomingHttpHeaders): string | null;
}

export const GEO_LOCATOR = Symbol('GEO_LOCATOR');
