'use client';
import type { CSSProperties } from 'react';
import './designkitscreen.css';
import { DesignKitMotion } from './DesignKitMotion';

export function DesignKitScreen() {
  return (
    <div
      className="ds-designkitscreen"
      style={
        {
          '--ac': '#5B4BE8',
          '--ac-ink': '#5B4BE8',
          '--ac-soft': 'color-mix(in srgb, #5B4BE8 12%, white)',
          '--bg': '#FFFFFF',
          '--surf': '#FFFFFF',
          '--surf2': '#F4F6FA',
          '--text': '#0F1420',
          '--muted': '#566073',
          '--line': '#E6E9F0',
          width: '100%',
          minHeight: '100dvh',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        } as CSSProperties
      }
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: '800', fontSize: '34px', letterSpacing: '-0.03em' }}>
          Kit: color, pines, cards y movimiento
        </span>
        <span style={{ fontSize: '15px', color: 'var(--muted)' }}>
          Un solo color de marca. Todo lo demás son neutros.
        </span>
      </div>
      <DesignKitMotion />
    </div>
  );
}
