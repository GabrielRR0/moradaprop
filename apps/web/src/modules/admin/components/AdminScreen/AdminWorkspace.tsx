'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { AdminScreenView } from '../../hooks/useAdminScreen';

export function AdminWorkspace({ v }: { v: AdminScreenView }) {
  return (
    <div style={{ flex: '1 1 auto', minHeight: '0', display: 'flex', gap: '20px' }}>
      <section
        style={{
          flex: '0 0 440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {v.queue.map((q, $index) => (
          <Fragment key={$index}>
            <button
              className={q.className}
              onClick={q.choose}
              style={css(`animation-delay:${q.delay}`)}
              type="button"
            >
              <span
                style={css(
                  `${q.tint}; flex:0 0 64px; height:64px; border-radius:14px; display:grid; place-items:center; color:var(--ac-ink)`,
                )}
              >
                <Icon name="house" size={28} strokeWidth={1.4} />
              </span>
              <span
                style={{
                  flex: '1',
                  minWidth: '0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontWeight: '800', fontSize: '15px' }}>{`${q.title}`}</span>
                <span
                  style={{ fontSize: '12px', color: 'var(--muted)' }}
                >{`${q.author} · ${q.when}`}</span>
                <span style={{ display: 'flex', gap: '6px' }}>
                  <span className="flag" style={css(`${q.summaryStyle}`)}>{`${q.summary}`}</span>
                </span>
              </span>
            </button>
          </Fragment>
        ))}
        {v.queueIsEmpty && (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '40px 20px',
                borderRadius: '20px',
                border: '2px dashed var(--line)',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  animation: 'burst-adminscreen .5s cubic-bezier(.3,1.5,.5,1) both',
                }}
              >
                <Icon name="check" size={32} strokeWidth={3} />
              </span>
              <span style={{ fontWeight: '800', fontSize: '18px' }}>¡Todo al día!</span>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                No hay anuncios pendientes de revisión.
              </span>
            </div>
          </>
        )}
      </section>
      <section
        style={{
          flex: '1 1 auto',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid var(--line)',
          background: 'var(--surf)',
          overflowY: 'auto',
        }}
      >
        {v.hasCurrent && (
          <>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span
                style={css(
                  `${v.current.tint}; flex:0 0 200px; height:150px; border-radius:18px; display:grid; place-items:center; color:var(--ac-ink)`,
                )}
              >
                <Icon name="house" size={52} strokeWidth={1.1} />
              </span>
              <span style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span
                  style={{ fontWeight: '800', fontSize: '24px', letterSpacing: '-0.02em' }}
                >{`${v.current.title}`}</span>
                <span
                  style={{ fontSize: '15px', color: 'var(--muted)' }}
                >{`${v.current.place} · ${v.current.price}/mes`}</span>
                <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  {'Publicado por '}
                  <b style={{ color: 'var(--text)' }}>{`${v.current.author}`}</b>
                  {` · ${v.current.when}`}
                </span>
                <Link
                  href="/propiedad/ejemplo"
                  style={{
                    marginTop: '6px',
                    fontSize: '14px',
                    fontWeight: '800',
                    color: 'var(--ac-ink)',
                  }}
                >
                  Abrir la ficha completa
                </Link>
              </span>
            </div>
            <span style={{ fontWeight: '800', fontSize: '16px', marginTop: '4px' }}>
              Revisión automática
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {v.currentChecks.map((c, $index) => (
                <Fragment key={$index}>
                  <div className="chk">
                    <span
                      style={css(
                        `flex:0 0 26px; height:26px; border-radius:50%; background:${c.badgeColor}; color:#fff; display:grid; place-items:center`,
                      )}
                    >
                      <Icon d={c.icon} size={14} strokeWidth={3.4} />
                    </span>
                    <span style={{ flex: '1' }}>{`${c.label}`}</span>
                    <span
                      style={css(`font-size:12px; font-weight:800; color:${c.badgeColor}`)}
                    >{`${c.note}`}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '12px' }}>
              <button
                className="btn"
                onClick={v.approve}
                style={{ flex: '1', background: '#1F9D55' }}
                type="button"
              >
                Aprobar y publicar
              </button>
              <button className="btn2" onClick={v.askChanges} style={{ flex: '1' }} type="button">
                Pedir cambios
              </button>
              <button
                className="btn2"
                onClick={v.reject}
                style={{ flex: '0 0 130px', color: '#D64545', borderColor: '#D64545' }}
                type="button"
              >
                Rechazar
              </button>
            </div>
          </>
        )}
        {!v.hasCurrent && (
          <>
            <div
              style={{
                flex: '1',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              Selecciona un anuncio de la lista
            </div>
          </>
        )}
      </section>
      <aside
        style={{
          flex: '0 0 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '20px',
          borderRadius: '24px',
          border: '1px solid var(--line)',
          background: 'var(--surf2)',
          overflowY: 'auto',
        }}
      >
        <span style={{ fontWeight: '800', fontSize: '16px', marginBottom: '6px' }}>
          Auditoría reciente
        </span>
        {v.log.map((l, $index) => (
          <Fragment key={$index}>
            <div className="log">
              <span
                style={css(
                  `flex:0 0 10px; height:10px; margin-top:5px; border-radius:50%; background:${l.color}`,
                )}
              />
              <span style={{ flex: '1', color: 'var(--muted)' }}>
                <b style={{ color: 'var(--text)' }}>{`${l.what}`}</b>
                <br />
                {`${l.who} · ${l.when}`}
              </span>
            </div>
          </Fragment>
        ))}
      </aside>
    </div>
  );
}
