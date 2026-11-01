import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '@/config';

/** Servicio de Cloudflare que valida la respuesta que el widget le dio al navegador. */
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Cloudflare documenta tokens de hasta 2048 caracteres: uno mas largo no es un token. */
const MAX_TOKEN_LENGTH = 2048;
/** Si Cloudflare no responde en este tiempo, se considera no disponible (el usuario puede reintentar). */
const TIMEOUT_MS = 5000;

/**
 * - `valid`: Cloudflare confirmo que la respuesta es de una persona y no se habia usado.
 * - `invalid`: Cloudflare la rechazo (falsa, vencida o ya usada) o ni siquiera tiene forma de token.
 * - `unavailable`: no se pudo preguntar (red caida, tiempo agotado, error de Cloudflare). No es culpa de quien intenta.
 */
export type TurnstileResult = 'valid' | 'invalid' | 'unavailable';

/** Valida con Cloudflare las respuestas del widget "no soy un robot". Cada token sirve una sola vez. */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: AppConfig) {}

  async verify(token: string, ip?: string): Promise<TurnstileResult> {
    if (!token || token.length > MAX_TOKEN_LENGTH) return 'invalid';

    const body = new URLSearchParams({ secret: this.config.security.turnstile.secretKey, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);

    try {
      const response = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Turnstile respondio ${response.status}`);
        return 'unavailable';
      }
      const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };
      if (result.success === true) return 'valid';
      // Un token malo/vencido/repetido es "invalid"; una clave secreta mal puesta es un problema nuestro ("unavailable").
      const errors = result['error-codes'] ?? [];
      if (errors.some((code) => code === 'invalid-input-secret' || code === 'missing-input-secret')) {
        this.logger.error('TURNSTILE_SECRET_KEY invalida: Cloudflare la rechazo');
        return 'unavailable';
      }
      return 'invalid';
    } catch (error) {
      this.logger.warn(`No se pudo consultar Turnstile: ${(error as Error).message}`);
      return 'unavailable';
    }
  }
}
