'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { Button, CodeInput, Field, Notice, Sheet } from '@/components/ui';
import { toast } from '@/lib/toast';
import { useSession } from '@/modules/auth';
import { useAction } from '../../hooks/useAction';
import { securityService } from '../../services/security.service';
import { BackupCodes } from '../shared/BackupCodes';
import { Card } from '../shared/Card';
import { TotpSetup } from '../shared/TotpSetup';

type Mode = 'disable' | 'codes';

/** Pide contrasena (si la cuenta tiene) y un codigo de la app para desactivar o regenerar respaldos. */
function ProofSheet({ mode, onClose }: { mode: Mode | null; onClose: () => void }) {
  const { user } = useSession();
  const action = useAction('El código o la contraseña no son correctos.');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);

  function close() {
    setPassword('');
    setCode('');
    setCodes(null);
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length < 6 || !mode) return;
    const proof = { password: user?.hasPassword ? password : undefined, code };
    const done = await action.run(async () => {
      if (mode === 'disable') {
        await securityService.twoFactorDisable(proof);
        return [] as string[];
      }
      return securityService.regenerateBackupCodes(proof);
    });
    if (!done) return;
    if (mode === 'disable') {
      toast('Verificación en dos pasos desactivada', 'warn');
      close();
    } else setCodes(done);
  }

  return (
    <Sheet
      open={Boolean(mode)}
      onClose={close}
      dismissible={!codes}
      title={mode === 'disable' ? 'Desactivar app autenticadora' : 'Nuevos códigos de respaldo'}
    >
      {codes ? (
        <BackupCodes codes={codes} onDone={close} />
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
          <Notice tone="warn" show={mode === 'codes'}>
            Los códigos anteriores dejarán de servir.
          </Notice>
          <Notice tone="error" show={Boolean(action.problem)}>
            {action.problem?.text}
          </Notice>
          {user?.hasPassword && (
            <Field label="Tu contraseña" type="password" value={password} onChange={setPassword} autoComplete="current-password" autoFocus />
          )}
          <div className="ui-field">
            <span className="ui-label">Código de tu app</span>
            <CodeInput value={code} onChange={setCode} disabled={action.pending} />
          </div>
          <Button type="submit" block variant={mode === 'disable' ? 'danger' : 'primary'} loading={action.pending} disabled={code.length < 6}>
            {mode === 'disable' ? 'Desactivar' : 'Generar códigos'}
          </Button>
        </form>
      )}
    </Sheet>
  );
}

/** App autenticadora (Google Authenticator, Authy...): activar, regenerar respaldos o desactivar. */
export function TotpCard({ index }: { index: number }) {
  const { user } = useSession();
  const enabled = Boolean(user?.twoFactorEnabled);
  const [setupOpen, setSetupOpen] = useState(false);
  const [showingCodes, setShowingCodes] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);

  function closeSetup() {
    setSetupOpen(false);
    setShowingCodes(false);
  }

  return (
    <Card
      index={index}
      title="App autenticadora"
      lead="Códigos de 6 dígitos que cambian cada 30 segundos, como segundo paso al entrar."
    >
      <div className="sc-item">
        <span className={enabled ? 'ico ok' : 'ico'}>
          <Icon name="smartphone" size={22} />
        </span>
        <span className="txt">
          <b>{enabled ? 'Activada' : 'No activada'}</b>
          <span>{enabled ? 'Tu cuenta pide un código al entrar desde sitios nuevos.' : 'Actívala si no usas passkeys o quieres un respaldo.'}</span>
        </span>
      </div>
      <div className="sc-actions">
        {enabled ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => setMode('codes')}>
              <Icon name="key" size={16} /> Nuevos códigos de respaldo
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMode('disable')}>
              Desactivar
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setSetupOpen(true)}>
            Activar
          </Button>
        )}
      </div>
      <Sheet open={setupOpen} onClose={closeSetup} dismissible={!showingCodes} title="Activar app autenticadora">
        {setupOpen && <TotpSetup onDone={closeSetup} onStage={setShowingCodes} />}
      </Sheet>
      <ProofSheet mode={mode} onClose={() => setMode(null)} />
    </Card>
  );
}
