import { Responsive } from '@/components/Responsive';
import { ImportScreen } from './ImportScreen';
import { ImportMobileScreen } from './ImportMobileScreen';

export function ImportPage() {
  return <Responsive desktop={<ImportScreen />} mobile={<ImportMobileScreen />} />;
}
