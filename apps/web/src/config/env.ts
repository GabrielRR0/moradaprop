/**
 * Next solo expone al navegador las variables NEXT_PUBLIC_*, y debe leerlas
 * con acceso literal (process.env.NEXT_PUBLIC_X) para poder sustituirlas.
 */
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Portal de Alquileres',
  /**
   * URL del API vista desde el NAVEGADOR. Sin la variable: en desarrollo es el API local (localhost:3001) y en produccion
   * es el MISMO dominio de la web (cadena vacia -> las llamadas van a /api/...), que es como se despliega en Vercel Services.
   * Una cadena vacia explicita tambien significa "mismo dominio".
   */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'),
  /** Muestra el boton flotante para probar color de marca y modo noche (herramienta de diseno). */
  showThemePicker: (process.env.NEXT_PUBLIC_SHOW_THEME_PICKER ?? 'true') === 'true',
  /** WhatsApp (solo digitos, con codigo de pais) para los botones de contacto de la maqueta. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  /** 'auto' usa datos de ejemplo si el API no responde; 'true' siempre ejemplo; 'false' nunca. */
  useMocks: (process.env.NEXT_PUBLIC_USE_MOCKS ?? 'auto') as 'auto' | 'true' | 'false',
  /** Estilo base del mapa (vector tiles de OpenFreeMap, sin clave). */
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/positron',
  /** Estilo con mas detalle y colores propios (boton "tipo de mapa"). */
  mapDetailStyleUrl:
    process.env.NEXT_PUBLIC_MAP_DETAIL_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
  appClientKey: process.env.NEXT_PUBLIC_APP_CLIENT_KEY ?? 'dev-web-client-key',
  /** Prefijo de las rutas de administracion de la API: debe ser igual a ADMIN_API_PREFIX de la API (ver docs/DESPLIEGUE.md). */
  adminApiPrefix: process.env.NEXT_PUBLIC_ADMIN_API_PREFIX ?? 'admin',
};

/** Solo para codigo de servidor (SSR, route handlers). Nunca importar desde componentes cliente. */
export const serverEnv = {
  /** URL del API vista desde el SERVIDOR de Next (en Docker es el nombre del servicio). */
  apiUrl: process.env.API_INTERNAL_URL ?? publicEnv.apiUrl,
};
