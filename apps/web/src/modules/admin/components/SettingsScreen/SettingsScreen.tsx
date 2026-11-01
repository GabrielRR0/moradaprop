'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Button, Field, Notice } from '@/components/ui';
import { ConfirmIdentitySheet } from '@/modules/auth';
import { MotionSupport } from '@/support/motion';
import { useSettings } from '../../hooks/useSettings';
import './settingsscreen.css';

/** Ajustes de la plataforma: el admin configura aqui el correo (Resend) sin tocar variables de entorno. */
export function SettingsScreen() {
  const v = useSettings();

  return (
    <div className="ui-font as-page">
      <header className="as-bar">
        <Link href="/admin" className="as-back" aria-label="Volver a administración">
          <Icon name="chevron-left" size={20} strokeWidth={2.6} />
        </Link>
        <div>
          <h1>Ajustes de la plataforma</h1>
          <small>Solo administradores</small>
        </div>
      </header>

      <main className="as-main">
        {v.loadError === 'two-factor' && (
          <Notice tone="warn">
            Para usar el panel de administración activa primero la verificación en dos pasos (app autenticadora o huella).{' '}
            <Link href="/seguridad/activar" className="ui-link">
              Activarla ahora
            </Link>
          </Notice>
        )}
        {v.loadError === 'prefix' && (
          <Notice tone="error">
            La API no encontró los ajustes. Revisa que <b>NEXT_PUBLIC_ADMIN_API_PREFIX</b> (en la web) sea igual a <b>ADMIN_API_PREFIX</b> (en la API).
          </Notice>
        )}
        {v.loadError === 'other' && (
          <Notice tone="error">
            No pudimos cargar los ajustes.{' '}
            <button type="button" className="ui-link" onClick={v.retry}>
              Reintentar
            </button>
          </Notice>
        )}

        <MotionSupport.motion.section className="as-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="as-card-head">
            <span className="as-ico">
              <Icon name="mail" size={22} />
            </span>
            <div>
              <h2>Correo</h2>
              <p>Los códigos de verificación y los avisos salen por aquí.</p>
            </div>
          </div>

          <p className={v.viaResend ? 'as-chip on' : 'as-chip'} aria-live="polite">
            <span className="as-dot" aria-hidden="true" />
            {v.loading ? 'Cargando…' : v.viaResend ? 'Enviando con Resend (clave guardada aquí)' : 'Enviando con las variables del servidor (MAIL_*)'}
          </p>
          <p className="as-help">
            Si guardas una clave de Resend, la plataforma la usa <b>en lugar de</b> las variables del servidor. Si la quitas, vuelve a usarlas.
          </p>

          <Field
            label="API key de Resend"
            type="password"
            value={v.apiKey}
            onChange={v.setApiKey}
            placeholder="re_..."
            autoComplete="off"
            hint={v.keyPreview ? `Guardada: ${v.keyPreview}. Escribe una nueva para reemplazarla.` : 'Aún no hay una guardada.'}
            disabled={v.loading}
          />
          <Field
            label="Correo remitente"
            type="email"
            value={v.fromAddress}
            onChange={v.setFromAddress}
            placeholder="no-reply@tudominio.com"
            autoComplete="off"
            hint="Debe ser de un dominio verificado en Resend."
            disabled={v.loading}
          />
          <Field label="Nombre del remitente" value={v.fromName} onChange={v.setFromName} placeholder="Portal de Alquileres" autoComplete="off" maxLength={60} disabled={v.loading} />

          <p className="as-lock">
            <Icon name="lock" size={14} />
            Todo se guarda cifrado en la base de datos. La clave nunca vuelve a mostrarse completa.
          </p>

          <div className="as-actions">
            <Button loading={v.saving} disabled={!v.dirty || v.loading} onClick={v.save}>
              <Icon name="check" size={18} />
              Guardar
            </Button>
            <Button variant="secondary" loading={v.testing} disabled={v.loading} onClick={v.sendTest}>
              <Icon name="send" size={18} />
              Enviar correo de prueba
            </Button>
            {v.viaResend && (
              <Button variant="secondary" loading={v.removing} onClick={v.removeKey}>
                Quitar la clave guardada
              </Button>
            )}
          </div>

          <Notice tone={v.testResult?.ok ? 'ok' : 'error'} show={v.testResult !== null}>
            {v.testResult?.ok ? `Enviamos una prueba a ${v.testResult.to}. Revisa tu bandeja (y el spam).` : `No se pudo enviar la prueba: ${v.testResult?.error ?? 'error desconocido'}`}
          </Notice>
        </MotionSupport.motion.section>
      </main>

      <ConfirmIdentitySheet identity={v.identity} />
    </div>
  );
}
