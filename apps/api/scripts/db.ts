/**
 * Comando unico para la base de datos (equivale a `php artisan migrate`):
 *
 *   pnpm db dev               aplica migraciones pendientes y regenera el cliente (desarrollo)
 *   pnpm db create <nombre>   crea una migracion nueva SIN aplicarla, para que la revises
 *   pnpm db deploy            aplica solo migraciones ya escritas (produccion / Supabase)
 *   pnpm db status            muestra que migraciones estan aplicadas o pendientes
 *   pnpm db reset             borra y recrea la base local (bloqueado fuera de local)
 *
 * Las migraciones son hacia adelante (no hay "down"). Para deshacer un cambio se crea
 * otra migracion que lo revierta. Nunca edites una migracion ya aplicada: Prisma lo detecta
 * por checksum y se niega a continuar.
 */
import { spawnSync } from 'node:child_process';
import { blockReason, type DbCommand } from '../src/database/migration-guard';

const LOCAL_URL = 'postgresql://alquiler:alquiler@localhost:5433/alquiler';
const COMMANDS: DbCommand[] = ['dev', 'create', 'deploy', 'status', 'reset', 'push'];

const [command, name] = process.argv.slice(2) as [DbCommand, string | undefined];

if (!COMMANDS.includes(command)) {
  console.error(`Uso: pnpm db <${COMMANDS.join('|')}> [nombre]`);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL ?? LOCAL_URL;
const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: process.env.DIRECT_URL ?? databaseUrl };

const motivo = blockReason({ command, databaseUrl, nodeEnv: process.env.NODE_ENV });
if (motivo) {
  console.error(`\n[BLOQUEADO] ${motivo}\n`);
  process.exit(1);
}

if (command === 'create' && !name) {
  console.error('Uso: pnpm db create <nombre_de_la_migracion>');
  process.exit(1);
}

const prismaArgs: Record<DbCommand, string[]> = {
  dev: ['migrate', 'dev'],
  create: ['migrate', 'dev', '--create-only', '--name', name ?? ''],
  deploy: ['migrate', 'deploy'],
  status: ['migrate', 'status'],
  reset: ['migrate', 'reset', '--force'],
  push: ['db', 'push'],
};

const result = spawnSync('npx', ['prisma', ...prismaArgs[command]], { stdio: 'inherit', shell: true, env });
process.exit(result.status ?? 1);
