import fs from 'node:fs';
import path from 'node:path';

/**
 * Regla local: desde fuera de un modulo (o desde otro modulo) solo se puede
 * importar su archivo padre, nunca sus archivos internos.
 *
 *   OK   : '../modules/auth/auth.module'   '@/modules/auth'   '@/modules/auth/index'
 *   MAL  : '../modules/auth/services/login.service'   '@/modules/auth/components/LoginForm'
 *
 * Dentro del mismo modulo se puede importar libremente.
 *
 * MINI MODULOS: una carpeta dentro de un modulo que tenga su propio `<carpeta>.module.ts`
 * (ej. modules/security/ownership/ownership.module.ts) es un mini modulo PRIVADO de su modulo padre:
 *   - desde fuera del padre no se importa nunca (se entra por el index del padre);
 *   - dentro del padre, los hermanos solo se importan por su archivo padre (index o <mini>.module).
 */
const MODULE_PATH = /[\\/]src[\\/]modules[\\/]([^\\/]+)(?:[\\/](.*))?$/;

const miniCache = new Map();
function isMiniModule(absolutePath, matchIndex, top, sub) {
  const marker = path.join(absolutePath.slice(0, matchIndex), 'src', 'modules', top, sub, `${sub}.module.ts`);
  if (!miniCache.has(marker)) miniCache.set(marker, fs.existsSync(marker));
  return miniCache.get(marker);
}

const strip = (rest) => rest.replace(/\.(ts|tsx|js)$/, '');

function moduleOf(absolutePath) {
  const match = MODULE_PATH.exec(absolutePath);
  if (!match) return null;
  const top = match[1];
  const parts = (match[2] ?? '').split(/[\\/]/).filter(Boolean);
  const sub = parts[0];
  if (sub && !sub.includes('.') && isMiniModule(absolutePath, match.index, top, sub)) {
    return { name: `${top}/${sub}`, own: sub, parent: top, rest: strip(parts.slice(1).join('/')) };
  }
  return { name: top, own: top, parent: null, rest: strip(parts.join('/')) };
}

const rule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      internal:
        'No importes archivos internos del modulo "{{module}}" ({{rest}}). Usa su archivo padre ({{module}}.module o index).',
      mini: 'El mini modulo "{{module}}" es privado de "{{parent}}". Importalo desde el index de "{{parent}}".',
    },
  },
  create(context) {
    const filename = path.resolve(context.filename);
    const srcRoot = /^(.*[\\/]src)[\\/]/.exec(filename)?.[1];
    const from = moduleOf(filename);

    function check(node, specifier) {
      if (typeof specifier !== 'string') return;

      let resolved;
      if (specifier.startsWith('.')) resolved = path.resolve(path.dirname(filename), specifier);
      else if (specifier.startsWith('@/') && srcRoot) resolved = path.join(srcRoot, specifier.slice(2));
      else return;

      const to = moduleOf(resolved);
      if (!to || (from && from.name === to.name)) return;

      // Un mini modulo solo lo importa su modulo padre o un hermano.
      if (to.parent && from?.name !== to.parent && from?.parent !== to.parent) {
        context.report({ node, messageId: 'mini', data: { module: to.name, parent: to.parent } });
        return;
      }

      const esPadre = to.rest === '' || to.rest === 'index' || to.rest === `${to.own}.module`;
      if (!esPadre) {
        context.report({ node, messageId: 'internal', data: { module: to.name, rest: to.rest } });
      }
    }

    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
      ImportExpression: (node) => node.source.type === 'Literal' && check(node, node.source.value),
    };
  },
};

export default { rules: { 'no-internal-imports': rule } };
