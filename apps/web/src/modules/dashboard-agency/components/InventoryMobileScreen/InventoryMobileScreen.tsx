'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import './inventorymobilescreen.css';
import { useInventoryMobileScreen } from '../../hooks/useInventoryMobileScreen';
import { Icon } from '@/components/icons';
import { AgencyTabBar } from '../shared/AgencyTabBar';

export function InventoryMobileScreen() {
  const v = useInventoryMobileScreen();
  return (
    <div
      className="ds-inventorymobilescreen"
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
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 16px 10px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.03em' }}>
            Propiedades
          </span>
          <Link
            href="/panel/importar"
            aria-label="Importar desde Excel"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: '1px solid var(--line)',
              background: 'var(--surf)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="download" size={20} strokeWidth={2.3} />
          </Link>
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minHeight: '48px',
            padding: '0 16px',
            borderRadius: '999px',
            background: 'var(--surf2)',
            border: '1px solid var(--line)',
          }}
        >
          <Icon name="search" size={18} strokeWidth={2.4} style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Buscar por título o código"
            aria-label="Buscar"
            style={{
              flex: '1',
              minWidth: '0',
              border: '0',
              outline: '0',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: '600',
            }}
          />
        </label>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            margin: '0 -16px',
            padding: '0 16px 2px',
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
      </header>
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '14px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {v.rows.map((r, $index) => (
          <Fragment key={$index}>
            <article className="pc" style={css(`animation-delay:${r.delay}`)}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span
                  style={css(
                    `${r.tint}; flex:0 0 84px; height:84px; border-radius:16px; display:grid; place-items:center; color:var(--ac-ink)`,
                  )}
                >
                  <Icon name="house" size={30} strokeWidth={1.4} />
                </span>
                <span
                  style={{
                    flex: '1',
                    minWidth: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.02em' }}>
                    {`${r.price}`}
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>
                      {' /mes'}
                    </span>
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>{`${r.title}`}</span>
                  <span
                    style={{ fontSize: '12px', color: 'var(--muted)' }}
                  >{`${r.place} · ${r.code}`}</span>
                </span>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <button
                  className="stat"
                  onClick={r.changeStatus}
                  style={css(`${r.statusStyle}`)}
                  type="button"
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'currentColor',
                    }}
                  />
                  {`${r.status}`}
                  <Icon name="chevron-down" size={12} strokeWidth={3} />
                </button>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--muted)',
                  }}
                >
                  <span
                    style={css(
                      `width:28px; height:28px; border-radius:50%; background:${r.agentColor}; color:#fff; display:grid; place-items:center; font-size:10px; font-weight:800`,
                    )}
                  >{`${r.agentInitials}`}</span>
                  {`${r.views} vistas`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/publicar" className="act">
                  <Icon name="pencil" size={16} />
                  Editar
                </Link>
                <button
                  className="act"
                  style={{ color: '#14633A', background: '#E3F4EA', borderColor: 'transparent' }}
                  type="button"
                >
                  <Icon name="whatsapp" size={16} />
                  Compartir
                </button>
                <button
                  className="act"
                  aria-label="Más acciones"
                  style={{ flex: '0 0 46px' }}
                  type="button"
                >
                  <Icon name="dots" size={18} fill="currentColor" />
                </button>
              </div>
            </article>
          </Fragment>
        ))}
      </div>
      <AgencyTabBar active="propiedades" />
    </div>
  );
}
