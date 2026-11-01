'use client';

import type { ReactNode } from 'react';
import { Button, CodeInput, Notice } from '@/components/ui';
import type { AuthSession } from '@/lib/api-types';
import { clock } from '../../hooks/useCooldown';
import { useVerifyEmail } from '../../hooks/useVerifyEmail';
import { HumanCheck } from './HumanCheck';

/** Pide el codigo de 6 digitos que llego al correo. Verifica solo al completar la sexta casilla. */
export function VerifyEmailStep({
  email,
  onVerified,
  onBack,
  backLabel = 'Atrás',
  sendOnMount,
  footer,
}: {
  email: string;
  onVerified: (session: AuthSession) => void;
  onBack?: () => void;
  backLabel?: string;
  /** Envia un codigo nuevo al abrir el paso (cuando el usuario llega sin haber recibido uno). */
  sendOnMount?: boolean;
  footer?: ReactNode;
}) {
  const v = useVerifyEmail(email, onVerified, sendOnMount);
  return (
    <div className="au-col">
      <div>
        <h1 className="au-title">Revisa tu correo</h1>
        <p className="au-sub">
          Si <b>{email}</b> es un correo válido, te enviamos un código de 6 dígitos. Escríbelo aquí.
        </p>
      </div>
      <Notice tone="error" show={Boolean(v.problem)}>
        {v.problem?.text}
      </Notice>
      <CodeInput
        value={v.code}
        onChange={v.setCode}
        onComplete={(value) => void v.verify(value)}
        bad={v.problem?.kind === 'credentials'}
        shakeKey={v.shakeKey}
        disabled={v.pending}
        autoFocus
      />
      <div className="au-between">
        <span>¿No te llegó?</span>
        <button type="button" className="ui-link" disabled={v.cooldown.active || !v.humanCheck.ready} onClick={v.resend}>
          {v.cooldown.active ? `Reenviar en ${clock(v.cooldown.left)}` : 'Reenviar código'}
        </button>
      </div>
      {/* Si el codigo se envia solo al abrir el paso, el widget se muestra completo; si no, solo aparece si hace falta o falla. */}
      <HumanCheck check={v.humanCheck} quiet={!sendOnMount} />
      <div className="au-row">
        {onBack && (
          <div style={{ flex: '0 0 auto' }}>
            <Button variant="secondary" onClick={onBack} disabled={v.pending}>
              {backLabel}
            </Button>
          </div>
        )}
        <Button block loading={v.pending} disabled={v.code.length < 6} onClick={() => v.verify(v.code)}>
          Verificar
        </Button>
      </div>
      {footer}
    </div>
  );
}
