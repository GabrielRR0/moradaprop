'use client';
import Link from 'next/link';
import { brand } from '@/config';
import './adminscreen.css';
import { useAdminScreen } from '../../hooks/useAdminScreen';
import { AdminWorkspace } from './AdminWorkspace';
import { Icon } from '@/components/icons';

export function AdminScreen() {
  const v = useAdminScreen();
  return (
    <div
      className="ds-adminscreen"
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
      <aside
        style={{
          flex: '0 0 264px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '22px 16px',
          borderRight: '1px solid var(--line)',
          background: 'var(--surf)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 8px 6px',
            fontWeight: '800',
            fontSize: '19px',
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--ac)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <Icon name="home" size={21} />
          </span>
          {` ${brand.name} `}
        </div>
        <span
          style={{
            margin: '0 8px 14px',
            alignSelf: 'flex-start',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'var(--ac-soft)',
            color: 'var(--ac-ink)',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
          }}
        >
          Administración
        </span>
        <Link href="/admin" className="nav">
          <Icon name="chart" size={22} />
          Métricas
        </Link>
        <Link href="/admin" className="nav on">
          <Icon name="shield" size={22} />
          Moderación
          <span className="c">{`${v.pendingCount}`}</span>
        </Link>
        <Link href="/admin" className="nav">
          <Icon name="team" size={22} />
          Usuarios
        </Link>
        <Link href="/admin" className="nav">
          <Icon name="ban" size={22} />
          Bloqueos
        </Link>
        <Link href="/admin" className="nav">
          <Icon name="clipboard" size={22} />
          Auditoría
        </Link>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px',
          }}
        >
          <span
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#12151C',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: '800',
              fontSize: '13px',
            }}
          >
            ADM
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: '0' }}>
            <span style={{ fontWeight: '800', fontSize: '14px' }}>Equipo de la plataforma</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Sesión con doble factor</span>
          </span>
        </div>
      </aside>
      <main
        style={{
          flex: '1 1 auto',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 36px',
          gap: '20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1
              style={{ margin: '0', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em' }}
            >
              Moderación de anuncios
            </h1>
            <p style={{ margin: '0', fontSize: '15px', color: 'var(--muted)' }}>
              Revisa lo nuevo antes de que aparezca en el mapa. Cada decisión queda en la auditoría.
            </p>
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px' }}
        >
          <div className="kpi">
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
              Por revisar
            </span>
            <span
              style={{
                fontWeight: '800',
                fontSize: '32px',
                letterSpacing: '-0.03em',
                lineHeight: '1',
              }}
            >{`${v.pendingCount}`}</span>
          </div>
          <div className="kpi">
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
              Reportes de usuarios
            </span>
            <span
              style={{
                fontWeight: '800',
                fontSize: '32px',
                letterSpacing: '-0.03em',
                lineHeight: '1',
              }}
            >
              3
            </span>
          </div>
          <div className="kpi">
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
              Cuentas nuevas hoy
            </span>
            <span
              style={{
                fontWeight: '800',
                fontSize: '32px',
                letterSpacing: '-0.03em',
                lineHeight: '1',
              }}
            >
              19
            </span>
          </div>
          <div className="kpi">
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
              Bloqueos activos
            </span>
            <span
              style={{
                fontWeight: '800',
                fontSize: '32px',
                letterSpacing: '-0.03em',
                lineHeight: '1',
              }}
            >
              6
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--line)' }}>
          <button className="tab on" type="button">
            Anuncios nuevos
          </button>
          <button className="tab" type="button">
            Reportes
          </button>
          <button className="tab" type="button">
            Cuentas de inmobiliarias
          </button>
        </div>
        <AdminWorkspace v={v} />
      </main>
    </div>
  );
}
