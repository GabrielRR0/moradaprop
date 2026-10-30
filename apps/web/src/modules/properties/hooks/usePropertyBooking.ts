import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  amenityTags,
  formatPrice,
  photoTint,
  placeOf,
  specsOf,
  typeLabel,
  propertyService,
  useFavorites,
  type PropertyDetail,
} from '@/lib/properties';
import { toast } from '@/lib/toast';
import { useSession } from '@/modules/auth';
import { QuerySupport } from '@/support/query';
import { VISIT_DAYS } from './property-data';

const STATUS_LABEL: Record<string, string> = {
  PUBLICADA: 'Disponible',
  RESERVADA: 'Reservada',
  ALQUILADA: 'Alquilada',
  PAUSADA: 'Pausada',
};

/** Lo que la ficha muestra de la propiedad ya formateado (null mientras carga o si falla). */
function describe(p: PropertyDetail) {
  // La portada primero, luego el resto en el orden de la galeria.
  const sorted = [...p.images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position);
  const photos = sorted.length ? sorted.map((image) => image.hd) : p.cover ? [p.cover.hd] : [];
  return {
    id: p.id,
    title: p.title,
    status: STATUS_LABEL[p.status] ?? p.status,
    price: formatPrice(p.priceAmount, p.currency),
    place: placeOf(p),
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parkingSpots: p.parkingSpots,
    area: p.areaM2 ? `${p.areaM2} m²` : '—',
    amenities: amenityTags(p),
    description: p.description?.trim() || 'El anunciante aún no agregó una descripción.',
    photos,
  };
}

/**
 * Lo que se puede hacer en la ficha, compartido por escritorio y teléfono:
 * cargar la propiedad del API, guardarla en favoritos, elegir el día de la visita y pedirla.
 * `dayClass` es la clase base de los botones de día ("chip" en escritorio, "day" en teléfono).
 */
export function usePropertyBooking(dayClass: string) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { status } = useSession();
  const [dayIndex, setDayIndex] = useState(1);

  const query = QuerySupport.useQuery({
    queryKey: ['property', id],
    queryFn: ({ signal }) => propertyService.detail(id, signal),
    staleTime: 60_000,
  });

  // Parecidas: mismo estado y tipo, sin la propia propiedad.
  const detail = query.data;
  const similarQuery = QuerySupport.useQuery({
    queryKey: ['property', id, 'similar'],
    enabled: !!detail,
    queryFn: ({ signal }) =>
      propertyService.search({ state: detail!.state, type: detail!.type, sort: 'recent' }, undefined, 1, 4, signal),
    staleTime: 60_000,
  });
  const similar = (similarQuery.data?.items ?? [])
    .filter((item) => item.id !== id)
    .slice(0, 3)
    .map((item, index) => ({
      id: item.id,
      href: `/propiedad/${item.id}`,
      price: formatPrice(item.priceAmount, item.currency),
      title: item.title,
      place: placeOf(item),
      specs: specsOf(item) || typeLabel(item.type),
      cover: item.cover?.medium ?? null,
      tint: photoTint(index),
    }));

  const favorites = useFavorites(status === 'authed');
  const isFavorite = favorites.isFavorite(id);

  return {
    property: query.data ? describe(query.data) : null,
    similar,
    loading: query.isLoading,
    failed: query.isError,
    retry: () => void query.refetch(),

    // Corazón: se llena y toma el color de marca cuando está guardada
    favoriteFill: isFavorite ? 'currentColor' : 'none',
    favoriteColor: isFavorite ? 'var(--ac-ink)' : 'var(--text)',
    isFavorite,
    toggleFavorite: () => favorites.toggle(id),

    visitDays: VISIT_DAYS.map((day, index) => ({
      name: day.name,
      number: day.number,
      className: index === dayIndex ? `${dayClass} on` : dayClass,
      choose: () => setDayIndex(index),
    })),
    selectedDayName: VISIT_DAYS[dayIndex].name,
    requestVisit: () => toast('Solicitud de visita enviada. El agente te confirmará.'),
  };
}

export type PropertyInfo = NonNullable<ReturnType<typeof usePropertyBooking>['property']>;
