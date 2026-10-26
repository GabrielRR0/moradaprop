/** Formas de las respuestas del API de seguridad (ver docs/FRONTEND-SEGURIDAD.md, seccion 4). */

export type Role = 'CLIENT' | 'OWNER' | 'AGENCY' | 'ADMIN';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: Role[];
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
}

/** Estado del segundo factor. Llega en login, refresh, verify-email y GET /auth/second-factor. */
export interface Enrollment {
  mode: 'off' | 'monitor' | 'enforce';
  /** Por su rol (admin, dueno, agencia) DEBE tener passkey o 2FA. */
  required: boolean;
  hasFactor: boolean;
  /** Vencio el plazo y no lo tiene. */
  mustEnrollNow: boolean;
  graceEndsAt: string | null;
  /** No es obligatorio (cliente), pero conviene. */
  recommended: boolean;
  /** El servidor lo limita a las rutas de enrolamiento (solo con mode 'enforce'). */
  blocked: boolean;
}

/** Sesion lista. En la web el refresh_token y el device_token viajan en cookies, no en el body. */
export interface AuthSession {
  user: PublicUser;
  accessToken: string;
  enrollment?: Enrollment;
}

export type SecondFactorMethod = 'passkey' | 'totp' | 'backup' | 'email';

/** Login que pide un segundo paso. */
export interface LoginChallenge {
  twoFactorRequired: true;
  /** Dura 5 minutos. */
  challengeToken: string;
  methods: SecondFactorMethod[];
  /** true = inicio de sesion inusual (otro pais, red o dispositivo). */
  unusual: boolean;
}

export type LoginResult = AuthSession | LoginChallenge;

export const isChallenge = (result: LoginResult): result is LoginChallenge =>
  'twoFactorRequired' in result;

export interface Passkey {
  id: string;
  label: string | null;
  backedUp: boolean;
  transports: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

export interface TrustedDevice {
  id: string;
  label: string | null;
  confirmed: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  lastCountry: string | null;
  current: boolean;
}

export interface ActiveSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

export interface SecurityEvent {
  id: string;
  at: string;
  type: string;
  title: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  country: string | null;
  device: string | null;
  details: string[];
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  /** data:image/png;base64,... */
  qrCode: string;
}
