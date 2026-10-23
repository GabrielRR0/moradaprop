import type { Metadata } from 'next';
import { TeamPage } from '@/modules/dashboard-agency';

export const metadata: Metadata = { title: 'Equipo' };

export default function Page() {
  return <TeamPage />;
}
