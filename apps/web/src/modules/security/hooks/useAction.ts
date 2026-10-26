import { useState } from 'react';
import { describeError, type Problem } from '@/modules/auth';

/** Ejecuta una accion asincrona mostrando "cargando" y el error traducido; evita dobles envios. */
export function useAction(fallback = 'No pudimos completar la acción. Inténtalo de nuevo.') {
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (pending) return undefined;
    setPending(true);
    setProblem(null);
    try {
      return await action();
    } catch (error) {
      setProblem(describeError(error, fallback));
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, problem, clear: () => setProblem(null) };
}
