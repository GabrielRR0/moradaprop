/** Donde vive cada archivo: las variantes se sirven publicas, los originales y las importaciones no. */
export type StorageBucket = 'public' | 'private';

/**
 * Contrato de almacenamiento. Hoy hay dos implementaciones (local y Supabase);
 * para pasar a S3/R2 se agrega otra y se cambia STORAGE_PROVIDER, sin tocar los modulos.
 */
export interface StorageProvider {
  put(bucket: StorageBucket, key: string, data: Buffer, contentType: string): Promise<void>;
  get(bucket: StorageBucket, key: string): Promise<Buffer>;
  delete(bucket: StorageBucket, keys: string[]): Promise<void>;
  /** URL para mostrar un archivo del bucket publico. */
  publicUrl(key: string): string;
  /** URL temporal para un archivo privado. */
  signedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
