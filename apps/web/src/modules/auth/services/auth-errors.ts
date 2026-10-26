import { ApiError } from '@/lib/api';
import { PasskeyError, passkeyMessages } from './webauthn';

/**
 * Traduce errores del API a textos propios (docs/FRONTEND-SEGURIDAD.md, secciones 6 y 11).
 * La logica se decide por `code` y `status`, nunca por el texto del servidor.
 * Por seguridad ningun texto revela si un correo existe ni por que exactamente se bloqueo un acceso.
 */
export interface Problem {
  text: string;
  /** Que debe hacer la pantalla ademas de mostrar el texto. */
  kind: 'generic' | 'credentials' | 'verify-email' | 'no-factor' | 'rate-limit' | 'locked' | 'network';
  /** Mensajes de validacion del API (400), para marcar campos. */
  fields?: string[];
}

const TEXTS = {
  network: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.',
  rate: 'Demasiados intentos. Espera un momento antes de volver a probar.',
  restricted: 'Acceso restringido. Si crees que es un error, contacta a soporte.',
  suspended: 'Tu cuenta está suspendida. Contacta a soporte para recuperarla.',
  locked: 'Por seguridad bloqueamos el acceso un rato. Inténtalo más tarde.',
  noFactor:
    'Por seguridad, entra desde tu dispositivo habitual y activa huella/Face ID o la verificación en dos pasos para poder entrar desde otros lugares.',
  config: 'Error de configuración del sitio. Avisa al equipo.',
};

export function describeError(error: unknown, fallback: string): Problem {
  if (!(error instanceof ApiError)) return { text: fallback, kind: 'generic' };
  if (error.status === 0) return { text: TEXTS.network, kind: 'network' };
  if (error.status === 429) return { text: TEXTS.rate, kind: 'rate-limit' };
  if (error.status === 400) {
    return { text: error.messages[0] ?? fallback, kind: 'generic', fields: error.messages };
  }
  if (error.status === 403) {
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return { text: 'Falta verificar tu correo.', kind: 'verify-email' };
    }
    if (error.code === 'SECOND_FACTOR_REQUIRED') return { text: TEXTS.noFactor, kind: 'no-factor' };
    if (error.code === 'TRUSTED_DEVICE_REQUIRED') {
      return { text: 'Hazlo desde el dispositivo con el que sueles entrar.', kind: 'generic' };
    }
    if (error.message === 'Cliente no autorizado') return { text: TEXTS.config, kind: 'generic' };
    if (/suspendida/i.test(error.message)) return { text: TEXTS.suspended, kind: 'locked' };
    if (/bloqueada/i.test(error.message)) return { text: TEXTS.locked, kind: 'locked' };
    return { text: TEXTS.restricted, kind: 'locked' };
  }
  return { text: fallback, kind: 'generic' };
}

/** Correo y clave: el mensaje es el mismo exista o no el correo. */
export function loginProblem(error: unknown): Problem {
  if (error instanceof ApiError && error.status === 401) {
    return { text: 'Correo o contraseña incorrectos.', kind: 'credentials' };
  }
  return describeError(error, 'No pudimos iniciar sesión. Inténtalo de nuevo.');
}

/** Codigo del segundo paso o de un correo. */
export function codeProblem(error: unknown): Problem {
  if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
    return { text: 'Código incorrecto o vencido.', kind: 'credentials' };
  }
  return describeError(error, 'No pudimos verificar el código.');
}

/**
 * Error de una passkey. Devuelve null cuando el usuario solo cancelo el dialogo
 * del sistema: eso no es un error y no se muestra nada.
 */
export function passkeyProblem(error: unknown): Problem | null {
  if (error instanceof PasskeyError) {
    if (error.failure === 'cancelled') return null;
    return { text: passkeyMessages[error.failure], kind: 'generic' };
  }
  if (error instanceof ApiError && error.status === 401) {
    return { text: 'No reconocimos esa passkey. Prueba otro método.', kind: 'credentials' };
  }
  if (error instanceof ApiError && error.status === 409) {
    return { text: 'Esa passkey ya estaba registrada o llegaste al máximo (10).', kind: 'generic' };
  }
  if (error instanceof ApiError && error.status === 403 && error.message === 'Contrasena incorrecta') {
    return { text: 'La contraseña no es correcta.', kind: 'credentials' };
  }
  return describeError(error, passkeyMessages.unknown);
}
