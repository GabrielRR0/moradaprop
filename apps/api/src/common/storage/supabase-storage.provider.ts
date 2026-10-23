import { AppConfig } from '../../config';
import type { StorageBucket, StorageProvider } from './storage-provider';

const BUCKETS: Record<StorageBucket, string> = {
  public: 'property-media', // publico: thumb / medium / hd
  private: 'private-files', // privado: originales e importaciones
};

/**
 * Supabase Storage por su API REST (sin SDK). La clave de servicio solo vive en el servidor.
 * Los buckets "property-media" (publico) y "private-files" (privado) se crean una vez en Supabase.
 */
export class SupabaseStorageProvider implements StorageProvider {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: AppConfig) {
    const { supabaseUrl, supabaseServiceKey } = config.storage;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('STORAGE_PROVIDER=supabase requiere SUPABASE_URL y SUPABASE_SERVICE_KEY');
    }
    this.baseUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1`;
    this.headers = { Authorization: `Bearer ${supabaseServiceKey}`, apikey: supabaseServiceKey };
  }

  async put(bucket: StorageBucket, key: string, data: Buffer, contentType: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/object/${BUCKETS[bucket]}/${key}`, {
      method: 'POST',
      headers: { ...this.headers, 'Content-Type': contentType, 'x-upsert': 'true' },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Supabase Storage: no se pudo subir ${key} (${res.status})`);
  }

  async get(bucket: StorageBucket, key: string): Promise<Buffer> {
    const res = await fetch(`${this.baseUrl}/object/authenticated/${BUCKETS[bucket]}/${key}`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Supabase Storage: no se pudo leer ${key} (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }

  async delete(bucket: StorageBucket, keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const res = await fetch(`${this.baseUrl}/object/${BUCKETS[bucket]}`, {
      method: 'DELETE',
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: keys }),
    });
    if (!res.ok) throw new Error(`Supabase Storage: no se pudo borrar (${res.status})`);
  }

  publicUrl(key: string): string {
    return `${this.baseUrl}/object/public/${BUCKETS.public}/${key}`;
  }

  async signedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const res = await fetch(`${this.baseUrl}/object/sign/${BUCKETS.private}/${key}`, {
      method: 'POST',
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });
    if (!res.ok) throw new Error(`Supabase Storage: no se pudo firmar ${key} (${res.status})`);
    const { signedURL } = (await res.json()) as { signedURL: string };
    return `${this.baseUrl}${signedURL}`;
  }
}
