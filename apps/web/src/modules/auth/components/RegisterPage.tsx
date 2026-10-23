import { Responsive } from '@/components/Responsive';
import { RegisterScreen } from './RegisterScreen';
import { RegisterMobileScreen } from './RegisterMobileScreen';

export function RegisterPage() {
  return <Responsive desktop={<RegisterScreen />} mobile={<RegisterMobileScreen />} />;
}
