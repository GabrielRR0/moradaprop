'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapHandle, ViewportInfo } from '../components/MapCanvas/MapCanvas';
import {
  cleanFilters,
  countActiveFilters,
  filtersFromParams,
  filtersToParams,
  propertyService,
  useIsUsingMocks,
  type Bounds,
  type MapView,
  type PropertyCard,
  type PropertyFilters,
} from '@/lib/properties';
import { DEFAULT_VIEW, suggestPlaces, type Place } from '../utils/places';
import { QuerySupport } from '@/support/query';

const PAGE_SIZE = 20;

/** Redondea la caja hacia afuera para que moverse un poco no cambie la consulta (mejor cache). */
function quantize(bounds: Bounds, pad = 0): Bounds {
  const step = 0.01;
  const dLat = (bounds.neLat - bounds.swLat) * pad;
  const dLng = (bounds.neLng - bounds.swLng) * pad;
  return {
    swLat: Math.floor((bounds.swLat - dLat) / step) * step,
    swLng: Math.floor((bounds.swLng - dLng) / step) * step,
    neLat: Math.ceil((bounds.neLat + dLat) / step) * step,
    neLng: Math.ceil((bounds.neLng + dLng) / step) * step,
  };
}

function viewFromParams(params: URLSearchParams): MapView | null {
  const [lat, lng] = (params.get('c') ?? '').split(',').map(Number);
  const zoom = Number(params.get('z'));
  return Number.isFinite(lat) && Number.isFinite(lng) && zoom > 0 ? { lat, lng, zoom } : null;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

interface Options {
  /** Cuanto se desplaza la propiedad elegida respecto al centro (deja sitio a la ficha flotante). */
  selectionOffset: [number, number];
}

/**
 * Todo lo que necesita la pantalla del mapa: filtros, pines, lista, seleccion y buscador de zonas.
 * Lo usan la version de escritorio y la movil.
 */
export function useMapExplorer({ selectionOffset }: Options) {
  const searchParams = useSearchParams();
  const queryClient = QuerySupport.useQueryClient();
  const handle = useRef<MapHandle>(null);
  const [initial] = useState(() => ({
    filters: filtersFromParams(new URLSearchParams(searchParams.toString())),
    view: viewFromParams(new URLSearchParams(searchParams.toString())) ?? DEFAULT_VIEW,
  }));

  const [filters, setFilters] = useState<PropertyFilters>(initial.filters);
  const [viewport, setViewport] = useState<ViewportInfo | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailStyle, setDetailStyle] = useState(false);
  const [offline, setOffline] = useState(false);
  const usingMocks = useIsUsingMocks();
  const view = useDebounced(viewport, 280);

  const listBounds = useMemo(() => (view ? quantize(view.bounds) : undefined), [view]);
  const mapBounds = useMemo(() => (view ? quantize(view.bounds, 0.25) : undefined), [view]);
  const apiZoom = view ? Math.min(20, Math.max(1, Math.round(view.zoom) + 1)) : 10;

  const mapQuery = QuerySupport.useQuery({
    queryKey: ['map', filters, mapBounds, apiZoom],
    queryFn: ({ signal }) => propertyService.map(filters, mapBounds, apiZoom, signal),
    enabled: !!view,
    placeholderData: QuerySupport.keepPreviousData,
  });

  const listQuery = QuerySupport.useInfiniteQuery({
    queryKey: ['list', filters, listBounds],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      propertyService.search(filters, listBounds, pageParam, PAGE_SIZE, signal),
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled: !!view,
    placeholderData: QuerySupport.keepPreviousData,
  });

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data],
  );
  const total = listQuery.data?.pages[0]?.total ?? 0;
  const markers = useMemo(() => mapQuery.data?.markers ?? [], [mapQuery.data]);

  // La propiedad elegida puede no estar en la primera pagina de la lista: se pide aparte.
  const known = items.find((p) => p.id === selectedId) ?? null;
  const detailQuery = QuerySupport.useQuery({
    queryKey: ['property', selectedId],
    queryFn: ({ signal }) => propertyService.detail(selectedId as string, signal),
    enabled: !!selectedId && !known,
  });
  const selected: PropertyCard | null = known ?? detailQuery.data ?? null;

  // ---- Seleccion ----
  const focusOn = useCallback(
    (lat: number, lng: number) => {
      const zoom = Math.max(handle.current?.getZoom() ?? 0, 13.5);
      handle.current?.flyTo({ lat, lng, zoom }, selectionOffset);
    },
    [selectionOffset],
  );

  const selectFromMap = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return;
      const marker = markers.find((m) => m.kind === 'point' && m.id === id);
      if (marker) focusOn(marker.latitude, marker.longitude);
    },
    [markers, focusOn],
  );

  const selectFromList = useCallback(
    (property: PropertyCard) => {
      setSelectedId(property.id);
      focusOn(property.latitude, property.longitude);
    },
    [focusOn],
  );

  // Al elegir un pin, la tarjeta de la lista aparece a la vista.
  useEffect(() => {
    if (!selectedId) return;
    document
      .getElementById(`card-${selectedId}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, items.length]);

  // ---- Filtros ----
  // Cambia algunos filtros y quita los que quedaron vacíos
  const patchFilters = useCallback((patch: PropertyFilters) => {
    setFilters((prev) => cleanFilters({ ...prev, ...patch }));
  }, []);
  const clearFilters = useCallback(() => setFilters({}), []);
  /** Reemplaza todos los filtros de una vez (lo usa el panel de filtros al aplicar). */
  const replaceFilters = useCallback((next: PropertyFilters) => setFilters(cleanFilters(next)), []);

  // ---- Buscador de zonas ----
  const [searchText, setSearchText] = useState(initial.filters.q ?? '');
  const [searchOpen, setSearchOpen] = useState(false);
  const suggestions = useMemo(() => suggestPlaces(searchText), [searchText]);
  const pickPlace = useCallback(
    (place: Place) => {
      setSearchText(place.label);
      setSearchOpen(false);
      patchFilters({ q: undefined });
      handle.current?.flyTo(place.view);
    },
    [patchFilters],
  );
  const submitSearch = useCallback(() => {
    if (suggestions[0]) return pickPlace(suggestions[0]);
    patchFilters({ q: searchText.trim() || undefined });
    setSearchOpen(false);
  }, [suggestions, pickPlace, patchFilters, searchText]);

  // ---- URL compartible (filtros + posicion del mapa) ----
  useEffect(() => {
    if (!view) return;
    const params = filtersToParams(filters);
    params.set('c', `${view.center.lat.toFixed(4)},${view.center.lng.toFixed(4)}`);
    params.set('z', view.zoom.toFixed(2));
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [filters, view]);

  const onViewport = useCallback((info: ViewportInfo) => setViewport(info), []);

  return {
    handle,
    initialView: initial.view,
    filters,
    patchFilters,
    clearFilters,
    replaceFilters,
    activeFilters: countActiveFilters(filters),
    markers,
    items,
    total,
    loading: !view || listQuery.isPending,
    refreshing: mapQuery.isFetching || listQuery.isFetching,
    hasMore: !!listQuery.hasNextPage,
    loadingMore: listQuery.isFetchingNextPage,
    loadMore: () => listQuery.fetchNextPage(),
    selectedId,
    selected,
    selectFromMap,
    selectFromList,
    clearSelection: () => setSelectedId(null),
    onViewport,
    refresh: () =>
      queryClient
        .invalidateQueries({ queryKey: ['map'] })
        .then(() => queryClient.invalidateQueries({ queryKey: ['list'] })),
    detailStyle,
    toggleDetailStyle: () => setDetailStyle((v) => !v),
    offline,
    setOffline,
    usingMocks,
    search: {
      text: searchText,
      setText: (text: string) => {
        setSearchText(text);
        setSearchOpen(true);
      },
      open: searchOpen && suggestions.length > 0,
      close: () => setSearchOpen(false),
      suggestions,
      pick: pickPlace,
      submit: submitSearch,
    },
  };
}

export type MapExplorer = ReturnType<typeof useMapExplorer>;
