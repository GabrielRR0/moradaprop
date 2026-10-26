'use client';

import { StepSwitcher } from '@/components/ui';
import { useLoginFlow } from '../../hooks/useLoginFlow';
import { AuthLayout } from '../shared/AuthLayout';
import { LoginCredentials } from './LoginCredentials';
import { LoginSecondStep } from './LoginSecondStep';

export function LoginScreen({ next }: { next: string | null }) {
  const flow = useLoginFlow(next);
  return (
    <AuthLayout
      headline="Tu cuenta, siempre protegida"
      subtitle="Entra con tu huella o Face ID, o con tu correo. Te avisamos de cualquier actividad rara."
      benefits={[
        'Entra en un toque con tu huella o Face ID',
        'Avisos de seguridad dentro de la app',
        'Tú decides qué dispositivos son de confianza',
      ]}
      switchText="¿Nuevo aquí?"
      switchLabel="Crear cuenta"
      switchHref="/registro"
    >
      <StepSwitcher step={flow.step === 'credentials' ? 1 : 2}>
        {flow.step === 'credentials' ? <LoginCredentials flow={flow} /> : <LoginSecondStep flow={flow} />}
      </StepSwitcher>
    </AuthLayout>
  );
}
