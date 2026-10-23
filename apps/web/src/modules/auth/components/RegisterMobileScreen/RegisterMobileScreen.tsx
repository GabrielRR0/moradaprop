'use client';
import Link from 'next/link';
import { brand } from '@/config';
import './registermobilescreen.css';
import { useRegisterMobileScreen } from '../../hooks/useRegisterMobileScreen';
import { RegisterMobileSteps } from './RegisterMobileSteps';
import { Icon } from '@/components/icons';

export function RegisterMobileScreen() {
  const v = useRegisterMobileScreen();
  return (
    <div
      className="ds-registermobilescreen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '18px 20px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '800',
              fontSize: '18px',
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'var(--ac)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
              }}
            >
              <Icon name="home" size={20} />
            </span>
            {`${brand.name}`}
          </span>
          <Link
            href="/registro"
            style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '44px',
              fontSize: '14px',
              fontWeight: '800',
              color: 'var(--ac-ink)',
            }}
          >
            Ingresar
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span className={v.progressBar1} />
          <span className={v.progressBar2} />
          <span className={v.progressBar3} />
        </div>
      </header>
      <RegisterMobileSteps v={v} />
      {v.showFooter && (
        <>
          <footer
            style={{
              flex: '0 0 auto',
              display: 'flex',
              gap: '10px',
              padding: '12px 20px 22px',
              borderTop: '1px solid var(--line)',
              background: 'var(--bg)',
            }}
          >
            {v.canGoBack && (
              <>
                <button
                  className="btn2"
                  onClick={v.goBack}
                  style={{ flex: '0 0 100px' }}
                  type="button"
                >
                  Atrás
                </button>
              </>
            )}
            <button
              className="btn"
              onClick={v.goNext}
              style={{ flex: '1' }}
              type="button"
            >{`${v.nextLabel}`}</button>
          </footer>
        </>
      )}
    </div>
  );
}
