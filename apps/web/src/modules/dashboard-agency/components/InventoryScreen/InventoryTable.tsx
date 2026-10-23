'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { InventoryScreenView } from '../../hooks/useInventoryScreen';

export function InventoryTable({ v }: { v: InventoryScreenView }) {
  return (
    <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '0 36px 120px' }}>
      {v.showTable && (
        <>
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: '20px',
              background: 'var(--surf)',
              overflow: 'hidden',
            }}
          >
            <div
              className="tr"
              style={{
                opacity: '1',
                animation: 'none',
                background: 'var(--surf2)',
                paddingTop: '14px',
                paddingBottom: '14px',
                cursor: 'default',
              }}
            >
              <button
                className={v.selectAllClass}
                onClick={v.toggleSelectAll}
                aria-label="Seleccionar todo"
                type="button"
              >
                <Icon name="check" size={14} strokeWidth={3.4} />
              </button>
              <span className="th">Propiedad</span>
              <span className="th">Zona</span>
              <span className="th">Precio</span>
              <span className="th">Estado</span>
              <span className="th">Agente</span>
              <span className="th">Interés</span>
              <span className="th" style={{ textAlign: 'right' }}>
                Acciones
              </span>
            </div>
            {v.rows.map((r, $index) => (
              <Fragment key={$index}>
                <div className={r.rowClass} style={css(`animation-delay:${r.delay}`)}>
                  <button
                    className={r.checkboxClass}
                    onClick={r.toggleSelected}
                    aria-label="Seleccionar"
                    type="button"
                  >
                    <Icon name="check" size={14} strokeWidth={3.4} />
                  </button>
                  <span
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '0' }}
                  >
                    <span
                      style={css(
                        `${r.tint}; flex:0 0 56px; height:56px; border-radius:14px; display:grid; place-items:center; color:var(--ac-ink)`,
                      )}
                    >
                      <Icon name="house" size={26} strokeWidth={1.5} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: '0' }}>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '15px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >{`${r.title}`}</span>
                      <span
                        style={{ fontSize: '12px', color: 'var(--muted)' }}
                      >{`${r.code} · ${r.bedrooms} hab · ${r.bathrooms} baños`}</span>
                    </span>
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{`${r.place}`}</span>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{`${r.price}`}</span>
                  <span>
                    <button
                      className="stat"
                      onClick={r.changeStatus}
                      style={css(`${r.statusStyle}`)}
                      title="Cambiar estado"
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
                    </button>
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    <span
                      style={css(
                        `width:30px; height:30px; border-radius:50%; background:${r.agentColor}; color:#fff; display:grid; place-items:center; font-size:11px; font-weight:800`,
                      )}
                    >{`${r.agentInitials}`}</span>
                    {`${r.agent}`}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{ fontWeight: '800', fontSize: '14px' }}
                    >{`${r.views} vistas`}</span>
                    <span
                      style={{ fontSize: '12px', color: 'var(--muted)' }}
                    >{`${r.messages} mensajes`}</span>
                  </span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                    <Link href="/publicar" className="ic" aria-label="Editar">
                      <Icon name="pencil" size={19} />
                    </Link>
                    <button className="ic" aria-label="Más acciones" type="button">
                      <Icon name="dots" size={19} fill="currentColor" />
                    </button>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      )}
      {v.showGrid && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '18px',
            }}
          >
            {v.rows.map((r, $index) => (
              <Fragment key={$index}>
                <article className="gcard" style={css(`animation-delay:${r.delay}`)}>
                  <div
                    style={css(
                      `${r.tint}; position:relative; height:130px; display:grid; place-items:center; color:var(--ac-ink)`,
                    )}
                  >
                    <Icon name="house" size={44} strokeWidth={1.2} />
                    <button
                      className={r.checkboxClass}
                      onClick={r.toggleSelected}
                      aria-label="Seleccionar"
                      style={{ position: 'absolute', top: '10px', left: '10px' }}
                      type="button"
                    >
                      <Icon name="check" size={14} strokeWidth={3.4} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontWeight: '800', fontSize: '18px' }}>{`${r.price}`}</span>
                      <button
                        className="stat"
                        onClick={r.changeStatus}
                        style={css(`${r.statusStyle}; min-height:30px; font-size:12px`)}
                        type="button"
                      >{`${r.status}`}</button>
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{`${r.title}`}</span>
                    <span
                      style={{ fontSize: '12px', color: 'var(--muted)' }}
                    >{`${r.place} · ${r.agent} · ${r.views} vistas`}</span>
                  </div>
                </article>
              </Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
