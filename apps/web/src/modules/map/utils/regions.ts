/**
 * Estados y municipios para el filtro de ubicación. Lista fija (como `places.ts`) mientras el API
 * no tenga un listado de ubicaciones; los nombres son los que guarda cada propiedad.
 */
export const REGIONS: Record<string, string[]> = {
  Amazonas: ['Atures'],
  Anzoátegui: ['Sotillo', 'Urbaneja', 'Simón Bolívar'],
  Aragua: ['Girardot', 'Mario Briceño Iragorry', 'Santiago Mariño'],
  Bolívar: ['Caroní', 'Heres'],
  Carabobo: ['Valencia', 'Naguanagua', 'San Diego'],
  'Distrito Capital': ['Libertador'],
  Lara: ['Iribarren'],
  Mérida: ['Libertador', 'Campo Elías'],
  Miranda: ['Chacao', 'Baruta', 'El Hatillo', 'Sucre', 'Libertador'],
  'Nueva Esparta': ['Maneiro', 'Mariño'],
  Táchira: ['San Cristóbal'],
  Zulia: ['Maracaibo', 'Cabimas'],
};

export const STATE_NAMES = Object.keys(REGIONS);
