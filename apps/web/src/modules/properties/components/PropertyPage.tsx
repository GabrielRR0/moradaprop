import { Responsive } from '@/components/Responsive';
import { PropertyScreen } from './PropertyScreen';
import { PropertyMobileScreen } from './PropertyMobileScreen';

export function PropertyPage() {
  return <Responsive desktop={<PropertyScreen />} mobile={<PropertyMobileScreen />} />;
}
