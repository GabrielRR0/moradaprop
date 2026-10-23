import { Responsive } from '@/components/Responsive';
import { TeamScreen } from './TeamScreen';
import { TeamMobileScreen } from './TeamMobileScreen';

export function TeamPage() {
  return <Responsive desktop={<TeamScreen />} mobile={<TeamMobileScreen />} />;
}
