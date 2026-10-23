import type { Metadata } from 'next';
import { FiltersPage } from '@/modules/map';

export const metadata: Metadata = { title: 'Filtros' };

export default function Page() {
  return <FiltersPage />;
}
