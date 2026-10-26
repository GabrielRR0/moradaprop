import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { EncryptedField } from '../types';
import { KeyRingService } from './key-ring.service';

const normalizers = {
  /** Correos: sin espacios y en minuscula. */
  email: (v: string) => v.trim().toLowerCase(),
  /** Documentos (RIF...): sin espacios ni guiones, en mayuscula. */
  document: (v: string) => v.replace(/[\s-]/g, '').toUpperCase(),
  exact: (v: string) => v,
} as const;
const MIN_PREFIX = 3;
const MAX_PREFIX = 12;

/** Palabras en minuscula y sin tildes; el correo se parte en sus partes (ana, correo, cl). */
const words = (text: string): string[] =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

export type BlindNormalizer = keyof typeof normalizers;

/**
 * Indice ciego: HMAC determinista para buscar por igualdad (y mantener @unique) sin guardar
 * el valor en claro. Usa una clave DISTINTA a la de cifrado. Usa siempre la primera version
 * de clave (`indexVersion`): asi rotar el cifrado no obliga a recalcular los hashes.
 */
@Injectable()
export class BlindIndexService {
  constructor(private readonly keys: KeyRingService) {}

  hash(field: EncryptedField, value: string, normalizer: BlindNormalizer = 'exact'): string {
    const key = this.keys.key(this.keys.indexVersion, 'idx', field);
    return createHmac('sha256', key).update(normalizers[normalizer](value)).digest('hex');
  }

  /**
   * Tokens para buscar texto parcial sin guardarlo: cada palabra se parte en prefijos
   * (desde 3 letras hasta 12) y cada prefijo se guarda como HMAC. "Gonzalez" se encuentra
   * escribiendo "gon", "gonz"... Quien lea la DB solo ve hashes (queda visible cuantas palabras
   * comparten un prefijo, no que dicen).
   */
  searchTokens(field: EncryptedField, ...texts: Array<string | null | undefined>): string[] {
    const tokens = new Set<string>();
    for (const text of texts) {
      for (const word of words(text ?? '')) {
        for (let n = Math.min(MIN_PREFIX, word.length); n <= Math.min(word.length, MAX_PREFIX); n++) {
          tokens.add(this.hash(field, word.slice(0, n)));
        }
      }
    }
    return [...tokens];
  }

  /** Tokens de una busqueda: una palabra por cada palabra escrita (todas deben coincidir). */
  queryTokens(field: EncryptedField, query: string): string[] {
    return [...new Set(words(query).map((word) => this.hash(field, word.slice(0, MAX_PREFIX))))];
  }
}
