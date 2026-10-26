'use client';

import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { Button, CodeInput, Field, Notice } from '@/components/ui';
import type { SecondFactorMethod } from '@/lib/api-types';
import { clock } from '../../hooks/useCooldown';
import type { LoginFlow } from '../../hooks/useLoginFlow';

const METHODS: Record<SecondFactorMethod, { label: string; icon: IconName }> = {
  passkey: { label: 'Huella / Face ID', icon: 'fingerprint' },
  totp: { label: 'App', icon: 'smartphone' },
  backup: { label: 'Respaldo', icon: 'key' },
  email: { label: 'Correo', icon: 'mail' },
};

/** Paso 2 del login: solo se ofrecen los metodos que el servidor dijo que esta cuenta puede usar. */
export function LoginSecondStep({ flow }: { flow: LoginFlow }) {
  const { problem, pending, mode, challenge } = flow;
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState('');

  function changeMode(next: SecondFactorMethod) {
    setCode('');
    setBackup('');
    flow.chooseMode(next);
  }

  function submitBackup(event: FormEvent) {
    event.preventDefault();
    if (backup.trim()) void flow.submitCode(backup);
  }

  const showCode = mode === 'totp' || (mode === 'email' && flow.emailSent);

  return (
    <div className="au-col">
      <div>
        <button type="button" className="ui-link" onClick={flow.backToCredentials} style={{ marginLeft: -2 }}>
          <Icon name="chevron-left" size={16} style={{ verticalAlign: '-3px' }} /> Volver
        </button>
        <h1 className="au-title" style={{ marginTop: 8 }}>
          Verifica que eres tú
        </h1>
        <p className="au-sub">
          Elige cómo quieres confirmar tu identidad para entrar a <b>{flow.email}</b>.
        </p>
      </div>

      <Notice tone="warn" show={Boolean(challenge?.unusual)}>
        Detectamos un inicio de sesión inusual. Verifica que eres tú.
      </Notice>
      <Notice tone="warn" show={flow.lowAttempts && !flow.locked}>
        Te quedan pocos intentos: tras 3 fallos bloqueamos la cuenta 30 minutos.
      </Notice>
      <Notice tone={flow.locked ? 'warn' : 'error'} show={Boolean(problem)}>
        {problem?.text}
      </Notice>

      {flow.modes.length > 1 && (
        <div role="tablist" aria-label="Método de verificación" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {flow.modes.map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={m === mode}
              className={m === mode ? 'au-chip on' : 'au-chip'}
              onClick={() => changeMode(m)}
            >
              <Icon name={METHODS[m].icon} size={16} />
              {METHODS[m].label}
              {m === mode && <motion.span layoutId="chip-bg" className="au-chip-bg" />}
            </button>
          ))}
        </div>
      )}

      {mode === 'passkey' && (
        <div className="au-center" style={{ padding: '8px 0' }}>
          <span className={pending ? 'ui-pulse waiting' : 'ui-pulse'}>
            <Icon name="fingerprint" size={46} strokeWidth={1.8} />
          </span>
          <p className="au-sub" style={{ margin: 0 }}>
            Tu dispositivo te pedirá la huella, la cara o el PIN.
          </p>
          <Button block loading={pending} onClick={flow.submitPasskeyStepUp}>
            Usar huella / Face ID
          </Button>
        </div>
      )}

      {showCode && (
        <div className="au-col">
          <p className="au-sub" style={{ margin: 0 }}>
            {mode === 'email'
              ? 'Escribe el código de 6 dígitos que te enviamos por correo.'
              : 'Escribe el código de 6 dígitos de tu app autenticadora.'}
          </p>
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={(value) => void flow.submitCode(value)}
            bad={problem?.kind === 'credentials'}
            shakeKey={flow.shakeKey}
            disabled={pending}
            autoFocus
          />
          <Button block loading={pending} disabled={code.length < 6} onClick={() => flow.submitCode(code)}>
            Verificar
          </Button>
        </div>
      )}

      {mode === 'email' && (
        <div className="au-between">
          <span>{flow.emailSent ? '¿No te llegó?' : 'Te lo enviamos ahora.'}</span>
          <button type="button" className="ui-link" disabled={flow.cooldown.active || pending} onClick={flow.requestEmailCode}>
            {flow.cooldown.active ? `Reenviar en ${clock(flow.cooldown.left)}` : 'Enviar código'}
          </button>
        </div>
      )}

      {mode === 'backup' && (
        <form className="au-col" onSubmit={submitBackup}>
          <Field
            label="Código de respaldo"
            value={backup}
            onChange={setBackup}
            placeholder="xxxxx-xxxxx"
            autoComplete="off"
            hint="Cada código de respaldo sirve una sola vez."
            autoFocus
          />
          <Button type="submit" block loading={pending} disabled={!backup.trim()}>
            Verificar
          </Button>
        </form>
      )}
    </div>
  );
}
