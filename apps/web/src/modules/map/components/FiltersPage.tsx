import { Suspense } from 'react';
import { FiltersScreen } from './FiltersScreen';

export function FiltersPage() {
  // useSearchParams (los filtros vienen en la URL del mapa) pide un Suspense.
  return (
    <Suspense fallback={null}>
      <FiltersScreen />
    </Suspense>
  );
}
