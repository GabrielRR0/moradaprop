import { useState } from 'react';
import {
  formatPrice,
  propertyService,
  RENT_BIN_COUNT,
  RENT_BIN_MAX,
  rentColor,
  rentVerdict,
} from '@/lib/properties';
import { QuerySupport } from '@/support/query';

/** Ciudad principal de cada estado (la gente busca "Caracas", no "Miranda") y dónde centrar el mapa. */
const MAIN_CITY: Record<string, { name: string; lat: number; lng: number; zoom: number }> = {
  Miranda: { name: 'Caracas', lat: 10.49, lng: -66.87, zoom: 11 },
  'Distrito Capital': { name: 'Caracas', lat: 10.49, lng: -66.9, zoom: 11 },
  Carabobo: { name: 'Valencia', lat: 10.2, lng: -68.0, zoom: 11 },
  Mérida: { name: 'Mérida', lat: 8.59, lng: -71.15, zoom: 11 },
  Aragua: { name: 'Maracay', lat: 10.25, lng: -67.6, zoom: 11 },
  Zulia: { name: 'Maracaibo', lat: 10.65, lng: -71.63, zoom: 11 },
  Lara: { name: 'Barquisimeto', lat: 10.07, lng: -69.3, zoom: 11 },
  Anzoátegui: { name: 'Lechería y Pto. La Cruz', lat: 10.2, lng: -64.66, zoom: 11 },
  'Nueva Esparta': { name: 'Isla de Margarita', lat: 10.98, lng: -63.83, zoom: 10.5 },
  Bolívar: { name: 'Puerto Ordaz', lat: 8.29, lng: -62.72, zoom: 11 },
  Táchira: { name: 'San Cristóbal', lat: 7.77, lng: -72.22, zoom: 11 },
};

/** Con menos propiedades que esto el "típico" no dice nada: el estado no se muestra. */
const MIN_PROPERTIES = 3;
/** Eje común de todas las barras (dólares al mes). */
const AXIS = [0, 300, 600, 900, 1200];

type Order = 'cheap' | 'expensive';

/** Enlace al mapa con el filtro del estado y centrado en su ciudad principal. */
function mapLink(state: string): string {
  const params = new URLSearchParams({ state });
  const city = MAIN_CITY[state];
  if (city) {
    params.set('c', `${city.lat},${city.lng}`);
    params.set('z', String(city.zoom));
  }
  return `/mapa?${params.toString()}`;
}

const percent = (amount: number) => Math.min(100, (amount / RENT_BIN_MAX) * 100);

/** "¿Cuánto cuesta alquilar?": alquiler típico por ciudad con todas las propiedades de la base de datos. */
export function useRentMap() {
  const [order, setOrder] = useState<Order>('cheap');
  const [selected, setSelected] = useState<string | null>(null);
  const query = QuerySupport.useQuery({
    queryKey: ['rent-stats'],
    queryFn: ({ signal }) => propertyService.rentStats(signal),
    staleTime: 5 * 60_000,
  });

  const states = (query.data ?? []).filter((s) => s.count >= MIN_PROPERTIES);
  const sorted = [...states].sort((a, b) =>
    order === 'cheap' ? a.median - b.median : b.median - a.median,
  );
  // Sin elegir nada, se destaca el estado con más propiedades (normalmente Caracas).
  const biggest = [...states].sort((a, b) => b.count - a.count)[0];
  const current = states.find((s) => s.state === selected) ?? biggest;

  const nameOf = (state: string) => MAIN_CITY[state]?.name ?? state;
  const base = (s: (typeof states)[number]) => ({
    key: s.state,
    city: nameOf(s.state),
    state: s.state,
    color: rentColor(s.median),
    pressed: s.state === current?.state,
    pick: () => setSelected(s.state),
  });

  const rows = sorted.map((s, index) => ({
    ...base(s),
    rank: index + 1,
    price: formatPrice(s.median),
    from: `${percent(s.p25)}%`,
    width: `${Math.max(2, percent(s.p75) - percent(s.p25))}%`,
    marker: `${percent(s.median)}%`,
    delay: `${Math.min(index, 9) * 60}ms`,
  }));

  const chips = sorted.map((s) => base(s));

  // Histograma: cuántas propiedades hay en cada tramo de precio; las barras dentro del rango típico resaltan.
  const tallest = Math.max(1, ...(current?.bins ?? [0]));
  const spot = current && {
    city: nameOf(current.state),
    state: current.state,
    count: current.count,
    price: current.median,
    color: rentColor(current.median),
    verdict: rentVerdict(current.median),
    min: formatPrice(current.min),
    max: formatPrice(current.max),
    range: `${formatPrice(current.p25)}–${formatPrice(current.p75).replace(/^\$/, '')}`,
    href: mapLink(current.state),
    bins: current.bins.map((count, index) => {
      const middle = ((index + 0.5) / RENT_BIN_COUNT) * RENT_BIN_MAX;
      return {
        height: `${Math.max(4, Math.round((count / tallest) * 100))}%`,
        color: rentColor(middle),
        inRange: middle >= current.p25 - 50 && middle <= current.p75 + 50,
        delay: `${index * 35}ms`,
      };
    }),
  };

  return {
    rows,
    chips,
    spot,
    gradient: `linear-gradient(90deg, ${Array.from({ length: 11 }, (_, i) => `${rentColor((RENT_BIN_MAX * i) / 10)} ${i * 10}%`).join(', ')})`,
    axis: AXIS.map((value) => ({ label: formatPrice(value), left: `${percent(value)}%`, value })),
    loading: query.isLoading,
    failed: query.isError && !query.data,
    empty: !query.isLoading && !query.isError && states.length === 0,
    retry: () => void query.refetch(),
    order,
    chooseCheap: () => setOrder('cheap'),
    chooseExpensive: () => setOrder('expensive'),
  };
}

export type RentMapView = ReturnType<typeof useRentMap>;
