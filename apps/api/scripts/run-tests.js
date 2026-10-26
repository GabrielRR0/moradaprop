/**
 * Lanza Jest:
 *   pnpm test                    -> todos los tests unitarios
 *   pnpm test:module auth        -> solo src/modules/auth
 *   pnpm test:watch              -> modo watch
 */
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
const jestArgs = ['jest', '--config', 'jest.config.js'];

const moduleIndex = args.indexOf('--module');
if (moduleIndex !== -1) {
  const modulo = args[moduleIndex + 1];
  if (!modulo) {
    console.error('Uso: pnpm test:module <nombre-del-modulo>');
    process.exit(1);
  }
  // Los modulos de negocio viven en src/modules/<modulo>; las capas transversales
  // (config, database...) viven directo en src/<nombre>.
  // Un mini modulo (ej. security/threat-model) se busca dentro de los modulos que lo contienen.
  const { existsSync, readdirSync } = require('node:fs');
  const mini = readdirSync('src/modules').find((padre) => existsSync(`src/modules/${padre}/${modulo}/${modulo}.module.ts`));
  const carpeta = existsSync(`src/modules/${modulo}`)
    ? `src/modules/${modulo}/`
    : mini
      ? `src/modules/${mini}/${modulo}/`
      : `src/${modulo}/`;
  jestArgs.push('--testPathPatterns', carpeta);
}
if (args.includes('--watch')) jestArgs.push('--watch');

const result = spawnSync('npx', jestArgs, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
