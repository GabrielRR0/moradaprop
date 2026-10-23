import { describe, expect, it } from 'vitest';
import { brand } from '../brand';

describe('brand', () => {
  it('usa un nombre provisional mientras la marca no este definida', () => {
    // espera: nombre no vacio; obtuvo: brand.name
    expect(brand.name.length).toBeGreaterThan(0);
  });
});
