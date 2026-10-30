import { publicEnv } from '@/config';
import { boundsToParams, filtersToParams, type PropertyFilters } from './filters';
import type {
  Bounds,
  ClusterMarker,
  MapMarker,
  MapResult,
  PointMarker,
  PropertyDetail,
  PropertyPage,
} from './types';
import type { StateRent } from './rent';

/** Error del API (o de red: status 0). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE = `${publicEnv.apiUrl}/api/properties`;

/** Llama al API y devuelve el JSON. Si no hay red el error trae status 0. */
async function request(path: string, params: URLSearchParams, signal?: AbortSignal) {
  const query = params.toString();
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`, {
      signal,
      headers: { 'X-App-Client': 'web', 'X-App-Key': publicEnv.appClientKey },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
  if (!response.ok) throw new ApiError(response.status, `Error ${response.status}`);
  return response.json();
}

/** El API manda cada pin suelto con sus datos dentro de `point`; aquí se aplanan. */
interface RawMarker {
  kind: 'point' | 'cluster';
  point?: PointMarker;
}

function flattenMarker(raw: RawMarker): MapMarker {
  if (raw.kind === 'point' && raw.point) {
    const { id, latitude, longitude, priceAmount, currency, status } = raw.point;
    return { kind: 'point', id, latitude, longitude, priceAmount, currency, status };
  }
  return raw as unknown as ClusterMarker;
}

export const propertyApi = {
  async map(
    filters: PropertyFilters,
    bounds: Bounds | undefined,
    zoom: number,
    signal?: AbortSignal,
  ): Promise<MapResult> {
    const params = filtersToParams(filters);
    boundsToParams(params, bounds);
    params.set('zoom', String(zoom));
    params.delete('sort');
    const data = await request('/map', params, signal);
    return {
      zoom: data.zoom,
      total: data.total,
      truncated: data.truncated,
      markers: data.markers.map(flattenMarker),
    };
  },

  search(
    filters: PropertyFilters,
    bounds: Bounds | undefined,
    page: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<PropertyPage> {
    const params = filtersToParams(filters);
    boundsToParams(params, bounds);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return request('', params, signal);
  },

  /** Alquiler típico por estado con todas las propiedades publicadas. */
  async rentStats(signal?: AbortSignal): Promise<StateRent[]> {
    const data = await request('/rent-stats', new URLSearchParams(), signal);
    return data.states;
  },

  detail(id: string, signal?: AbortSignal): Promise<PropertyDetail> {
    return request(`/${encodeURIComponent(id)}`, new URLSearchParams(), signal);
  },
};
