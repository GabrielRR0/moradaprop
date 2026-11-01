import { useState } from 'react';
import { isEmail, passwordProblem } from '@/lib/password';
import { toast } from '@/lib/toast';
import { codeProblem, describeError, type Problem } from '../services/auth-errors';
import { authService } from '../services/auth.service';
import { useCooldown } from './useCooldown';
import { useHumanCheck } from './useHumanCheck';

export const FORGOT_EMAIL = 1;
export const FORGOT_RESET = 2;
export const FORGOT_DONE = 3;

/** Recuperar contrasena: correo -> codigo + clave nueva -> listo. Al restablecer se cierran todas las sesiones. */
export function useForgotFlow() {
  const [step, setStep] = useState(FORGOT_EMAIL);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, setPending] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const cooldown = useCooldown();
  const humanCheck = useHumanCheck();

  async function sendCode() {
    if (!isEmail(email)) return setEmailError('Escribe un correo válido.');
    if (!humanCheck.ready) return;
    setEmailError(null);
    setPending(true);
    setProblem(null);
    try {
      await authService.forgotPassword(email.trim(), humanCheck.headers());
      cooldown.start(60);
      setStep(FORGOT_RESET);
    } catch (error) {
      const found = describeError(error, 'No pudimos enviar el código. Inténtalo de nuevo.');
      if (found.kind === 'human-check') humanCheck.refresh();
      setProblem(found);
    } finally {
      humanCheck.reset(); // cada token sirve una sola vez
      setPending(false);
    }
  }

  async function resend() {
    if (cooldown.active || !humanCheck.ready) return;
    cooldown.start(60);
    try {
      await authService.forgotPassword(email.trim(), humanCheck.headers());
      toast('Te enviamos un código nuevo', 'info');
    } catch (error) {
      const found = describeError(error, 'No pudimos reenviar el código.');
      if (found.kind === 'human-check') humanCheck.refresh();
      setProblem(found);
    } finally {
      humanCheck.reset(); // cada token sirve una sola vez
    }
  }

  async function reset() {
    const weak = passwordProblem(password);
    setPasswordError(weak);
    if (weak || code.length < 6) return;
    setPending(true);
    setProblem(null);
    try {
      await authService.resetPassword(email.trim(), code, password);
      toast('Contraseña actualizada');
      setStep(FORGOT_DONE);
    } catch (error) {
      setProblem(codeProblem(error));
      setShakeKey((k) => k + 1);
      setCode('');
    } finally {
      setPending(false);
    }
  }

  return {
    step,
    email,
    setEmail: (v: string) => {
      setEmail(v);
      setEmailError(null);
    },
    code,
    setCode,
    password,
    setPassword: (v: string) => {
      setPassword(v);
      setPasswordError(null);
    },
    emailError,
    passwordError,
    problem,
    pending,
    shakeKey,
    cooldown,
    humanCheck,
    sendCode,
    resend,
    reset,
    backToEmail: () => {
      setStep(FORGOT_EMAIL);
      setProblem(null);
    },
  };
}

export type ForgotFlow = ReturnType<typeof useForgotFlow>;
