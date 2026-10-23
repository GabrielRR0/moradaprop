'use client';
import Link from 'next/link';
import './importmobilescreen.css';
import { useImportMobileScreen } from '../../hooks/useImportMobileScreen';
import { ImportMobileSteps } from './ImportMobileSteps';
import { Icon } from '@/components/icons';

export function ImportMobileScreen() {
  const v = useImportMobileScreen();
  return (
    <div
      className="ds-importmobilescreen"
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
          gap: '12px',
          padding: '14px 16px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link
            href="/panel/propiedades"
            aria-label="Cerrar"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'var(--surf2)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="close" size={20} strokeWidth={2.4} />
          </Link>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Importar desde Excel</span>
          <span style={{ width: '46px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span className={v.progress1} />
          <span className={v.progress2} />
          <span className={v.progress3} />
        </div>
      </header>
      <ImportMobileSteps v={v} />
      <footer
        style={{
          flex: '0 0 auto',
          display: 'flex',
          gap: '10px',
          padding: '12px 16px 22px',
          borderTop: '1px solid var(--line)',
          background: 'var(--bg)',
        }}
      >
        {v.showReviewStep && (
          <>
            <button className="btn2" onClick={v.goBack} style={{ flex: '0 0 100px' }} type="button">
              Atrás
            </button>
          </>
        )}
        {v.showNextButton && (
          <>
            <button
              className="btn"
              onClick={v.goNext}
              style={{ flex: '1' }}
              type="button"
            >{`${v.nextLabel}`}</button>
          </>
        )}
        {v.showDoneStep && (
          <>
            <Link href="/panel/propiedades" className="btn" style={{ flex: '1' }}>
              Ver mis propiedades
            </Link>
          </>
        )}
      </footer>
    </div>
  );
}
