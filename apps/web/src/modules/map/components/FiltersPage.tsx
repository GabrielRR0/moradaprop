import { MapPage } from './MapPage';

/**
 * `/filtros`: el mapa con el panel de filtros ya abierto encima (lo usa el botón "Filtros" del inicio).
 * Desde el mapa el panel se abre sin cambiar de página.
 */
export function FiltersPage() {
  return <MapPage startWithFilters />;
}
