import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { toast } from '@/lib/toast';
import { HOME_LISTINGS, QUICK_FILTERS } from './home-data';

/** Inicio: las propiedades de ejemplo con su corazón de favorito y los filtros rápidos del buscador. */
export function useHomeScreen() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([2]);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Planta eléctrica']);

  function toggleFavorite(propertyId: number) {
    const wasFavorite = favoriteIds.includes(propertyId);
    if (wasFavorite) setFavoriteIds(favoriteIds.filter((id) => id !== propertyId));
    else setFavoriteIds([...favoriteIds, propertyId]);
    toast(wasFavorite ? 'Quitada de favoritos' : 'Guardada en favoritos');
  }

  function toggleFilter(name: string) {
    if (activeFilters.includes(name)) setActiveFilters(activeFilters.filter((n) => n !== name));
    else setActiveFilters([...activeFilters, name]);
  }

  const listings = HOME_LISTINGS.map((listing, index) => {
    const isFavorite = favoriteIds.includes(listing.id);
    return {
      title: listing.title,
      place: listing.place,
      price: listing.price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: listing.area,
      badge: listing.badge,
      amenities: listing.amenities,
      delay: `${index * 80}ms`,
      tint: `background:color-mix(in srgb, var(--ac) ${10 + index * 3}%, var(--surf2))`,
      heartFill: isFavorite ? 'currentColor' : 'none',
      heartColor: isFavorite ? 'var(--ac-ink)' : 'var(--text)',
      toggleFavorite: () => toggleFavorite(listing.id),
    };
  });

  const filterChips = QUICK_FILTERS.map((name) => ({
    label: name,
    className: classIf('chip', activeFilters.includes(name)),
    toggle: () => toggleFilter(name),
  }));

  return { listings, filterChips };
}

/** El tipo de lo que devuelve el hook (las partes de la pantalla lo usan para saber qué hay en `v`). */
export type HomeScreenView = ReturnType<typeof useHomeScreen>;
