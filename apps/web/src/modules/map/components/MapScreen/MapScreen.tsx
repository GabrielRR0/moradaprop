'use client';

import Link from 'next/link';
import { brand } from '@/config';
import { askLogin } from '@/lib/login-prompt';
import { toast } from '@/lib/toast';
import { useSession } from '@/modules/auth';
import { useState } from 'react';
import { closeFiltersRoute } from '../FiltersScreen/filters-route';
import { useMapExplorer } from '../../hooks/useMapExplorer';
import { FiltersOverlay } from '../FiltersScreen';
import { MapFilterBar } from './MapFilterBar';
import { MapPane } from './MapPane';
import { MapResults } from './MapResults';
import './mapscreen.css';
import { Icon } from '@/components/icons';

/** Desplazamiento del punto elegido para que la ficha flotante (arriba del pin) quede a la vista. */
const POPUP_OFFSET: [number, number] = [0, 120];

/**
 * Mapa + lista (escritorio). El diseno vive en docs/diseno/pantallas/Mapa.dc.html; aqui el mapa es el
 * real de Venezuela y los datos salen del API (o de datos de ejemplo si el API no responde).
 */
export function MapScreen({ startWithFilters = false }: { startWithFilters?: boolean }) {
  const ex = useMapExplorer({ selectionOffset: POPUP_OFFSET });
  const { search } = ex;
  const [filtersOpen, setFiltersOpen] = useState(startWithFilters);
  const session = useSession();
  const needAccount = (reason: string) =>
    session.status === 'authed' ? toast('Muy pronto disponible', 'info') : askLogin(reason);

  return (
    <div
      className="ds-mapscreen"
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          flex: '0 0 72px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '0 24px',
          borderBottom: '1px solid var(--line)',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 800,
            fontSize: 19,
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              background: 'var(--ac)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <Icon name="home" size={20} />
          </span>
          {` ${brand.name} `}
        </Link>

        <div style={{ flex: '1 1 auto', maxWidth: 560, position: 'relative' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search.submit();
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 48,
                padding: '0 16px',
                borderRadius: 999,
                background: 'var(--surf2)',
                border: '1px solid var(--line)',
              }}
            >
              <Icon name="search" size={20} style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={search.text}
                placeholder="Busca una ciudad, zona o estado"
                aria-label="Buscar ubicación"
                autoComplete="off"
                onChange={(e) => search.setText(e.target.value)}
                onFocus={() => search.setText(search.text)}
                onBlur={() => window.setTimeout(search.close, 120)}
                style={{
                  flex: 1,
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  font: 'inherit',
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--text)',
                }}
              />
            </label>
          </form>
          {search.open && (
            <ul className="ex-suggest" role="listbox">
              {search.suggestions.map((place) => (
                <li key={`${place.kind}-${place.label}-${place.hint}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => search.pick(place)}
                  >
                    {place.label}
                    <small>{place.hint}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn2" aria-label="Favoritos" type="button" onClick={() => needAccount('ver tus favoritos')}>
            <Icon name="heart" size={18} />
            {' Favoritos'}
          </button>
          <button className="btn2" aria-label="Crear alerta" type="button" onClick={() => needAccount('crear alertas')}>
            <Icon name="bell" size={18} />
            {' Alertas'}
          </button>
          <Link href="/publicar" className="btn">
            Publicar
          </Link>
        </div>
      </header>

      <MapFilterBar ex={ex} onOpenFilters={() => setFiltersOpen(true)} />
      <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
        <MapResults ex={ex} />
        <MapPane ex={ex} />
      </div>
      <FiltersOverlay
        open={filtersOpen}
        filters={ex.filters}
        onApply={(next) => {
          ex.replaceFilters(next);
          setFiltersOpen(false);
          closeFiltersRoute();
        }}
        onClose={() => {
          setFiltersOpen(false);
          closeFiltersRoute();
        }}
      />
    </div>
  );
}
