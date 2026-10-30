import { describe, expect, it } from 'vitest';
import { readWorkerFile } from './maplibre-worker';

describe('readWorkerFile', () => {
  it('sirve el worker', async () => {
    expect(await readWorkerFile('maplibre-gl-worker.mjs')).toContain('MapLibre GL JS');
  });

  // En maplibre-gl 6.x el modulo "shared" viene vacio: igual debe servirse (el worker lo importa).
  it('sirve el modulo shared', async () => {
    expect(typeof (await readWorkerFile('maplibre-gl-shared.mjs'))).toBe('string');
  });

  it.each(['../package.json', '..%2Fpackage.json', 'maplibre-gl.mjs', 'maplibre-gl-worker.mjs.map', ''])(
    'rechaza "%s"',
    async (name) => {
      expect(await readWorkerFile(name)).toBeNull();
    },
  );
});
