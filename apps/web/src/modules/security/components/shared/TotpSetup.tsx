'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, CodeInput, Notice, StepSwitcher } from '@/components/ui';
import type { TwoFactorSetup } from '@/lib/api-types';
import { describeError, type Problem } from '@/modules/auth';
import { securityService } from '../../services/security.service';
import { BackupCodes } from './BackupCodes';

/**
 * Activar la app autenticadora: 1) escanear el QR y escribir el primer codigo,
 * 2) guardar los 8 codigos de respaldo (se muestran una sola vez).
 * `onStage` avisa si ya se estan mostrando los codigos (ahi no se debe poder cerrar el panel).
 */
export function TotpSetup({ onDone, onStage }: { onDone: () => void; onStage?: (showingCodes: boolean) => void }) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, setPending] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const started = useRef(false);

  // Cada llamada a /2fa/setup genera un secreto nuevo: se pide UNA sola vez al abrir.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    securityService
      .twoFactorSetup()
      .then(setSetup)
      .catch((error) => setProblem(describeError(error, 'No pudimos preparar la app autenticadora.')));
  }, []);

  async function confirm(value: string) {
    if (pending || value.length < 6) return;
    setPending(true);
    setProblem(null);
    try {
      const backupCodes = await securityService.twoFactorConfirm(value);
      setCodes(backupCodes);
      onStage?.(true);
    } catch (error) {
      setProblem(describeError(error, 'Ese código no es válido. Revisa la hora de tu teléfono.'));
      setShakeKey((k) => k + 1);
      setCode('');
    } finally {
      setPending(false);
    }
  }

  return (
    <StepSwitcher step={codes ? 2 : 1}>
      {codes ? (
        <BackupCodes codes={codes} onDone={onDone} />
      ) : (
        <div className="sc-qr" style={{ alignItems: 'stretch', gap: 16 }}>
          <Notice tone="error" show={Boolean(problem)}>
            {problem?.text}
          </Notice>
          <div className="sc-qr">
            {setup ? (
              <>
                <img src={setup.qrCode} alt="Código QR para tu app autenticadora" />
                <span className="ui-hint">¿No puedes escanear? Escribe esta clave en tu app:</span>
                <span className="sc-secret">{setup.secret}</span>
              </>
            ) : (
              !problem && <div className="sc-skel" style={{ width: 200, height: 200 }} />
            )}
          </div>
          <p className="ui-hint" style={{ margin: 0, textAlign: 'center' }}>
            Escanéalo con Google Authenticator, Authy o similar y escribe el código de 6 dígitos que aparece.
          </p>
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={(value) => void confirm(value)}
            bad={Boolean(problem) && shakeKey > 0}
            shakeKey={shakeKey}
            disabled={!setup || pending}
          />
          <Button block loading={pending} disabled={!setup || code.length < 6} onClick={() => confirm(code)}>
            Activar
          </Button>
        </div>
      )}
    </StepSwitcher>
  );
}
