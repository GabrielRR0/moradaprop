import type { Metadata } from 'next';
import { EnrollPage } from '@/modules/security';

export const metadata: Metadata = { title: 'Protege tu cuenta' };

export default function Page() {
  return <EnrollPage />;
}
