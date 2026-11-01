import type { Metadata } from 'next';
import { TemplatesScreen } from '@/modules/inbox';

export const metadata: Metadata = { title: 'Respuestas guardadas' };

export default function Page() {
  return <TemplatesScreen />;
}
