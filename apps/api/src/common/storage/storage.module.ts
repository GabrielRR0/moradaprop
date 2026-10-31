import { Global, Module } from '@nestjs/common';
import { AppConfig } from '@/config';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from './storage-provider';
import { SupabaseStorageProvider } from './supabase-storage.provider';

/** Elige la implementacion segun STORAGE_PROVIDER (local | supabase). */
@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [AppConfig],
      useFactory: (config: AppConfig): StorageProvider =>
        config.storage.provider === 'supabase' ? new SupabaseStorageProvider(config) : new LocalStorageProvider(config),
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
