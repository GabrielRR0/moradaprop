'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { HomeScreenView } from '../../hooks/useHomeScreen';

export function HomeListings({ v }: { v: HomeScreenView }) {
  return (
    <section
      style={{
        padding: '0 48px 80px',
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
      data-reveal=""
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2
            style={{ margin: '0', fontSize: '36px', fontWeight: '800', letterSpacing: '-0.025em' }}
          >
            Propiedades cerca de ti
          </h2>
          <p style={{ margin: '0', fontSize: '17px', color: 'var(--muted)' }}>
            Caracas · 128 disponibles
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              padding: '4px',
              borderRadius: '14px',
              background: 'var(--surf2)',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '40px',
                padding: '0 16px',
                borderRadius: '10px',
                background: 'var(--surf)',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(15,20,32,.1)',
              }}
            >
              <Icon name="grid" size={18} />
              {' Lista'}
            </span>
            <Link
              href="/mapa"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '40px',
                padding: '0 16px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                color: 'var(--muted)',
              }}
            >
              <Icon name="map" size={18} />
              {' Mapa'}
            </Link>
          </div>
          <Link href="/filtros" className="btn2">
            <Icon name="sliders" size={18} />
            {' Filtros '}
          </Link>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {v.listings.map((p, $index) => (
          <Fragment key={$index}>
            <article className="card" style={css(`animation-delay:${p.delay}`)}>
              <div
                className="photo"
                style={css(
                  `${p.tint}; position:relative; height:220px; overflow:hidden; display:grid; place-items:center; color:var(--ac-ink)`,
                )}
              >
                <Icon name="home" size={72} strokeWidth={1.2} />
                <span
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    background: 'var(--surf)',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: 'var(--ac-ink)',
                  }}
                >{`${p.badge}`}</span>
                <button
                  className="heart"
                  aria-label="Guardar en favoritos"
                  onClick={p.toggleFavorite}
                  style={css(`color:${p.heartColor}`)}
                  type="button"
                >
                  <Icon name="heart" size={22} fill={p.heartFill} />
                </button>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.02em' }}>
                    {`${p.price} `}
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>
                      /mes
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ac-ink)' }}>
                    Ver en Bs.
                  </span>
                </div>
                <div style={{ fontWeight: '700', fontSize: '17px' }}>{`${p.title}`}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    color: 'var(--muted)',
                  }}
                >
                  <Icon name="pin" size={16} />
                  {` ${p.place} `}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '18px',
                    padding: '12px 0',
                    borderTop: '1px solid var(--line)',
                    borderBottom: '1px solid var(--line)',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <span>{`${p.bedrooms} hab`}</span>
                  <span>{`${p.bathrooms} baños`}</span>
                  <span>{`${p.area} m²`}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {p.amenities.map((t, $index) => (
                    <Fragment key={$index}>
                      <span className="tag">{`${t}`}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
            </article>
          </Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link href="/mapa" className="btn2" style={{ minHeight: '52px', padding: '0 28px' }}>
          Ver las 128 propiedades en el mapa
        </Link>
      </div>
    </section>
  );
}
