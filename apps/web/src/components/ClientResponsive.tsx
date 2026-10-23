'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const BREAKPOINT = 900;
const QUERY = `(max-width: ${BREAKPOINT - 1}px)`;

function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

/**
 * Como `Responsive`, pero monta SOLO la version que corresponde (no las dos).
 * Se usa donde cada version abre recursos pesados (el mapa abre WebGL y pide datos al API).
 * Hasta saber el ancho muestra `fallback`.
 */
export function ClientResponsive({
  desktop,
  mobile,
  fallback = null,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
  fallback?: ReactNode;
}) {
  const isMobile = useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null,
  );
  if (isMobile === null) return <>{fallback}</>;
  return <>{isMobile ? mobile : desktop}</>;
}
