import type { Metadata } from 'next';
import { DesignKitPage } from '@/modules/design';

export const metadata: Metadata = { title: 'Kit de diseño' };

export default function Page() {
  return <DesignKitPage />;
}
