'use client';
import { DesignKitPins } from './DesignKitPins';
import { Icon } from '@/components/icons';

export function DesignKitMotion() {
  return (
    <div style={{ display: 'flex', gap: '40px', flex: '1 1 auto', minHeight: '0' }}>
      <section style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <span style={{ fontWeight: '800', fontSize: '18px' }}>1 · Elige el color de marca</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#2563EB' }}
            />
            <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800' }}>Azul</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Confianza, formal, "banco"
              </span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              #2563EB
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              borderRadius: '18px',
              border: '2px solid var(--ac)',
              background: 'var(--ac-soft)',
            }}
          >
            <span
              style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#5B4BE8' }}
            />
            <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800' }}>Violeta</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Moderno, se distingue de la competencia
              </span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              #5B4BE8
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#0E8A5F' }}
            />
            <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800' }}>Verde</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Hogar, crecimiento, tranquilo
              </span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              #0E8A5F
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#C2410C' }}
            />
            <span style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800' }}>Terracota</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                Cálido, cercano, llamativo
              </span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              #C2410C
            </span>
          </div>
        </div>
        <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6', color: 'var(--muted)' }}>
          Cambia el acento con el botón Tweaks de cualquier pantalla. En modo noche el color se
          aclara solo para mantener la lectura.
        </p>
      </section>
      <DesignKitPins />
      <section style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <span style={{ fontWeight: '800', fontSize: '18px' }}>4 · Animaciones con propósito</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              className="move"
              style={{
                animation: 'hop-designkitscreen 1.8s ease-in-out infinite',
                width: '44px',
                height: '44px',
              }}
            />
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>Pines que caen</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
                Al cargar la zona, aparecen uno a uno con rebote.
              </span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              className="cluster"
              style={{ width: '44px', height: '44px', fontSize: '13px', flex: '0 0 auto' }}
            >
              9
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>Grupos que laten</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
                El halo invita a hacer zoom; al tocar se separan.
              </span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{
                flex: '0 0 44px',
                height: '44px',
                display: 'grid',
                placeItems: 'center',
                animation: 'beat-designkitscreen 1.6s ease-in-out infinite',
                color: 'var(--ac)',
              }}
            >
              <Icon name="heart" size={30} strokeWidth={2} fill="currentColor" />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>Corazón con micro-pulso</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
                Confirma el favorito sin mensajes ni ventanas.
              </span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px',
              borderRadius: '18px',
              border: '1px solid var(--line)',
            }}
          >
            <span
              style={{ flex: '0 0 44px', height: '44px', display: 'grid', placeItems: 'center' }}
            >
              <span
                className="move"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '9px',
                  animation: 'slide-designkitscreen 2.2s ease-in-out infinite',
                }}
              />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '800', fontSize: '15px' }}>Cards que suben al entrar</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
                Escalonadas 80 ms; al pasar el cursor se elevan.
              </span>
            </span>
          </div>
        </div>
        <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.6', color: 'var(--muted)' }}>
          Regla: se anima lo que ayuda a entender (dónde, qué cambió, qué se guardó). Todo se apaga
          con "reducir movimiento" del sistema.
        </p>
      </section>
    </div>
  );
}
