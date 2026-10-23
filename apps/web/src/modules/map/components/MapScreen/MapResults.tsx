'use client';

import { css } from '@/lib/dc';
import type { MapExplorer } from '../../hooks/useMapExplorer';
import { SORT_OPTIONS } from '../../utils/amenities';
import { amenityTags, badgeOf, formatPrice, photoTint, placeOf, specsOf } from '../../utils/format';
import { ChipMenu } from '../shared/ChipMenu';
import { Icon } from '@/components/icons';

/** Columna izquierda: cuantas propiedades hay en la zona y su lista. */
export function MapResults({ ex }: { ex: MapExplorer }) {
  const sort = ex.filters.sort ?? 'recent';
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sort)?.label ?? 'Más recientes';

  return (
    <aside
      style={{
        flex: '0 0 470px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--line)',
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px 12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.01em' }}
            aria-live="polite"
          >
            {ex.loading
              ? 'Buscando…'
              : `${ex.total} ${ex.total === 1 ? 'propiedad' : 'propiedades'}`}
          </span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>en esta zona del mapa</span>
        </div>
        <ChipMenu
          className="btn2"
          align="right"
          label={sortLabel}
          options={SORT_OPTIONS}
          selectedId={sort}
          onChoose={(id) =>
            ex.patchFilters({ sort: id === 'price_asc' || id === 'price_desc' ? id : 'recent' })
          }
        />
      </div>
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '4px 20px 20px',
        }}
      >
        {ex.loading &&
          [0, 1, 2, 3].map((i) => <div key={i} className="ex-skel" style={{ height: 156 }} />)}

        {!ex.loading && ex.items.length === 0 && (
          <div className="ex-empty">
            <strong style={{ color: 'var(--text)', fontSize: 16 }}>No hay propiedades aquí</strong>
            Aleja el mapa, muévete a otra zona o quita algunos filtros.
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {ex.activeFilters > 0 && (
                <button type="button" className="btn2" onClick={ex.clearFilters}>
                  Quitar filtros
                </button>
              )}
              <button
                type="button"
                className="btn2"
                onClick={() => ex.handle.current?.flyTo({ lat: 8.0, lng: -66.0, zoom: 5.6 })}
              >
                Ver toda Venezuela
              </button>
            </div>
          </div>
        )}

        {ex.items.map((p, i) => {
          const badge = badgeOf(p);
          return (
            <button
              key={p.id}
              id={`card-${p.id}`}
              type="button"
              className={p.id === ex.selectedId ? 'row sel' : 'row'}
              onClick={() => ex.selectFromList(p)}
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <span
                style={{
                  ...css(
                    `${photoTint(i)}; flex:0 0 132px; height:132px; border-radius:14px; display:grid; place-items:center; color:var(--ac-ink); overflow:hidden`,
                  ),
                }}
              >
                {p.cover ? (
                  <img
                    src={p.cover.thumb}
                    alt=""
                    loading="lazy"
                    style={{ width: 132, height: 132, objectFit: 'cover' }}
                  />
                ) : (
                  <Icon name="home" size={40} strokeWidth={1.3} />
                )}
              </span>
              <span
                style={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
                    {formatPrice(p.priceAmount, p.currency)}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
                      {' '}
                      /mes
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--ac-ink)',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    {badge}
                  </span>
                </span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{p.title}</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{placeOf(p)}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{specsOf(p)}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {amenityTags(p).map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}

        {ex.hasMore && (
          <button type="button" className="btn2" onClick={ex.loadMore} disabled={ex.loadingMore}>
            {ex.loadingMore ? 'Cargando…' : 'Ver más propiedades'}
          </button>
        )}
      </div>
    </aside>
  );
}
