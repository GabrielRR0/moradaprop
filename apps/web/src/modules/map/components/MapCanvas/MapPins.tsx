'use client';

import type { ClusterMarker, PointMarker } from '../../services';
import { formatPrice, pinPrice } from '../../utils/format';

/** Pin con precio del diseno (`.pin`). Reservada = borde punteado; seleccionada = color de marca. */
export function PinButton({
  marker,
  selected,
  onSelect,
}: {
  marker: PointMarker;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const reserved = marker.status === 'RESERVADA' && !selected;
  return (
    <button
      type="button"
      className={selected ? 'pin sel' : 'pin'}
      style={{
        left: 0,
        top: 0,
        ...(reserved
          ? { borderStyle: 'dashed', color: 'var(--muted)', background: 'var(--surf2)' }
          : null),
      }}
      aria-label={`${formatPrice(marker.priceAmount, marker.currency)}${reserved ? ', en reserva' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(selected ? null : marker.id)}
    >
      {pinPrice(marker.priceAmount, marker.currency)}
    </button>
  );
}

/** Grupo de propiedades (`.cluster`): al tocarlo el mapa se acerca a esa zona. */
export function ClusterButton({
  marker,
  onZoom,
}: {
  marker: ClusterMarker;
  onZoom: (marker: ClusterMarker) => void;
}) {
  return (
    <button
      type="button"
      className="cluster"
      style={{ left: 0, top: 0 }}
      aria-label={`${marker.count} propiedades desde ${formatPrice(marker.minPrice)}. Acercar`}
      onClick={() => onZoom(marker)}
    >
      <span>{marker.count}</span>
    </button>
  );
}
