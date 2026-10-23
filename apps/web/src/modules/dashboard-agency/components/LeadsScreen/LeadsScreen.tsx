'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { whatsappUrl } from '@/lib/whatsapp';
import './leadsscreen.css';
import { useLeadsScreen } from '../../hooks/useLeadsScreen';
import { Icon } from '@/components/icons';
import { AgencySidebar } from '../shared/AgencySidebar';

export function LeadsScreen() {
  const v = useLeadsScreen();
  return (
    <div
      className="ds-leadsscreen"
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
      <AgencySidebar active="leads" />
      <main
        style={{
          flex: '1 1 auto',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 36px 28px',
          gap: '20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1
              style={{ margin: '0', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em' }}
            >
              Leads y citas
            </h1>
            <p style={{ margin: '0', fontSize: '15px', color: 'var(--muted)' }}>
              Cada persona interesada, en su etapa. Usa el botón para avanzarla.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn2" type="button">
              <Icon name="calendar" size={18} strokeWidth={2.3} />
              Calendario de visitas
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {v.agentFilters.map((f, $index) => (
            <Fragment key={$index}>
              <button
                className={f.className}
                onClick={f.choose}
                type="button"
              >{`${f.label}`}</button>
            </Fragment>
          ))}
        </div>
        <div style={{ flex: '1 1 auto', minHeight: '0', display: 'flex', gap: '14px' }}>
          {v.columns.map((c, $index) => (
            <Fragment key={$index}>
              <section className="col">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 4px 4px',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: '800',
                      fontSize: '16px',
                    }}
                  >
                    <span
                      style={css(
                        `width:10px; height:10px; border-radius:50%; background:${c.color}`,
                      )}
                    />
                    {`${c.title}`}
                  </span>
                  <span
                    style={{
                      minWidth: '28px',
                      height: '26px',
                      padding: '0 9px',
                      borderRadius: '13px',
                      background: 'var(--surf)',
                      border: '1px solid var(--line)',
                      fontSize: '13px',
                      fontWeight: '800',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >{`${c.count}`}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    overflowY: 'auto',
                    minHeight: '0',
                  }}
                >
                  {c.leads.map((l, $index) => (
                    <Fragment key={$index}>
                      <article className="lead">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={css(
                              `flex:0 0 42px; height:42px; border-radius:50%; background:${l.color}; color:#fff; display:grid; place-items:center; font-weight:800; font-size:14px`,
                            )}
                          >{`${l.initials}`}</span>
                          <span
                            style={{
                              flex: '1',
                              minWidth: '0',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <span
                              style={{ fontWeight: '800', fontSize: '15px' }}
                            >{`${l.name}`}</span>
                            <span
                              style={{ fontSize: '12px', color: 'var(--muted)' }}
                            >{`${l.when}`}</span>
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            padding: '10px 12px',
                            borderRadius: '12px',
                            background: 'var(--surf2)',
                          }}
                        >
                          <span
                            style={{ fontWeight: '700', fontSize: '13px' }}
                          >{`${l.propertyTitle}`}</span>
                          <span
                            style={{ fontSize: '12px', color: 'var(--muted)' }}
                          >{`${l.price} · ${l.place}`}</span>
                        </div>
                        <div
                          style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--muted)' }}
                        >{`"${l.message}"`}</div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="wa">
                            <Icon name="whatsapp" size={16} strokeWidth={2.3} />
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
                </div>
              </section>
            </Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}
