'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { ImportMobileScreenView } from '../../hooks/useImportMobileScreen';

export function ImportMobileSteps({ v }: { v: ImportMobileScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '6px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {v.showFileStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '28px',
                  lineHeight: '1.1',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Sube tu inventario
              </h1>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  color: 'var(--muted)',
                }}
              >
                Elige tu archivo .xlsx o .csv. Revisamos cada fila antes de publicar.
              </p>
            </div>
            <button className="btn" onClick={v.goNext} style={{ minHeight: '64px' }} type="button">
              <span
                style={{
                  animation: 'bob-importmobilescreen 2.2s ease-in-out infinite',
                  display: 'grid',
                }}
              >
                <Icon name="upload" size={26} />
              </span>
              Elegir archivo
            </button>
            <button className="btn2" type="button">
              Descargar plantilla .xlsx
            </button>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                borderRadius: '20px',
                background: 'var(--ac-soft)',
                color: 'var(--ac-ink)',
              }}
            >
              <span style={{ fontWeight: '800', fontSize: '15px' }}>
                ¿Prefieres hacerlo desde la computadora?
              </span>
              <span style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Te enviamos el enlace por correo para continuar ahí. Tu progreso se guarda.
              </span>
              <button
                style={{
                  alignSelf: 'flex-start',
                  minHeight: '46px',
                  padding: '0 18px',
                  borderRadius: '12px',
                  border: '2px solid var(--ac)',
                  background: 'transparent',
                  color: 'var(--ac-ink)',
                  fontWeight: '800',
                  fontSize: '14px',
                }}
                type="button"
              >
                Enviarme el enlace
              </button>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Las fotos se agregan después, por propiedad.
            </span>
          </div>
        </>
      )}
      {v.showReviewStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'var(--surf2)',
              }}
            >
              <Icon name="file" size={20} strokeWidth={2} style={{ color: '#14633A' }} />
              <span style={{ fontWeight: '700', fontSize: '14px' }}>inventario-octubre.xlsx</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>48 filas</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="sum">
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
                  Listas
                </span>
                <span
                  style={{
                    fontWeight: '800',
                    fontSize: '32px',
                    letterSpacing: '-0.03em',
                    color: '#1F9D55',
                  }}
                >{`${v.readyCount}`}</span>
              </div>
              <div className="sum">
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
                  Por arreglar
                </span>
                <span
                  style={css(
                    `font-weight:800; font-size:32px; letter-spacing:-0.03em; color:${v.errorColor}`,
                  )}
                >{`${v.errorCount}`}</span>
              </div>
            </div>
            {v.errors.map((e, $index) => (
              <Fragment key={$index}>
                <div className={e.className}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        minWidth: '44px',
                        height: '28px',
                        padding: '0 8px',
                        borderRadius: '8px',
                        background: 'var(--surf2)',
                        fontWeight: '800',
                        fontSize: '13px',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >{`#${e.row}`}</span>
                    <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{`${e.message}`}</span>
                      <span
                        style={{ fontSize: '12px', color: 'var(--muted)' }}
                      >{`${e.propertyName}`}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="fi"
                      type="text"
                      placeholder={e.placeholder}
                      aria-label="Corrección"
                    />
                    <button
                      className={e.buttonClass}
                      onClick={e.toggleFixed}
                      type="button"
                    >{`${e.buttonLabel}`}</button>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </>
      )}
      {v.showProgressStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '30px' }}
          >
            <span style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.02em' }}>
              Importando…
            </span>
            <div className="prog">
              <i />
            </div>
            <span style={{ fontSize: '15px', lineHeight: '1.5', color: 'var(--muted)' }}>
              Creando propiedades y ubicándolas en el mapa. Puedes salir: te avisamos al terminar.
            </span>
          </div>
        </>
      )}
      {v.showDoneStep && (
        <>
          <div
            className="step"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '18px',
              paddingTop: '30px',
            }}
          >
            <span
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'var(--ac)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                animation: 'burst-importmobilescreen .6s cubic-bezier(.3,1.5,.5,1) both',
              }}
            >
              <svg
                width="46"
                height="46"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M5 12l5 5 9-10"
                  style={{
                    strokeDasharray: '40',
                    animation: 'check-importmobilescreen .6s .35s ease-out both',
                  }}
                />
              </svg>
            </span>
            <h1
              style={{
                margin: '0',
                fontSize: '30px',
                lineHeight: '1.1',
                fontWeight: '800',
                letterSpacing: '-0.03em',
              }}
            >{`¡${v.readyCount} propiedades importadas!`}</h1>
            <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.55', color: 'var(--muted)' }}>
              Quedaron como borrador. Asigna agentes, agrega fotos y publícalas.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
