import type { Metadata } from 'next';
import { ForgotPage } from '@/modules/auth';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default function Page() {
  return <ForgotPage />;
}
