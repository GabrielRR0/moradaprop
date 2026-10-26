'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Notice, PasswordStrength, Sheet } from '@/components/ui';
import { passwordProblem } from '@/lib/password';
import { toast } from '@/lib/toast';
import { useSession } from '@/modules/auth';
import { useAction } from '../../hooks/useAction';
import { securityService } from '../../services/security.service';

/** Cambiar la contrasena desde la cuenta: cierra las DEMAS sesiones y conserva la actual. */
export function PasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useSession();
  const action = useAction();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const weak = passwordProblem(next);
    setError(weak);
    if (weak) return;
    const ok = await action.run(async () => {
      await securityService.changePassword(user?.hasPassword ? current : undefined, next);
      return true;
    });
    if (ok) {
      toast('Contraseña actualizada');
      setCurrent('');
      setNext('');
      onClose();
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={user?.hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
        <Notice tone="error" show={Boolean(action.problem)}>
          {action.problem?.text}
        </Notice>
        {user?.hasPassword && (
          <Field label="Contraseña actual" type="password" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />
        )}
        <Field
          label="Contraseña nueva"
          type="password"
          value={next}
          onChange={(value) => {
            setNext(value);
            setError(null);
          }}
          autoComplete="new-password"
          error={error}
        />
        <PasswordStrength password={next} />
        <Notice tone="info">Cerraremos tus otras sesiones; esta se mantiene abierta.</Notice>
        <Button type="submit" block loading={action.pending} disabled={!next || (Boolean(user?.hasPassword) && !current)}>
          Guardar contraseña
        </Button>
      </form>
    </Sheet>
  );
}
