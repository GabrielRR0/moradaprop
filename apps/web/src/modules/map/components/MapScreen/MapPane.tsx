'use client';

import { toast } from '@/lib/toast';
import { useTheme } from '@/lib/theme';
import type { MapExplorer } from '../../hooks/useMapExplorer';
import { MapCanvas } from '../MapCanvas/MapCanvas';
import { PropertyPopup } from '../shared/PropertyPopup';
import '../shared/explorer.css';
import { Icon } from '@/components/icons';

const SHADOW = '0 8px 22px rgba(15,20,32,.2)';

/** Panel derecho: el mapa real de Venezuela con sus botones, la ficha flotante y la leyenda. */
export function MapPane({ ex }: { ex: MapExplorer }) {
  const { dark } = useTheme();
  const { handle, selected } = ex;

  return (
    <main
      style={{
        flex: '1 1 auto',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--map-bg)',
      }}
    >
      <MapCanvas
        ref={handle}
        style={{ position: 'absolute', inset: 0 }}
        markers={ex.markers}
        selectedId={ex.selectedId}
        onSelect={ex.selectFromMap}
        onViewport={ex.onViewport}
        initialView={ex.initialView}
        dark={dark}
        detail={ex.detailStyle}
        onStatus={(status) => ex.setOffline(status === 'offline')}
        popup={
          selected
            ? {
                lat: selected.latitude,
                lng: selected.longitude,
                content: <PropertyPopup property={selected} onClose={ex.clearSelection} />,
              }
            : null
        }
      />

      <button
        type="button"
        className="btn2"
        onClick={() => void ex.refresh()}
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          minHeight: 46,
          padding: '0 22px',
          borderRadius: 999,
          boxShadow: SHADOW,
          fontWeight: 700,
          color: 'var(--ac-ink)',
          zIndex: 5,
        }}
      >
        {ex.refreshing ? (
          <span className="ex-spin" aria-hidden="true" />
        ) : (
          <Icon name="refresh" size={18} strokeWidth={2.4} />
        )}
        {ex.refreshing ? ' Buscando…' : ' Buscar en esta zona'}
      </button>

      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 5,
        }}
      >
        <button
          className="mc"
          aria-label="Acercar"
          type="button"
          onClick={() => handle.current?.zoomIn()}
        >
          <Icon name="plus" size={20} strokeWidth={2.4} />
        </button>
        <button
          className="mc"
          aria-label="Alejar"
          type="button"
          onClick={() => handle.current?.zoomOut()}
        >
          <Icon name="minus" size={20} strokeWidth={2.4} />
        </button>
        <button
          className="mc"
          aria-label="Mi ubicación"
          style={{ marginTop: 6 }}
          type="button"
          onClick={() => handle.current?.locate()}
        >
          <Icon name="locate" size={20} />
        </button>
        <button
          className="mc"
          aria-label={ex.detailStyle ? 'Mapa limpio' : 'Mapa con más detalle'}
          aria-pressed={ex.detailStyle}
          type="button"
          onClick={ex.toggleDetailStyle}
          style={
            ex.detailStyle
              ? { background: 'var(--ac)', color: '#fff', borderColor: 'var(--ac)' }
              : undefined
          }
        >
          <Icon name="layers" size={20} />
        </button>
      </div>

      <button
        className="btn2"
        type="button"
        onClick={() => toast('Dibujar tu zona en el mapa llega pronto', 'info')}
        style={{ position: 'absolute', left: 18, bottom: 18, boxShadow: SHADOW, zIndex: 5 }}
      >
        <Icon name="pencil-draw" size={18} />
        {' Dibujar mi zona'}
      </button>

      {(ex.usingMocks || ex.offline) && (
        <span className="ex-pill" role="status">
          {ex.offline
            ? 'Sin conexión al mapa: solo se ven los pines'
            : 'Datos de ejemplo (sin conexión al servidor)'}
        </span>
      )}

      <div
        style={{
          position: 'absolute',
          right: 18,
          bottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '10px 16px',
          borderRadius: 14,
          background: 'var(--surf)',
          border: '1px solid var(--line)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
          boxShadow: '0 8px 22px rgba(15,20,32,.16)',
          zIndex: 5,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--ac)' }} />
          Seleccionada
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--surf)',
              border: '2px solid var(--muted)',
            }}
          />
          Disponible
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--surf2)',
              border: '2px dashed var(--muted)',
            }}
          />
          En reserva
        </span>
      </div>
    </main>
  );
}
