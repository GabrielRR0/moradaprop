import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AuthSession, LoginChallenge, SecondFactorMethod } from '@/lib/api-types';
import { isChallenge } from '@/lib/api-types';
import { isEmail } from '@/lib/password';
import { toast } from '@/lib/toast';
import { codeProblem, loginProblem, passkeyProblem, type Problem } from '../services/auth-errors';
import { routeAfterAuth } from '../services/auth-routing';
import { authService } from '../services/auth.service';
import { passkeysSupported } from '../services/webauthn';
import { useCooldown } from './useCooldown';
import { useHumanCheck } from './useHumanCheck';

/** Los cuatro metodos de segundo paso, en el orden en que se ofrecen. */
const METHOD_ORDER: SecondFactorMethod[] = ['passkey', 'totp', 'backup', 'email'];
/** El desafio vence a los 5 minutos: se vuelve al inicio un poco antes para no fallar en el ultimo segundo. */
const CHALLENGE_MS = 5 * 60_000 - 10_000;
/** Tras tantos fallos en un inicio inusual el servidor bloquea la cuenta 30 minutos. */
const FAILS_BEFORE_LOCK = 3;

export type LoginStep = 'credentials' | 'second';

/**
 * Login como maquina de estados (docs/FRONTEND-SEGURIDAD.md, seccion 6):
 * correo y clave -> (sesion | segundo paso | rechazo con `code`).
 */
export function useLoginFlow(next: string | null) {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [mode, setMode] = useState<SecondFactorMethod>('totp');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [fails, setFails] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [canPasskey, setCanPasskey] = useState(false);
  const cooldown = useCooldown();
  const humanCheck = useHumanCheck();

  useEffect(() => setCanPasskey(passkeysSupported()), []);

  const enter = useCallback(
    (session: AuthSession) => {
      toast('Bienvenido de nuevo');
      router.replace(routeAfterAuth(session, next));
    },
    [router, next],
  );

  const fail = useCallback(
    (found: Problem | null) => {
      setProblem(found);
      if (found) {
        setShakeKey((k) => k + 1);
        if (found.kind === 'rate-limit') cooldown.start(8);
      }
    },
    [cooldown],
  );

  // El desafio vence solo: se vuelve al inicio con un aviso claro.
  useEffect(() => {
    if (!challenge) return;
    const timer = window.setTimeout(() => {
      setChallenge(null);
      setStep('credentials');
      setProblem({ text: 'La verificación venció. Ingresa de nuevo.', kind: 'generic' });
    }, CHALLENGE_MS);
    return () => window.clearTimeout(timer);
  }, [challenge]);

  const available = (methods: SecondFactorMethod[]) =>
    METHOD_ORDER.filter((m) => methods.includes(m) && (m !== 'passkey' || canPasskey));

  async function submitCredentials() {
    const errors = {
      email: isEmail(email) ? undefined : 'Escribe un correo válido.',
      password: password ? undefined : 'Escribe tu contraseña.',
    };
    setFieldErrors(errors);
    if (errors.email || errors.password || !humanCheck.ready) return;
    setPending(true);
    setProblem(null);
    try {
      const result = await authService.login(email.trim(), password, humanCheck.headers());
      if (isChallenge(result)) {
        const methods = available(result.methods);
        setChallenge(result);
        setMode(methods[0] ?? 'totp');
        setFails(0);
        setEmailSent(false);
        setStep('second');
      } else {
        enter(result);
      }
    } catch (error) {
      const found = loginProblem(error);
      if (found.kind === 'human-check') humanCheck.refresh();
      if (found.kind === 'verify-email') {
        router.push(`/verificar?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      fail(found);
    } finally {
      humanCheck.reset(); // cada token sirve una sola vez
      setPending(false);
    }
  }

  async function submitCode(code: string) {
    if (!challenge || pending) return;
    setPending(true);
    setProblem(null);
    try {
      enter(await authService.loginSecondFactor(challenge.challengeToken, code.trim()));
    } catch (error) {
      const found = codeProblem(error);
      if (found.kind === 'credentials') setFails((n) => n + 1);
      fail(found);
    } finally {
      setPending(false);
    }
  }

  async function submitPasskeyStepUp() {
    if (!challenge || pending) return;
    setPending(true);
    setProblem(null);
    try {
      enter(await authService.stepUpWithPasskey(challenge.challengeToken));
    } catch (error) {
      fail(passkeyProblem(error));
    } finally {
      setPending(false);
    }
  }

  async function submitPasskeyLogin() {
    if (pending) return;
    setPending(true);
    setProblem(null);
    try {
      enter(await authService.loginWithPasskey());
    } catch (error) {
      fail(passkeyProblem(error));
    } finally {
      setPending(false);
    }
  }

  async function requestEmailCode() {
    if (!challenge || cooldown.active) return;
    setPending(true);
    try {
      await authService.sendEmailCode(challenge.challengeToken);
      setEmailSent(true);
      cooldown.start(60);
      toast('Te enviamos un código por correo', 'info');
    } catch (error) {
      fail(codeProblem(error));
    } finally {
      setPending(false);
    }
  }

  function chooseMode(next: SecondFactorMethod) {
    setMode(next);
    setProblem(null);
    if (next === 'email' && !emailSent) void requestEmailCode();
  }

  function backToCredentials() {
    setStep('credentials');
    setChallenge(null);
    setProblem(null);
    setFails(0);
  }

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    pending,
    problem,
    fieldErrors,
    shakeKey,
    canPasskey,
    cooldown,
    humanCheck,
    // segundo paso
    challenge,
    modes: challenge ? available(challenge.methods) : [],
    mode,
    emailSent,
    lowAttempts: Boolean(challenge?.unusual) && fails >= FAILS_BEFORE_LOCK - 1,
    locked: problem?.kind === 'locked',
    // acciones
    submitCredentials,
    submitCode,
    submitPasskeyStepUp,
    submitPasskeyLogin,
    requestEmailCode,
    chooseMode,
    backToCredentials,
  };
}

export type LoginFlow = ReturnType<typeof useLoginFlow>;
