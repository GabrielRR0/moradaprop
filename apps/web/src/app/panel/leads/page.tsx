import type { Metadata } from 'next';
import { LeadsPage } from '@/modules/dashboard-agency';

export const metadata: Metadata = { title: 'Leads y citas' };

export default function Page() {
  return <LeadsPage />;
}
