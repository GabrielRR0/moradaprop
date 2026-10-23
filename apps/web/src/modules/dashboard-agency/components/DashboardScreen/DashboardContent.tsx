'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { DashboardScreenView } from '../../hooks/useDashboardScreen';

export function DashboardContent({ v }: { v: DashboardScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '30px 36px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1
            style={{ margin: '0', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}
          >
            Buenos días, equipo
          </h1>
          <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
            {'Tienes '}
            <b style={{ color: 'var(--text)' }}>7 interesados nuevos</b>
            {' y '}
            <b style={{ color: 'var(--text)' }}>2 visitas</b>
            {' para hoy.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/panel/importar" className="btn2">
            <Icon name="download" size={18} strokeWidth={2.3} />
            Importar Excel
          </Link>
          <Link href="/panel" className="btn2">
            <Icon name="user-plus" size={18} strokeWidth={2.3} />
            Invitar agente
          </Link>
        </div>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}
      >
        {v.kpis.map((k, $index) => (
          <Fragment key={$index}>
            <div className="kpi" style={css(`animation-delay:${k.delay}`)}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span
                  style={{ fontSize: '14px', fontWeight: '700', color: 'var(--muted)' }}
                >{`${k.label}`}</span>
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--ac-soft)',
                    color: 'var(--ac-ink)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon d={k.icon} size={20} />
                </span>
              </div>
              <span
                style={{
                  fontWeight: '800',
                  fontSize: '36px',
                  letterSpacing: '-0.03em',
                  lineHeight: '1',
                }}
              >{`${k.value}`}</span>
              <span
                style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ac-ink)' }}
              >{`${k.note}`}</span>
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '20px', minHeight: '0' }}>
        <section className="card" style={{ flex: '1 1 560px', minWidth: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: '800', fontSize: '18px' }}>Visitas a tus anuncios</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Pasa el cursor sobre una barra
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '3px',
                borderRadius: '12px',
                background: 'var(--surf2)',
                border: '1px solid var(--line)',
              }}
            >
              {v.rangeButtons.map((r, $index) => (
                <Fragment key={$index}>
                  <button
                    className={r.className}
                    onClick={r.choose}
                    type="button"
                  >{`${r.label}`}</button>
                </Fragment>
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '6px',
              height: '200px',
              paddingTop: '8px',
            }}
          >
            {v.chartBars.map((b, $index) => (
              <Fragment key={$index}>
                <span className={b.className} style={css(`height:${b.height}`)} title={b.tooltip} />
              </Fragment>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--muted)',
            }}
          >
            <span>{`${v.rangeStartLabel}`}</span>
            <span>Hoy</span>
          </div>
        </section>
        <section className="card" style={{ flex: '0 0 380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '800', fontSize: '18px' }}>Para hoy</span>
            <span
              style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ac-ink)' }}
            >{`${v.todosDone} de 4`}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {v.todoItems.map((t, $index) => (
              <Fragment key={$index}>
                <button className={t.className} onClick={t.toggle} type="button">
                  <span className="ck">
                    <Icon name="check" size={14} strokeWidth={3.4} />
                  </span>
                  {`${t.label}`}
                </button>
              </Fragment>
            ))}
          </div>
        </section>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <section className="card" style={{ flex: '1 1 560px', minWidth: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '800', fontSize: '18px' }}>Propiedades con más interés</span>
            <Link
              href="/panel/propiedades"
              style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ac-ink)' }}
            >
              Ver todas
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {v.topProperties.map((p, $index) => (
              <Fragment key={$index}>
                <div className="row">
                  <span
                    style={css(
                      `${p.tint}; flex:0 0 52px; height:52px; border-radius:14px; display:grid; place-items:center; color:var(--ac-ink)`,
                    )}
                  >
                    <Icon name="house" strokeWidth={1.5} />
                  </span>
                  <span
                    style={{ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{`${p.title}`}</span>
                    <span
                      style={{ fontSize: '13px', color: 'var(--muted)' }}
                    >{`${p.place} · ${p.agent}`}</span>
                  </span>
                  <span style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{ fontWeight: '800', fontSize: '15px' }}
                    >{`${p.views} vistas`}</span>
                    <span
                      style={{ fontSize: '12px', color: 'var(--muted)' }}
                    >{`${p.messages} mensajes`}</span>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </section>
        <section className="card" style={{ flex: '0 0 380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '800', fontSize: '18px' }}>Tu equipo</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ac-ink)' }}>
              Gestionar
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {v.teamPreview.map((m, $index) => (
              <Fragment key={$index}>
                <div className="row">
                  <span
                    style={css(
                      `flex:0 0 44px; height:44px; border-radius:50%; background:${m.color}; color:#fff; display:grid; place-items:center; font-weight:800; font-size:14px`,
                    )}
                  >{`${m.initials}`}</span>
                  <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{`${m.name}`}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{`${m.role}`}</span>
                  </span>
                  <span
                    style={{ fontSize: '13px', fontWeight: '800' }}
                  >{`${m.propertyCount}`}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
