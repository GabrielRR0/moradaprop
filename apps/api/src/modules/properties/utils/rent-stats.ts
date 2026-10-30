/** Una propiedad publicada: lo único que hace falta para calcular el alquiler típico de un estado. */
export interface RentRow {
  state: string;
  priceAmount: number;
}

/** Histograma: cuántas propiedades caen en cada tramo de 0 a BIN_MAX dólares (las más caras van al último). */
export const BIN_COUNT = 12;
export const BIN_MAX = 1300;

export interface StateRent {
  state: string;
  count: number;
  min: number;
  max: number;
  /** Mediana: el alquiler "típico" (no la tira un solo precio muy alto). */
  median: number;
  /** Rango en el que cae la mayoría (25 % a 75 % de los precios). */
  p25: number;
  p75: number;
  /** Cantidad de propiedades por tramo de precio (BIN_COUNT tramos de 0 a BIN_MAX). */
  bins: number[];
}

/** Valor en la posición `q` (0 a 1) de una lista ya ordenada, con interpolación. */
function percentile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/** Agrupa por estado y calcula el alquiler típico. Los estados con más propiedades van primero. */
export function computeRentStats(rows: RentRow[]): StateRent[] {
  const byState = new Map<string, number[]>();
  for (const row of rows) {
    const list = byState.get(row.state) ?? [];
    list.push(row.priceAmount);
    byState.set(row.state, list);
  }
  return [...byState.entries()]
    .map(([state, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b);
      const bins = Array<number>(BIN_COUNT).fill(0);
      for (const price of sorted) bins[Math.min(BIN_COUNT - 1, Math.floor((price / BIN_MAX) * BIN_COUNT))]++;
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
    .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state));
}
