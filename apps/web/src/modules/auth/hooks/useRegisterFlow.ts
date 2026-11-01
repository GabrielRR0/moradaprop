import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AuthSession } from '@/lib/api-types';
import { isEmail, passwordProblem } from '@/lib/password';
import { toast } from '@/lib/toast';
import { describeError, type Problem } from '../services/auth-errors';
import { mustEnrollNow, routeAfterAuth } from '../services/auth-routing';
import { authService, type AccountType } from '../services/auth.service';
import { useCooldown } from './useCooldown';
import { useHumanCheck } from './useHumanCheck';
import { ROLES, STEP_CODE, STEP_DATA, STEP_DONE, STEP_ROLE } from './register-data';

type FieldName = 'agencyName' | 'firstName' | 'lastName' | 'email' | 'phone' | 'password';
type Errors = Partial<Record<FieldName, string>>;

const ACCOUNT_TYPE: Record<string, AccountType> = {
  client: 'CLIENT',
  owner: 'OWNER',
  agency: 'AGENCY',
};

/** "0412 000 0000" o "412-0000000" -> "+584120000000" (7 a 15 digitos, como pide el API). */
function toInternationalPhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  return digits ? `+58${digits}` : undefined;
}

/** Registro en 4 pasos: perfil -> datos -> codigo del correo -> listo. Conectado al API. */
export function useRegisterFlow() {
  const router = useRouter();
  const [step, setStep] = useState(STEP_ROLE);
  const [roleId, setRoleId] = useState('client');
  const [form, setForm] = useState({
    agencyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, setPending] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const cooldown = useCooldown();
  const humanCheck = useHumanCheck();

  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0];
  const isAgency = role.id === 'agency';

  function setField(name: FieldName, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function validate(): Errors {
    const found: Errors = {};
    if (isAgency && form.agencyName.trim().length < 2) found.agencyName = 'Escribe el nombre.';
    if (form.firstName.trim().length < 1) found.firstName = 'Escribe tu nombre.';
    if (form.lastName.trim().length < 1) found.lastName = 'Escribe tu apellido.';
    if (!isEmail(form.email)) found.email = 'Escribe un correo válido.';
    const phone = toInternationalPhone(form.phone);
    if (phone && !/^\+\d{7,15}$/.test(phone)) found.phone = 'Revisa el número.';
    const weak = passwordProblem(form.password);
    if (weak) found.password = weak;
    return found;
  }

  async function createAccount() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || pending || cooldown.active || !humanCheck.ready) return;
    setPending(true);
    setProblem(null);
    try {
      await authService.register({
        email: form.email.trim(),
        password: form.password,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        accountType: ACCOUNT_TYPE[role.id],
        phone: toInternationalPhone(form.phone),
        agencyName: isAgency ? form.agencyName.trim() : undefined,
      }, humanCheck.headers());
      setStep(STEP_CODE);
    } catch (error) {
      const found = describeError(error, 'No pudimos crear la cuenta. Inténtalo de nuevo.');
      if (found.kind === 'rate-limit') cooldown.start(10);
      if (found.kind === 'human-check') humanCheck.refresh();
      setProblem(found);
    } finally {
      humanCheck.reset(); // cada token sirve una sola vez
      setPending(false);
    }
  }

  function onVerified(next: AuthSession) {
    toast('Cuenta verificada');
    setSession(next);
    setStep(STEP_DONE);
  }

  /** Despues de verificar: dueno y agencia nuevos deben proteger la cuenta antes que nada. */
  const mustProtect = session ? mustEnrollNow(session) : false;
  function finish() {
    if (session) router.replace(mustProtect ? '/seguridad/activar' : routeAfterAuth(session, role.doneLink));
  }

  return {
    step,
    role,
    roleId,
    setRoleId,
    isAgency,
    form,
    setField,
    errors,
    problem,
    pending,
    cooldown,
    humanCheck,
    mustProtect,
    goData: () => setStep(STEP_DATA),
    goBack: () => setStep((s) => Math.max(STEP_ROLE, s - 1)),
    createAccount,
    onVerified,
    finish,
  };
}

export type RegisterFlow = ReturnType<typeof useRegisterFlow>;
