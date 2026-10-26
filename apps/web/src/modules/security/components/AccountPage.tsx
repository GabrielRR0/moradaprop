import { AuthGate } from '@/modules/auth';
import { AccountScreen } from './AccountScreen';

/** /seguridad: solo con sesion. Tambien la ven las cuentas limitadas (es justo para ellas). */
export function AccountPage() {
  return (
    <AuthGate allowBlocked>
      <AccountScreen />
    </AuthGate>
  );
}
