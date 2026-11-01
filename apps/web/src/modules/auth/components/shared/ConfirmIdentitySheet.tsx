'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Field, Notice, Sheet } from '@/components/ui';
import type { ConfirmIdentity } from '../../hooks/useConfirmIdentity';
import { describeError, passkeyProblem, type Problem } from '../../services/auth-errors';
import { authService } from '../../services/auth.service';
import { passkeysSupported } from '../../services/webauthn';

/** Contenido del panel; aparte para que el codigo y el error empiecen vacios cada vez que se abre. */
function Body({ identity }: { identity: ConfirmIdentity }) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function run(action: () => Promise<unknown>, translate: (error: unknown) => Problem | null) {
    setPending(true);
    setProblem(null);
    try {
      await action();
      identity.done();
    } catch (error) {
      setProblem(translate(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="au-col">
      <p className="au-sub" style={{ margin: 0 }}>
        Por seguridad, antes de hacer este cambio confirma tu segundo factor: escribe el código de tu app autenticadora o uno de tus códigos de respaldo.
      </p>
      <Notice tone="error" show={Boolean(problem)}>
        {problem?.text}
      </Notice>
      <form
        className="au-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (code.trim().length >= 6) void run(() => authService.reverifyWithCode(code.trim()), (error) => describeError(error, 'Código incorrecto o vencido.'));
        }}
      >
        <Field label="Código" value={code} onChange={setCode} placeholder="123456" autoComplete="one-time-code" inputMode="text" maxLength={11} autoFocus disabled={pending} />
        <Button type="submit" block loading={pending} disabled={code.trim().length < 6}>
          Confirmar
        </Button>
      </form>
      {passkeysSupported() && (
        <Button variant="secondary" block disabled={pending} onClick={() => void run(() => authService.reverifyWithPasskey(), passkeyProblem)}>
          <Icon name="fingerprint" size={22} />
          Usar huella / Face ID
        </Button>
      )}
    </div>
  );
}

/** Panel "Confirma que eres tú": pide el segundo factor antes de una accion sensible (ver `useConfirmIdentity`). */
export function ConfirmIdentitySheet({ identity }: { identity: ConfirmIdentity }) {
  return (
    <Sheet open={identity.open} onClose={identity.cancel} title="Confirma que eres tú">
      <Body identity={identity} />
    </Sheet>
  );
}
