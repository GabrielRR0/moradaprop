import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { classIf } from '@/lib/classes';
import {
  amenityTags,
  badgeOf,
  filtersToParams,
  formatPrice,
  photoTint,
  placeOf,
  propertyService,
  typeLabel,
  useFavorites,
  type PropertyFilters,
} from '@/lib/properties';
import { useSession } from '@/modules/auth';
import { QuerySupport } from '@/support/query';
import { QUICK_FILTERS } from './home-data';

/** Cuantas propiedades se muestran en el inicio. */
const HOME_LIMIT = 6;

/** Cada filtro rapido enciende un servicio del API. */
const FILTER_FLAG: Record<string, keyof PropertyFilters> = {
  'Planta eléctrica': 'hasGenerator',
  'Agua constante': 'hasWaterTank',
  'Fibra óptica': 'hasFiberOptic',
  Vigilancia: 'hasSecurity',
};

const digits = (text: string) => {
  const found = text.replace(/\D/g, '');
  return found ? Number(found) : undefined;
};

/** Inicio: propiedades reales del API (las mas recientes), filtros rapidos, buscador y favoritos. */
export function useHomeScreen() {
  const router = useRouter();
  const { status } = useSession();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [where, setWhere] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  const filters: PropertyFilters = { sort: 'recent' };
  for (const name of activeFilters) Object.assign(filters, { [FILTER_FLAG[name]]: true });

  const query = QuerySupport.useQuery({
    queryKey: ['home', 'listings', activeFilters],
    queryFn: ({ signal }) => propertyService.search(filters, undefined, 1, HOME_LIMIT, signal),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  // Favoritos reales: solo con sesion. Sin sesion el corazon lleva a ingresar.
  const favorites = useFavorites(status === 'authed');

  function toggleFilter(name: string) {
    setActiveFilters((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  }

  /** "Buscar" abre el mapa con lo escrito y los filtros rapidos encendidos. */
  function submitSearch(event?: FormEvent) {
    event?.preventDefault();
    const params = filtersToParams({
      ...filters,
      sort: undefined,
      q: where.trim() || undefined,
      maxPrice: digits(maxPrice),
      bedrooms: digits(bedrooms),
    });
    const text = params.toString();
    router.push(text ? `/mapa?${text}` : '/mapa');
  }

  const listings = (query.data?.items ?? []).map((p, index) => {
    const isFavorite = favorites.isFavorite(p.id);
    return {
      id: p.id,
      href: `/propiedad/${p.id}`,
      title: p.title,
      place: placeOf(p),
      kind: typeLabel(p.type),
      price: formatPrice(p.priceAmount, p.currency),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.areaM2,
      badge: badgeOf(p),
      amenities: amenityTags(p),
      cover: p.cover?.medium ?? null,
      delay: `${index * 80}ms`,
      tint: photoTint(index),
      heartFill: isFavorite ? 'currentColor' : 'none',
      heartColor: isFavorite ? 'var(--ac-ink)' : 'var(--text)',
      toggleFavorite: () => favorites.toggle(p.id),
    };
  });

  const filterChips = QUICK_FILTERS.map((name) => ({
    label: name,
    className: classIf('chip', activeFilters.includes(name)),
    toggle: () => toggleFilter(name),
  }));

  return {
    listings,
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    failed: query.isError && !query.data,
    retry: () => void query.refetch(),
    filterChips,
    search: { where, setWhere, maxPrice, setMaxPrice, bedrooms, setBedrooms, submit: submitSearch },
  };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type HomeScreenView = ReturnType<typeof useHomeScreen>;
