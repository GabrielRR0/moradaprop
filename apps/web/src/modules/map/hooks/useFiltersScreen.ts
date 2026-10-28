'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { classIf } from '@/lib/classes';
import {
  cleanFilters,
  filtersFromParams,
  filtersToParams,
  propertyService,
  type PropertyFilters,
} from '../services';
import { QuerySupport } from '@/support/query';

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

/** Solo los números de lo que se escribe ("$ 500" -> 500; vacío -> sin límite). */
function numberFrom(text: string): number | undefined {
  const digits = text.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : undefined;
}

/**
 * Panel de filtros. Parte de los filtros que trae la URL del mapa,
 * y "Ver N propiedades" vuelve al mapa con los filtros elegidos.
 */
export function useFiltersScreen() {
  const searchParams = useSearchParams();
  const urlParams = new URLSearchParams(searchParams.toString());

  const [filters, setFilters] = useState<PropertyFilters>(filtersFromParams(urlParams));
  const [showAdvanced, setShowAdvanced] = useState(true);

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

  // Al ir y volver del mapa se conserva dónde estaba (parámetros c y z de la URL)
  function mapLink(chosenFilters: PropertyFilters): string {
    const params = filtersToParams(chosenFilters);
    for (const name of ['c', 'z']) {
      const value = urlParams.get(name);
      if (value) params.set(name, value);
    }
    return `/mapa?${params.toString()}`;
  }

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
    usdButtonClass: classIf('seg', isDollars),
    vesButtonClass: classIf('seg', !isDollars),
    chooseUsd: () => change({ currency: undefined }),
    chooseVes: () => change({ currency: 'VES' }),

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
    applyLink: mapLink(filters),
    backLink: mapLink(filtersFromParams(urlParams)),
    clearAll: () => setFilters({}),
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type FiltersScreenView = ReturnType<typeof useFiltersScreen>;
