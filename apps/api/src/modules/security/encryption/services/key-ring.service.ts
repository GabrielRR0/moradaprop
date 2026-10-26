import { Injectable } from '@nestjs/common';
import { createHash, hkdfSync } from 'node:crypto';
import { AppConfig } from '../../../../config';

export type KeyPurpose = 'enc' | 'idx';

/**
 * Llavero: claves maestras versionadas (ENCRYPTION_KEYS="v1:...,v2:...") y claves derivadas
 * por proposito y por campo con HKDF. Nunca se usa la misma clave para cifrar y para indexar.
 */
@Injectable()
export class KeyRingService {
  private readonly masters = new Map<string, Buffer>();
  readonly activeVersion: string;
  /** Version fija del indice ciego (la primera): rotar el cifrado no cambia los hashes. */
  readonly indexVersion: string;
  private readonly derived = new Map<string, Buffer>();

  constructor(config: AppConfig) {
    const { keys, activeVersion } = config.security.encryption;
    let first = '';
    let last = '';
    for (const entry of keys.split(',').map((e) => e.trim()).filter(Boolean)) {
      const [version, ...rest] = entry.split(':');
      const secret = rest.join(':');
      if (!/^v\d+$/.test(version ?? '') || secret.length < 32) {
        throw new Error('ENCRYPTION_KEYS invalido: usa "v1:clave,v2:clave" con claves de al menos 32 caracteres');
      }
      this.masters.set(version, createHash('sha256').update(secret).digest());
      first ||= version;
      last = version;
    }
    if (!last) throw new Error('ENCRYPTION_KEYS: falta al menos una clave');
    this.indexVersion = first;
    this.activeVersion = activeVersion || last;
    if (!this.masters.has(this.activeVersion)) {
      throw new Error(`ENCRYPTION_ACTIVE_VERSION (${this.activeVersion}) no existe en ENCRYPTION_KEYS`);
    }
  }

  has(version: string): boolean {
    return this.masters.has(version);
  }

  /** Clave de 32 bytes para (version, proposito, campo). */
  key(version: string, purpose: KeyPurpose, field: string): Buffer {
    const id = `${version}|${purpose}|${field}`;
    let key = this.derived.get(id);
    if (!key) {
      const master = this.masters.get(version);
      if (!master) throw new Error(`Version de clave desconocida: ${version}`);
      key = Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), `${purpose}:${field}`, 32));
      this.derived.set(id, key);
    }
    return key;
  }
}
