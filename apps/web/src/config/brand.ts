import { publicEnv } from './env';

/**
 * Marca de la plataforma. El nombre definitivo aun esta pendiente:
 * cuando se decida, se cambia NEXT_PUBLIC_APP_NAME y los textos de este archivo.
 * Ningun componente debe escribir el nombre a mano.
 */
export const brand = {
  name: publicEnv.appName,
  tagline: 'Alquila en Venezuela de forma simple',
};
