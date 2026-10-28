import type { Currency, PropertyCard } from './types';

const NUMBER = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 });

/** "$1.200" (USD) o "Bs. 1.200" (VES). */
export function formatPrice(amount: number, currency: Currency = 'USD'): string {
  const value = NUMBER.format(amount);
  return currency === 'USD' ? `$${value}` : `Bs. ${value}`;
}

/** Precio compacto para el pin del mapa ($450, $1,2k). */
export function pinPrice(amount: number, currency: Currency = 'USD'): string {
  if (currency === 'USD' && amount >= 10_000) return `$${Math.round(amount / 1000)}k`;
  return formatPrice(amount, currency);
}

const TYPE_LABEL: Record<string, string> = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  TOWNHOUSE: 'Townhouse',
  HABITACION: 'Habitación',
  LOCAL: 'Local',
  OFICINA: 'Oficina',
  GALPON: 'Galpón',
  TERRENO: 'Terreno',
};
export const typeLabel = (type: string) => TYPE_LABEL[type] ?? type;

/** Insignia de la tarjeta: reservada, nueva (menos de 10 dias) o vacia. */
export function badgeOf(p: PropertyCard): string {
  if (p.inReservation) return 'En reserva';
  if (p.publishedAt && Date.now() - new Date(p.publishedAt).getTime() < 10 * 86_400_000)
    return 'Nuevo';
  return '';
}

/** Servicios que tiene la propiedad, en el orden en que importan en Venezuela. */
export function amenityTags(p: PropertyCard): string[] {
  const tags: string[] = [];
  if (p.hasGenerator) tags.push('Planta eléctrica');
  if (p.hasWaterTank) tags.push('Tanque de agua');
  if (p.hasFiberOptic) tags.push('Fibra óptica');
  if (p.hasSecurity) tags.push('Vigilancia');
  return tags;
}

export function placeOf(p: PropertyCard): string {
  return p.urbanization ? `${p.urbanization}, ${p.municipality}` : `${p.municipality}, ${p.state}`;
}

/** Texto de la ficha: "2 hab · 2 baños · 85 m²" (sin partes que no aplican). */
export function specsOf(p: PropertyCard): string {
  const parts: string[] = [];
  if (p.bedrooms > 0) parts.push(`${p.bedrooms} hab`);
  if (p.bathrooms > 0) parts.push(`${p.bathrooms} ${p.bathrooms === 1 ? 'baño' : 'baños'}`);
  if (p.areaM2) parts.push(`${p.areaM2} m²`);
  return parts.join(' · ');
}

/** Tono de color de la foto de reemplazo (cuando la propiedad no trae foto). */
export function photoTint(index: number): string {
  return `background:color-mix(in srgb, var(--ac) ${10 + ((index * 3) % 18)}%, var(--surf2))`;
}
