'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { PublishSteps } from './PublishSteps';
import { Icon } from '@/components/icons';
import type { PublishScreenView } from '../../hooks/usePublishScreen';

export function PublishPreview({ v }: { v: PublishScreenView }) {
  return (
    <div style={{ flex: '1 1 auto', display: 'flex', minHeight: '0' }}>
      <nav
        style={{
          flex: '0 0 300px',
          padding: '28px 20px',
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {v.stepList.map((s, $index) => (
          <Fragment key={$index}>
            <button className={s.className} onClick={s.goTo} type="button">
              <span className="n">{`${s.badge}`}</span>
              {`${s.name}`}
            </button>
          </Fragment>
        ))}
        <div
          style={{
            marginTop: 'auto',
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--surf2)',
            fontSize: '13px',
            lineHeight: '1.5',
            color: 'var(--muted)',
          }}
        >
          <b style={{ color: 'var(--text)' }}>Consejo:</b>
          {' los anuncios con 8 fotos o más reciben el doble de mensajes. '}
        </div>
      </nav>
      <main style={{ flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
        <PublishSteps v={v} />
        <footer
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 56px 20px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button className="btn2" onClick={v.goBack} type="button">
            Atrás
          </button>
          <span
            style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}
          >{`Paso ${v.step} de 6`}</span>
          <button className="btn" onClick={v.goNext} type="button">{`${v.nextLabel}`}</button>
        </footer>
      </main>
      <aside
        style={{
          flex: '0 0 420px',
          padding: '28px',
          borderLeft: '1px solid var(--line)',
          background: 'var(--surf2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: '800',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          Así se verá tu anuncio
        </span>
        <article
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '22px',
            background: 'var(--surf)',
            border: '1px solid var(--line)',
            overflow: 'hidden',
            boxShadow: '0 18px 40px rgba(15,20,32,.1)',
          }}
        >
          <div
            style={{
              height: '190px',
              background: 'color-mix(in srgb, var(--ac) 16%, var(--surf2))',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ac-ink)',
              position: 'relative',
            }}
          >
            <Icon name="home" size={64} strokeWidth={1.2} />
            <span
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '5px 11px',
                borderRadius: '999px',
                background: 'var(--surf)',
                fontSize: '12px',
                fontWeight: '800',
                color: 'var(--ac-ink)',
              }}
            >
              Nuevo
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px' }}>
            <div style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.02em' }}>
              {`$${v.price}`}
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>
                {' /mes'}
              </span>
            </div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>{`${v.typeName} en Altamira`}</div>
            <div
              style={{ fontSize: '13px', color: 'var(--muted)' }}
            >{`Chacao, Caracas · ${v.bedrooms} hab · ${v.bathrooms} baños · ${v.parkingSpots} puestos`}</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginTop: '4px',
                minHeight: '26px',
              }}
            >
              {v.chosenAmenities.map((t, $index) => (
                <Fragment key={$index}>
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'var(--surf2)',
                      color: 'var(--muted)',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >{`${t.name}`}</span>
                </Fragment>
              ))}
            </div>
          </div>
        </article>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            padding: '18px',
            borderRadius: '20px',
            background: 'var(--surf)',
            border: '1px solid var(--line)',
          }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            aria-hidden="true"
            style={{ flex: '0 0 72px', transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              style={{ stroke: 'var(--line)' }}
              strokeWidth="8"
            />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              style={css(
                `stroke:var(--ac); transition:stroke-dashoffset .6s; stroke-dasharray:176; stroke-dashoffset:${v.ringOffset}`,
              )}
              strokeWidth="8"
              strokeLinecap="round"
            />
          </svg>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: '800', fontSize: '22px' }}>{`${v.quality}%`}</span>
            <span
              style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--muted)' }}
            >{`Calidad del anuncio. ${v.tip}`}</span>
          </span>
        </div>
      </aside>
    </div>
  );
}
