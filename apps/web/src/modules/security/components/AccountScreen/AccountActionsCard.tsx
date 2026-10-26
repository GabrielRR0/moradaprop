'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { toast } from '@/lib/toast';
import { endSession, useSession } from '@/modules/auth';
import { securityService } from '../../services/security.service';
import { Card, ConfirmSheet } from '../shared/Card';
import { PasswordSheet } from './PasswordSheet';

/** Contrasena y "cerrar todas las sesiones" (incluida esta). */
export function AccountActionsCard({ index }: { index: number }) {
  const router = useRouter();
  const { user } = useSession();
  const [password, setPassword] = useState(false);
  const [all, setAll] = useState(false);

  return (
    <Card index={index} title="Contraseña y sesiones">
      <div className="sc-actions">
        <Button variant="secondary" onClick={() => setPassword(true)}>
          <Icon name="lock" size={18} /> {user?.hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}
        </Button>
        <Button variant="secondary" onClick={() => setAll(true)}>
          <Icon name="logout" size={18} /> Cerrar todas las sesiones
        </Button>
      </div>
      <PasswordSheet open={password} onClose={() => setPassword(false)} />
      <ConfirmSheet
        open={all}
        onClose={() => setAll(false)}
        title="¿Cerrar todas las sesiones?"
        text="Se cerrará la sesión en todos tus dispositivos, incluido este. Tendrás que ingresar de nuevo."
        confirmLabel="Cerrar todas"
        danger
        onConfirm={async () => {
          await securityService.logoutAll();
          toast('Cerramos todas tus sesiones');
          endSession(true);
          router.replace('/ingresar');
        }}
      />
    </Card>
  );
}
