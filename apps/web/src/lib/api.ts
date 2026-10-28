import { publicEnv } from '@/config';
import type { AuthSession } from './api-types';

/**
 * Cliente HTTP unico del API. Concentra cabeceras, el access token (solo en memoria),
 * UN refresh a la vez y el reintento. Ninguna pantalla repite esta logica.
 * Regla de seguridad: el token jamas va a localStorage/sessionStorage.
 */

const BASE = `${publicEnv.apiUrl}/api`;

/** Error del API (o de red: status 0). `code` solo viene en los errores de seguridad. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public messages: string[] = [],
  ) {
    super(message);
  }
}

/** Avisos que el cliente HTTP da al resto de la app sin conocer el router ni la sesion. */
interface ApiHooks {
  /** El refresh funciono o fallo: la sesion se actualiza o se cierra. */
  onSession?: (session: AuthSession | null) => void;
  /** El API rechazo con SECOND_FACTOR_ENROLLMENT_REQUIRED. */
  onEnrollmentRequired?: () => void;
}

let hooks: ApiHooks = {};
let accessToken: string | null = null;
let refreshing: Promise<AuthSession | null> | null = null;

export const setApiHooks = (next: ApiHooks) => {
  hooks = next;
};
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const hasAccessToken = () => accessToken !== null;

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown };

async function raw<T>(path: string, { json, headers, ...init }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
        'x-app-client': 'web',
        'x-app-key': publicEnv.appClientKey,
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
  } catch {
    throw new ApiError(0, undefined, 'No se pudo conectar con el servidor');
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const messages: string[] = Array.isArray(body?.message)
      ? body.message
      : body?.message
        ? [body.message]
        : [];
    throw new ApiError(
      response.status,
      body?.code,
      messages[0] ?? `Error ${response.status}`,
      messages,
    );
  }
  return body as T;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Renueva la sesion. Si varias peticiones lo piden a la vez sale UNA sola (el servidor rechaza
 * las repetidas). Un 401 se reintenta una vez: pudo ganar otra pestana con la misma cookie.
 */
export function refreshSession(): Promise<AuthSession | null> {
  refreshing ??= (async () => {
    // Esperas entre reintentos: un 401 se repite enseguida (pudo ganar otra pestana con la misma cookie);
    // un 429, un corte de red o un 5xx se reintentan con mas calma y NO cierran la sesion.
    let rejected = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const session = await raw<AuthSession>('/auth/refresh', { method: 'POST', json: {} });
        accessToken = session.accessToken;
        hooks.onSession?.(session);
        return session;
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 0;
        rejected = status === 401;
        const transient = status === 0 || status === 429 || status >= 500;
        if (rejected && attempt === 0) await wait(350);
        else if (transient) await wait(1500 * 2 ** attempt);
        else break;
      }
    }
    // Solo un 401 confirmado significa "sesion terminada". Si fallo por limite o red, la cookie sigue valida.
    if (rejected) {
      accessToken = null;
      hooks.onSession?.(null);
    }
    return null;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Rutas publicas de auth: no llevan sesion, asi que un 401 ahi nunca se arregla renovando. */
const PUBLIC_AUTH =
  /^\/auth\/(login|refresh|register|verify-email|resend-code|password|google|passkeys\/(login|step-up))/;

/** Peticion al API. Con sesion, un 401 renueva el token UNA vez y reintenta. */
export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await raw<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 && accessToken && !PUBLIC_AUTH.test(path)) {
        if (await refreshSession()) return raw<T>(path, options);
      }
      if (error.code === 'SECOND_FACTOR_ENROLLMENT_REQUIRED') hooks.onEnrollmentRequired?.();
    }
    throw error;
  }
}
