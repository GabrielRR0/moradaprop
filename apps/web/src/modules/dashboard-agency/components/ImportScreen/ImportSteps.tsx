'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { ImportScreenView } from '../../hooks/useImportScreen';

export function ImportSteps({ v }: { v: ImportScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        minHeight: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1060px',
      }}
    >
      {v.showFileStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                padding: '20px 22px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                background: 'var(--surf)',
              }}
            >
              <span
                style={{
                  flex: '0 0 56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#E3F4EA',
                  color: '#14633A',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="file-error" size={28} strokeWidth={2} />
              </span>
              <span style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontWeight: '800', fontSize: '17px' }}>
                  ¿Primera vez? Empieza con nuestra plantilla
                </span>
                <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  Ya trae las columnas listas y un ejemplo en la primera fila.
                </span>
              </span>
              <button className="btn2" type="button">
                Descargar plantilla .xlsx
              </button>
            </div>
            <button
              className="drop"
              onClick={v.goNext}
              style={{ font: 'inherit', cursor: 'pointer' }}
              type="button"
            >
              <span className="up">
                <Icon name="upload" size={56} strokeWidth={1.8} />
              </span>
              <span style={{ fontWeight: '800', fontSize: '22px' }}>Arrastra tu archivo aquí</span>
              <span style={{ fontSize: '15px', fontWeight: '600', opacity: '.85' }}>
                o toca para elegirlo · .xlsx o .csv · hasta 500 filas
              </span>
            </button>
            <div
              style={{
                display: 'flex',
                gap: '24px',
                fontSize: '14px',
                color: 'var(--muted)',
                fontWeight: '600',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="check" size={18} strokeWidth={2.8} style={{ color: 'var(--ac-ink)' }} />
                No se publica nada hasta que confirmes
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="check" size={18} strokeWidth={2.8} style={{ color: 'var(--ac-ink)' }} />
                Las fotos se agregan después, por propiedad
              </span>
            </div>
          </div>
        </>
      )}
      {v.showReviewStep && (
        <>
          <div
            className="step"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '0' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                borderRadius: '16px',
                border: '1px solid var(--line)',
                background: 'var(--surf2)',
              }}
            >
              <Icon name="file" size={22} strokeWidth={2} style={{ color: '#14633A' }} />
              <span style={{ fontWeight: '700', fontSize: '15px' }}>inventario-octubre.xlsx</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>48 filas leídas</span>
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div className="sum">
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
                  Listas para importar
                </span>
                <span
                  style={{
                    fontWeight: '800',
                    fontSize: '38px',
                    letterSpacing: '-0.03em',
                    color: '#1F9D55',
                  }}
                >{`${v.readyCount}`}</span>
              </div>
              <div className="sum">
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
                  Necesitan un arreglo
                </span>
                <span
                  style={css(
                    `font-weight:800; font-size:38px; letter-spacing:-0.03em; color:${v.errorColor}`,
                  )}
                >{`${v.errorCount}`}</span>
              </div>
              <div className="sum">
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}>
                  Total en el archivo
                </span>
                <span style={{ fontWeight: '800', fontSize: '38px', letterSpacing: '-0.03em' }}>
                  48
                </span>
              </div>
            </div>
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: '20px',
                background: 'var(--surf)',
                overflow: 'hidden',
              }}
            >
              <div
                className="err"
                style={{ background: 'var(--surf2)', paddingTop: '12px', paddingBottom: '12px' }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}
                >
                  Fila
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}
                >
                  Qué pasó
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}
                >
                  Corrige aquí
                </span>
                <span />
              </div>
              {v.errors.map((e, $index) => (
                <Fragment key={$index}>
                  <div className={e.className}>
                    <span style={{ fontWeight: '800', fontSize: '15px' }}>{`#${e.row}`}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{`${e.message}`}</span>
                      <span
                        style={{ fontSize: '12px', color: 'var(--muted)' }}
                      >{`${e.propertyName}`}</span>
                    </span>
                    <input className="fi" type="text" placeholder={e.placeholder} />
                    <button
                      className={e.buttonClass}
                      onClick={e.toggleFixed}
                      type="button"
                    >{`${e.buttonLabel}`}</button>
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="btn2" onClick={v.goBack} type="button">
                Cambiar archivo
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>
                  Las filas con error se omiten si no las corriges
                </span>
                <button
                  className="btn"
                  onClick={v.goNext}
                  type="button"
                >{`Importar ${v.readyCount} propiedades`}</button>
              </div>
            </div>
          </div>
        </>
      )}
      {v.showProgressStep && (
        <>
          <div
            className="step"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
              padding: '44px',
              borderRadius: '26px',
              border: '1px solid var(--line)',
              background: 'var(--surf)',
            }}
          >
            <span style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.02em' }}>
              Importando tu inventario…
            </span>
            <div className="prog">
              <i />
            </div>
            <span style={{ fontSize: '15px', color: 'var(--muted)' }}>
              Validando, creando propiedades y ubicándolas en el mapa. Puedes salir de esta
              pantalla: te avisamos al terminar.
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn" onClick={v.goNext} type="button">
                Ver resultado
              </button>
            </div>
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
              gap: '20px',
              padding: '44px',
              borderRadius: '26px',
              border: '1px solid var(--line)',
              background: 'var(--surf)',
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
                animation: 'burst-importscreen .6s cubic-bezier(.3,1.5,.5,1) both',
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
                    animation: 'check-importscreen .6s .35s ease-out both',
                  }}
                />
              </svg>
            </span>
            <span
              style={{ fontWeight: '800', fontSize: '32px', letterSpacing: '-0.03em' }}
            >{`¡${v.readyCount} propiedades importadas!`}</span>
            <span
              style={{
                fontSize: '16px',
                lineHeight: '1.55',
                color: 'var(--muted)',
                maxWidth: '560px',
              }}
            >
              Quedaron como borrador para que las revises. Asigna agentes y agrega fotos, luego
              publícalas todas juntas.
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/panel/propiedades" className="btn">
                Ver mi inventario
              </Link>
              <button className="btn2" onClick={v.restart} type="button">
                Importar otro archivo
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
