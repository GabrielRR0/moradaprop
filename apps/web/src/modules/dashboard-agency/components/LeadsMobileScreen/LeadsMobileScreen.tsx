'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { whatsappUrl } from '@/lib/whatsapp';
import './leadsmobilescreen.css';
import { useLeadsMobileScreen } from '../../hooks/useLeadsMobileScreen';
import { Icon } from '@/components/icons';
import { AgencyTabBar } from '../shared/AgencyTabBar';

export function LeadsMobileScreen() {
  const v = useLeadsMobileScreen();
  return (
    <div
      className="ds-leadsmobilescreen"
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
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.03em' }}>
            Leads y citas
          </span>
          <Link
            href="/panel/leads"
            aria-label="Calendario de visitas"
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
            <Icon name="calendar" size={20} />
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            margin: '0 -16px',
            padding: '0 16px 2px',
          }}
        >
          {v.stageTabs.map((t, $index) => (
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
        {v.leads.map((l, $index) => (
          <Fragment key={$index}>
            <article className="lead" style={css(`animation-delay:${l.delay}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={css(
                    `flex:0 0 46px; height:46px; border-radius:50%; background:${l.color}; color:#fff; display:grid; place-items:center; font-weight:800; font-size:15px`,
                  )}
                >{`${l.initials}`}</span>
                <span
                  style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column' }}
                >
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>{`${l.name}`}</span>
                  <span
                    style={{ fontSize: '12px', color: 'var(--muted)' }}
                  >{`${l.when} · ${l.agentName}`}</span>
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  background: 'var(--surf2)',
                }}
              >
                <span style={{ fontWeight: '700', fontSize: '13px' }}>{`${l.propertyTitle}`}</span>
                <span
                  style={{ fontSize: '12px', color: 'var(--muted)' }}
                >{`${l.price} · ${l.place}`}</span>
              </div>
              <div
                style={{ fontSize: '14px', lineHeight: '1.45', color: 'var(--muted)' }}
              >{`"${l.message}"`}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="wa">
                  <Icon name="whatsapp" size={18} strokeWidth={2.3} />
                  Responder
                </a>
                <button className="mv" onClick={l.advance} type="button">
                  {`${l.advanceLabel}`}
                  <Icon name="arrow-right" size={14} strokeWidth={2.8} />
                </button>
              </div>
            </article>
          </Fragment>
        ))}
        {v.isEmpty && (
          <>
            <div
              style={{
                padding: '40px 20px',
                borderRadius: '20px',
                border: '2px dashed var(--line)',
                textAlign: 'center',
                color: 'var(--muted)',
                fontWeight: '600',
              }}
            >
              No hay leads en esta etapa. ¡Buen trabajo!
            </div>
          </>
        )}
      </div>
      <AgencyTabBar active="leads" />
    </div>
  );
}
