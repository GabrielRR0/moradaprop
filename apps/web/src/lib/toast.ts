export type ToastTone = 'ok' | 'info' | 'warn';

export interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

type Listener = (toast: ToastMessage) => void;

const listeners = new Set<Listener>();
let nextId = 1;

/** Muestra un aviso breve (ej: "Guardado en favoritos"). Se puede llamar desde cualquier hook. */
export function toast(text: string, tone: ToastTone = 'ok') {
  const message = { id: nextId++, text, tone };
  listeners.forEach((listener) => listener(message));
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
