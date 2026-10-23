import type { Metadata } from 'next';
import { RegisterPage } from '@/modules/auth';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function Page() {
  return <RegisterPage />;
}
