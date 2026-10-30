'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { classIf } from '@/lib/classes';
import {
  cleanFilters,
  propertyService,
  type PropertyFilters,
} from '@/lib/properties';
import { QuerySupport } from '@/support/query';
import { REGIONS, STATE_NAMES } from '../utils/regions';

/** Tipos de inmueble del panel: lo que se lee y el valor que entiende el API. */
const TYPE_OPTIONS = [
  { label: 'Apartamento', apiValue: 'APARTAMENTO' },
  { label: 'Casa', apiValue: 'CASA' },
  { label: 'Townhouse', apiValue: 'TOWNHOUSE' },
  { label: 'Habitación', apiValue: 'HABITACION' },
  { label: 'Local', apiValue: 'LOCAL' },
  { label: 'Oficina', apiValue: 'OFICINA' },
];

/** Servicios del panel: cada uno prende un filtro del API. */
const AMENITY_OPTIONS = [
  {
    filter: 'hasGenerator',
    label: 'Planta eléctrica',
    icon: 'M13 2L4 14h7l-1 8 9-12h-7z',
  },
  {
    filter: 'hasWaterTank',
    label: 'Agua constante',
    icon: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  },
  {
    filter: 'hasFiberOptic',
    label: 'Fibra óptica',
    icon: 'M2 9a15 15 0 0120 0M5 12.5a10.5 10.5 0 0114 0M8.5 16a5.5 5.5 0 017 0M12 19.5h.01',
  },
  {
    filter: 'hasSecurity',
    label: 'Vigilancia 24h',
    icon: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z',
  },
];

/** Rango del control de precio según la moneda: en el tope derecho no hay máximo. */
const PRICE_RANGE = {
  USD: { max: 2000, step: 10 },
  VES: { max: 100_000, step: 1000 },
} as const;
const BUCKETS = 10;

/** Solo los números de lo que se escribe ("$ 500" -> 500; vacío -> sin límite). */
function numberFrom(text: string): number | undefined {
  const digits = text.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : undefined;
}

/**
 * Panel de filtros. Parte de los filtros que tiene el mapa; "Ver N propiedades" los aplica
 * (`onApply`) y cerrar los descarta (`onClose`). Todo pasa sobre el mapa, sin cambiar de página.
 */
export function useFiltersScreen({
  initial,
  onApply,
  onClose,
}: {
  initial: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}) {
  const [filters, setFilters] = useState<PropertyFilters>(initial);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function change(patch: PropertyFilters) {
    setFilters(cleanFilters({ ...filters, ...patch }));
  }

  // Cuántas propiedades cumplen con los filtros de ahora
  const countQuery = QuerySupport.useQuery({
    queryKey: ['filters-count', filters],
    queryFn: ({ signal }) => propertyService.search(filters, undefined, 1, 1, signal),
    placeholderData: QuerySupport.keepPreviousData,
  });
  const count = countQuery.data?.total;

  // Botones 0, 1, 2, 3… donde 0 es "todas" (sin filtro)
  function numberPills(
    labels: string[],
    current: number | undefined,
    save: (value: number | undefined) => void,
  ) {
    return labels.map((label, number) => ({
      label,
      className: classIf('pill', (current ?? 0) === number),
      choose: () => save(number || undefined),
    }));
  }

  const isDollars = (filters.currency ?? 'USD') === 'USD';
  const { max: rangeMax, step } = PRICE_RANGE[isDollars ? 'USD' : 'VES'];
  const minValue = Math.min(filters.minPrice ?? 0, rangeMax - step);
  const maxValue = Math.min(filters.maxPrice ?? rangeMax, rangeMax);

  // Barras de precios: cuántas propiedades hay en cada tramo (muestra de las 150 más recientes).
  const currency = isDollars ? 'USD' : 'VES';
  const withoutPrice: PropertyFilters = { ...filters };
  delete withoutPrice.minPrice;
  delete withoutPrice.maxPrice;
  delete withoutPrice.sort;
  const sampleQuery = QuerySupport.useQuery({
    queryKey: ['filters-histogram', withoutPrice],
    queryFn: async ({ signal }) => {
      const pages = await Promise.all(
        [1, 2, 3].map((page) => propertyService.search(withoutPrice, undefined, page, 50, signal)),
      );
      return pages.flatMap((page) => page.items);
    },
    placeholderData: QuerySupport.keepPreviousData,
    staleTime: 60_000,
  });
  const counts = Array<number>(BUCKETS).fill(0);
  for (const item of sampleQuery.data ?? []) {
    if (item.currency !== currency) continue;
    counts[Math.min(BUCKETS - 1, Math.floor((item.priceAmount / rangeMax) * BUCKETS))]++;
  }
  const tallest = Math.max(1, ...counts);
  const bars = counts.map((count, index) => {
    const from = (index / BUCKETS) * rangeMax;
    const to = ((index + 1) / BUCKETS) * rangeMax;
    return {
      height: `${Math.max(8, Math.round((count / tallest) * 100))}%`,
      inRange: to > minValue && (index === BUCKETS - 1 ? maxValue >= from : from < maxValue),
    };
  });

  const symbol = isDollars ? '$ ' : 'Bs. ';
  const priceText = (value: number | undefined) => (value === undefined ? '' : `${symbol}${value}`);

  return {
    bedroomPills: numberPills(['Todas', '1', '2', '3', '4+'], filters.bedrooms, (bedrooms) =>
      change({ bedrooms }),
    ),
    bathroomPills: numberPills(['Todos', '1', '2', '3+'], filters.bathrooms, (bathrooms) =>
      change({ bathrooms }),
    ),
    parkingPills: numberPills(['Todos', '1', '2', '3+'], filters.parkingSpots, (parkingSpots) =>
      change({ parkingSpots }),
    ),

    amenityCards: AMENITY_OPTIONS.map((amenity) => {
      const isOn = filters[amenity.filter as 'hasGenerator'] === true;
      return {
        label: amenity.label,
        icon: amenity.icon,
        className: classIf('amen', isOn),
        toggle: () => change({ [amenity.filter]: !isOn }),
      };
    }),

    typeCards: TYPE_OPTIONS.map((type) => {
      const isOn = filters.type === type.apiValue;
      return {
        label: type.label,
        className: classIf('pill', isOn),
        choose: () => change({ type: isOn ? undefined : type.apiValue }),
      };
    }),

    // Precio mínimo y máximo (se escribe con o sin símbolo)
    minText: priceText(filters.minPrice),
    maxText: priceText(filters.maxPrice),
    onMinChange: (event: ChangeEvent<HTMLInputElement>) =>
      change({ minPrice: numberFrom(event.target.value) }),
    onMaxChange: (event: ChangeEvent<HTMLInputElement>) =>
      change({ maxPrice: numberFrom(event.target.value) }),
    // Control de arrastre con dos puntas (mínimo y máximo); en el tope derecho no hay máximo
    slider: {
      max: rangeMax,
      step,
      minValue,
      maxValue,
      leftPercent: (minValue / rangeMax) * 100,
      rightPercent: 100 - (maxValue / rangeMax) * 100,
      onMin: (event: ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(event.target.value), maxValue - step);
        change({ minPrice: value <= 0 ? undefined : value });
      },
      onMax: (event: ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(event.target.value), minValue + step);
        change({ maxPrice: value >= rangeMax ? undefined : value });
      },
      bars,
    },
    usdButtonClass: classIf('seg', isDollars),
    vesButtonClass: classIf('seg', !isDollars),
    // Al cambiar de moneda se limpia el rango: los montos de una no sirven en la otra.
    chooseUsd: () => change({ currency: undefined, minPrice: undefined, maxPrice: undefined }),
    chooseVes: () => change({ currency: 'VES', minPrice: undefined, maxPrice: undefined }),

    // Ubicación: estado y, dentro de él, municipio
    states: STATE_NAMES,
    municipalities: filters.state ? (REGIONS[filters.state] ?? []) : [],
    state: filters.state ?? '',
    municipality: filters.municipality ?? '',
    chooseState: (event: ChangeEvent<HTMLSelectElement>) =>
      change({ state: event.target.value || undefined, municipality: undefined }),
    chooseMunicipality: (event: ChangeEvent<HTMLSelectElement>) =>
      change({ municipality: event.target.value || undefined }),

    // Básico / Avanzado
    isAdvanced: showAdvanced,
    basicButtonClass: classIf('seg', !showAdvanced),
    advancedButtonClass: classIf('seg', showAdvanced),
    chooseBasic: () => setShowAdvanced(false),
    chooseAdvanced: () => setShowAdvanced(true),

    // Botones de abajo y de cerrar
    countLabel:
      count === undefined
        ? 'Ver propiedades'
        : `Ver ${count} ${count === 1 ? 'propiedad' : 'propiedades'}`,
    apply: () => onApply(filters),
    close: onClose,
    clearAll: () => setFilters({}),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type FiltersScreenView = ReturnType<typeof useFiltersScreen>;
