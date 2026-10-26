import { safeNext } from '../services/auth-routing';
import { LoginScreen } from './LoginScreen';

/** `next` es la ruta a la que volver despues de entrar (solo rutas internas). */
export function LoginPage({ next }: { next?: string }) {
  return <LoginScreen next={safeNext(next)} />;
}
