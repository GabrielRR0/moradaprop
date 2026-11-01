import { useEffect, useState } from 'react';
import { msLeft } from '@/lib/appointments';

/**
 * Cuánto tiempo le queda a un mensaje para poder editarse (0 si ya no, o si nunca fue editable: `until` null).
 * El reloj solo corre mientras queda tiempo, así que los mensajes viejos no gastan nada.
 */
export function useEditWindow(until: string | null, skew: number): number {
  const [left, setLeft] = useState(() => (until ? msLeft(until, skew) : 0));

  useEffect(() => {
    if (!until) {
      setLeft(0);
      return;
    }
    const tick = () => {
      const next = msLeft(until, skew);
      setLeft(next);
      return next;
    };
    if (tick() <= 0) return;
    const timer = setInterval(() => {
      if (tick() <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [until, skew]);

  return left;
}
