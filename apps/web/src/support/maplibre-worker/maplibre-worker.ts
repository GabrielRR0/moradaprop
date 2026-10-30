// Archivos del worker de MapLibre, leidos de node_modules (solo servidor). Nunca se copian al proyecto.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** Unicos nombres que se sirven: el worker y el modulo que importa por ruta relativa. */
const WORKER_FILES = new Set(['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']);

// Desde el directorio de la app (apps/web): `require.resolve` lo reescribe Turbopack a una ruta virtual que no existe en disco.
const distDir = (): string => path.join(process.cwd(), 'node_modules', 'maplibre-gl', 'dist');

/** Contenido del archivo, o `null` si el nombre no esta en la lista (evita salir de `dist`). */
export const readWorkerFile = async (name: string): Promise<string | null> => {
  if (!WORKER_FILES.has(name)) return null;
  return readFile(path.join(distDir(), name), 'utf8');
};
