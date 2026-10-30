export interface LoginPromptRequest {
  /** Lo que la persona quería hacer ("guardar tus favoritos"). */
  reason: string;
  /** Página a la que volver después de ingresar. */
  next: string;
}

type Listener = (request: LoginPromptRequest) => void;

const listeners = new Set<Listener>();

/** Abre el aviso "necesitas ingresar" con un botón que lleva al login. Se puede llamar desde cualquier hook. */
export function askLogin(reason: string) {
  const next = `${window.location.pathname}${window.location.search}`;
  listeners.forEach((listener) => listener({ reason, next }));
}

export function subscribeLoginPrompt(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
