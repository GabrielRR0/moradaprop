// Unico lugar donde se carga el script de Cloudflare Turnstile (el widget "no soy un robot").

/** Lo que usa la web del widget; es nuestro, no el de Cloudflare. */
export interface RenderOptions {
  /** Clave publica del sitio (la entrega la API por GET /auth/human-check). */
  sitekey: string;
  /** El widget obtuvo una respuesta: este es el token que se manda a la API. */
  onToken: (token: string) => void;
  /** El widget no pudo cargar o resolver (red, bloqueador de contenido...). */
  onError: () => void;
  /** El token vencio (a los 5 minutos); el widget pide uno nuevo solo. */
  onExpire: () => void;
}

/** Un widget ya dibujado. */
export interface Widget {
  /** Pide un token nuevo (cada token sirve una sola vez). */
  reset: () => void;
  /** Quita el widget de la pagina. */
  remove: () => void;
}

interface CloudflareApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: CloudflareApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<CloudflareApi> | null = null;

/** Carga el script una sola vez (y permite reintentar si fallo, por ejemplo por un bloqueador de contenido). */
function load(): Promise<CloudflareApi> {
  if (typeof window !== 'undefined' && window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<CloudflareApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile no se inicializo')));
    script.onerror = () => {
      script.remove();
      loading = null;
      reject(new Error('No se pudo cargar Turnstile'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Dibuja el widget dentro de `container`. Aparece solo si hace falta una accion de la persona (`interaction-only`);
 * casi siempre se resuelve en silencio. Sigue el tema claro u oscuro de la pagina y esta en espanol.
 */
export async function render(container: HTMLElement, options: RenderOptions): Promise<Widget> {
  const api = await load();
  const id = api.render(container, {
    sitekey: options.sitekey,
    callback: options.onToken,
    'error-callback': options.onError,
    'expired-callback': options.onExpire,
    theme: 'auto',
    language: 'es',
    appearance: 'interaction-only',
  });
  return { reset: () => api.reset(id), remove: () => api.remove(id) };
}
