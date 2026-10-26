'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState, type ReactNode } from 'react';

/** Proveedores de datos de la app (TanStack Query: cache, reintentos y "dato anterior mientras carga"). */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  // reducedMotion="user": quien pidio menos movimiento en su sistema no ve desplazamientos animados.
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
