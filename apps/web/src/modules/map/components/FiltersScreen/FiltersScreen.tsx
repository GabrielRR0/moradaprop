'use client';
import { useEffect } from 'react';
import './filtersscreen.css';
import { useFiltersScreen } from '../../hooks/useFiltersScreen';
import { FiltersForm } from './FiltersForm';
import { Icon } from '@/components/icons';
import type { PropertyFilters } from '@/lib/properties';
import { MotionSupport } from '@/support/motion';

/**
 * Panel de filtros: sube desde abajo y queda centrado sobre el mapa (en el teléfono ocupa toda la pantalla);
 * al cerrar vuelve a bajar. El mapa queda detrás con desenfoque.
 * Se cierra con la X, tocando el fondo o con Escape.
 */
export function FiltersScreen({
  initial,
  onApply,
  onClose,
}: {
  initial: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}) {
  const v = useFiltersScreen({ initial, onApply, onClose });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <MotionSupport.motion.div
      className="ds-filtersscreen fs-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <MotionSupport.motion.div
        className="fs-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 38 }}
        onClick={(event) => event.stopPropagation()}
      >
      <header
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px 16px',
        }}
      >
        <span style={{ fontWeight: '800', fontSize: '24px', letterSpacing: '-0.02em' }}>
          Filtros
        </span>
        <button
          onClick={v.close}
          type="button"
          aria-label="Cerrar filtros"
          style={{
            border: '0',
            color: 'var(--text)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--surf2)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="close" size={20} strokeWidth={2.4} />
        </button>
      </header>
      <div style={{ flex: '0 0 auto', padding: '0 28px 16px' }}>
        <div
          style={{
            display: 'flex',
            padding: '4px',
            borderRadius: '14px',
            background: 'var(--surf2)',
            border: '1px solid var(--line)',
          }}
        >
          <button className={v.basicButtonClass} onClick={v.chooseBasic} type="button">
            Básico
          </button>
          <button className={v.advancedButtonClass} onClick={v.chooseAdvanced} type="button">
            Avanzado
          </button>
        </div>
      </div>
      <FiltersForm v={v} />
      <footer
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px 28px 22px',
          borderTop: '1px solid var(--line)',
          background: 'var(--bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={{
              minHeight: '52px',
              padding: '0 8px',
              border: '0',
              background: 'transparent',
              fontWeight: '700',
              fontSize: '15px',
              textDecoration: 'underline',
              color: 'var(--muted)',
            }}
            onClick={v.clearAll}
            type="button"
          >
            Limpiar
          </button>
          <button onClick={v.apply} className="btn" style={{ flex: '1' }} type="button">
            {v.countLabel}
          </button>
        </div>
      </footer>
      </MotionSupport.motion.div>
    </MotionSupport.motion.div>
  );
}
