import { isEmail } from '@/lib/password';
import { safeNext } from '../services/auth-routing';
import { LoginPage } from './LoginPage';
import { VerifyEmailScreen } from './VerifyEmailScreen';

/** Sin un correo valido en la direccion no hay nada que verificar: se muestra el login. */
export function VerifyEmailPage({ email, next }: { email?: string; next?: string }) {
  if (!email || !isEmail(email)) return <LoginPage next={next} />;
  return <VerifyEmailScreen email={email} next={safeNext(next)} />;
}
