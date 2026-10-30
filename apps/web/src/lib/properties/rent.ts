import type { PropertyCard } from './types';

/** Alquiler mensual típico (en USD) de un estado, calculado con todas las propiedades publicadas. */
export interface StateRent {
  state: string;
  count: number;
  min: number;
  max: number;
  /** El alquiler "típico": la mediana, que no la mueve una sola propiedad carísima. */
  median: number;
  /** Rango en el que cae la mayoría (25 % a 75 % de los precios). */
  p25: number;
  p75: number;
  /** Propiedades por tramo de precio: BIN_COUNT tramos de 0 a RENT_BIN_MAX dólares. */
  bins: number[];
}

export const RENT_BIN_COUNT = 12;
export const RENT_BIN_MAX = 1300;

/** Alquiler que se pinta del todo verde y del todo rojo (USD al mes). Entre medias va pasando por amarillo y naranja. */
export const RENT_GREEN_AT = 150;
export const RENT_RED_AT = 1000;

/** Posición de un alquiler en la escala: 0 = verde (barato) ... 1 = rojo (caro). */
export function rentHeat(amount: number): number {
  return Math.min(1, Math.max(0, (amount - RENT_GREEN_AT) / (RENT_RED_AT - RENT_GREEN_AT)));
}

/**
 * Color del alquiler: verde (barato) → amarillo → naranja → rojo (caro).
 * La luminosidad sale de `--rent-l` (más oscura en modo claro, más clara en modo noche).
 */
export function rentColor(amount: number): string {
  const hue = Math.round(140 * (1 - rentHeat(amount)));
  return `hsl(${hue} 78% var(--rent-l, 52%))`;
}

/** Palabra que acompaña al color: de "Económico" a "Muy alto". */
export function rentVerdict(amount: number): string {
  const heat = rentHeat(amount);
  if (heat < 0.2) return 'Económico';
  if (heat < 0.4) return 'Accesible';
  if (heat < 0.6) return 'Intermedio';
  if (heat < 0.8) return 'Alto';
  return 'Muy alto';
}

const RESIDENTIAL = new Set(['APARTAMENTO', 'CASA', 'TOWNHOUSE', 'HABITACION']);

function percentile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/** Lo mismo que calcula el API, para los datos de ejemplo (NEXT_PUBLIC_USE_MOCKS). */
export function rentStatsFrom(properties: PropertyCard[]): StateRent[] {
  const byState = new Map<string, number[]>();
  for (const p of properties) {
    if (p.currency !== 'USD' || !RESIDENTIAL.has(p.type)) continue;
    byState.set(p.state, [...(byState.get(p.state) ?? []), p.priceAmount]);
  }
  return [...byState.entries()]
    .map(([state, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b);
      const bins = Array<number>(RENT_BIN_COUNT).fill(0);
      for (const price of sorted) bins[Math.min(RENT_BIN_COUNT - 1, Math.floor((price / RENT_BIN_MAX) * RENT_BIN_COUNT))]++;
      return {
        state,
        count: sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: Math.round(percentile(sorted, 0.5)),
        p25: Math.round(percentile(sorted, 0.25)),
        p75: Math.round(percentile(sorted, 0.75)),
        bins,
      };
    })
    .sort((a, b) => b.count - a.count);
}
