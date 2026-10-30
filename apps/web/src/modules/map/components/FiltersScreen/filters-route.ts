/** Si el mapa se abrió desde `/filtros`, al cerrar el panel la dirección vuelve a `/mapa` (sin recargar). */
export function closeFiltersRoute() {
  if (window.location.pathname === '/filtros') {
    window.history.replaceState(null, '', `/mapa${window.location.search}`);
  }
}
