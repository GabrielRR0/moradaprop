/**
 * Antes de los tests e2e: crea la base de pruebas (si no existe) y le aplica las migraciones.
 * Se niega a trabajar con una base cuyo nombre no termine en "_test".
 */
const { execSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

module.exports = async () => {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://alquiler:alquiler@localhost:5433/alquiler_test';
  const parsed = new URL(url);
  const dbName = parsed.pathname.slice(1);

  if (!dbName.endsWith('_test')) {
    throw new Error(`La base de pruebas debe terminar en "_test" (recibido: "${dbName}")`);
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new PrismaClient({ datasourceUrl: adminUrl.toString() });
  try {
    const found = await admin.$queryRawUnsafe('SELECT 1 FROM pg_database WHERE datname = $1', dbName);
    if (found.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } catch (error) {
    throw new Error(
      `No se pudo conectar a Postgres en ${parsed.host}. ¿Esta levantada la base? (pnpm dev:db)\n${error.message}`,
      { cause: error },
    );
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
};
