import type { ReactNode } from 'react';
import { AuthGate } from '@/modules/auth';

/** Mensajes: cualquier cuenta con sesion (el cliente ve lo que pidio; quien publica, ademas lo que recibe). */
export default function Layout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
