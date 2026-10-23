import { Responsive } from '@/components/Responsive';
import { AdminScreen } from './AdminScreen';
import { DesktopOnlyNotice } from '@/components/DesktopOnlyNotice';

export function AdminPage() {
  return <Responsive desktop={<AdminScreen />} mobile={<DesktopOnlyNotice />} />;
}
