'use client';
import { Fragment } from 'react';
import { Icon } from '@/components/icons';
import type { PropertyMobileScreenView } from '../../hooks/usePropertyMobileScreen';

export function PropertyMobileDetails({ v }: { v: PropertyMobileScreenView }) {
  return (
    <div
      style={{
        marginTop: '-24px',
        position: 'relative',
        padding: '22px 16px 28px',
        borderRadius: '26px 26px 0 0',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '800', fontSize: '32px', letterSpacing: '-0.03em' }}>
            $450
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--muted)' }}>
              {' /mes'}
            </span>
          </span>
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ac-ink)' }}>
            Ver en Bs.
          </span>
        </div>
        <span style={{ fontWeight: '800', fontSize: '20px', lineHeight: '1.2' }}>
          Apartamento moderno con vista
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: 'var(--muted)',
          }}
        >
          <Icon name="pin" size={16} />
          Los Palos Grandes, Caracas
        </span>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}
      >
        <div
          style={{
            padding: '12px 4px',
            borderRadius: '16px',
            background: 'var(--surf2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: '800', fontSize: '20px' }}>2</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)' }}>Hab.</div>
        </div>
        <div
          style={{
            padding: '12px 4px',
            borderRadius: '16px',
            background: 'var(--surf2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: '800', fontSize: '20px' }}>2</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)' }}>Baños</div>
        </div>
        <div
          style={{
            padding: '12px 4px',
            borderRadius: '16px',
            background: 'var(--surf2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: '800', fontSize: '20px' }}>1</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)' }}>Puesto</div>
        </div>
        <div
          style={{
            padding: '12px 4px',
            borderRadius: '16px',
            background: 'var(--surf2)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: '800', fontSize: '20px' }}>85</div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)' }}>m²</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontWeight: '800', fontSize: '18px' }}>Servicios</span>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}
        >
          <div className="am">
            <span className="i">
              <Icon name="bolt" size={20} strokeWidth={2} />
            </span>
            Planta eléctrica
          </div>
          <div className="am">
            <span className="i">
              <Icon name="droplet" size={20} strokeWidth={2} />
            </span>
            Tanque de agua
          </div>
          <div className="am">
            <span className="i">
              <Icon name="wifi" size={20} strokeWidth={2} />
            </span>
            Fibra óptica
          </div>
          <div className="am">
            <span className="i">
              <Icon name="shield" size={20} strokeWidth={2} />
            </span>
            Vigilancia 24 h
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontWeight: '800', fontSize: '18px' }}>Agenda una visita</span>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            margin: '0 -16px',
            padding: '0 16px 2px',
          }}
        >
          {v.visitDays.map((d, $index) => (
            <Fragment key={$index}>
              <button className={d.className} onClick={d.choose} type="button">
                <span style={{ fontSize: '11px', opacity: '.85' }}>{`${d.name}`}</span>
                <span style={{ fontSize: '18px', fontWeight: '800' }}>{`${d.number}`}</span>
              </button>
            </Fragment>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontWeight: '800', fontSize: '18px' }}>Descripción</span>
        <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.65', color: 'var(--muted)' }}>
          [Descripción escrita por el dueño o la inmobiliaria.]
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px',
          borderRadius: '20px',
          border: '1px solid var(--line)',
        }}
      >
        <span
          style={{
            flex: '0 0 48px',
            height: '48px',
            borderRadius: '50%',
            background: '#0E8A5F',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: '800',
          }}
        >
          AN
        </span>
        <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>
            Andrea · Inmobiliaria [Nombre]
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Responde en menos de 1 hora
          </span>
        </span>
      </div>
    </div>
  );
}
