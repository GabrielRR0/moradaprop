import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import { AppConfig } from '@/config';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: AppConfig) {
    // Clave de 32 bytes derivada de ENCRYPTION_KEY (AES-256).
    this.key = createHash('sha256').update(config.auth.encryptionKey).digest();
  }

  /** Hash determinista para buscar tokens por valor (refresh tokens, invitaciones). */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Hash de un codigo corto. Lleva el contexto (usuario+tipo) para que no sirva en otro lado. */
  hashCode(code: string, context: string): string {
    return createHmac('sha256', this.key).update(`${context}:${code}`).digest('hex');
  }

  safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }

  /** Token aleatorio largo (refresh token, invitacion). */
  randomToken(bytes = 48): string {
    return randomBytes(bytes).toString('base64url');
  }

  /** Codigo numerico de N digitos con ceros a la izquierda. */
  numericCode(length: number): string {
    return randomInt(0, 10 ** length)
      .toString()
      .padStart(length, '0');
  }

  /** Cifra un secreto (AES-256-GCM). Formato: iv.tag.cifrado en base64url. */
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.');
  }

  decrypt(payload: string): string {
    const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }
}
