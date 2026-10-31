import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describeCase } from '@test/support/describe-case';

/**
 * Toda ruta de administracion que CAMBIA algo (POST, PUT, PATCH, DELETE) debe quedar en la auditoria: o lleva @Audit(...),
 * o el service la audita por dentro y se declara aqui con el motivo. Una ruta nueva sin ninguna de las dos hace fallar la prueba.
 */
const MODULES = path.resolve(__dirname, '../../../modules');
const MUTATING = ['Post', 'Put', 'Patch', 'Delete'];

/** "Clase.metodo" -> por que no lleva @Audit. */
const AUDITED_INSIDE_SERVICE: Record<string, string> = {
  'AdminUsersController.setStatus': 'AdminUsersService.setStatus registra admin.user.suspended / admin.user.reactivated',
  'SettingsController.set': 'SettingsService.set registra settings.update; @Audit guardaria el cuerpo, que trae el secreto',
  'SettingsController.remove': 'SettingsService.remove registra settings.remove',
  'SettingsController.testMail': 'no cambia datos: solo envia un correo de prueba al propio admin',
};

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const adminControllers = walk(MODULES).filter((file) => file.endsWith('.controller.ts') && file.split(path.sep).join('/').includes('/private/admin/'));

/** Rutas que modifican datos: `Clase.metodo` y si llevan @Audit. */
function mutatingRoutes(file: string): Array<{ id: string; audited: boolean }> {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);
  const routes: Array<{ id: string; audited: boolean }> = [];
  source.forEachChild((node) => {
    if (!ts.isClassDeclaration(node) || !node.name) return;
    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member)) continue;
      const names = (ts.getDecorators(member) ?? []).map((d) => (ts.isCallExpression(d.expression) ? d.expression.expression.getText(source) : d.expression.getText(source)));
      if (!names.some((n) => MUTATING.includes(n))) continue;
      routes.push({ id: `${node.name.text}.${member.name.getText(source)}`, audited: names.includes('Audit') });
    }
  });
  return routes;
}

const routes = adminControllers.flatMap(mutatingRoutes);

describe('Auditoria de las rutas de administracion', () => {
  describeCase('admin-audit', {
    que: 'toda ruta de admin que modifica datos queda en la auditoria',
    espera: 'cada ruta POST/PUT/PATCH/DELETE de private/admin lleva @Audit o esta declarada como auditada por su service',
    ejecutar: () => routes.filter((r) => !r.audited && !(r.id in AUDITED_INSIDE_SERVICE)).map((r) => r.id),
    verificar: (sinAuditar) => expect(sinAuditar).toEqual([]),
    describirObtenido: (sinAuditar) => (sinAuditar.length === 0 ? `${routes.length} rutas que modifican datos, todas auditadas` : `sin auditar: ${sinAuditar.join(', ')}`),
  });

  describeCase('admin-audit', {
    que: 'la lista de excepciones no queda con rutas que ya no existen',
    espera: 'toda excepcion declarada corresponde a una ruta real que no lleva @Audit',
    ejecutar: () => Object.keys(AUDITED_INSIDE_SERVICE).filter((id) => !routes.some((r) => r.id === id && !r.audited)),
    verificar: (sobrantes) => expect(sobrantes).toEqual([]),
    describirObtenido: (sobrantes) => (sobrantes.length === 0 ? 'sin excepciones sobrantes' : `sobran: ${sobrantes.join(', ')}`),
  });
});
