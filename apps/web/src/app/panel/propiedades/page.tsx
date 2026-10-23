import type { Metadata } from 'next';
import { InventoryPage } from '@/modules/dashboard-agency';

export const metadata: Metadata = { title: 'Propiedades' };

export default function Page() {
  return <InventoryPage />;
}
