import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

// Acepta el codigo del paso anterior/siguiente (+-30s) por desfase de reloj del telefono.
const engine = authenticator.clone({ window: 1 });

export const PERIOD_SECONDS = 30;

/** Secreto base32 nuevo para una app autenticadora. */
export const generateSecret = (): string => engine.generateSecret();

/** URL `otpauth://` que escanean las apps autenticadoras. */
export const keyUri = (account: string, issuer: string, secret: string): string => engine.keyuri(account, issuer, secret);

/** Codigo QR (data URL PNG) de cualquier texto, normalmente la `keyUri`. */
export const qrDataUrl = (text: string): Promise<string> => toDataURL(text);

/**
 * Compara un codigo con el secreto: 0 = paso actual, -1 = anterior, 1 = siguiente; null = incorrecto.
 * Quien llama debe rechazar reusar un paso ya aceptado (anti-replay).
 */
export const check = (code: string, secret: string): number | null => engine.checkDelta(code, secret);

/** Codigo valido ahora (o `offsetSeconds` despues). Pensado para tests. */
export const generate = (secret: string, offsetSeconds = 0): string =>
  engine.clone({ epoch: Date.now() + offsetSeconds * 1000 }).generate(secret);
