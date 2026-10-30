import { Suspense } from 'react';
import { ClientResponsive } from '@/components/ClientResponsive';
import { MapMobileScreen } from './MapMobileScreen';
import { MapScreen } from './MapScreen';

/** Fondo mientras se sabe si es escritorio o telefono (evita un destello en blanco). */
const loading = (
  <div style={{ minHeight: '100dvh', background: 'var(--map-bg)' }} aria-hidden="true" />
);

/** `/mapa`: escritorio o telefono, solo se monta uno (el mapa abre WebGL y pide datos). */
export function MapPage({ startWithFilters = false }: { startWithFilters?: boolean }) {
  return (
    // useSearchParams (filtros y posicion en la URL) pide un Suspense.
    <Suspense fallback={loading}>
      <ClientResponsive desktop={<MapScreen startWithFilters={startWithFilters} />}
        mobile={<MapMobileScreen startWithFilters={startWithFilters} />} fallback={loading} />
    </Suspense>
  );
}
