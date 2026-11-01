import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api';
import { describeError, loginProblem } from '../services/auth-errors';

describe('errores de la verificacion "no soy un robot"', () => {
  it('falta o falla la verificacion: pide intentarlo de nuevo y la pantalla pide un token nuevo', () => {
    for (const code of ['HUMAN_CHECK_REQUIRED', 'HUMAN_CHECK_FAILED']) {
      const problem = describeError(new ApiError(403, code, 'x'), 'otro');
      expect(problem.kind).toBe('human-check');
      expect(problem.text).toContain('persona');
    }
  });

  it('Cloudflare no responde: mensaje propio, sin acusar al usuario', () => {
    const problem = describeError(new ApiError(503, 'HUMAN_CHECK_UNAVAILABLE', 'x'), 'otro');
    expect(problem.kind).toBe('human-check');
    expect(problem.text).toContain('no responde');
  });

  it('el login lo muestra igual (no lo confunde con "contraseña incorrecta")', () => {
    expect(loginProblem(new ApiError(403, 'HUMAN_CHECK_FAILED', 'x')).kind).toBe('human-check');
    expect(loginProblem(new ApiError(401, undefined, 'x')).kind).toBe('credentials');
  });

  it('un 403 sin ese codigo sigue siendo "acceso restringido" y no dispara la verificacion', () => {
    expect(describeError(new ApiError(403, undefined, 'No tienes permiso'), 'otro').kind).toBe('locked');
  });
});
