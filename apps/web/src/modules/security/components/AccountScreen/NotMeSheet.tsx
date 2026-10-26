'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Notice, Sheet } from '@/components/ui';
import { toast } from '@/lib/toast';
import { endSession } from '@/modules/auth';
import { useAction } from '../../hooks/useAction';
import { securityService } from '../../services/security.service';
import { PasswordSheet } from './PasswordSheet';

/** "No fui yo": las tres acciones que corta el acceso de un intruso. */
export function NotMeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const action = useAction();
  const [changing, setChanging] = useState(false);

  async function logoutAll() {
    const ok = await action.run(async () => {
      await securityService.logoutAll();
      return true;
    });
    if (ok) {
      toast('Cerramos todas tus sesiones');
      endSession(true);
      router.replace('/ingresar');
    }
  }

  return (
    <>
      <Sheet open={open && !changing} onClose={onClose} title="Protege tu cuenta ahora">
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>
          Haz esto en orden. Primero cierra todas las sesiones y luego cambia tu contraseña.
        </p>
        <Notice tone="error" show={Boolean(action.problem)}>
          {action.problem?.text}
        </Notice>
        <Button block variant="danger" loading={action.pending} onClick={logoutAll}>
          <Icon name="logout" size={18} /> Cerrar todas las sesiones
        </Button>
        <Button block variant="secondary" onClick={() => setChanging(true)}>
          <Icon name="lock" size={18} /> Cambiar mi contraseña
        </Button>
        <Button block variant="secondary" onClick={onClose}>
          Revisar mis dispositivos
        </Button>
      </Sheet>
      <PasswordSheet
        open={open && changing}
        onClose={() => {
          setChanging(false);
          onClose();
        }}
      />
    </>
  );
}
