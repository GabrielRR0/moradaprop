export type DbCommand = 'dev' | 'create' | 'deploy' | 'status' | 'reset' | 'push';

/** Comandos que pueden borrar o alterar datos sin dejar una migracion versionada. */
const DESTRUCTIVE: DbCommand[] = ['reset', 'push'];
/** Comandos que generan/aplican migraciones de desarrollo (shadow DB incluida). */
const DEV_ONLY: DbCommand[] = ['dev', 'create', ...DESTRUCTIVE];

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'db', 'host.docker.internal'];

export function isLocalDatabase(databaseUrl: string): boolean {
  try {
    return LOCAL_HOSTS.includes(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}

interface GuardInput {
  command: DbCommand;
  databaseUrl: string;
  nodeEnv?: string;
}

/**
 * Devuelve el motivo del bloqueo, o null si el comando es seguro.
 * - Nunca se permite reset/push/dev/create en produccion ni contra una DB remota (ej. Supabase).
 * - En esas bases solo se aplican migraciones ya escritas: `deploy` y `status`.
 */
export function blockReason({ command, databaseUrl, nodeEnv }: GuardInput): string | null {
  const local = isLocalDatabase(databaseUrl);

  if (nodeEnv === 'production' && DEV_ONLY.includes(command)) {
    return `"${command}" esta prohibido en produccion. Usa "deploy" para aplicar migraciones existentes.`;
  }
  if (!local && DESTRUCTIVE.includes(command)) {
    return `"${command}" puede borrar datos y la base no es local. Usa una migracion nueva (create) y "deploy".`;
  }
  if (!local && DEV_ONLY.includes(command)) {
    return `"${command}" solo se permite contra la base local de Docker. Para una base remota usa "deploy".`;
  }
  return null;
}
