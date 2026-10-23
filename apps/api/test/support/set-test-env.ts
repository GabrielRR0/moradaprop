import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Valores minimos para que la config valide durante los tests (sin tocar tu .env real).
process.env.NODE_ENV = 'test';
// SIEMPRE una base distinta a la de desarrollo (nunca se hereda DATABASE_URL del entorno).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://alquiler:alquiler@localhost:5433/alquiler_test';
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0123456789';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789';
process.env.ENCRYPTION_KEY ??= 'test-encryption-key-0123456789-abcdef';
process.env.APP_CLIENT_KEY_WEB = 'test-web-key';
process.env.APP_CLIENT_KEY_MOBILE = 'test-mobile-key';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
// Los archivos subidos en los tests van a una carpeta temporal, no al proyecto.
process.env.STORAGE_LOCAL_DIR = join(tmpdir(), 'alquiler-test-uploads');
// Sin cache en los tests e2e: cada prueba debe ver el estado real de la base.
process.env.CACHE_TTL_SECONDS = '0';
process.env.API_PUBLIC_URL = 'http://api.test';
