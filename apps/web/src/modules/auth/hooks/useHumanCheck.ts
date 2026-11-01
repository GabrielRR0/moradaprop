import { useCallback, useRef, useState } from 'react';
import { TurnstileSupport } from '@/support/turnstile';
import { QuerySupport } from '@/support/query';
import { authService } from '../services/auth.service';

/** Cabecera con la que se manda la respuesta del widget a la API. */
export const HUMAN_CHECK_HEADER = 'x-turnstile-token';

/**
 * La verificacion "no soy un robot" (Cloudflare Turnstile) de un formulario. Un solo interruptor, el de la API:
 * esta pregunta `GET /auth/human-check` y, si esta apagado, todo esto es transparente (`ready` siempre true, sin cabecera).
 * Si esta encendido, `ready` es true cuando el widget ya dio un token, y cada token sirve UNA sola vez: despues de
 * cada intento (salga bien o mal) hay que llamar `reset()` para pedir uno nuevo.
 */
export function useHumanCheck() {
  const config = QuerySupport.useQuery({
    queryKey: ['auth', 'human-check'],
    queryFn: () => authService.humanCheck(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const enabled = config.data?.enabled === true;

  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  /** Sube cada vez que hay que dibujar el widget de nuevo (ej. al tocar "Reintentar"). */
  const [attempt, setAttempt] = useState(0);
  const widget = useRef<TurnstileSupport.Widget | null>(null);

  const onToken = useCallback((next: string) => {
    setToken(next);
    setFailed(false);
  }, []);
  const onError = useCallback(() => {
    setToken(null);
    setFailed(true);
  }, []);
  const onExpire = useCallback(() => setToken(null), []);
  const attach = useCallback((next: TurnstileSupport.Widget | null) => {
    widget.current = next;
  }, []);

  const headers = useCallback((): Record<string, string> => (enabled && token ? { [HUMAN_CHECK_HEADER]: token } : {}), [enabled, token]);

  /** Gasta el token actual y pide uno nuevo (llamar despues de cada envio). */
  const reset = useCallback(() => {
    setToken(null);
    widget.current?.reset();
  }, []);

  return {
    /** El servidor lo exige. */
    enabled,
    siteKey: config.data?.siteKey ?? null,
    /** Aun no se sabe si el servidor lo exige. */
    loading: config.isLoading,
    /** El widget no pudo cargar o resolver. */
    failed,
    /** Se puede enviar el formulario: ya se sabe si hace falta y, si hace falta, ya hay token. */
    ready: !config.isLoading && (!enabled || token !== null),
    /** Cabeceras para la llamada protegida (vacias si esta apagado). */
    headers,
    reset,
    /** Vuelve a preguntar a la API (cuando respondio que faltaba la verificacion: quizas se activo despues de abrir la pagina). */
    refresh: () => void config.refetch(),
    /** Dibuja el widget de nuevo. */
    retry: () => {
      setFailed(false);
      setAttempt((n) => n + 1);
    },
    attempt,
    // Los usa el componente que dibuja el widget:
    onToken,
    onError,
    onExpire,
    attach,
  };
}

export type HumanCheck = ReturnType<typeof useHumanCheck>;
