import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { useInventoryList } from './useInventoryList';

/** Inventario en escritorio: la lista común más selección múltiple y vista de tabla o tarjetas. */
export function useInventoryScreen() {
  const list = useInventoryList('tab');
  const [selectedIds, setSelectedIds] = useState<number[]>([2, 4]);
  const [showAsTable, setShowAsTable] = useState(true);

  function toggleSelected(id: number) {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((other) => other !== id));
    else setSelectedIds([...selectedIds, id]);
  }

  // "Seleccionar todo" marca las propiedades que se ven; si ya estaban todas marcadas, las desmarca.
  const allVisibleSelected =
    list.visibleIds.length > 0 && list.visibleIds.every((id) => selectedIds.includes(id));

  function toggleSelectAll() {
    const others = selectedIds.filter((id) => !list.visibleIds.includes(id));
    setSelectedIds(allVisibleSelected ? others : [...others, ...list.visibleIds]);
  }

  const rows = list.rows.map((row) => {
    const isSelected = selectedIds.includes(row.id);
    return {
      ...row,
      rowClass: isSelected ? 'tr sel' : 'tr',
      checkboxClass: classIf('cb', isSelected),
      toggleSelected: () => toggleSelected(row.id),
    };
  });

  return {
    tabs: list.tabs,
    rows,

    // Selección múltiple (barra negra de abajo)
    selectedCount: selectedIds.length,
    hasSelection: selectedIds.length > 0,
    selectAllClass: classIf('cb', allVisibleSelected),
    toggleSelectAll,
    clearSelection: () => setSelectedIds([]),

    // Tabla o tarjetas
    showTable: showAsTable,
    showGrid: !showAsTable,
    tableButtonClass: classIf('tab', showAsTable),
    gridButtonClass: classIf('tab', !showAsTable),
    showTableView: () => setShowAsTable(true),
    showGridView: () => setShowAsTable(false),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type InventoryScreenView = ReturnType<typeof useInventoryScreen>;
