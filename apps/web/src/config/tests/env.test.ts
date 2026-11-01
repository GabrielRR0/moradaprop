import { afterEach, describe, expect, it, vi } from 'vitest';

/** Carga `publicEnv` de nuevo con el entorno indicado (el archivo lee las variables al importarse). */
async function publicEnvWith(nodeEnv: string, apiUrl: string | undefined) {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.stubEnv('NEXT_PUBLIC_API_URL', apiUrl);
  return (await import('../env')).publicEnv;
}

describe('publicEnv.apiUrl (a donde llama la web)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('en desarrollo sin variable usa el API local', async () => {
    expect((await publicEnvWith('development', undefined)).apiUrl).toBe('http://localhost:3001');
  });

  it('en produccion sin variable usa el mismo dominio de la web (la API vive en /api)', async () => {
    expect((await publicEnvWith('production', undefined)).apiUrl).toBe('');
  });

  it('una URL explicita manda en cualquier entorno', async () => {
    expect((await publicEnvWith('production', 'https://api.ejemplo.com')).apiUrl).toBe('https://api.ejemplo.com');
    expect((await publicEnvWith('development', 'http://otro:3001')).apiUrl).toBe('http://otro:3001');
  });

  it('una cadena vacia explicita tambien significa mismo dominio', async () => {
    expect((await publicEnvWith('development', '')).apiUrl).toBe('');
  });
});
