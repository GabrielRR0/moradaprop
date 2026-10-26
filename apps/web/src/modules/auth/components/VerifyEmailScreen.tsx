'use client';

import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import type { AuthSession } from '@/lib/api-types';
import { routeAfterAuth } from '../services/auth-routing';
import { AuthLayout } from './shared/AuthLayout';
import { VerifyEmailStep } from './shared/VerifyEmailStep';

/** Llega aqui quien intento entrar con un correo sin verificar: se le envia un codigo nuevo. */
export function VerifyEmailScreen({ email, next }: { email: string; next: string | null }) {
  const router = useRouter();

  function onVerified(session: AuthSession) {
    toast('Cuenta verificada');
    router.replace(routeAfterAuth(session, next));
  }

  return (
    <AuthLayout
      headline="Un paso para empezar"
      subtitle="Confirmamos tu correo para proteger tu cuenta y avisarte de lo importante."
      benefits={['Código de un solo uso', 'Vence en pocos minutos', 'Tu cuenta, solo tuya']}
      switchText="¿Otra cuenta?"
      switchLabel="Ingresar"
      switchHref="/ingresar"
    >
      <VerifyEmailStep email={email} onVerified={onVerified} sendOnMount />
    </AuthLayout>
  );
}
