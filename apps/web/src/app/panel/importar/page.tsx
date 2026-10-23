import type { Metadata } from 'next';
import { ImportPage } from '@/modules/dashboard-agency';

export const metadata: Metadata = { title: 'Importar desde Excel' };

export default function Page() {
  return <ImportPage />;
}
