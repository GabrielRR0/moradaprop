import type { ReactNode } from 'react';
import { AuthGate } from '@/modules/auth';

export default function Layout({ children }: { children: ReactNode }) {
  return <AuthGate roles={['OWNER', 'AGENCY', 'ADMIN']}>{children}</AuthGate>;
}
