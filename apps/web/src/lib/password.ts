/** Cuantos requisitos cumple la contrasena (0 a 4): 8+ caracteres, mayuscula y minuscula, un numero, un simbolo. */
export function passwordStrength(password: string): number {
  let points = 0;
  if (password.length >= 8) points += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
  if (/[0-9]/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  return points;
}

export const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];

/** Lo minimo que exige el API: 8 a 128 caracteres con letras y numeros. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Usa al menos 8 caracteres.';
  if (password.length > 128) return 'Usa máximo 128 caracteres.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Combina letras y números.';
  }
  return null;
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
