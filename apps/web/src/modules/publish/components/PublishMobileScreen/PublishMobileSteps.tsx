'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { PublishMobileScreenView } from '../../hooks/usePublishMobileScreen';

export function PublishMobileSteps({ v }: { v: PublishMobileScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '8px 16px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {v.showTypeStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                ¿Qué vas a alquilar?
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
                Toca una opción.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {v.typeCards.map((t, $index) => (
                <Fragment key={$index}>
                  <button className={t.className} onClick={t.choose} type="button">
                    <span className="ico">
                      <Icon d={t.icon} size={26} strokeWidth={2} />
                    </span>
                    {`${t.name}`}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
      {v.showLocationStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                ¿Dónde está?
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
                Ajusta el pin en el mapa.
              </p>
            </div>
            <div
              style={{
                position: 'relative',
                height: '210px',
                borderRadius: '22px',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                background: 'var(--map-bg)',
              }}
            >
              <svg
                viewBox="0 0 360 210"
                preserveAspectRatio="xMidYMid slice"
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: '0' }}
                aria-hidden="true"
              >
                <rect width="360" height="210" style={{ fill: 'var(--map-bg)' }} />
                <path
                  d="M230 10 C 300 0 360 40 350 90 C 340 130 280 140 240 110 C 200 80 190 20 230 10z"
                  style={{ fill: 'var(--map-park)' }}
                />
                <path
                  d="M-10 170 C 80 150 160 190 250 170 S 340 150 380 175"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-water)',
                    strokeWidth: '34',
                    strokeLinecap: 'round',
                  }}
                />
                <path
                  d="M-10 70 C 100 90 200 50 380 80"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-road)',
                    strokeWidth: '14',
                    strokeLinecap: 'round',
                  }}
                />
                <path
                  d="M120 -10 C 140 70 100 140 140 220"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-road)',
                    strokeWidth: '12',
                    strokeLinecap: 'round',
                  }}
                />
                <path
                  d="M-10 120 L 380 130 M60 -10 L 50 220 M260 -10 L 270 220"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-road)',
                    strokeWidth: '5',
                    strokeLinecap: 'round',
                  }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-20px',
                  marginTop: '-52px',
                  animation: 'pin-publishmobilescreen 1.4s ease-in-out infinite',
                }}
              >
                <svg width="40" height="52" viewBox="0 0 48 60" aria-hidden="true">
                  <path
                    d="M24 58C24 58 4 36 4 22a20 20 0 0140 0c0 14-20 36-20 36z"
                    style={{ fill: 'var(--ac)' }}
                  />
                  <circle cx="24" cy="22" r="8" fill="#fff" />
                </svg>
              </div>
              <button
                className="btn2"
                style={{
                  position: 'absolute',
                  right: '10px',
                  bottom: '10px',
                  minHeight: '44px',
                  fontSize: '13px',
                  boxShadow: '0 6px 16px rgba(15,20,32,.2)',
                }}
                type="button"
              >
                Usar mi ubicación
              </button>
            </div>
            <label className="fld">
              <span className="l">Urbanización o zona</span>
              <span className="box">
                <input type="text" defaultValue="Altamira, Chacao" />
              </span>
            </label>
            <label className="fld">
              <span className="l">Referencia (opcional)</span>
              <span className="box">
                <input type="text" placeholder="Cerca de la plaza…" />
              </span>
            </label>
          </div>
        </>
      )}
      {v.showDetailsStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Los detalles
              </h1>
              <p style={{ margin: '6px 0 4px', fontSize: '15px', color: 'var(--muted)' }}>
                Toca + y −.
              </p>
            </div>
            {v.counters.map((c, $index) => (
              <Fragment key={$index}>
                <div className="cnt">
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>{`${c.label}`}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button className="cb" aria-label="Menos" onClick={c.decrease} type="button">
                      <Icon name="minus" size={18} strokeWidth={2.6} />
                    </button>
                    <span
                      style={{
                        minWidth: '24px',
                        textAlign: 'center',
                        fontWeight: '800',
                        fontSize: '24px',
                      }}
                    >{`${c.value}`}</span>
                    <button className="cb" aria-label="Más" onClick={c.increase} type="button">
                      <Icon name="plus" size={18} strokeWidth={2.6} />
                    </button>
                  </span>
                </div>
              </Fragment>
            ))}
            <label className="fld">
              <span className="l">Área (m²)</span>
              <span className="box">
                <input type="text" defaultValue="85" />
              </span>
            </label>
          </div>
        </>
      )}
      {v.showAmenitiesStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                ¿Qué servicios tiene?
              </h1>
              <p style={{ margin: '6px 0 6px', fontSize: '15px', color: 'var(--muted)' }}>
                Lo primero que preguntan.
              </p>
            </div>
            {v.amenityCards.map((a, $index) => (
              <Fragment key={$index}>
                <button className={a.className} onClick={a.toggle} type="button">
                  <Icon d={a.icon} size={26} strokeWidth={2} />
                  {`${a.name}`}
                  <span className="sw" />
                </button>
              </Fragment>
            ))}
          </div>
        </>
      )}
      {v.showPhotosStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Agrega fotos
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
                La primera es la portada.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ flex: '1' }} type="button">
                <Icon name="camera" size={22} />
                Tomar foto
              </button>
              <button className="btn2" style={{ flex: '1' }} type="button">
                Galería
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '10px',
              }}
            >
              {v.photoTiles.map((f, $index) => (
                <Fragment key={$index}>
                  <div className="ph" style={css(`${f.tint}; animation-delay:${f.delay}`)}>
                    <Icon name="image" size={28} strokeWidth={1.4} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'var(--surf)',
                        fontSize: '10px',
                        fontWeight: '800',
                        color: 'var(--ac-ink)',
                      }}
                    >{`${f.caption}`}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Se comprimen solas para gastar pocos datos.
            </span>
          </div>
        </>
      )}
      {v.showPriceStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Precio y contacto
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
                ¡Último paso!
              </p>
            </div>
            <label className="fld">
              <span className="l">Precio mensual (USD)</span>
              <span className="box">
                <span style={{ fontWeight: '800', color: 'var(--muted)' }}>$</span>
                <input
                  type="text"
                  value={v.price}
                  onChange={v.onPriceChange}
                  style={{ fontSize: '24px', fontWeight: '800' }}
                />
              </span>
            </label>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'var(--surf2)',
                fontSize: '13px',
                color: 'var(--muted)',
                fontWeight: '600',
              }}
            >
              En bolívares: Bs. [según tasa del día]
            </div>
            <label className="fld">
              <span className="l">WhatsApp para interesados</span>
              <span className="box">
                <span style={{ fontWeight: '700', color: 'var(--muted)' }}>+58</span>
                <input type="text" defaultValue="412 000 0000" />
              </span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '16px',
                background: 'var(--ac-soft)',
                color: 'var(--ac-ink)',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              <Icon name="shield" size={22} />
              Pasa por una revisión rápida antes de salir en el mapa.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
