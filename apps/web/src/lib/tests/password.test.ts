import { describe, expect, it } from 'vitest';
import { isEmail, passwordProblem, passwordStrength } from '../password';

describe('contrasena', () => {
  it('exige 8 caracteres con letras y numeros', () => {
    expect(passwordProblem('abc123')).not.toBeNull();
    expect(passwordProblem('sololetrasss')).not.toBeNull();
    expect(passwordProblem('12345678')).not.toBeNull();
    expect(passwordProblem('Clave1234')).toBeNull();
  });
  it('mide la fuerza de 0 a 4', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('Clave1234!')).toBe(4);
  });
  it('valida correos', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
  });
});
