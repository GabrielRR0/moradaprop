import { api, refreshSession, setAccessToken } from '@/lib/api';
import type {
  ActiveSession,
  Enrollment,
  Passkey,
  SecurityEvent,
  TrustedDevice,
  TwoFactorSetup,
} from '@/lib/api-types';

const post = <T>(path: string, json: unknown = {}) => api<T>(path, { method: 'POST', json });
const del = (path: string) => api<null>(path, { method: 'DELETE' });

export interface FactorProof {
  /** Solo si la cuenta tiene contrasena (las creadas con Google no la piden). */
  password?: string;
  /** Codigo de 6 digitos de la app autenticadora. */
  code: string;
}

/** Todo lo de "Seguridad de la cuenta". Rutas y respuestas: docs/FRONTEND-SEGURIDAD.md, secciones 7 a 9. */
export const securityService = {
  secondFactor: () => api<Enrollment>('/auth/second-factor'),
  events: async () => (await api<{ items: SecurityEvent[] }>('/auth/security-events')).items,

  passkeys: async () => (await api<{ items: Passkey[] }>('/auth/passkeys')).items,
  renamePasskey: (id: string, label: string) =>
    api<unknown>(`/auth/passkeys/${id}`, { method: 'PATCH', json: { label } }),
  removePasskey: (id: string) => del(`/auth/passkeys/${id}`),

  devices: async () => {
    const result = await api<{ items: TrustedDevice[] }>('/auth/devices');
    return result.items;
  },
  removeDevice: (id: string) => del(`/auth/devices/${id}`),

  sessions: () => api<ActiveSession[]>('/auth/sessions'),
  closeSession: (id: string) => del(`/auth/sessions/${id}`),
  logoutAll: () => post<null>('/auth/logout-all'),

  twoFactorSetup: () => post<TwoFactorSetup>('/auth/2fa/setup'),

  /** Activa el 2FA. El servidor entrega un access token nuevo: reemplaza al actual. */
  async twoFactorConfirm(code: string): Promise<string[]> {
    const result = await post<{ backupCodes: string[]; accessToken: string }>('/auth/2fa/confirm', { code });
    setAccessToken(result.accessToken);
    await refreshSession();
    return result.backupCodes;
  },
  async twoFactorDisable(proof: FactorProof): Promise<void> {
    await post<unknown>('/auth/2fa/disable', proof);
    await refreshSession();
  },
  /** Los codigos de respaldo anteriores dejan de servir. Se muestran UNA sola vez. */
  async regenerateBackupCodes(proof: FactorProof): Promise<string[]> {
    return (await post<{ backupCodes: string[] }>('/auth/2fa/backup-codes', proof)).backupCodes;
  },

  changePassword: (currentPassword: string | undefined, newPassword: string) =>
    post<unknown>('/users/me/password', { currentPassword, newPassword }),
};
