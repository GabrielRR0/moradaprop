/**
 * Verificacion manual contra un Redis real (no forma parte de los tests automaticos):
 *   pnpm --filter @app/api exec ts-node scripts/check-redis.ts
 * Comprueba que dos servidores comparten cache y que la app sigue viva si Redis se cae.
 */
import { AppConfig } from '../src/config';
import { loadEnv } from '../src/config/env';
import { CacheService } from '../src/common/cache';

function server(redisUrl: string) {
  const config = new AppConfig(loadEnv());
  Object.assign(config.cache, { driver: 'redis', ttlSeconds: 10 });
  Object.assign(config.database, { redisUrl });
  return new CacheService(config);
}

async function main() {
  const url = process.argv[2] ?? 'redis://localhost:6379';
  let consultas = 0;
  const consulta = async () => {
    consultas++;
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { ok: true };
  };

  const a = server(url);
  const b = server(url);
  const clave = `check:${Date.now()}`;

  await Promise.all(Array.from({ length: 500 }, () => a.remember(clave, consulta)));
  console.log(`Servidor A: 500 peticiones simultaneas -> ${consultas} consulta`);

  await Promise.all(Array.from({ length: 500 }, () => b.remember(clave, consulta)));
  console.log(`Servidor B: 500 peticiones mas -> ${consultas} consultas en total (B reutilizo lo que guardo A)`);

  await a.forget('check:');
  await a.remember(clave, consulta);
  console.log(`Tras forget(): ${consultas} consultas en total (volvio a consultar)`);

  await a.onModuleDestroy();
  await b.onModuleDestroy();

  const caido = server('redis://localhost:6399'); // puerto sin Redis
  const resultado = await caido.remember('x', async () => 'respuesta-directa');
  console.log(`Redis caido: la app responde igual -> "${resultado}"`);
  await caido.onModuleDestroy();
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
