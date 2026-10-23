'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import './propertymobilescreen.css';
import { usePropertyMobileScreen } from '../../hooks/usePropertyMobileScreen';
import { PropertyMobileDetails } from './PropertyMobileDetails';
import { Icon } from '@/components/icons';

export function PropertyMobileScreen() {
  const v = usePropertyMobileScreen();
  return (
    <div
      className="ds-propertymobilescreen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      <div
        style={{ flex: '1 1 auto', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            position: 'relative',
            flex: '0 0 300px',
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
          }}
        >
          {v.photoTiles.map((p, $index) => (
            <Fragment key={$index}>
              <div
                style={css(
                  `${p.tint}; flex:0 0 100%; scroll-snap-align:center; display:grid; place-items:center; color:var(--ac-ink)`,
                )}
              >
                <Icon name="home" size={72} strokeWidth={1} />
              </div>
            </Fragment>
          ))}
        </div>
        <Link
          href="/mapa"
          className="round"
          aria-label="Volver"
          style={{ top: '14px', left: '14px' }}
        >
          <Icon name="chevron-left" size={20} strokeWidth={2.6} />
        </Link>
        <button
          className={v.favoriteButtonClass}
          onClick={v.toggleFavorite}
          aria-label="Guardar en favoritos"
          style={css(`top:14px; right:14px; color:${v.favoriteColor}`)}
          type="button"
        >
          <Icon name="heart" size={22} fill={v.favoriteFill} />
        </button>
        <button
          className="round"
          aria-label="Compartir"
          style={{ top: '14px', right: '68px' }}
          type="button"
        >
          <Icon name="share" size={20} />
        </button>
        <span
          style={{
            position: 'absolute',
            left: '16px',
            top: '272px',
            marginTop: '-60px',
            display: 'flex',
            gap: '5px',
          }}
        >
          <span className="dot on" style={{ width: '22px' }} />
          <span className="dot" style={{ width: '7px' }} />
          <span className="dot" style={{ width: '7px' }} />
          <span className="dot" style={{ width: '7px' }} />
        </span>
      </div>
      <PropertyMobileDetails v={v} />
    </div>
  );
}
