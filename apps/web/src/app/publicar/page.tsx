import type { Metadata } from 'next';
import { PublishPage } from '@/modules/publish';

export const metadata: Metadata = { title: 'Publicar propiedad' };

export default function Page() {
  return <PublishPage />;
}
