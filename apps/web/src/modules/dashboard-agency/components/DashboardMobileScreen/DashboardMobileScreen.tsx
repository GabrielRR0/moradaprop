'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { brand } from '@/config';
import './dashboardmobilescreen.css';
import { useDashboardMobileScreen } from '../../hooks/useDashboardMobileScreen';
import { Icon } from '@/components/icons';
import { AgencyTabBar } from '../shared/AgencyTabBar';

export function DashboardMobileScreen() {
  const v = useDashboardMobileScreen();
  return (
    <div
      className="ds-dashboardmobilescreen"
      style={{
        position: 'relative',
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
          flex: '0 0 64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '800',
            fontSize: '17px',
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '11px',
              background: 'var(--ac)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <Icon name="home" size={19} />
          </span>
          {` ${brand.name}`}
        </span>
        <button
          aria-label="Notificaciones"
          style={{
            position: 'relative',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: '1px solid var(--line)',
            background: 'var(--surf)',
            display: 'grid',
            placeItems: 'center',
          }}
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
      </header>
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '20px 16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.03em' }}>
            Buenos días
          </span>
          <span style={{ fontSize: '15px', color: 'var(--muted)' }}>
            <b style={{ color: 'var(--text)' }}>7 interesados nuevos</b>
            {' y '}
            <b style={{ color: 'var(--text)' }}>2 visitas</b>
            {' hoy.'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/publicar" className="qa main">
            <span className="i">
              <Icon name="plus" size={22} strokeWidth={2.8} />
            </span>
            Publicar
          </Link>
          <Link href="/panel/leads" className="qa">
            <span className="i">
              <Icon name="whatsapp" size={22} />
            </span>
            Responder
          </Link>
          <Link href="/panel/equipo" className="qa">
            <span className="i">
              <Icon name="user-plus" size={22} />
            </span>
            Invitar
          </Link>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}
        >
          {v.kpis.map((k, $index) => (
            <Fragment key={$index}>
              <div className="kpi" style={css(`animation-delay:${k.delay}`)}>
                <span
                  style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}
                >{`${k.label}`}</span>
                <span
                  style={{
                    fontWeight: '800',
                    fontSize: '32px',
                    letterSpacing: '-0.03em',
                    lineHeight: '1.1',
                  }}
                >{`${k.value}`}</span>
                <span
                  style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ac-ink)' }}
                >{`${k.note}`}</span>
              </div>
            </Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '800', fontSize: '18px' }}>Para hoy</span>
            <span
              style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ac-ink)' }}
            >{`${v.todosDone} de 4`}</span>
          </div>
          {v.todoItems.map((t, $index) => (
            <Fragment key={$index}>
              <button className={t.className} onClick={t.toggle} type="button">
                <span className="ck">
                  <Icon name="check" size={15} strokeWidth={3.4} />
                </span>
                {`${t.label}`}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <AgencyTabBar active="resumen" />
    </div>
  );
}
