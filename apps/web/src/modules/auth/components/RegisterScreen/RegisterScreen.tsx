'use client';

import { StepSwitcher } from '@/components/ui';
import { STEP_CODE, STEP_DATA, STEP_DONE } from '../../hooks/register-data';
import { useRegisterFlow } from '../../hooks/useRegisterFlow';
import { AuthLayout } from '../shared/AuthLayout';
import { VerifyEmailStep } from '../shared/VerifyEmailStep';
import { RegisterDataStep } from './RegisterDataStep';
import { RegisterDoneStep } from './RegisterDoneStep';
import { RegisterRoleStep } from './RegisterRoleStep';

/** Registro de cuenta. El panel de color cambia segun el perfil elegido. */
export function RegisterScreen() {
  const flow = useRegisterFlow();
  const { step, role } = flow;
  const total = 3;
  return (
    <AuthLayout
      headline={role.headline}
      subtitle={role.subtitle}
      benefits={role.benefits}
      switchText="¿Ya tienes cuenta?"
      switchLabel="Ingresar"
      switchHref="/ingresar"
    >
      {step !== STEP_DONE && (
        <div className="au-col" style={{ gap: 8, marginBottom: 22 }}>
          <div className="au-progress" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <i key={n} className={step >= n ? 'on' : undefined} />
            ))}
          </div>
          <span className="ui-hint" style={{ fontWeight: 700 }}>{`Paso ${step} de ${total}`}</span>
        </div>
      )}
      <StepSwitcher step={step}>
        {step === STEP_DATA ? (
          <RegisterDataStep flow={flow} />
        ) : step === STEP_CODE ? (
          <VerifyEmailStep email={flow.form.email.trim()} onVerified={flow.onVerified} onBack={flow.goBack} />
        ) : step === STEP_DONE ? (
          <RegisterDoneStep flow={flow} />
        ) : (
          <RegisterRoleStep flow={flow} />
        )}
      </StepSwitcher>
    </AuthLayout>
  );
}
