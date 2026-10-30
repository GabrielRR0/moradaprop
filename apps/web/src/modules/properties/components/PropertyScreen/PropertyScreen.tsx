'use client';
import Link from 'next/link';
import { brand } from '@/config';
import './propertyscreen.css';
import { usePropertyScreen } from '../../hooks/usePropertyScreen';
import { PropertyBooking } from './PropertyBooking';
import { Icon } from '@/components/icons';

export function PropertyScreen() {
  const v = usePropertyScreen();
  return (
    <div
      className="ds-propertyscreen"
      style={{
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '16px 48px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '800',
            fontSize: '19px',
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '11px',
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
        <Link href="/mapa" className="btn2">
          <Icon name="chevron-left" size={16} strokeWidth={2.6} />
          {' Volver al mapa'}
        </Link>
      </header>
      {v.property ? (
        <PropertyBooking v={v} p={v.property} />
      ) : (
        <p style={{ padding: '64px 48px', textAlign: 'center', color: 'var(--muted)' }}>
          {v.loading ? 'Cargando propiedad…' : 'No pudimos cargar esta propiedad.'}
          {v.failed && (
            <button className="btn2" type="button" onClick={v.retry} style={{ marginLeft: '8px' }}>
              Reintentar
            </button>
          )}
        </p>
      )}
    </div>
  );
}
