import { api } from '@/lib/api';
import type { AuthSession, LoginResult } from '@/lib/api-types';
import { isChallenge } from '@/lib/api-types';
import { endSession, startSession } from '../session/session.store';
import { createPasskey, getPasskey } from './webauthn';

export type AccountType = 'CLIENT' | 'OWNER' | 'AGENCY';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  accountType: AccountType;
  phone?: string;
  agencyName?: string;
}

/** Guarda la sesion si la respuesta la trae; si pide segundo paso la devuelve tal cual. */
function adopt(result: LoginResult): LoginResult {
  if (!isChallenge(result)) startSession(result);
  return result;
}

const post = <T>(path: string, json: unknown) => api<T>(path, { method: 'POST', json });

export const authService = {
  register: (input: RegisterInput) => post<{ message: string }>('/auth/register', input),

  async verifyEmail(email: string, code: string): Promise<AuthSession> {
    const session = await post<AuthSession>('/auth/verify-email', { email, code });
    startSession(session);
    return session;
  },

  resendCode: (email: string) => post<unknown>('/auth/resend-code', { email }),

  async login(email: string, password: string): Promise<LoginResult> {
    return adopt(await post<LoginResult>('/auth/login', { email, password }));
  },

  /** Segundo paso con app autenticadora, codigo de respaldo o codigo por correo. */
  async loginSecondFactor(challengeToken: string, code: string): Promise<AuthSession> {
    return adopt(
      await post<LoginResult>('/auth/login/2fa', { challengeToken, code }),
    ) as AuthSession;
  },

  sendEmailCode: (challengeToken: string) =>
    post<unknown>('/auth/login/2fa/email-code', { challengeToken }),

  /** Entrar solo con passkey, sin correo ni clave. */
  async loginWithPasskey(): Promise<AuthSession> {
    const options = await post<unknown>('/auth/passkeys/login/options', {});
    const credential = await getPasskey(options);
    const session = await post<AuthSession>('/auth/passkeys/login/verify', { credential });
    startSession(session);
    return session;
  },

  /** Segundo paso del login cuando el servidor ofrecio `passkey`. */
  async stepUpWithPasskey(challengeToken: string): Promise<AuthSession> {
    const options = await post<unknown>('/auth/passkeys/step-up/options', { challengeToken });
    const credential = await getPasskey(options);
    const session = await post<AuthSession>('/auth/passkeys/step-up/verify', {
      challengeToken,
      credential,
    });
    startSession(session);
    return session;
  },

  forgotPassword: (email: string) => post<unknown>('/auth/password/forgot', { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    post<unknown>('/auth/password/reset', { email, code, newPassword }),

  /** Registra una passkey nueva (pide la clave de nuevo si la cuenta tiene). */
  async registerPasskey(password: string | undefined, label?: string): Promise<void> {
    const options = await post<unknown>('/auth/passkeys/register/options', { password });
    const credential = await createPasskey(options);
    await post<unknown>('/auth/passkeys/register/verify', { credential, label });
  },

  async logout(): Promise<void> {
    try {
      await post<unknown>('/auth/logout', {});
    } finally {
      endSession(true);
    }
  },
};
