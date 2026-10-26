import { useSyncExternalStore } from 'react';
import { refreshSession, setAccessToken } from '@/lib/api';
import type { AuthSession, Enrollment, PublicUser } from '@/lib/api-types';

/**
 * Sesion del navegador. El access token NO esta aqui (vive en memoria dentro de lib/api);
 * esto guarda solo lo que la pantalla necesita: quien es y si debe activar un segundo factor.
 */
export interface SessionState {
  /** loading: aun no se sabe (se esta pidiendo el refresh al abrir la app). */
  status: 'loading' | 'authed' | 'anon';
  user: PublicUser | null;
  enrollment: Enrollment | null;
}

const LOADING: SessionState = { status: 'loading', user: null, enrollment: null };
const ANON: SessionState = { status: 'anon', user: null, enrollment: null };

let state: SessionState = LOADING;
const listeners = new Set<() => void>();
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('session');

function set(next: SessionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Guarda una sesion recien obtenida (login, verificacion, refresh). */
export function startSession(session: AuthSession) {
  setAccessToken(session.accessToken);
  set({ status: 'authed', user: session.user, enrollment: session.enrollment ?? null });
}

/** Cierra la sesion local. `broadcast` avisa a las demas pestanas. */
export function endSession(broadcast = false) {
  setAccessToken(null);
  set(ANON);
  if (broadcast) channel?.postMessage('logout');
}

/** El segundo factor cambio (se activo una passkey o el 2FA): se actualiza sin pedir todo otra vez. */
export function updateEnrollment(enrollment: Enrollment) {
  if (state.status === 'authed') set({ ...state, enrollment });
}

export function updateUser(user: PublicUser) {
  if (state.status === 'authed') set({ ...state, user });
}

channel?.addEventListener('message', (event) => {
  if (event.data === 'logout' && state.status === 'authed') endSession();
});

/** Al abrir la app: si la cookie de refresh sigue viva, el usuario ya estaba dentro. */
export async function bootSession() {
  const session = await refreshSession();
  if (session) startSession(session);
  else endSession();
}

export const getSession = () => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSession, () => LOADING);
}
