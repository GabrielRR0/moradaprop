import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api';
import { RECENT_FACTOR_CODE, withRecentSecondFactor } from '../admin/recent-factor';

const pideFactor = () => new ApiError(403, RECENT_FACTOR_CODE, 'Confirma tu segundo factor');

describe('withRecentSecondFactor (acciones sensibles del admin)', () => {
  it('si la accion sale bien no pide nada', async () => {
    const confirm = vi.fn();
    expect(await withRecentSecondFactor(async () => 'listo', confirm)).toBe('listo');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('si la API pide el segundo factor, lo pide y repite la accion una vez', async () => {
    const action = vi.fn().mockRejectedValueOnce(pideFactor()).mockResolvedValueOnce('guardado');
    const confirm = vi.fn().mockResolvedValue(undefined);
    expect(await withRecentSecondFactor(action, confirm)).toBe('guardado');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('si el admin cancela, el error sube y la accion no se repite', async () => {
    const action = vi.fn().mockRejectedValue(pideFactor());
    const confirm = vi.fn().mockRejectedValue(new Error('cancelled'));
    await expect(withRecentSecondFactor(action, confirm)).rejects.toThrow('cancelled');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('si despues de confirmar vuelve a fallar, no insiste (solo una repeticion)', async () => {
    const action = vi.fn().mockRejectedValue(pideFactor());
    const confirm = vi.fn().mockResolvedValue(undefined);
    await expect(withRecentSecondFactor(action, confirm)).rejects.toBeInstanceOf(ApiError);
    expect(action).toHaveBeenCalledTimes(2);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('otros errores pasan sin pedir nada', async () => {
    const confirm = vi.fn();
    await expect(withRecentSecondFactor(async () => Promise.reject(new ApiError(400, undefined, 'valor invalido')), confirm)).rejects.toThrow('valor invalido');
    expect(confirm).not.toHaveBeenCalled();
  });
});
