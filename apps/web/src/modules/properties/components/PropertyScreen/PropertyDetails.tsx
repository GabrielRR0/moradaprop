'use client';
import Link from 'next/link';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { PropertyScreenView } from '../../hooks/usePropertyScreen';

export function PropertyDetails({ v }: { v: PropertyScreenView }) {
  return (
    <div
      style={{
        flex: '999 1 560px',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'var(--ac-soft)',
              color: 'var(--ac-ink)',
              fontSize: '13px',
              fontWeight: '800',
            }}
          >
            Disponible
          </span>
          <h1
            style={{
              margin: '0',
              fontSize: '38px',
              lineHeight: '1.1',
              fontWeight: '800',
              letterSpacing: '-0.03em',
            }}
          >
            Apartamento moderno con vista
          </h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              color: 'var(--muted)',
            }}
          >
            <Icon name="pin" size={18} />
            {' Los Palos Grandes, Chacao · Caracas'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={v.favoriteButtonClass}
            onClick={v.toggleFavorite}
            aria-label="Guardar en favoritos"
            style={css(`color:${v.favoriteColor}`)}
            type="button"
          >
            <Icon name="heart" size={22} fill={v.favoriteFill} />
          </button>
          <button className="heart" aria-label="Compartir" type="button">
            <Icon name="share" size={22} />
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--surf2)',
          }}
        >
          <span style={{ fontWeight: '800', fontSize: '26px' }}>2</span>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>
            Habitaciones
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--surf2)',
          }}
        >
          <span style={{ fontWeight: '800', fontSize: '26px' }}>2</span>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>Baños</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--surf2)',
          }}
        >
          <span style={{ fontWeight: '800', fontSize: '26px' }}>1</span>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>Puesto</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '16px',
            borderRadius: '18px',
            background: 'var(--surf2)',
          }}
        >
          <span style={{ fontWeight: '800', fontSize: '26px' }}>85 m²</span>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>Área</span>
        </div>
      </div>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Servicios del inmueble
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          <div className="am">
            <span className="i">
              <Icon name="bolt" strokeWidth={2} />
            </span>
            Planta eléctrica
          </div>
          <div className="am">
            <span className="i">
              <Icon name="droplet" strokeWidth={2} />
            </span>
            Tanque de agua
          </div>
          <div className="am">
            <span className="i">
              <Icon name="wifi" strokeWidth={2} />
            </span>
            Fibra óptica
          </div>
          <div className="am">
            <span className="i">
              <Icon name="shield" strokeWidth={2} />
            </span>
            Vigilancia 24 h
          </div>
        </div>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Descripción
        </h2>
        <p style={{ margin: '0', fontSize: '16px', lineHeight: '1.7', color: 'var(--muted)' }}>
          [Descripción escrita por el dueño o la inmobiliaria: luz natural, vista, cercanía a
          transporte y comercios, condiciones del contrato.]
        </p>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Ubicación
        </h2>
        <div
          style={{
            position: 'relative',
            height: '260px',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--line)',
            background: 'var(--map-bg)',
          }}
        >
          <svg
            viewBox="0 0 800 260"
            preserveAspectRatio="xMidYMid slice"
            width="100%"
            height="100%"
            style={{ position: 'absolute', inset: '0' }}
            aria-hidden="true"
          >
            <rect width="800" height="260" style={{ fill: 'var(--map-bg)' }} />
            <path
              d="M560 10 C 650 0 760 40 770 100 C 780 160 700 180 640 150 C 580 120 520 30 560 10z"
              style={{ fill: 'var(--map-park)' }}
            />
            <path
              d="M-10 210 C 150 180 280 240 420 215 S 680 180 810 225"
              style={{
                fill: 'none',
                stroke: 'var(--map-water)',
                strokeWidth: '44',
                strokeLinecap: 'round',
              }}
            />
            <path
              d="M-10 80 C 180 110 340 50 520 90 S 720 110 810 80"
              style={{
                fill: 'none',
                stroke: 'var(--map-road)',
                strokeWidth: '16',
                strokeLinecap: 'round',
              }}
            />
            <path
              d="M300 -10 C 320 80 270 160 330 270"
              style={{
                fill: 'none',
                stroke: 'var(--map-road)',
                strokeWidth: '14',
                strokeLinecap: 'round',
              }}
            />
            <path
              d="M-10 150 L 810 160 M150 -10 L 140 270 M480 -10 L 500 270 M660 -10 L 670 270"
              style={{
                fill: 'none',
                stroke: 'var(--map-road)',
                strokeWidth: '5',
                strokeLinecap: 'round',
              }}
            />
          </svg>
          <span
            style={{
              position: 'absolute',
              left: '42%',
              top: '52%',
              width: '96px',
              height: '96px',
              margin: '-48px 0 0 -48px',
              borderRadius: '50%',
              background: 'var(--ac)',
              opacity: '.18',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '42%',
              top: '52%',
              transform: 'translate(-50%,-100%)',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'var(--ac)',
              color: '#fff',
              fontWeight: '800',
              fontSize: '14px',
              boxShadow: '0 6px 16px rgba(15,20,32,.3)',
            }}
          >
            $450
          </span>
          <span
            style={{
              position: 'absolute',
              left: '16px',
              bottom: '16px',
              padding: '8px 14px',
              borderRadius: '12px',
              background: 'var(--surf)',
              border: '1px solid var(--line)',
              fontSize: '13px',
              fontWeight: '700',
            }}
          >
            Zona aproximada · la dirección exacta se comparte al agendar
          </span>
        </div>
      </section>
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px',
          borderRadius: '22px',
          border: '1px solid var(--line)',
          background: 'var(--surf)',
        }}
      >
        <span
          style={{
            flex: '0 0 60px',
            height: '60px',
            borderRadius: '50%',
            background: '#0E8A5F',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: '800',
            fontSize: '20px',
          }}
        >
          AN
        </span>
        <span style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontWeight: '800', fontSize: '17px' }}>
            Andrea · Inmobiliaria [Nombre]
          </span>
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
            Responde en menos de 1 hora · 42 propiedades
          </span>
        </span>
        <Link href="/" className="btn2">
          Ver perfil
        </Link>
      </section>
    </div>
  );
}
