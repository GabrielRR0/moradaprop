import { Responsive } from '@/components/Responsive';
import { LeadsScreen } from './LeadsScreen';
import { LeadsMobileScreen } from './LeadsMobileScreen';

export function LeadsPage() {
  return <Responsive desktop={<LeadsScreen />} mobile={<LeadsMobileScreen />} />;
}
