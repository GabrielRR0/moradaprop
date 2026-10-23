import { Responsive } from '@/components/Responsive';
import { PublishScreen } from './PublishScreen';
import { PublishMobileScreen } from './PublishMobileScreen';

export function PublishPage() {
  return <Responsive desktop={<PublishScreen />} mobile={<PublishMobileScreen />} />;
}
