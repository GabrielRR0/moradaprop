'use client';

import { useState, type ReactNode } from 'react';
import { LoginPrompt } from '@/components/LoginPrompt';
import { MotionSupport } from '@/support/motion';
import { QuerySupport } from '@/support/query';

/** Proveedores de datos de la app (TanStack Query: cache, reintentos y "dato anterior mientras carga"). */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QuerySupport.QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  // reducedMotion="user": quien pidio menos movimiento en su sistema no ve desplazamientos animados.
  return (
    <QuerySupport.QueryClientProvider client={client}>
      <MotionSupport.MotionConfig reducedMotion="user">{children}
        <LoginPrompt />
      </MotionSupport.MotionConfig>
    </QuerySupport.QueryClientProvider>
  );
}
