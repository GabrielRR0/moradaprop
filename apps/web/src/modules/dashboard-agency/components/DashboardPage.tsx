import { Responsive } from '@/components/Responsive';
import { DashboardScreen } from './DashboardScreen';
import { DashboardMobileScreen } from './DashboardMobileScreen';

export function DashboardPage() {
  return <Responsive desktop={<DashboardScreen />} mobile={<DashboardMobileScreen />} />;
}
