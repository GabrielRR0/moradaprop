'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { css } from '@/lib/dc';
import { useSession } from '@/modules/auth';
import { askLogin } from '@/lib/login-prompt';
import { useTheme } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { useMapExplorer } from '../../hooks/useMapExplorer';
import type { PropertyCard } from '@/lib/properties';
import { AMENITY_FILTERS } from '../../utils/amenities';
import { badgeOf, formatPrice, photoTint, placeOf, specsOf } from '@/lib/properties';
import { MapCanvas } from '../MapCanvas/MapCanvas';
import { FiltersOverlay } from '../FiltersScreen';
import { closeFiltersRoute } from '../FiltersScreen/filters-route';
import '../shared/explorer.css';
import './mapmobilescreen.css';
import { Icon } from '@/components/icons';

/** La hoja de abajo tapa unos 300 px: el punto elegido se sube para que quede visible arriba. */
const SHEET_OFFSET: [number, number] = [0, -110];

function Card({
  p,
  index,
  selected,
  list,
  onPick,
}: {
  p: PropertyCard;
  index: number;
  selected: boolean;
  list: boolean;
  onPick: () => void;
}) {
  const badge = badgeOf(p);
  return (
    <button
      id={`card-${p.id}`}
      type="button"
      className={`slide${selected ? ' sel' : ''}${list ? ' list' : ''}`}
      onClick={onPick}
    >
      <span
        style={css(
          `${photoTint(index)}; flex:0 0 96px; height:110px; border-radius:14px; display:grid; place-items:center; color:var(--ac-ink); overflow:hidden`,
        )}
      >
        {p.cover ? (
          <img
            src={p.cover.thumb}
            alt=""
            loading="lazy"
            style={{ width: 96, height: 110, objectFit: 'cover' }}
          />
        ) : (
          <Icon name="home" size={34} strokeWidth={1.3} />
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em' }}>
          {formatPrice(p.priceAmount, p.currency)}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}> /mes</span>
          {badge && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--ac-ink)',
                textTransform: 'uppercase',
              }}
            >
              {badge}
            </span>
          )}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.25 }}>{p.title}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{placeOf(p)}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{specsOf(p)}</span>
        <Link
          href={`/propiedad/${p.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 28,
            marginTop: 2,
            fontSize: 12,
            fontWeight: 800,
            color: 'var(--ac-ink)',
          }}
        >
          Ver detalle y escribir por WhatsApp →
        </Link>
      </span>
    </button>
  );
}

/**
 * Mapa en el telefono: mapa a pantalla completa, hoja inferior con tarjetas deslizables y barra de pestañas.
 * Diseno: docs/diseno/pantallas/Movil.dc.html.
 */
export function MapMobileScreen({ startWithFilters = false }: { startWithFilters?: boolean }) {
  const ex = useMapExplorer({ selectionOffset: SHEET_OFFSET });
  const { dark } = useTheme();
  const session = useSession();
  // Favoritos y alertas piden cuenta: sin sesion se abre el aviso con el boton a ingresar.
  const needAccount = (reason: string) =>
    session.status === 'authed' ? toast('Muy pronto disponible', 'info') : askLogin(reason);
  const { search, filters } = ex;
  const [listOpen, setListOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(startWithFilters);

  // La tarjeta elegida se centra en el carrusel.
  useEffect(() => {
    if (!ex.selectedId || listOpen) return;
    document
      .getElementById(`card-${ex.selectedId}`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [ex.selectedId, listOpen]);

  return (
    <div
      className="ds-mapmobilescreen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        maxWidth: 560,
        margin: '0 auto',
        background: 'var(--map-bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
      }}
    >
      <MapCanvas
        ref={ex.handle}
        style={{ position: 'absolute', inset: 0 }}
        markers={ex.markers}
        selectedId={ex.selectedId}
        onSelect={ex.selectFromMap}
        onViewport={ex.onViewport}
        initialView={ex.initialView}
        dark={dark}
        detail={ex.detailStyle}
        onStatus={(status) => ex.setOffline(status === 'offline')}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 14px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search.submit();
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: 52,
                  padding: '0 16px',
                  borderRadius: 999,
                  background: 'var(--surf)',
                  border: '1px solid var(--line)',
                  boxShadow: '0 8px 20px rgba(0,0,0,.3)',
                }}
              >
                <Icon
                  name="search"
                  size={20}
                  strokeWidth={2.4}
                  style={{ color: 'var(--ac-ink)' }}
                />
                <input
                  type="text"
                  value={search.text}
                  placeholder="Ciudad, zona o estado"
                  aria-label="Buscar ubicación"
                  autoComplete="off"
                  onChange={(e) => search.setText(e.target.value)}
                  onBlur={() => window.setTimeout(search.close, 120)}
                  style={{
                    flex: 1,
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    font: 'inherit',
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--text)',
                    minWidth: 0,
                  }}
                />
              </label>
            </form>
            {search.open && (
              <ul className="ex-suggest" role="listbox">
                {search.suggestions.map((place) => (
                  <li key={`${place.kind}-${place.label}-${place.hint}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => search.pick(place)}
                    >
                      {place.label}
                      <small>{place.hint}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label="Abrir filtros"
            style={{
              border: 0,
              position: 'relative',
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--ac)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,.35)',
            }}
          >
            <Icon name="sliders" size={22} strokeWidth={2.4} />
            {ex.activeFilters > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  background: '#fff',
                  color: '#0F1420',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {ex.activeFilters}
              </span>
            )}
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '2px 14px 6px',
            margin: '0 -14px',
          }}
        >
          {AMENITY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={filters[key] ? 'chip on' : 'chip'}
              aria-pressed={!!filters[key]}
              onClick={() => ex.patchFilters({ [key]: !filters[key] })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        aria-label="Mi ubicación"
        type="button"
        onClick={() => ex.handle.current?.locate()}
        style={{
          position: 'absolute',
          right: 14,
          bottom: listOpen ? 'calc(70% + 86px)' : 318,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: 'var(--surf)',
          color: 'var(--text)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 8px 20px rgba(0,0,0,.35)',
          zIndex: 10,
          transition: 'bottom .35s',
        }}
      >
        <Icon name="locate" size={22} />
      </button>

      {(ex.usingMocks || ex.offline) && (
        <span className="ex-pill" style={{ top: 118, bottom: 'auto', zIndex: 15 }} role="status">
          {ex.offline ? 'Sin conexión al mapa: solo pines' : 'Datos de ejemplo'}
        </span>
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 72,
          height: listOpen ? '70%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px 0 14px',
          borderRadius: '28px 28px 0 0',
          background: 'var(--surf)',
          borderTop: '1px solid var(--line)',
          boxShadow: '0 -14px 40px rgba(0,0,0,.4)',
          animation: 'up-mapmobilescreen .6s .3s cubic-bezier(.2,.8,.2,1) both',
          zIndex: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 5,
            borderRadius: 3,
            background: 'var(--line)',
            margin: '0 auto 12px',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px 12px',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 17 }} aria-live="polite">
            {ex.loading
              ? 'Buscando…'
              : `${ex.total} ${ex.total === 1 ? 'propiedad' : 'propiedades'}`}
          </span>
          <button
            type="button"
            onClick={() => setListOpen((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minHeight: 44,
              border: 0,
              background: 'transparent',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--ac-ink)',
            }}
          >
            {listOpen ? ' Ver mapa ' : ' Ver lista '}
            <Icon
              name="chevron-up"
              size={16}
              strokeWidth={2.6}
              style={{
                transform: listOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform .3s',
              }}
            />
          </button>
        </div>
        <div
          style={
            listOpen
              ? {
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '0 16px 8px',
                }
              : {
                  display: 'flex',
                  gap: 12,
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  padding: '0 34px 4px',
                }
          }
        >
          {ex.loading && <div className="ex-skel" style={{ flex: '0 0 322px', height: 130 }} />}
          {!ex.loading && ex.items.length === 0 && (
            <div className="ex-empty" style={{ flex: 1 }}>
              <strong style={{ color: 'var(--text)', fontSize: 15 }}>
                No hay propiedades aquí
              </strong>
              Aleja el mapa o quita filtros.
              {ex.activeFilters > 0 && (
                <button type="button" className="chip" onClick={ex.clearFilters}>
                  Quitar filtros
                </button>
              )}
            </div>
          )}
          {ex.items.map((p, i) => (
            <Card
              key={p.id}
              p={p}
              index={i}
              selected={p.id === ex.selectedId}
              list={listOpen}
              onPick={() => ex.selectFromList(p)}
            />
          ))}
          {ex.hasMore && (
            <button
              type="button"
              className="chip"
              style={{ flex: '0 0 auto', alignSelf: 'center' }}
              onClick={ex.loadMore}
            >
              {ex.loadingMore ? 'Cargando…' : 'Ver más'}
            </button>
          )}
        </div>
      </div>

      <nav
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px 6px',
          background: 'var(--surf)',
          borderTop: '1px solid var(--line)',
          zIndex: 14,
        }}
      >
        <button className="tab on" type="button">
          <Icon name="map" />
          Explorar
        </button>
        <button className="tab" type="button" onClick={() => needAccount('ver tus favoritos')}>
          <Icon name="heart" />
          Favoritos
        </button>
        <button className="tab" type="button" onClick={() => needAccount('crear alertas')}>
          <Icon name="bell" />
          Alertas
        </button>
        <Link href={session.status === 'authed' ? '/seguridad' : '/ingresar'} className="tab">
          <Icon name="user" />
          Perfil
        </Link>
      </nav>
      <FiltersOverlay
        open={filtersOpen}
        filters={ex.filters}
        onApply={(next) => {
          ex.replaceFilters(next);
          setFiltersOpen(false);
          closeFiltersRoute();
        }}
        onClose={() => {
          setFiltersOpen(false);
          closeFiltersRoute();
        }}
      />
    </div>
  );
}
