'use client';
import Link from 'next/link';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { HomeScreenView } from '../../hooks/useHomeScreen';

export function HomeListings({ v }: { v: HomeScreenView }) {
  return (
    <section
      className="hm-pad"
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
            className="hm-h2"
            style={{ margin: '0', fontSize: '36px', fontWeight: '800', letterSpacing: '-0.025em' }}
          >
            Propiedades recientes
          </h2>
          <p style={{ margin: '0', fontSize: '17px', color: 'var(--muted)' }}>
            {v.loading ? 'Cargando propiedades…' : `${v.total} disponibles`}
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
        aria-busy={v.loading}
      >
        {v.loading &&
          [0, 1, 2].map((n) => (
            <div key={n} className="card hm-skel" style={{ minHeight: '420px' }} />
          ))}
        {v.listings.map((p) => (
          <article key={p.id} className="card" style={css(`animation-delay:${p.delay}`)}>
            {/* El enlace cubre toda la tarjeta; el corazon queda encima para no abrir la ficha al guardar */}
            <Link href={p.href} className="hm-cardlink" aria-label={`Ver ${p.title}`} />
            <div
              className="photo"
              style={css(
                `${p.tint}; position:relative; height:220px; overflow:hidden; display:grid; place-items:center; color:var(--ac-ink)`,
              )}
            >
              {p.cover ? (
                <img
                  src={p.cover}
                  alt={p.title}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Icon name="home" size={72} strokeWidth={1.2} />
              )}
              {p.badge && (
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
                >
                  {p.badge}
                </span>
              )}
              <button
                className="heart"
                aria-label="Guardar en favoritos"
                onClick={p.toggleFavorite}
                style={css(`color:${p.heartColor}; z-index:2`)}
                type="button"
              >
                <Icon name="heart" size={22} fill={p.heartFill} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
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
                  {p.kind}
                </span>
              </div>
              <div style={{ fontWeight: '700', fontSize: '17px' }}>{p.title}</div>
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
                {p.bedrooms > 0 && <span>{`${p.bedrooms} hab`}</span>}
                <span>{`${p.bathrooms} ${p.bathrooms === 1 ? 'baño' : 'baños'}`}</span>
                {p.area ? <span>{`${p.area} m²`}</span> : null}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '28px' }}>
                {p.amenities.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      {v.failed && (
        <div className="hm-state" role="alert">
          <b>No pudimos cargar las propiedades.</b>
          <button className="btn2" type="button" onClick={v.retry}>
            Reintentar
          </button>
        </div>
      )}
      {!v.loading && !v.failed && v.listings.length === 0 && (
        <div className="hm-state">
          <b>No hay propiedades con estos filtros.</b>
          <span>Quita alguno de los filtros rápidos para ver más.</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Link href="/mapa" className="btn2" style={{ minHeight: '52px', padding: '0 28px' }}>
          {v.total > 0 ? `Ver las ${v.total} propiedades en el mapa` : 'Explorar el mapa'}
        </Link>
      </div>
    </section>
  );
}
