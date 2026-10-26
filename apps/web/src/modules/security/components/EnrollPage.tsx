import { AuthGate } from '@/modules/auth';
import { EnrollScreen } from './EnrollScreen';

/** /seguridad/activar: "Protege tu cuenta". Es la unica pantalla a la que puede ir una cuenta limitada. */
export function EnrollPage() {
  return (
    <AuthGate allowBlocked>
      <EnrollScreen />
    </AuthGate>
  );
}
