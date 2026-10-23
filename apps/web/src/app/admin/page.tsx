import type { Metadata } from 'next';
import { AdminPage } from '@/modules/admin';

export const metadata: Metadata = { title: 'Administración' };

export default function Page() {
  return <AdminPage />;
}
