import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { classIf } from '@/lib/classes';
import { toast } from '@/lib/toast';
import {
  ROLES,
  STEP_CODE,
  STEP_DATA,
  STEP_DONE,
  STEP_ROLE,
  STRENGTH_LABELS,
} from './register-data';

/** Cuántos requisitos cumple la contraseña: 8+ letras, mayúscula y minúscula, un número, un símbolo. */
function passwordStrength(password: string): number {
  let points = 0;
  if (password.length >= 8) points += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
  if (/[0-9]/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  return points;
}

/**
 * Lógica del registro, compartida por escritorio y teléfono:
 * en qué paso va, qué perfil eligió y qué tan fuerte es su contraseña.
 */
export function useRegisterFlow() {
  const [step, setStep] = useState(STEP_ROLE);
  const [roleId, setRoleId] = useState('agency');
  const [password, setPassword] = useState('');

  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0];
  const strength = passwordStrength(password);

  function goNext() {
    if (step === STEP_CODE) toast('Cuenta verificada');
    setStep(Math.min(STEP_DONE, step + 1));
  }

  function goBack() {
    setStep(Math.max(STEP_ROLE, step - 1));
  }

  function restart() {
    setStep(STEP_ROLE);
    setPassword('');
  }

  function onPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  return {
    // Qué paso se muestra
    step,
    showRoleStep: step === STEP_ROLE,
    showDataStep: step === STEP_DATA,
    showCodeStep: step === STEP_CODE,
    showDoneStep: step === STEP_DONE,

    // Barras de avance (la 1 siempre prendida, la 2 desde el paso 2, la 3 desde el paso 3)
    progressBar1: classIf('bar', step >= 1),
    progressBar2: classIf('bar', step >= 2),
    progressBar3: classIf('bar', step >= 3),

    // Perfil elegido
    role,
    isAgency: role.id === 'agency',
    roleCards: ROLES.map((r) => ({
      title: r.title,
      shortTitle: r.shortTitle,
      description: r.description,
      shortDescription: r.shortDescription,
      icon: r.icon,
      className: classIf('role', r.id === roleId),
      choose: () => setRoleId(r.id),
    })),
    dataStepTitle: role.dataTitle,
    doneButton: role.doneButton,
    doneLink: role.doneLink,

    // Fuerza de la contraseña: 4 barritas y una palabra
    strengthBar1: classIf('bar', strength >= 1),
    strengthBar2: classIf('bar', strength >= 2),
    strengthBar3: classIf('bar', strength >= 3),
    strengthBar4: classIf('bar', strength >= 4),
    strengthLabel: STRENGTH_LABELS[strength],
    onPasswordChange,

    // Botones
    goNext,
    goBack,
    restart,
  };
}
