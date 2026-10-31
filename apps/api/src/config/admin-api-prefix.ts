import { loadEnv } from './env';

/**
 * Prefijo de las rutas de administracion. Las rutas se arman al importar los archivos de routes/, antes de que Nest
 * cree la configuracion, por eso se lee aqui directamente (main.ts carga el .env antes de importar la app).
 */
export const adminApiPrefix = (): string => loadEnv().adminApiPrefix;
