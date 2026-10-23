'use client';
import Link from 'next/link';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import './publishmobilescreen.css';
import { usePublishMobileScreen } from '../../hooks/usePublishMobileScreen';
import { PublishMobileSteps } from './PublishMobileSteps';
import { Icon } from '@/components/icons';

export function PublishMobileScreen() {
  const v = usePublishMobileScreen();
  return (
    <div
      className="ds-publishmobilescreen"
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
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Nueva propiedad</span>
          <span
            style={{
              minWidth: '46px',
              textAlign: 'right',
              fontSize: '13px',
              fontWeight: '800',
              color: 'var(--ac-ink)',
            }}
          >{`${v.quality}%`}</span>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {v.progressBars.map((b, $index) => (
            <Fragment key={$index}>
              <span
                style={css(
                  `flex:1; height:6px; border-radius:3px; background:${b.color}; transition:background .3s`,
                )}
              />
            </Fragment>
          ))}
        </div>
      </header>
      <PublishMobileSteps v={v} />
      <footer
        style={{
          flex: '0 0 auto',
          display: 'flex',
          gap: '10px',
          padding: '12px 16px 20px',
          borderTop: '1px solid var(--line)',
          background: 'var(--bg)',
        }}
      >
        <button className="btn2" onClick={v.goBack} style={{ flex: '0 0 100px' }} type="button">
          Atrás
        </button>
        <button
          className="btn"
          onClick={v.goNext}
          style={{ flex: '1' }}
          type="button"
        >{`${v.nextLabel}`}</button>
      </footer>
    </div>
  );
}
