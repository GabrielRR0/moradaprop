'use client';
import type { CSSProperties } from 'react';
import { Icon } from '@/components/icons';

export function DesignKitPins() {
  return (
    <section
      style={{
        flex: '1 1 auto',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <span style={{ fontWeight: '800', fontSize: '18px' }}>
        2 · Pines del mapa: un estado, un significado
      </span>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div
          style={{
            flex: '1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '30px 26px',
            padding: '32px 28px 36px',
            borderRadius: '22px',
            background: '#EEF1F6',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin">$450</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Disponible
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin sel">$1.200</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Seleccionada
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin seen">$280</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Ya vista
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin res">$390</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              En reserva
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin fav">
              <Icon name="heart" size={14} fill="#5B4BE8" />
              $320
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Favorita
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="cluster">14</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Grupo (zoom)
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="dot" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Tú estás aquí
            </span>
          </div>
        </div>
        <div
          style={
            {
              '--bg': '#0E1117',
              '--surf': '#161B24',
              '--surf2': '#1D2430',
              '--text': '#F3F5F9',
              '--muted': '#A3ADBF',
              '--line': '#2A3342',
              '--ac': '#8B7BFF',
              '--ac-ink': '#B9AFFF',
              flex: '0 0 330px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: '30px 24px',
              padding: '32px 28px 36px',
              borderRadius: '22px',
              background: '#1A212C',
              color: 'var(--text)',
            } as CSSProperties
          }
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin">$450</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Noche
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="pin sel" style={{ color: '#0E1117' }}>
              $1.200
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Seleccionada
            </span>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}
          >
            <span className="cluster" style={{ color: '#0E1117' }}>
              14
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Grupo
            </span>
          </div>
        </div>
      </div>
      <span style={{ fontWeight: '800', fontSize: '18px', marginTop: '6px' }}>
        3 · Insignias de estado (las del negocio)
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        <span className="badge" style={{ background: 'var(--ac-soft)', color: 'var(--ac-ink)' }}>
          Nuevo
        </span>
        <span className="badge" style={{ background: '#FFF1D6', color: '#7A4A00' }}>
          Destacado
        </span>
        <span className="badge" style={{ background: '#E3F4EA', color: '#14633A' }}>
          Disponible hoy
        </span>
        <span className="badge" style={{ background: '#FDE7E3', color: '#8F2A1B' }}>
          En proceso de reserva
        </span>
        <span className="badge" style={{ background: 'var(--surf2)', color: 'var(--muted)' }}>
          Alquilada
        </span>
        <span className="tag">Planta eléctrica</span>
        <span className="tag">Fibra óptica</span>
        <span className="tag">Tanque de agua</span>
      </div>
    </section>
  );
}
