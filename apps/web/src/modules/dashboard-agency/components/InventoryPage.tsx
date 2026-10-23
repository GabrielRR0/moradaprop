import { Responsive } from '@/components/Responsive';
import { InventoryScreen } from './InventoryScreen';
import { InventoryMobileScreen } from './InventoryMobileScreen';

export function InventoryPage() {
  return <Responsive desktop={<InventoryScreen />} mobile={<InventoryMobileScreen />} />;
}
