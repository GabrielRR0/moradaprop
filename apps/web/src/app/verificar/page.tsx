import type { Metadata } from 'next';
import { VerifyEmailPage } from '@/modules/auth';

export const metadata: Metadata = { title: 'Verificar correo' };

export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string; next?: string }> }) {
  const { email, next } = await searchParams;
  return <VerifyEmailPage email={email} next={next} />;
}
