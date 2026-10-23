import type { Metadata } from 'next';
import { MapPage } from '@/modules/map';

export const metadata: Metadata = { title: 'Mapa' };

export default function Page() {
  return <MapPage />;
}
