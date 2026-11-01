import type { Metadata } from 'next';
import { SettingsPage } from '@/modules/admin';

export const metadata: Metadata = { title: 'Ajustes de la plataforma' };

export default function Page() {
  return <SettingsPage />;
}
