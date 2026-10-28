import { useState } from 'react';
import { refreshSession } from '@/lib/api';
import { toast } from '@/lib/toast';
import { authService, passkeyProblem, useSession, type Problem } from '@/modules/auth';

import { securityKeys } from './useSecurityData';
import { QuerySupport } from '@/support/query';

/**
 * Registrar una passkey: pide la clave otra vez (si la cuenta tiene), abre el dialogo del sistema
 * y, al terminar, renueva la sesion para que el estado de "segundo factor" quede limpio.
 */
export function usePasskeyAdd(onAdded?: () => void) {
  const { user } = useSession();
  const client = QuerySupport.useQueryClient();
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function add(password: string, label: string) {
    if (pending) return;
    if (user?.hasPassword && !password) {
      setProblem({ text: 'Escribe tu contraseña para continuar.', kind: 'credentials' });
      return;
    }
    setPending(true);
    setProblem(null);
    try {
      await authService.registerPasskey(user?.hasPassword ? password : undefined, label.trim() || undefined);
      await refreshSession();
      await client.invalidateQueries({ queryKey: securityKeys.passkeys });
      toast('Passkey agregada');
      onAdded?.();
    } catch (error) {
      setProblem(passkeyProblem(error));
    } finally {
      setPending(false);
    }
  }

  return { add, pending, problem, needsPassword: Boolean(user?.hasPassword), clearProblem: () => setProblem(null) };
}
