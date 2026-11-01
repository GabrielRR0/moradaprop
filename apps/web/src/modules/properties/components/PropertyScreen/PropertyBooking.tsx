'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { ContactPanel } from '../ContactPanel';
import { PropertyDetails } from './PropertyDetails';
import { Icon } from '@/components/icons';
import type { PropertyInfo } from '../../hooks/usePropertyBooking';
import type { PropertyScreenView } from '../../hooks/usePropertyScreen';

/** Foto que llena su recuadro. */
function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

export function PropertyBooking({ v, p }: { v: PropertyScreenView; p: PropertyInfo }) {
  return (
    <div
      style={{
        padding: '28px 48px 64px',
        maxWidth: '1360px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)',
          gridTemplateRows: '200px 200px',
          gap: '12px',
          borderRadius: '26px',
          overflow: 'hidden',
        }}
      >
        <div
          className="ph"
          style={{
            gridRow: 'span 2',
            background: 'color-mix(in srgb, var(--ac) 18%, var(--surf2))',
          }}
        >
          {p.photos[0] ? <Photo src={p.photos[0]} alt={p.title} /> : <Icon name="home" size={96} strokeWidth={1} />}
          <span
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'var(--surf)',
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--ac-ink)',
            }}
          >
            Portada
          </span>
        </div>
        {[1, 2, 3, 4].map((slot) => (
          <div
            key={slot}
            className="ph"
            style={{ background: `color-mix(in srgb, var(--ac) ${8 + slot * 5}%, var(--surf2))` }}
          >
            {p.photos[slot] ? (
              <Photo src={p.photos[slot]} alt={`${p.title} (${slot + 1})`} />
            ) : (
              <Icon name="image" size={40} strokeWidth={1.3} />
            )}
            {slot === 4 && p.photos.length > 5 && (
              <span
                style={{
                  position: 'absolute',
                  right: '14px',
                  bottom: '14px',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  background: 'var(--surf)',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: 'var(--text)',
                  boxShadow: '0 6px 16px rgba(15,20,32,.2)',
                }}
              >
                {`+${p.photos.length - 5} fotos`}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
        <PropertyDetails v={v} p={p} />
        <aside
          style={{
            flex: '1 1 380px',
            minWidth: '0',
            maxWidth: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            padding: '24px',
            borderRadius: '26px',
            border: '1px solid var(--line)',
            background: 'var(--surf)',
            boxShadow: '0 24px 54px rgba(15,20,32,.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '800', fontSize: '38px', letterSpacing: '-0.03em' }}>
              {p.price}
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--muted)' }}>
                {' /mes'}
              </span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ac-ink)' }}>
              Ver en Bs.
            </span>
          </div>
          <ContactPanel property={p} />
        </aside>
      </div>
      {/* Sin data-reveal: este bloque aparece al terminar de cargar la propiedad y RevealObserver solo mira al cambiar de ruta. */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '12px' }}>
        <h2 style={{ margin: '0', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Propiedades parecidas
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {v.similar.map((s) => (
            <Fragment key={s.id}>
              <Link href={s.href} className="sim">
                <div
                  style={css(
                    `${s.tint}; position:relative; overflow:hidden; height:170px; display:grid; place-items:center; color:var(--ac-ink)`,
                  )}
                >
                  {s.cover ? <Photo src={s.cover} alt={s.title} /> : <Icon name="house" size={52} strokeWidth={1.1} />}
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '18px' }}
                >
                  <span style={{ fontWeight: '800', fontSize: '22px' }}>
                    {s.price}
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted)' }}>
                      {' /mes'}
                    </span>
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{s.title}</span>
                  <span
                    style={{ fontSize: '13px', color: 'var(--muted)' }}
                  >{`${s.place} · ${s.specs}`}</span>
                </div>
              </Link>
            </Fragment>
          ))}
        </div>
      </section>
    </div>
  );
}
