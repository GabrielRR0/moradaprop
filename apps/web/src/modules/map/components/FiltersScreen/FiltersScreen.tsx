'use client';
import Link from 'next/link';
import './filtersscreen.css';
import { useFiltersScreen } from '../../hooks/useFiltersScreen';
import { FiltersForm } from './FiltersForm';
import { Icon } from '@/components/icons';

export function FiltersScreen() {
  const v = useFiltersScreen();
  return (
    <div
      className="ds-filtersscreen"
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
        maxWidth: '560px',
        margin: '0 auto',
      }}
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
        <Link
          href={v.backLink}
          aria-label="Cerrar filtros"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--surf2)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="close" size={20} strokeWidth={2.4} />
        </Link>
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
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            defaultChecked
            style={{ width: '20px', height: '20px', accentColor: 'var(--ac)' }}
          />
          {' Avísame cuando haya propiedades nuevas con estos filtros '}
        </label>
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
          <Link href={v.applyLink} className="btn" style={{ flex: '1' }}>
            {v.countLabel}
          </Link>
        </div>
      </footer>
    </div>
  );
}
