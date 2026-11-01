import type { Metadata } from 'next';
import { ConversationScreen } from '@/modules/inbox';

export const metadata: Metadata = { title: 'Conversación' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConversationScreen id={id} />;
}
