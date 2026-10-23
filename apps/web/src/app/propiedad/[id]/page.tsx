import type { Metadata } from 'next';
import { PropertyPage } from '@/modules/properties';

export const metadata: Metadata = { title: 'Propiedad' };

export default function Page() {
  return <PropertyPage />;
}
