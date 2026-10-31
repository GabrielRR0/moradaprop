import type { SecondFactorStatus } from '@/modules/security';
import type { AuthUserResource } from './auth-user.resource';

/**
 * Sesion iniciada. En la web el refresh token viaja solo en una cookie httpOnly y el secreto de un
 * dispositivo nuevo en otra cookie: ninguno aparece en el cuerpo.
 */
export interface AuthSessionResource {
  user: AuthUserResource;
  accessToken: string;
  /** Si debe activar passkey o 2FA, hasta cuando, y si esta limitado. */
  enrollment?: SecondFactorStatus;
}

/** Sesion iniciada desde la app movil: no hay cookies, asi que los secretos van en el cuerpo. */
export interface AuthSessionMobileResource extends AuthSessionResource {
  refreshToken: string;
  /** Secreto de un dispositivo NUEVO. */
  deviceToken?: string;
}

/** El login pide un segundo paso antes de entregar la sesion. */
export interface TwoFactorRequiredResource {
  twoFactorRequired: true;
  /** Token corto que se devuelve junto con el codigo del segundo paso. */
  challengeToken: string;
  /** Formas de resolver el segundo paso que tiene disponibles esta cuenta. */
  methods: Array<'passkey' | 'totp' | 'backup' | 'email'>;
  /** true si se pide porque el inicio de sesion es inusual (pais, red o dispositivo nuevos). */
  unusual?: boolean;
}

/** El correo de la cuenta de Google ya existe: hay que confirmar con un codigo antes de vincularla. */
export interface GoogleLinkRequiredResource {
  linkRequired: true;
  email: string;
  message: string;
}

/** Lo que puede responder cualquier ruta que inicia sesion (login, verificar correo, 2FA, Google, passkey). */
export type LoginResponseResource =
  | AuthSessionResource
  | AuthSessionMobileResource
  | TwoFactorRequiredResource
  | GoogleLinkRequiredResource;
