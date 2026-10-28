'use client';
import { Fragment } from 'react';
import { Icon } from '@/components/icons';
import type { HomeScreenView } from '../../hooks/useHomeScreen';

export function HomeIntro({ v }: { v: HomeScreenView }) {
  return (
    <section
      className="hm-pad hm-hero"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '48px',
        padding: '72px 48px 64px',
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
      }}
      data-reveal=""
    >
      <div
        style={{
          flex: '1 1 520px',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        <span
          className="tag"
          style={{
            alignSelf: 'flex-start',
            background: 'var(--ac-soft)',
            color: 'var(--ac-ink)',
            fontSize: '13px',
            padding: '7px 14px',
          }}
        >
          <Icon name="pin" size={14} strokeWidth={2.4} />
          {' Alquileres en toda Venezuela '}
        </span>
        <h1
          className="hm-h1"
          style={{
            margin: '0',
            fontSize: '62px',
            lineHeight: '1.04',
            fontWeight: '800',
            letterSpacing: '-0.035em',
          }}
        >
          {'Encuentra tu próximo '}
          <span className="u">hogar</span>
          {' sin complicaciones'}
        </h1>
        <p
          style={{
            margin: '0',
            fontSize: '19px',
            lineHeight: '1.55',
            color: 'var(--muted)',
            maxWidth: '520px',
          }}
        >
          Explora en el mapa, filtra por lo que de verdad importa en Venezuela —planta eléctrica,
          agua constante, fibra óptica— y contacta por WhatsApp.
        </p>
        <form
          className="hm-form"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            gap: '6px',
            padding: '8px',
            borderRadius: '22px',
            background: 'var(--surf)',
            border: '1px solid var(--line)',
            boxShadow: '0 18px 44px rgba(15,20,32,.1)',
          }}
          onSubmit={v.search.submit}
        >
          <label
            style={{
              flex: '2 1 180px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '10px 16px',
              borderRadius: '16px',
              cursor: 'text',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--muted)',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
              Dónde
            </span>
            <input
              type="text"
              placeholder="Ciudad, municipio o urbanización"
              value={v.search.where}
              onChange={(e) => v.search.setWhere(e.target.value)}
              style={{
                border: '0',
                outline: '0',
                background: 'transparent',
                fontWeight: '600',
                fontSize: '15px',
                width: '100%',
                minHeight: '28px',
              }}
            />
          </label>
          <label
            style={{
              flex: '1 1 120px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '10px 16px',
              borderRadius: '16px',
              borderLeft: '1px solid var(--line)',
              cursor: 'text',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--muted)',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
              Hasta
            </span>
            <input
              type="text"
              placeholder="Ej. 500 (USD al mes)"
              inputMode="numeric"
              value={v.search.maxPrice}
              onChange={(e) => v.search.setMaxPrice(e.target.value)}
              style={{
                border: '0',
                outline: '0',
                background: 'transparent',
                fontWeight: '600',
                fontSize: '15px',
                width: '100%',
                minHeight: '28px',
              }}
            />
          </label>
          <label
            style={{
              flex: '1 1 110px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '10px 16px',
              borderRadius: '16px',
              borderLeft: '1px solid var(--line)',
              cursor: 'text',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--muted)',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
              Habitaciones
            </span>
            <input
              type="text"
              placeholder="Cualquiera"
              inputMode="numeric"
              value={v.search.bedrooms}
              onChange={(e) => v.search.setBedrooms(e.target.value)}
              style={{
                border: '0',
                outline: '0',
                background: 'transparent',
                fontWeight: '600',
                fontSize: '15px',
                width: '100%',
                minHeight: '28px',
              }}
            />
          </label>
          <button
            type="submit"
            className="btn"
            style={{
              flex: '0 0 auto',
              minHeight: '64px',
              padding: '0 30px',
              borderRadius: '16px',
              fontSize: '16px',
            }}
          >
            <Icon name="search" size={20} strokeWidth={2.4} />
            {' Buscar '}
          </button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>
            Filtros rápidos:
          </span>
          {v.filterChips.map((c, $index) => (
            <Fragment key={$index}>
              <button
                className={c.className}
                onClick={c.toggle}
                type="button"
              >{`${c.label}`}</button>
            </Fragment>
          ))}
        </div>
      </div>
      <div
        className="hm-map"
        style={{
          flex: '1 1 460px',
          minWidth: '0',
          position: 'relative',
          height: '520px',
          borderRadius: '32px',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'var(--map-bg)',
          boxShadow: '0 30px 70px rgba(15,20,32,.16)',
        }}
      >
        <svg
          viewBox="0 0 560 520"
          preserveAspectRatio="xMidYMid slice"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: '0' }}
          aria-hidden="true"
        >
          <rect width="560" height="520" style={{ fill: 'var(--map-bg)' }} />
          <path
            d="M-20 420 C 120 380 200 470 330 430 S 520 360 600 400"
            style={{
              fill: 'none',
              stroke: 'var(--map-water)',
              strokeWidth: '46',
              strokeLinecap: 'round',
            }}
          />
          <path
            d="M300 40 C 360 30 430 70 440 130 C 450 190 380 200 330 170 C 280 140 250 60 300 40z"
            style={{ fill: 'var(--map-park)' }}
          />
          <path
            d="M-10 110 C 100 150 200 90 330 130 S 500 190 580 150"
            style={{
              fill: 'none',
              stroke: 'var(--map-road)',
              strokeWidth: '16',
              strokeLinecap: 'round',
            }}
          />
          <path
            d="M120 -10 C 140 100 90 200 150 300 S 200 460 180 540"
            style={{
              fill: 'none',
              stroke: 'var(--map-road)',
              strokeWidth: '14',
              strokeLinecap: 'round',
            }}
          />
          <path
            d="M-10 270 C 150 250 300 300 420 260 S 540 280 580 300"
            style={{
              fill: 'none',
              stroke: 'var(--map-road)',
              strokeWidth: '10',
              strokeLinecap: 'round',
            }}
          />
          <path
            d="M400 -10 C 380 80 440 200 410 300 S 430 420 450 540"
            style={{
              fill: 'none',
              stroke: 'var(--map-road)',
              strokeWidth: '10',
              strokeLinecap: 'round',
            }}
          />
          <path
            d="M-10 190 L 560 210 M-10 340 L 560 330 M250 -10 L 270 540 M60 -10 L 40 540 M510 -10 L 500 540"
            style={{
              fill: 'none',
              stroke: 'var(--map-road)',
              strokeWidth: '5',
              strokeLinecap: 'round',
            }}
          />
        </svg>
        <div
          className="cluster"
          style={{ left: '18%', top: '30%', animation: 'drop-homescreen .7s .1s both' }}
        >
          <span>12</span>
        </div>
        <div
          className="cluster"
          style={{ left: '82%', top: '62%', animation: 'drop-homescreen .7s .3s both' }}
        >
          <span>8</span>
        </div>
        <button
          className="pin"
          style={{ left: '46%', top: '46%', animationDelay: '.4s' }}
          type="button"
        >
          $450
        </button>
        <button
          className="pin sel"
          style={{ left: '62%', top: '28%', animationDelay: '.55s' }}
          type="button"
        >
          $1.200
        </button>
        <button
          className="pin"
          style={{ left: '30%', top: '66%', animationDelay: '.7s' }}
          type="button"
        >
          $280
        </button>
        <button
          className="pin"
          style={{ left: '70%', top: '80%', animationDelay: '.85s' }}
          type="button"
        >
          $390
        </button>
        <div
          className="float"
          style={{
            position: 'absolute',
            left: '20px',
            right: '20px',
            bottom: '20px',
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            padding: '12px',
            borderRadius: '20px',
            background: 'var(--surf)',
            border: '1px solid var(--line)',
            boxShadow: '0 20px 44px rgba(15,20,32,.22)',
          }}
        >
          <div
            style={{
              flex: '0 0 84px',
              height: '84px',
              borderRadius: '14px',
              background: 'color-mix(in srgb, var(--ac) 20%, var(--surf2))',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ac-ink)',
            }}
          >
            <Icon name="home" size={34} strokeWidth={1.8} />
          </div>
          <div style={{ minWidth: '0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: '800', fontSize: '20px' }}>
              {'$1.200 '}
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--muted)' }}>
                /mes
              </span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Casa familiar con jardín</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
              La Lagunita · 4 hab · 3 baños
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
