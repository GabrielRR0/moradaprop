import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { EncryptedField } from '../types';
import { KeyRingService } from './key-ring.service';

const PREFIX = /^v\d+\./;

/**
 * Cifra y descifra valores de columnas (AES-256-GCM).
 * Formato guardado: `v<N>.iv.tag.dato` (base64url). La version permite rotar claves;
 * el campo ("User.email") va como AAD: un valor copiado a otra columna no descifra.
 */
@Injectable()
export class FieldCipher {
  constructor(private readonly keys: KeyRingService) {}

  encrypt(field: EncryptedField, plain: string): string {
    const version = this.keys.activeVersion;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.keys.key(version, 'enc', field), iv);
    cipher.setAAD(Buffer.from(field));
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return `${version}.${[iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')}`;
  }

  decrypt(field: EncryptedField, payload: string): string {
    const [version, ...parts] = payload.split('.');
    if (!PREFIX.test(`${version}.`) || parts.length !== 3 || !this.keys.has(version)) {
      throw new Error(`Valor cifrado invalido en ${field}`);
    }
    const [iv, tag, data] = parts.map((p) => Buffer.from(p, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', this.keys.key(version, 'enc', field), iv);
    decipher.setAAD(Buffer.from(field));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  /** true si el valor ya esta en el formato cifrado (sirve para migrar datos viejos en claro). */
  isEncrypted(payload: string): boolean {
    const [version, ...parts] = payload.split('.');
    return PREFIX.test(`${version}.`) && parts.length === 3;
  }

  /** Descifra, o devuelve tal cual si todavia esta en claro (solo durante la migracion). */
  decryptOrPlain(field: EncryptedField, payload: string): string {
    return this.isEncrypted(payload) ? this.decrypt(field, payload) : payload;
  }

  encryptJson(field: EncryptedField, value: unknown): string {
    return this.encrypt(field, JSON.stringify(value));
  }

  decryptJson<T>(field: EncryptedField, payload: string): T {
    return JSON.parse(this.decrypt(field, payload)) as T;
  }

  /** true si el valor usa una version distinta de la activa (hay que re-cifrarlo). */
  needsRotation(payload: string): boolean {
    return !payload.startsWith(`${this.keys.activeVersion}.`);
  }

  /**
   * Cifra las columnas de texto indicadas de un objeto (`data:` de Prisma). Lo que no sea texto
   * (undefined = no tocar, null = vaciar) se deja igual. El campo cifrado es `<model>.<columna>`.
   */
  encryptFields<T extends object>(model: string, data: T, fields: ReadonlyArray<keyof T & string>): T {
    const out = { ...data } as Record<string, unknown>;
    for (const field of fields) {
      const value = out[field];
      if (typeof value === 'string') out[field] = this.encrypt(`${model}.${field}`, value);
    }
    return out as T;
  }

  /** Inverso de encryptFields para una fila leida de la base. */
  decryptFields<T extends object>(model: string, row: T, fields: ReadonlyArray<keyof T & string>): T {
    const out = { ...row } as Record<string, unknown>;
    for (const field of fields) {
      const value = out[field];
      if (typeof value === 'string') out[field] = this.decrypt(`${model}.${field}`, value);
    }
    return out as T;
  }
}
