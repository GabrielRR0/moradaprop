'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { setApiHooks } from '@/lib/api';
import { bootSession, endSession, startSession } from '../session/session.store';

/**
 * Se monta una vez en el layout. Conecta el cliente HTTP con la sesion y la navegacion
 * y, al abrir la app, intenta recuperar la sesion con la cookie de refresh.
 */
export function SessionBoot() {
  const router = useRouter();

  useEffect(() => {
    setApiHooks({
      // El cliente renovo el token (o no pudo): la sesion de pantalla lo refleja.
      onSession: (session) => (session ? startSession(session) : endSession()),
      // Cualquier ruta rechazada por falta de segundo factor lleva a "Protege tu cuenta".
      onEnrollmentRequired: () => {
        if (!window.location.pathname.startsWith('/seguridad')) router.replace('/seguridad/activar');
      },
    });
    void bootSession();
  }, [router]);

  return null;
}
