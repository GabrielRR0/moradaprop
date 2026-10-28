'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import type { Role } from '@/lib/api-types';
import { useSession } from '../session/session.store';
import '@/components/ui/ui.css';
import { MotionSupport } from '@/support/motion';

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="ui-font" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 24 }}>
      {children}
    </div>
  );
}

/**
 * Protege una zona de la web. Ocultar una pantalla NO protege nada (lo hace el API);
 * esto solo evita que alguien sin sesion o sin el rol vea pantallas vacias o errores.
 *  - sin sesion -> /ingresar y vuelve aqui despues
 *  - rol equivocado -> aviso amable
 *  - cuenta limitada por falta de segundo factor -> "Protege tu cuenta"
 */
export function AuthGate({
  roles,
  allowBlocked,
  children,
}: {
  roles?: Role[];
  /** Deja pasar a cuentas limitadas (las pantallas de seguridad son justo para ellas). */
  allowBlocked?: boolean;
  children: ReactNode;
}) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const blocked = Boolean(session.enrollment?.blocked) && !allowBlocked;

  useEffect(() => {
    if (session.status === 'anon') router.replace(`/ingresar?next=${encodeURIComponent(pathname)}`);
    else if (blocked) router.replace('/seguridad/activar');
  }, [session.status, blocked, pathname, router]);

  if (session.status !== 'authed' || blocked) {
    return (
      <FullScreen>
        <span className="ui-spinner" style={{ borderColor: 'var(--line)', borderTopColor: 'var(--ac)', width: 34, height: 34 }} role="status" aria-label="Cargando" />
      </FullScreen>
    );
  }

  if (roles && !roles.some((role) => session.user?.roles.includes(role))) {
    return (
      <FullScreen>
        <MotionSupport.motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="au-center"
          style={{ maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}
        >
          <span className="ui-pulse">
            <Icon name="lock" size={40} />
          </span>
          <h1 style={{ margin: 0, fontSize: 26, letterSpacing: '-0.02em' }}>No tienes acceso a esta sección</h1>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>
            Tu cuenta no tiene los permisos necesarios. Si crees que es un error, escribe a soporte.
          </p>
          <Link href="/mapa" className="ui-btn">
            Volver al mapa
          </Link>
        </MotionSupport.motion.div>
      </FullScreen>
    );
  }

  return <>{children}</>;
}
