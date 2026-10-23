import { describeCase } from '../../../test/support/describe-case';
import { blockReason, isLocalDatabase } from '../migration-guard';

const LOCAL = 'postgresql://alquiler:alquiler@db:5432/alquiler';
const SUPABASE = 'postgresql://postgres.x:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

describe('migration-guard', () => {
  describeCase('database', {
    que: 'reconoce la base de Docker y localhost como locales',
    espera: 'db y localhost son locales; Supabase no',
    ejecutar: () => [isLocalDatabase(LOCAL), isLocalDatabase('postgresql://u:p@localhost/x'), isLocalDatabase(SUPABASE)],
    verificar: (r) => expect(r).toEqual([true, true, false]),
  });

  describeCase('database', {
    que: 'bloquea migrate reset contra Supabase',
    espera: 'un mensaje de bloqueo (no null)',
    ejecutar: () => blockReason({ command: 'reset', databaseUrl: SUPABASE }),
    verificar: (motivo) => expect(motivo).toContain('puede borrar datos'),
  });

  describeCase('database', {
    que: 'bloquea db push aunque la base sea local cuando NODE_ENV es production',
    espera: 'un mensaje de bloqueo por produccion',
    ejecutar: () => blockReason({ command: 'push', databaseUrl: LOCAL, nodeEnv: 'production' }),
    verificar: (motivo) => expect(motivo).toContain('produccion'),
  });

  describeCase('database', {
    que: 'bloquea migrate dev (crear migraciones) contra una base remota',
    espera: 'un mensaje de bloqueo (solo base local)',
    ejecutar: () => blockReason({ command: 'dev', databaseUrl: SUPABASE }),
    verificar: (motivo) => expect(motivo).toContain('solo se permite contra la base local'),
  });

  describeCase('database', {
    que: 'permite aplicar migraciones existentes (deploy) en produccion y en Supabase',
    espera: 'null (sin bloqueo)',
    ejecutar: () => [
      blockReason({ command: 'deploy', databaseUrl: SUPABASE, nodeEnv: 'production' }),
      blockReason({ command: 'status', databaseUrl: SUPABASE, nodeEnv: 'production' }),
    ],
    verificar: (r) => expect(r).toEqual([null, null]),
  });

  describeCase('database', {
    que: 'permite todo en la base local de desarrollo',
    espera: 'null para dev, create y reset',
    ejecutar: () =>
      (['dev', 'create', 'reset'] as const).map((command) =>
        blockReason({ command, databaseUrl: LOCAL, nodeEnv: 'development' }),
      ),
    verificar: (r) => expect(r).toEqual([null, null, null]),
  });
});
