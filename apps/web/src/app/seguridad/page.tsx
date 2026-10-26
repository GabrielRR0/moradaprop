import type { Metadata } from 'next';
import { AccountPage } from '@/modules/security';

export const metadata: Metadata = { title: 'Seguridad de la cuenta' };

export default function Page() {
  return <AccountPage />;
}
