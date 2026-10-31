import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describeCase } from '@test/support/describe-case';

const SUPPORT_DIR = join(__dirname, '..');

const modules = readdirSync(SUPPORT_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'tests')
  .map((entry) => entry.name);

/** Nombres que un index.ts exporta (export { a, type B } from..., export * as XSupport from..., export const/function/class X). */
function exportedNames(source: string): string[] {
  const names = new Set<string>();
  for (const block of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of block[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop();
      if (name) names.add(name);
    }
  }
  for (const ns of source.matchAll(/export\s+\*\s+as\s+(\w+)/g)) names.add(ns[1]);
  for (const decl of source.matchAll(/export\s+(?:async\s+)?(?:const|function|class|interface|type)\s+(\w+)/g)) names.add(decl[1]);
  return [...names];
}

describe('support/: modulos que envuelven paquetes de terceros', () => {
  describeCase('support', {
    que: 'hay modulos en support/ y cada uno tiene index.ts y README.md',
    espera: 'ninguno sin index.ts ni README.md',
    ejecutar: () =>
      modules.filter((m) => !existsSync(join(SUPPORT_DIR, m, 'index.ts')) || !existsSync(join(SUPPORT_DIR, m, 'README.md'))),
    verificar: (faltan) => {
      expect(modules.length).toBeGreaterThan(0);
      expect(faltan).toEqual([]);
    },
  });

  describeCase('support', {
    que: 'todo lo que exporta el index de un modulo esta nombrado en su README',
    espera: 'ningun export sin documentar',
    ejecutar: () =>
      modules.flatMap((m) => {
        const readme = readFileSync(join(SUPPORT_DIR, m, 'README.md'), 'utf8');
        return exportedNames(readFileSync(join(SUPPORT_DIR, m, 'index.ts'), 'utf8'))
          .filter((name) => !readme.includes(name))
          .map((name) => `${m}: ${name}`);
      }),
    verificar: (sinDocumentar) => expect(sinDocumentar).toEqual([]),
  });
});
