import { useCallback, useRef, useState } from 'react';

/**
 * Abre y cierra el panel "Confirma que eres tú" y lo convierte en una promesa: `confirm()` se resuelve cuando la persona
 * confirma su segundo factor y se rechaza (`Error('cancelled')`) si lo cierra sin confirmar. Asi una accion sensible
 * puede escribirse como "confirma y luego repite" (ver `withRecentSecondFactor`).
 */
export function useConfirmIdentity() {
  const [open, setOpen] = useState(false);
  const pending = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null);

  const confirm = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        pending.current = { resolve, reject };
        setOpen(true);
      }),
    [],
  );

  /** Lo llama el panel cuando el API acepto el segundo factor. */
  const done = useCallback(() => {
    setOpen(false);
    pending.current?.resolve();
    pending.current = null;
  }, []);

  /** Lo llama el panel al cerrarse sin confirmar. */
  const cancel = useCallback(() => {
    setOpen(false);
    pending.current?.reject(new Error('cancelled'));
    pending.current = null;
  }, []);

  return { open, confirm, done, cancel };
}

export type ConfirmIdentity = ReturnType<typeof useConfirmIdentity>;

/** El error con el que se rechaza `confirm()` cuando la persona cancela (para ignorarlo sin mostrar un aviso). */
export const isCancelled = (error: unknown): boolean => error instanceof Error && error.message === 'cancelled';
