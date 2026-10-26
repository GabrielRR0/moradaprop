import { useCallback, useEffect, useState } from 'react';

/** Cuenta regresiva en segundos (reenviar codigo, esperar tras un 429). */
export function useCooldown(initial = 0) {
  const [left, setLeft] = useState(initial);

  useEffect(() => {
    if (left <= 0) return;
    const timer = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [left]);

  const start = useCallback((seconds: number) => setLeft(seconds), []);
  return { left, active: left > 0, start };
}

/** 42 -> "0:42" */
export function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
