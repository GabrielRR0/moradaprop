import { publicEnv } from '@/config';
import { api } from '@/lib/api';

/** Un ajuste de la plataforma tal como lo entrega la API. Un secreto nunca llega completo. */
export interface Setting {
  key: string;
  label: string;
  /** true = se muestra enmascarado (`preview`) y nunca completo. */
  secret: boolean;
  /** Hay un valor guardado. */
  configured: boolean;
  /** El valor, solo si no es secreto. */
  value: string | null;
  /** Un secreto enmascarado ("re_••••ail9"). */
  preview: string | null;
  updatedAt: string | null;
}

/** Resultado del correo de prueba. */
export interface MailTestResult {
  ok: boolean;
  /** Correo al que se envio (el del admin). */
  to: string;
  error: string | null;
}

/** Las rutas de admin cuelgan de un prefijo propio (ADMIN_API_PREFIX en la API; aqui NEXT_PUBLIC_ADMIN_API_PREFIX). */
const base = () => `/${publicEnv.adminApiPrefix}/settings`;

/** Ajustes de la plataforma (correo con Resend). Guardar y quitar piden haber confirmado el segundo factor hace poco. */
export const adminSettingsService = {
  list: () => api<Setting[]>(base()),
  save: (key: string, value: string) => api<Setting>(`${base()}/${key}`, { method: 'PUT', json: { value } }),
  remove: (key: string) => api<Setting>(`${base()}/${key}`, { method: 'DELETE' }),
  /** Envia un correo de prueba al propio admin con la configuracion actual. */
  testMail: () => api<MailTestResult>(`${base()}/mail/test`, { method: 'POST' }),
};
