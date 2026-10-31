import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describeCase } from '@test/support/describe-case';

/**
 * La carpeta de un controller dice quien puede usar sus rutas, y el decorador de la clase lo hace cumplir.
 * Si no coinciden, alguien movio un archivo o cambio un grupo sin cambiar el otro: aqui se detecta.
 * Ver docs/CONVENCIONES.md, "Controllers".
 */
const MODULES = path.resolve(__dirname, '../../../modules');

/** Carpeta -> grupos de acceso que se aceptan en la clase. */
const FOLDERS: Array<[string, string[]]> = [
  ['/controllers/public/', ['PublicGroup', 'GuestGroup']],
  ['/controllers/private/user/', ['AuthGroup']],
  ['/controllers/private/publisher/', ['PublisherGroup']],
  ['/controllers/private/agency/', ['AgencyGroup']],
  ['/controllers/private/admin/', ['AdminGroup']],
];

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const controllers = walk(MODULES)
  .filter((file) => file.endsWith('.controller.ts'))
  .map((file) => ({ file, rel: path.relative(MODULES, file).split(path.sep).join('/') }));

/** Decoradores de las clases @Controller de un archivo. */
function classDecorators(file: string): string[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  const names: string[] = [];
  source.forEachChild((node) => {
    if (!ts.isClassDeclaration(node)) return;
    const decorators = (ts.getDecorators(node) ?? []).map((d) => (ts.isCallExpression(d.expression) ? d.expression.expression.getText(source) : d.expression.getText(source)));
    if (decorators.includes('Controller')) names.push(...decorators);
  });
  return names;
}

describe('Estructura de controllers', () => {
  describeCase('controllers', {
    que: 'todo controller vive en controllers/public o en controllers/private/<acceso>',
    espera: 'ningun controller fuera de las carpetas de acceso conocidas',
    ejecutar: () => controllers.filter(({ rel }) => !FOLDERS.some(([folder]) => `/${rel}`.includes(folder))).map(({ rel }) => rel),
    verificar: (fuera) => expect(fuera).toEqual([]),
    describirObtenido: (fuera) => (fuera.length === 0 ? `${controllers.length} controllers, todos en su carpeta` : `fuera de lugar: ${fuera.join(', ')}`),
  });

  describeCase('controllers', {
    que: 'el grupo de acceso de la clase coincide con la carpeta del controller',
    espera: 'public/ usa PublicGroup o GuestGroup, private/user AuthGroup, private/publisher PublisherGroup, private/agency AgencyGroup y private/admin AdminGroup',
    ejecutar: () =>
      controllers.flatMap(({ file, rel }) => {
        const match = FOLDERS.find(([folder]) => `/${rel}`.includes(folder));
        if (!match) return [];
        const used = classDecorators(file);
        return match[1].some((group) => used.includes(group)) ? [] : [`${rel} deberia llevar ${match[1].join(' o ')} en la clase`];
      }),
    verificar: (desajustes) => expect(desajustes).toEqual([]),
    describirObtenido: (desajustes) => (desajustes.length === 0 ? 'todos coinciden' : desajustes.join(' | ')),
  });
});
