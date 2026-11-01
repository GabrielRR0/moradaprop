import { ApiError } from '@/lib/api';

/** Codigo con el que el API pide confirmar el segundo factor (comprobado hace menos de 5 minutos). */
export const RECENT_FACTOR_CODE = 'RECENT_TWO_FACTOR_REQUIRED';

/**
 * Ejecuta una accion sensible del admin. Si el API responde que hay que volver a confirmar el segundo factor,
 * llama a `confirm` (abre el panel "Confirma que eres tú") y repite la accion UNA vez. Si `confirm` se rechaza
 * (cancelo), el error sube tal cual y la accion no se repite.
 */
export async function withRecentSecondFactor<T>(action: () => Promise<T>, confirm: () => Promise<void>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError && error.code === RECENT_FACTOR_CODE) {
      await confirm();
      return action();
    }
    throw error;
  }
}
