import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve, sep } from 'node:path';
import { AppConfig } from '../../config';
import type { StorageBucket, StorageProvider } from './storage-provider';

/** Guarda en disco (desarrollo). public/ se sirve en /uploads; private/ nunca. */
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(private readonly config: AppConfig) {
    this.root = resolve(config.storage.localDir);
  }

  async put(bucket: StorageBucket, key: string, data: Buffer): Promise<void> {
    const file = this.pathOf(bucket, key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, data);
  }

  get(bucket: StorageBucket, key: string): Promise<Buffer> {
    return readFile(this.pathOf(bucket, key));
  }

  async delete(bucket: StorageBucket, keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => rm(this.pathOf(bucket, key), { force: true })));
  }

  publicUrl(key: string): string {
    return `${this.config.storage.publicBaseUrl}/uploads/${key}`;
  }

  async signedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `${this.config.storage.publicBaseUrl}/uploads-private/${key}?expires=${expires}&sig=${this.sign(key, expires)}`;
  }

  /** Verifica una URL firmada (lo usa el endpoint de desarrollo que sirve archivos privados). */
  verifySignature(key: string, expires: number, signature: string): boolean {
    if (expires < Date.now() / 1000) return false;
    const expected = Buffer.from(this.sign(key, expires));
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  get publicDir(): string {
    return join(this.root, 'public');
  }

  private sign(key: string, expires: number): string {
    return createHmac('sha256', this.config.auth.encryptionKey).update(`${key}:${expires}`).digest('hex');
  }

  /** Impide que una key con ../ salga de la carpeta de uploads (path traversal). */
  private pathOf(bucket: StorageBucket, key: string): string {
    const base = join(this.root, bucket);
    const file = resolve(base, normalize(key));
    if (!file.startsWith(base + sep)) throw new Error('Ruta de archivo invalida');
    return file;
  }
}
