import type { Metadata } from 'next';
import { InboxScreen } from '@/modules/inbox';

export const metadata: Metadata = { title: 'Mensajes' };

export default function Page() {
  return <InboxScreen />;
}
