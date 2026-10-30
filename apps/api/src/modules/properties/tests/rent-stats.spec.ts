import { computeRentStats } from '../utils/rent-stats';

describe('computeRentStats', () => {
  it('agrupa por estado y calcula mediana y rango típico', () => {
    const rows = [100, 200, 300, 400, 500].map((priceAmount) => ({ state: 'Mérida', priceAmount }));
    rows.push({ state: 'Zulia', priceAmount: 900 });
    const [merida, zulia] = computeRentStats(rows);
    expect(merida).toMatchObject({ state: 'Mérida', count: 5, min: 100, max: 500, median: 300, p25: 200, p75: 400 });
    expect(zulia).toMatchObject({ state: 'Zulia', count: 1, median: 900, p25: 900, p75: 900 });
  });

  it('una sola cifra muy alta no mueve la mediana', () => {
    const rows = [200, 210, 220, 230, 9000].map((priceAmount) => ({ state: 'Lara', priceAmount }));
    expect(computeRentStats(rows)[0].median).toBe(220);
  });

  it('sin propiedades no hay estados', () => {
    expect(computeRentStats([])).toEqual([]);
  });
});
