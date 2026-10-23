'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { Icon } from '@/components/icons';
import type { RegisterMobileScreenView } from '../../hooks/useRegisterMobileScreen';

export function RegisterMobileSteps({ v }: { v: RegisterMobileScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '8px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {v.showRoleStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '30px',
                  lineHeight: '1.1',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Crea tu cuenta
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
                ¿Qué quieres hacer?
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {v.roleCards.map((r, $index) => (
                <Fragment key={$index}>
                  <button className={r.className} onClick={r.choose} type="button">
                    <span className="ico">
                      <Icon d={r.icon} size={26} strokeWidth={2} />
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span
                        style={{ fontWeight: '800', fontSize: '16px' }}
                      >{`${r.shortTitle}`}</span>
                      <span
                        style={{ fontSize: '13px', color: 'var(--muted)' }}
                      >{`${r.shortDescription}`}</span>
                    </span>
                    <span className="radio">
                      <Icon name="check" size={14} strokeWidth={3.4} />
                    </span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}
      {v.showDataStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '30px',
                  lineHeight: '1.1',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >{`${v.dataStepTitle}`}</h1>
              <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'var(--muted)' }}>
                Menos de un minuto.
              </p>
            </div>
            <button className="btn2" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21.600 12.200c0-.7-.1-1.400-.2-2H12v3.800h5.400a4.600 4.600 0 01-2 3v2.500h3.200c1.900-1.700 3-4.300 3-7.300z"
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
              Continuar con Google
            </button>
            {v.isAgency && (
              <>
                <label className="fld">
                  <span className="l">Nombre de la inmobiliaria</span>
                  <span className="box">
                    <input type="text" placeholder="[Nombre comercial]" />
                  </span>
                </label>
                <label className="fld">
                  <span className="l">RIF</span>
                  <span className="box">
                    <input type="text" placeholder="J-00000000-0" />
                  </span>
                </label>
              </>
            )}
            <label className="fld">
              <span className="l">Nombre y apellido</span>
              <span className="box">
                <input type="text" placeholder="Tu nombre completo" />
              </span>
            </label>
            <label className="fld">
              <span className="l">Correo electrónico</span>
              <span className="box">
                <input type="text" placeholder="nombre@correo.com" />
              </span>
            </label>
            <label className="fld">
              <span className="l">WhatsApp</span>
              <span className="box">
                <span style={{ fontWeight: '700', color: 'var(--muted)' }}>+58</span>
                <input type="text" placeholder="412 000 0000" />
              </span>
            </label>
            <label className="fld">
              <span className="l">Contraseña</span>
              <span className="box">
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  onChange={v.onPasswordChange}
                />
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-4px' }}>
              <span className={v.strengthBar1} />
              <span className={v.strengthBar2} />
              <span className={v.strengthBar3} />
              <span className={v.strengthBar4} />
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--muted)',
                  minWidth: '56px',
                }}
              >{`${v.strengthLabel}`}</span>
            </div>
          </div>
        </>
      )}
      {v.showCodeStep && (
        <>
          <div className="step" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <h1
                style={{
                  margin: '0',
                  fontSize: '30px',
                  lineHeight: '1.1',
                  fontWeight: '800',
                  letterSpacing: '-0.03em',
                }}
              >
                Revisa tu correo
              </h1>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  color: 'var(--muted)',
                }}
              >
                {'Enviamos un código de 6 dígitos a '}
                <b style={{ color: 'var(--text)' }}>nombre@correo.com</b>.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
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
              <input className="code" type="text" maxLength={1} aria-label="Dígito 4" />
              <input className="code" type="text" maxLength={1} aria-label="Dígito 5" />
              <input className="code" type="text" maxLength={1} aria-label="Dígito 6" />
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
              paddingTop: '30px',
            }}
          >
            <span
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'var(--ac)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                animation: 'burst-registermobilescreen .6s cubic-bezier(.3,1.5,.5,1) both',
              }}
            >
              <svg
                width="48"
                height="48"
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
                    animation: 'check-registermobilescreen .6s .35s ease-out both',
                  }}
                />
              </svg>
            </span>
            <h1
              style={{
                margin: '0',
                fontSize: '32px',
                lineHeight: '1.1',
                fontWeight: '800',
                letterSpacing: '-0.03em',
              }}
            >
              ¡Cuenta verificada!
            </h1>
            <p
              style={{ margin: '0', fontSize: '16px', lineHeight: '1.55', color: 'var(--muted)' }}
            >{`${v.doneText}`}</p>
            <Link
              href={v.doneLink}
              className="btn"
              style={{ alignSelf: 'stretch' }}
            >{`${v.doneButton}`}</Link>
          </div>
        </>
      )}
    </div>
  );
}
