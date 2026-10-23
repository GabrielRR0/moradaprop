'use client';
import Link from 'next/link';
import './publishscreen.css';
import { usePublishScreen } from '../../hooks/usePublishScreen';
import { PublishPreview } from './PublishPreview';
import { Icon } from '@/components/icons';

export function PublishScreen() {
  const v = usePublishScreen();
  return (
    <div
      className="ds-publishscreen"
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
          justifyContent: 'space-between',
          padding: '0 32px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Link
          href="/panel"
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
          {' Nueva propiedad '}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--muted)',
            }}
          >
            <Icon name="check" size={16} strokeWidth={2.4} />
            {' Borrador guardado automáticamente'}
          </span>
          <Link href="/panel/propiedades" className="btn2" style={{ minHeight: '44px' }}>
            Guardar y salir
          </Link>
        </div>
      </header>
      <PublishPreview v={v} />
    </div>
  );
}
