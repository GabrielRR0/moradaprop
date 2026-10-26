/**
 * Cambia una variable de entorno SOLO para una suite e2e (antes de createTestApp, que lee la config).
 * Devuelve la funcion que la deja como estaba: llamala en afterAll.
 */
export function overrideEnv(name: string, value: string): () => void {
  const anterior = process.env[name];
  process.env[name] = value;
  return () => {
    if (anterior === undefined) delete process.env[name];
    else process.env[name] = anterior;
  };
}
