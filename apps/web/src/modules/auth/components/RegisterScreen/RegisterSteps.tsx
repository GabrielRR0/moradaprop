'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { Icon } from '@/components/icons';
import type { RegisterScreenView } from '../../hooks/useRegisterScreen';

export function RegisterSteps({ v }: { v: RegisterScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: '560px',
        minHeight: '0',
      }}
    >
      {v.showRoleStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2
                style={{
                  margin: '0',
                  fontSize: '36px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Crea tu cuenta
              </h2>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Cuéntanos qué quieres hacer. Siempre podrás cambiarlo después.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {v.roleCards.map((r, $index) => (
                <Fragment key={$index}>
                  <button className={r.className} onClick={r.choose} type="button">
                    <span className="ico">
                      <Icon d={r.icon} size={28} strokeWidth={2} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: '800', fontSize: '18px' }}>{`${r.title}`}</span>
                      <span
                        style={{ fontSize: '14px', color: 'var(--muted)' }}
                      >{`${r.description}`}</span>
                    </span>
                    <span className="radio">
                      <Icon name="check" size={14} strokeWidth={3.4} />
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
            <button className="btn" onClick={v.goNext} type="button">
              {'Continuar '}
              <Icon name="arrow-right" size={20} strokeWidth={2.6} />
            </button>
          </div>
        </>
      )}
      {v.showDataStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2
                style={{
                  margin: '0',
                  fontSize: '36px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >{`${v.dataStepTitle}`}</h2>
              <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
                Solo lo necesario. Menos de un minuto.
              </p>
            </div>
            <button className="btn2" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.300 3-7.300z"
                  fill="#4285F4"
                />
                <path
                  d="M12 22c2.700 0 5-.9 6.600-2.400l-3.200-2.500c-.9.600-2 1-3.400 1-2.600 0-4.800-1.800-5.600-4.100H3.100v2.600A10 10 0 0012 22z"
                  fill="#34A853"
                />
                <path
                  d="M6.400 14c-.2-.6-.3-1.300-.3-2s.1-1.400.3-2V7.400H3.100a10 10 0 000 9.200z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.900c1.500 0 2.800.5 3.800 1.500l2.800-2.800A10 10 0 003.100 7.400L6.400 10C7.200 7.700 9.400 5.900 12 5.900z"
                  fill="#EA4335"
                />
              </svg>
              {' Continuar con Google '}
            </button>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: 'var(--muted)',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              <span style={{ flex: '1', height: '1px', background: 'var(--line)' }} />
              o con tu correo
              <span style={{ flex: '1', height: '1px', background: 'var(--line)' }} />
            </div>
            {v.isAgency && (
              <>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label className="field" style={{ flex: '2' }}>
                    <span className="l">Nombre de la inmobiliaria</span>
                    <span className="box">
                      <input type="text" placeholder="[Nombre comercial]" />
                    </span>
                  </label>
                  <label className="field" style={{ flex: '1' }}>
                    <span className="l">RIF</span>
                    <span className="box">
                      <input type="text" placeholder="J-00000000-0" />
                    </span>
                  </label>
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="field" style={{ flex: '1' }}>
                <span className="l">Nombre</span>
                <span className="box">
                  <input type="text" placeholder="Tu nombre" />
                </span>
              </label>
              <label className="field" style={{ flex: '1' }}>
                <span className="l">Apellido</span>
                <span className="box">
                  <input type="text" placeholder="Tu apellido" />
                </span>
              </label>
            </div>
            <label className="field">
              <span className="l">Correo electrónico</span>
              <span className="box">
                <input type="text" placeholder="nombre@correo.com" />
              </span>
            </label>
            <label className="field">
              <span className="l">Teléfono / WhatsApp</span>
              <span className="box">
                <span style={{ fontWeight: '700', color: 'var(--muted)' }}>+58</span>
                <input type="text" placeholder="412 000 0000" />
              </span>
            </label>
            <label className="field">
              <span className="l">Contraseña</span>
              <span className="box">
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  onChange={v.onPasswordChange}
                />
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-8px' }}>
              <span className={v.strengthBar1} />
              <span className={v.strengthBar2} />
              <span className={v.strengthBar3} />
              <span className={v.strengthBar4} />
              <span
                style={{
                  marginLeft: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--muted)',
                  minWidth: '60px',
                }}
              >{`${v.strengthLabel}`}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                className="btn2"
                onClick={v.goBack}
                style={{ padding: '0 20px' }}
                type="button"
              >
                Atrás
              </button>
              <button className="btn" onClick={v.goNext} style={{ flex: '1' }} type="button">
                Crear cuenta
              </button>
            </div>
          </div>
        </>
      )}
      {v.showCodeStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2
                style={{
                  margin: '0',
                  fontSize: '36px',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Revisa tu correo
              </h2>
              <p
                style={{ margin: '0', fontSize: '16px', lineHeight: '1.5', color: 'var(--muted)' }}
              >
                {'Te enviamos un código de 6 dígitos a '}
                <b style={{ color: 'var(--text)' }}>nombre@correo.com</b>. Vence en 10 minutos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                className="code"
                type="text"
                maxLength={1}
                defaultValue="4"
                aria-label="Dígito 1"
              />
              <input
                className="code"
                type="text"
                maxLength={1}
                defaultValue="8"
                aria-label="Dígito 2"
              />
              <input
                className="code"
                type="text"
                maxLength={1}
                defaultValue="2"
                aria-label="Dígito 3"
              />
              <input
                className="code"
                type="text"
                maxLength={1}
                defaultValue=""
                aria-label="Dígito 4"
              />
              <input
                className="code"
                type="text"
                maxLength={1}
                defaultValue=""
                aria-label="Dígito 5"
              />
              <input
                className="code"
                type="text"
                maxLength={1}
                defaultValue=""
                aria-label="Dígito 6"
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                color: 'var(--muted)',
              }}
            >
              <span>¿No te llegó?</span>
              <span style={{ fontWeight: '800', color: 'var(--ac-ink)' }}>Reenviar en 0:42</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn2"
                onClick={v.goBack}
                style={{ padding: '0 20px' }}
                type="button"
              >
                Atrás
              </button>
              <button className="btn" onClick={v.goNext} style={{ flex: '1' }} type="button">
                Verificar
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
              gap: '24px',
            }}
          >
            <span
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'var(--ac)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                animation: 'burst-registerscreen .6s cubic-bezier(.3,1.5,.5,1) both',
              }}
            >
              <svg
                width="52"
                height="52"
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
                    animation: 'check-registerscreen .6s .35s ease-out both',
                  }}
                />
              </svg>
            </span>
            <h2
              style={{ margin: '0', fontSize: '38px', fontWeight: '800', letterSpacing: '-0.03em' }}
            >
              ¡Cuenta verificada!
            </h2>
            <p
              style={{ margin: '0', fontSize: '17px', lineHeight: '1.55', color: 'var(--muted)' }}
            >{`${v.doneText}`}</p>
            <Link href={v.doneLink} className="btn">{`${v.doneButton}`}</Link>
            <button
              className="btn2"
              onClick={v.restart}
              style={{ minHeight: '44px' }}
              type="button"
            >
              Volver a ver el registro
            </button>
          </div>
        </>
      )}
    </div>
  );
}
