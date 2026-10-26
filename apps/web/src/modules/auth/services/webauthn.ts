/**
 * Passkeys (huella, Face ID, Windows Hello) con el navegador.
 * Usa las funciones JSON de WebAuthn (Chrome 129+, Safari 18+, Firefox 119+): en navegadores
 * anteriores `passkeysSupported()` da false y la interfaz oculta los botones de passkey.
 */

export function passkeysSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof PublicKeyCredential.parseCreationOptionsFromJSON === 'function' &&
    typeof PublicKeyCredential.parseRequestOptionsFromJSON === 'function'
  );
}

/** Por que fallo el dialogo del sistema. `cancelled` NO es un error: no se muestra nada. */
export type PasskeyFailure = 'cancelled' | 'already' | 'security' | 'unsupported' | 'unknown';

export class PasskeyError extends Error {
  constructor(public failure: PasskeyFailure) {
    super(failure);
  }
}

function toFailure(error: unknown): PasskeyFailure {
  if (!(error instanceof DOMException)) return 'unknown';
  switch (error.name) {
    case 'NotAllowedError':
    case 'AbortError':
      return 'cancelled';
    case 'InvalidStateError':
      return 'already';
    case 'SecurityError':
      return 'security';
    case 'NotSupportedError':
      return 'unsupported';
    default:
      return 'unknown';
  }
}

export const passkeyMessages: Record<Exclude<PasskeyFailure, 'cancelled'>, string> = {
  already: 'Este dispositivo ya está registrado.',
  security: 'Las passkeys no están bien configuradas en este sitio. Avisa al equipo.',
  unsupported: 'Configura un PIN o una huella en tu dispositivo para usar passkeys.',
  unknown: 'No pudimos usar la passkey. Inténtalo de nuevo.',
};

/** Crea una passkey con las opciones del servidor y devuelve la credencial lista para enviar. */
export async function createPasskey(options: unknown): Promise<unknown> {
  try {
    const credential = (await navigator.credentials.create({
      publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(
        options as PublicKeyCredentialCreationOptionsJSON,
      ),
    })) as PublicKeyCredential | null;
    if (!credential) throw new PasskeyError('cancelled');
    return credential.toJSON();
  } catch (error) {
    throw error instanceof PasskeyError ? error : new PasskeyError(toFailure(error));
  }
}

/** Pide la firma de una passkey existente (entrar o segundo paso). */
export async function getPasskey(options: unknown): Promise<unknown> {
  try {
    const credential = (await navigator.credentials.get({
      publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(
        options as PublicKeyCredentialRequestOptionsJSON,
      ),
    })) as PublicKeyCredential | null;
    if (!credential) throw new PasskeyError('cancelled');
    return credential.toJSON();
  } catch (error) {
    throw error instanceof PasskeyError ? error : new PasskeyError(toFailure(error));
  }
}
