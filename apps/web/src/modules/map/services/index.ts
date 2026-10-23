import { useSyncExternalStore } from 'react';
import { publicEnv } from '@/config';
import type { PropertyFilters } from './filters';
import { mockDetail, mockMap, mockSearch } from './mock-search';
import { ApiError, propertyApi } from './property-api';
import type { Bounds, MapResult, PropertyCard, PropertyPage } from './types';

export * from './filters';
export * from './types';
export { ApiError } from './property-api';

/**
 * Fuente de datos del mapa y la lista.
 *  - NEXT_PUBLIC_USE_MOCKS=false : solo el API.
 *  - NEXT_PUBLIC_USE_MOCKS=true  : siempre datos de ejemplo.
 *  - NEXT_PUBLIC_USE_MOCKS=auto  : el API y, si no responde, datos de ejemplo (se avisa en pantalla).
 */
let usingMocks = publicEnv.useMocks === 'true';
const listeners = new Set<() => void>();

function switchToMocks() {
  if (usingMocks) return;
  usingMocks = true;
  listeners.forEach((listener) => listener());
}

async function withFallback<T>(real: () => Promise<T>, mock: () => T): Promise<T> {
  if (usingMocks) return mock();
  try {
    return await real();
  } catch (error) {
    const offline = error instanceof ApiError && (error.status === 0 || error.status >= 500);
    if (offline && publicEnv.useMocks === 'auto') {
      switchToMocks();
      return mock();
    }
    throw error;
  }
}

/** true cuando lo que se ve son datos de ejemplo (para mostrar un aviso discreto). */
export function useIsUsingMocks(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => usingMocks,
    () => publicEnv.useMocks === 'true',
  );
}

export const propertyService = {
  map(
    filters: PropertyFilters,
    bounds: Bounds | undefined,
    zoom: number,
    signal?: AbortSignal,
  ): Promise<MapResult> {
    return withFallback(
      () => propertyApi.map(filters, bounds, zoom, signal),
      () => mockMap(filters, bounds, zoom),
    );
  },

  search(
    filters: PropertyFilters,
    bounds: Bounds | undefined,
    page: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<PropertyPage> {
    return withFallback(
      () => propertyApi.search(filters, bounds, page, limit, signal),
      () => mockSearch(filters, bounds, page, limit),
    );
  },

  detail(id: string, signal?: AbortSignal): Promise<PropertyCard> {
    return withFallback(
      () => propertyApi.detail(id, signal),
      () => {
        const found = mockDetail(id);
        if (!found) throw new ApiError(404, 'Propiedad no encontrada');
        return found;
      },
    );
  },
};
