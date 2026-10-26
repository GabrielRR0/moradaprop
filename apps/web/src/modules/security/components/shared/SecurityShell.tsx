'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { authService, useSession } from '@/modules/auth';
import '@/components/ui/ui.css';
import './security.css';

/** Marco de las pantallas de seguridad: barra con volver / cerrar sesion y el contenido centrado. */
export function SecurityShell({
  children,
  backHref,
  narrow,
}: {
  children: ReactNode;
  /** Sin enlace de volver (ej. la pantalla obligatoria de "Protege tu cuenta"). */
  backHref?: string;
  narrow?: boolean;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    await authService.logout().catch(() => undefined);
    router.replace('/ingresar');
  }

  return (
    <div className="sc ui-font">
      <header className="sc-bar">
        {backHref ? (
          <Link href={backHref} className="back">
            <Icon name="chevron-left" size={18} /> Volver
          </Link>
        ) : (
          <span className="who">
            <Icon name="shield" size={18} /> Seguridad
          </span>
        )}
        <span className="who">
          {user?.email}
          <Button variant="secondary" size="sm" onClick={logout} loading={leaving}>
            <Icon name="logout" size={16} /> Salir
          </Button>
        </span>
      </header>
      <div className={narrow ? 'sc-page narrow' : 'sc-page'}>{children}</div>
    </div>
  );
}
