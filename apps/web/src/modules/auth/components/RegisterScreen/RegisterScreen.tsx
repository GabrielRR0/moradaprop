'use client';
import Link from 'next/link';
import './registerscreen.css';
import { useRegisterScreen } from '../../hooks/useRegisterScreen';
import { RegisterBrandPanel } from './RegisterBrandPanel';
import { RegisterSteps } from './RegisterSteps';

export function RegisterScreen() {
  const v = useRegisterScreen();
  return (
    <div
      className="ds-registerscreen"
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
      }}
    >
      <RegisterBrandPanel v={v} />
      <main
        style={{
          flex: '1 1 auto',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 80px 40px 96px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: 'var(--muted)',
          }}
        >
          <span>¿Ya tienes cuenta?</span>
          <Link href="/registro" style={{ fontWeight: '800', color: 'var(--ac-ink)' }}>
            Ingresar
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '28px', maxWidth: '560px' }}>
          <span className={v.progressBar1} />
          <span className={v.progressBar2} />
          <span className={v.progressBar3} />
        </div>
        <span
          style={{ marginTop: '10px', fontSize: '13px', fontWeight: '700', color: 'var(--muted)' }}
        >{`${v.stepLabel}`}</span>
        <RegisterSteps v={v} />
        <span
          style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '560px', lineHeight: '1.5' }}
        >
          Al continuar aceptas los Términos y la Política de privacidad. Protegemos tu cuenta con
          verificación por correo y, si quieres, doble factor.
        </span>
      </main>
    </div>
  );
}
