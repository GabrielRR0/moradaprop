import { useEffect, useRef, useState } from 'react';
import type { AuthSession } from '@/lib/api-types';
import { toast } from '@/lib/toast';
import { codeProblem, describeError, type Problem } from '../services/auth-errors';
import { authService } from '../services/auth.service';
import { useCooldown } from './useCooldown';

/** Segundos de espera entre un envio del codigo y el siguiente (el API permite 1 por minuto). */
const RESEND_SECONDS = 60;

/** Verificar el correo con el codigo de 6 digitos y reenviarlo. La usan el registro y /verificar. */
export function useVerifyEmail(
  email: string,
  onVerified: (session: AuthSession) => void,
  sendOnMount = false,
) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const cooldown = useCooldown(RESEND_SECONDS);
  const sent = useRef(false);

  // Quien llega desde el login con el correo sin verificar aun no recibio un codigo nuevo.
  useEffect(() => {
    if (!sendOnMount || sent.current) return;
    sent.current = true;
    authService.resendCode(email).catch((error) => {
      setProblem(describeError(error, 'No pudimos enviar el código.'));
    });
  }, [sendOnMount, email]);

  async function verify(value: string) {
    if (pending || value.length < 6) return;
    setPending(true);
    setProblem(null);
    try {
      onVerified(await authService.verifyEmail(email, value));
    } catch (error) {
      setProblem(codeProblem(error));
      setShakeKey((k) => k + 1);
      setCode('');
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (cooldown.active) return;
    cooldown.start(RESEND_SECONDS);
    try {
      await authService.resendCode(email);
      toast('Te enviamos un código nuevo', 'info');
    } catch (error) {
      setProblem(describeError(error, 'No pudimos reenviar el código.'));
    }
  }

  return { code, setCode, pending, problem, shakeKey, cooldown, verify, resend };
}
