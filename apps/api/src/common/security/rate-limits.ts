/**
 * LIMITES DE PETICIONES: el unico lugar donde se decide cuantas peticiones por minuto
 * puede hacer UNA misma IP a cada tipo de ruta. Al pasarse recibe 429 (demasiadas peticiones).
 *
 * Para cambiar un limite, cambia el numero aqui. Para dar un limite propio a una ruta concreta:
 *   @Throttle(limitPerMinute(RATE_LIMITS.upload))
 *
 * Los contadores viven en Redis cuando CACHE_DRIVER=redis (compartidos entre servidores).
 */
export const RATE_LIMITS = {
  /** Lectura publica (busqueda, mapa, fichas). Alto, porque el mapa dispara varias consultas al moverse. */
  public: 120,
  /** Rutas sensibles sin sesion (login, registro, codigos, recuperar clave). Bajo, frena fuerza bruta. */
  sensitive: 10,
  /** Usuarios con sesion iniciada. */
  authenticated: 120,
  /** Subida de imagenes (cuesta CPU: se procesan con sharp). */
  upload: 20,
  /** Importacion de planillas (cuesta CPU y base de datos). */
  import: 10,
} as const;

/** Formato que espera @Throttle: `limit` peticiones cada 60 segundos. */
export const limitPerMinute = (limit: number) => ({ default: { limit, ttl: 60_000 } });
