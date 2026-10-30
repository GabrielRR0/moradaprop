'use client';

import type { MapExplorer } from '../../hooks/useMapExplorer';
import {
  AMENITY_FILTERS,
  BEDROOM_OPTIONS,
  optionToNumber,
  PRICE_OPTIONS,
} from '../../utils/amenities';
import { ChipMenu } from '../shared/ChipMenu';
import { Icon } from '@/components/icons';

/** Barra de filtros bajo el encabezado: precio, habitaciones, servicios y "Más filtros". */
export function MapFilterBar({ ex, onOpenFilters }: { ex: MapExplorer; onOpenFilters: () => void }) {
  const { filters } = ex;
  const priceLabel = filters.maxPrice ? `Hasta $${filters.maxPrice}` : 'Precio';
  const bedLabel = filters.bedrooms ? `Habitaciones · ${filters.bedrooms}+` : 'Habitaciones';

  return (
    <div
      style={{
        flex: '0 0 68px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 24px',
        borderBottom: '1px solid var(--line)',
        position: 'relative',
        zIndex: 30,
      }}
    >
      <ChipMenu
        label={priceLabel}
        options={PRICE_OPTIONS}
        selectedId={String(filters.maxPrice ?? 'any')}
        active={!!filters.maxPrice}
        onChoose={(id) => ex.patchFilters({ maxPrice: optionToNumber(id) })}
      />
      <ChipMenu
        label={bedLabel}
        options={BEDROOM_OPTIONS}
        selectedId={String(filters.bedrooms ?? 'any')}
        active={!!filters.bedrooms}
        onChoose={(id) => ex.patchFilters({ bedrooms: optionToNumber(id) })}
      />
      <span style={{ width: 1, height: 28, background: 'var(--line)', margin: '0 4px' }} />
      {AMENITY_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={filters[key] ? 'chip on' : 'chip'}
          aria-pressed={!!filters[key]}
          onClick={() => ex.patchFilters({ [key]: !filters[key] })}
        >
          {label}
        </button>
      ))}
      <button type="button" onClick={onOpenFilters} className="btn2" style={{ marginLeft: 'auto' }}>
        <Icon name="sliders" size={18} />
        {' Más filtros '}
        {ex.activeFilters > 0 && (
          <span
            style={{
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              background: 'var(--ac)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {ex.activeFilters}
          </span>
        )}
      </button>
    </div>
  );
}
