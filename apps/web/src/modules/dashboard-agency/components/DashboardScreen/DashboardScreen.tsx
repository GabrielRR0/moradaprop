'use client';
import Link from 'next/link';
import './dashboardscreen.css';
import { useDashboardScreen } from '../../hooks/useDashboardScreen';
import { AgencySidebar } from '../shared/AgencySidebar';
import { DashboardContent } from './DashboardContent';
import { Icon } from '@/components/icons';

export function DashboardScreen() {
  const v = useDashboardScreen();
  return (
    <div
      className="ds-dashboardscreen"
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
      }}
    >
      <AgencySidebar active="resumen" withPlan />
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
            flex: '0 0 78px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 36px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '420px',
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
              placeholder="Buscar propiedad, cliente o código…"
              aria-label="Buscar"
              style={{
                flex: '1',
                border: '0',
                outline: '0',
                background: 'transparent',
                font: 'inherit',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text)',
              }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn2"
              aria-label="Notificaciones"
              style={{ width: '48px', padding: '0', position: 'relative' }}
              type="button"
            >
              <Icon name="bell" size={20} />
              <span
                style={{
                  position: 'absolute',
                  top: '11px',
                  right: '12px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  border: '2px solid var(--surf)',
                }}
              />
            </button>
            <Link href="/publicar" className="btn">
              <Icon name="plus" size={18} strokeWidth={2.8} />
              Nueva propiedad
            </Link>
          </div>
        </header>
        <DashboardContent v={v} />
      </main>
    </div>
  );
}
