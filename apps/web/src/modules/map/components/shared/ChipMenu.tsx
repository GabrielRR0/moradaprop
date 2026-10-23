'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import type { FilterOption } from '../../utils/amenities';
import './explorer.css';

interface ChipMenuProps {
  /** Texto del botón (ej. "Precio" o "Hasta $800"). */
  label: string;
  options: FilterOption[];
  /** `id` de la opción elegida ahora. */
  selectedId: string;
  onChoose: (id: string) => void;
  /** Clase del botón: `chip` (filtros) o `btn2` (orden). */
  className?: string;
  /** Resalta el botón (hay un filtro puesto). */
  active?: boolean;
  /** De qué lado se abre el menú. */
  align?: 'left' | 'right';
}

/** Botón con menú desplegable (precio, habitaciones, orden). Se cierra al tocar fuera o con Escape. */
export function ChipMenu({
  label,
  options,
  selectedId,
  onChoose,
  className = 'chip',
  active = false,
  align = 'left',
}: ChipMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Mientras está abierto, tocar fuera o apretar Escape lo cierra
  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="ex-menu-wrap">
      <button
        type="button"
        className={active ? `${className} on` : className}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label}
        <Icon name="chevron-down" size={14} strokeWidth={2.6} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            className={`ex-menu ex-menu-${align}`}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            {options.map((option) => (
              <li key={option.id} role="option" aria-selected={option.id === selectedId}>
                <button
                  type="button"
                  className={option.id === selectedId ? 'ex-item on' : 'ex-item'}
                  onClick={() => {
                    onChoose(option.id);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
