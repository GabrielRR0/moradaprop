import { useInventoryList } from './useInventoryList';

/** Inventario en el teléfono: la lista común (pestañas por estado y tarjetas). */
export function useInventoryMobileScreen() {
  const list = useInventoryList('chip');
  return { tabs: list.tabs, rows: list.rows };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type InventoryMobileScreenView = ReturnType<typeof useInventoryMobileScreen>;
