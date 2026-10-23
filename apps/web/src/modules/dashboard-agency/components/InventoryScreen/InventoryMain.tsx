'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { InventoryTable } from './InventoryTable';
import { Icon } from '@/components/icons';
import type { InventoryScreenView } from '../../hooks/useInventoryScreen';

export function InventoryMain({ v }: { v: InventoryScreenView }) {
  return (
    <main
      style={{
        flex: '1 1 auto',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '26px 36px 0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1
            style={{ margin: '0', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em' }}
          >
            Propiedades
          </h1>
          <p style={{ margin: '0', fontSize: '15px', color: 'var(--muted)' }}>
            Todo tu inventario. Toca el estado para cambiarlo al instante.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/panel/importar" className="btn2">
            <Icon name="download" size={18} strokeWidth={2.3} />
            Importar Excel
          </Link>
          <Link href="/publicar" className="btn">
            <Icon name="plus" size={18} strokeWidth={2.8} />
            Nueva propiedad
          </Link>
        </div>
      </header>
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '18px 28px 0',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {v.tabs.map((t, $index) => (
          <Fragment key={$index}>
            <button className={t.className} onClick={t.choose} type="button">
              {`${t.name}`}
              <span className="n">{`${t.count}`}</span>
            </button>
          </Fragment>
        ))}
      </div>
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 36px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '340px',
            minHeight: '46px',
            padding: '0 16px',
            borderRadius: '999px',
            background: 'var(--surf2)',
            border: '1px solid var(--line)',
          }}
        >
          <Icon name="search" size={18} strokeWidth={2.4} style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Buscar por título o código…"
            aria-label="Buscar"
            style={{
              flex: '1',
              border: '0',
              outline: '0',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: '600',
            }}
          />
        </label>
        <button className="btn2" style={{ minHeight: '46px' }} type="button">
          Agente: todos
          <Icon name="chevron-down" size={14} strokeWidth={2.6} />
        </button>
        <button className="btn2" style={{ minHeight: '46px' }} type="button">
          Zona: todas
          <Icon name="chevron-down" size={14} strokeWidth={2.6} />
        </button>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            padding: '3px',
            borderRadius: '12px',
            background: 'var(--surf2)',
            border: '1px solid var(--line)',
          }}
        >
          <button
            className={v.tableButtonClass}
            onClick={v.showTableView}
            aria-label="Vista tabla"
            style={{
              width: '44px',
              minHeight: '40px',
              border: '0',
              borderRadius: '9px',
              display: 'grid',
              placeItems: 'center',
            }}
            type="button"
          >
            <Icon name="menu" size={20} />
          </button>
          <button
            className={v.gridButtonClass}
            onClick={v.showGridView}
            aria-label="Vista tarjetas"
            style={{
              width: '44px',
              minHeight: '40px',
              border: '0',
              borderRadius: '9px',
              display: 'grid',
              placeItems: 'center',
            }}
            type="button"
          >
            <Icon name="grid" size={20} />
          </button>
        </div>
      </div>
      <InventoryTable v={v} />
      {v.hasSelection && (
        <>
          <div className="bulk">
            <span
              style={{ fontWeight: '800', fontSize: '15px', marginRight: '6px' }}
            >{`${v.selectedCount} seleccionadas`}</span>
            <button type="button">Pausar</button>
            <button type="button">Cambiar agente</button>
            <button type="button">Marcar alquiladas</button>
            <button style={{ background: 'rgba(255,90,90,.28)' }} type="button">
              Eliminar
            </button>
            <button
              onClick={v.clearSelection}
              aria-label="Cancelar selección"
              style={{ width: '44px', padding: '0', display: 'grid', placeItems: 'center' }}
              type="button"
            >
              <Icon name="close" size={18} strokeWidth={2.6} />
            </button>
          </div>
        </>
      )}
    </main>
  );
}
