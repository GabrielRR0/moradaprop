import type { ReactNode } from 'react';
import { AuthGate } from '@/modules/auth';

/** Panel de inmobiliaria: solo con sesion. El API es quien decide de verdad; esto evita pantallas vacias. */
export default function Layout({ children }: { children: ReactNode }) {
  return <AuthGate roles={['AGENCY', 'ADMIN']}>{children}</AuthGate>;
}
