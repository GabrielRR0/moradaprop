'use client';
import type { PropertyFilters } from '@/lib/properties';
import { MotionSupport } from '@/support/motion';
import { FiltersScreen } from './FiltersScreen';

/** Muestra u oculta el panel de filtros con su animación de entrada y salida. */
export function FiltersOverlay({
  open,
  filters,
  onApply,
  onClose,
}: {
  open: boolean;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}) {
  return (
    <MotionSupport.AnimatePresence>
      {open && <FiltersScreen initial={filters} onApply={onApply} onClose={onClose} />}
    </MotionSupport.AnimatePresence>
  );
}
