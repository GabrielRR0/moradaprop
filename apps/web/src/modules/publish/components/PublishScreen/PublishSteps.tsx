'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { PublishScreenView } from '../../hooks/usePublishScreen';

export function PublishSteps({ v }: { v: PublishScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '40px 56px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {v.showTypeStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: '0',
                  fontSize: '34px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                ¿Qué vas a alquilar?
              </h1>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Elige el tipo de inmueble. Es el primer paso, ¡y el más rápido!
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '14px',
              }}
            >
              {v.typeCards.map((t, $index) => (
                <Fragment key={$index}>
                  <button className={t.className} onClick={t.choose} type="button">
                    <span className="ico">
                      <Icon d={t.icon} size={28} strokeWidth={2} />
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
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: '0',
                  fontSize: '34px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                ¿Dónde está?
              </h1>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Escribe la zona y ajusta el pin en el mapa. Mostramos la zona, no la dirección
                exacta.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">Estado</span>
                <span className="box">
                  <input type="text" defaultValue="Distrito Capital" />
                </span>
              </label>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">Municipio</span>
                <span className="box">
                  <input type="text" defaultValue="Chacao" />
                </span>
              </label>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">Urbanización</span>
                <span className="box">
                  <input type="text" defaultValue="Altamira" />
                </span>
              </label>
            </div>
            <div
              style={{
                position: 'relative',
                height: '300px',
                borderRadius: '22px',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                background: 'var(--map-bg)',
              }}
            >
              <svg
                viewBox="0 0 720 300"
                preserveAspectRatio="xMidYMid slice"
                width="100%"
                height="100%"
                style={{ position: 'absolute', inset: '0' }}
                aria-hidden="true"
              >
                <rect width="720" height="300" style={{ fill: 'var(--map-bg)' }} />
                <path
                  d="M480 20 C 560 10 660 50 670 110 C 680 170 600 190 540 160 C 480 130 430 40 480 20z"
                  style={{ fill: 'var(--map-park)' }}
                />
                <path
                  d="M-10 230 C 120 200 220 270 360 240 S 600 200 740 250"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-water)',
                    strokeWidth: '40',
                    strokeLinecap: 'round',
                  }}
                />
                <path
                  d="M-10 90 C 150 120 300 60 460 100 S 640 120 740 90"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-road)',
                    strokeWidth: '16',
                    strokeLinecap: 'round',
                  }}
                />
                <path
                  d="M200 -10 C 220 90 170 170 230 310"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-road)',
                    strokeWidth: '14',
                    strokeLinecap: 'round',
                  }}
                />
                <path
                  d="M-10 160 L 740 170 M100 -10 L 90 310 M330 -10 L 350 310 M560 -10 L 570 310"
                  style={{
                    fill: 'none',
                    stroke: 'var(--map-road)',
                    strokeWidth: '5',
                    strokeLinecap: 'round',
                  }}
                />
              </svg>
              <div className="mappin">
                <svg width="48" height="60" viewBox="0 0 48 60" aria-hidden="true">
                  <path
                    d="M24 58C24 58 4 36 4 22a20 20 0 0140 0c0 14-20 36-20 36z"
                    style={{ fill: 'var(--ac)' }}
                  />
                  <circle cx="24" cy="22" r="8" fill="#fff" />
                </svg>
              </div>
              <span
                style={{
                  position: 'absolute',
                  left: '52%',
                  top: '46%',
                  width: '22px',
                  height: '8px',
                  marginLeft: '-11px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.25)',
                }}
              />
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
                  boxShadow: '0 6px 16px rgba(15,20,32,.18)',
                }}
              >
                Arrastra el pin hasta tu edificio o casa
              </span>
              <button
                className="btn2"
                style={{
                  position: 'absolute',
                  right: '16px',
                  bottom: '16px',
                  minHeight: '44px',
                  boxShadow: '0 6px 16px rgba(15,20,32,.18)',
                }}
                type="button"
              >
                Usar mi ubicación
              </button>
            </div>
            <label className="fld">
              <span className="l">Referencia (opcional)</span>
              <span className="box">
                <input type="text" placeholder="Ej: cerca de la plaza, edificio con vigilancia" />
              </span>
            </label>
          </div>
        </>
      )}
      {v.showDetailsStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: '0',
                  fontSize: '34px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Cuéntanos los detalles
              </h1>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Toca + y − para ajustar. Sin escribir de más.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {v.counters.map((c, $index) => (
                <Fragment key={$index}>
                  <div className="cnt">
                    <span style={{ fontWeight: '800', fontSize: '17px' }}>{`${c.label}`}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <button className="cb" aria-label="Menos" onClick={c.decrease} type="button">
                        <Icon name="minus" size={18} strokeWidth={2.6} />
                      </button>
                      <span
                        style={{
                          minWidth: '28px',
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
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">Área (m²)</span>
                <span className="box">
                  <input type="text" defaultValue="85" />
                </span>
              </label>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">Disponible desde</span>
                <span className="box">
                  <input type="text" defaultValue="Inmediato" />
                </span>
              </label>
            </div>
            <label className="fld">
              <span className="l">Descripción</span>
              <span className="box" style={{ alignItems: 'flex-start', padding: '14px 16px' }}>
                <textarea
                  rows={4}
                  placeholder="Qué hace especial a esta propiedad: luz, vista, cercanía a transporte…"
                />
              </span>
            </label>
          </div>
        </>
      )}
      {v.showAmenitiesStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: '0',
                  fontSize: '34px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                ¿Qué servicios tiene?
              </h1>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Lo primero que preguntan los inquilinos en Venezuela. Actívalos con un toque.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {v.amenityCards.map((a, $index) => (
                <Fragment key={$index}>
                  <button className={a.className} onClick={a.toggle} type="button">
                    <Icon d={a.icon} size={28} strokeWidth={2} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{`${a.name}`}</span>
                      <span
                        style={{ fontSize: '13px', fontWeight: '500', color: 'var(--muted)' }}
                      >{`${a.hint}`}</span>
                    </span>
                    <span className="sw" />
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
      {v.showPhotosStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: '0',
                  fontSize: '34px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Agrega fotos
              </h1>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                La primera es la portada. Arrastra para reordenar. Las optimizamos por ti.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '14px',
              }}
            >
              {v.photoTiles.map((f, $index) => (
                <Fragment key={$index}>
                  <div
                    className="ph"
                    style={css(`${f.tint}; height:150px; animation-delay:${f.delay}`)}
                  >
                    <Icon name="image" size={34} strokeWidth={1.4} />
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        background: 'var(--surf)',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: 'var(--ac-ink)',
                      }}
                    >{`${f.caption}`}</span>
                  </div>
                </Fragment>
              ))}
              <div
                style={{
                  gridColumn: 'span 2',
                  height: '150px',
                  borderRadius: '16px',
                  border: '2px dashed var(--ac)',
                  background: 'var(--ac-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: 'var(--ac-ink)',
                }}
              >
                <Icon name="upload" size={32} />
                <span style={{ fontWeight: '800', fontSize: '15px' }}>Arrastra tus fotos aquí</span>
                <span style={{ fontSize: '12px', fontWeight: '600', opacity: '.85' }}>
                  o toca para elegir · JPG o PNG
                </span>
              </div>
            </div>
          </div>
        </>
      )}
      {v.showPriceStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  margin: '0',
                  fontSize: '34px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Precio y contacto
              </h1>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Último paso. Revisa a la derecha cómo se verá tu anuncio.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">Precio mensual (USD)</span>
                <span className="box">
                  <span style={{ fontWeight: '800', color: 'var(--muted)' }}>$</span>
                  <input
                    type="text"
                    value={v.price}
                    onChange={v.onPriceChange}
                    style={{ fontSize: '22px', fontWeight: '800' }}
                  />
                </span>
              </label>
              <label className="fld" style={{ flex: '1' }}>
                <span className="l">En bolívares (automático)</span>
                <span className="box" style={{ background: 'var(--surf2)' }}>
                  <span style={{ fontWeight: '700', color: 'var(--muted)' }}>
                    Bs. [según tasa del día]
                  </span>
                </span>
              </label>
            </div>
            <label className="fld">
              <span className="l">WhatsApp para recibir interesados</span>
              <span className="box">
                <span style={{ fontWeight: '700', color: 'var(--muted)' }}>+58</span>
                <input type="text" defaultValue="412 000 0000" />
              </span>
            </label>
            <div className="cnt" style={{ padding: '16px 18px' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: '800', fontSize: '16px' }}>
                  Permitir solicitar visitas
                </span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  Los interesados eligen día y hora
                </span>
              </span>
              <span
                style={{
                  width: '46px',
                  height: '26px',
                  borderRadius: '13px',
                  background: 'var(--ac)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: '23px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                  }}
                />
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 18px',
                borderRadius: '18px',
                background: 'var(--ac-soft)',
                color: 'var(--ac-ink)',
                fontWeight: '700',
                fontSize: '14px',
              }}
            >
              <Icon name="shield" size={22} />
              {' Pasará una revisión rápida antes de aparecer en el mapa. '}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
