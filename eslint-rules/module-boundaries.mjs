import path from 'node:path';

/**
 * Regla local: desde fuera de un modulo (o desde otro modulo) solo se puede
 * importar su archivo padre, nunca sus archivos internos.
 *
 *   OK   : '../modules/auth/auth.module'   '@/modules/auth'   '@/modules/auth/index'
 *   MAL  : '../modules/auth/services/login.service'   '@/modules/auth/components/LoginForm'
 *
 * Dentro del mismo modulo se puede importar libremente.
 */
const MODULE_PATH = /[\\/]src[\\/]modules[\\/]([^\\/]+)(?:[\\/](.*))?$/;

function moduleOf(absolutePath) {
  const match = MODULE_PATH.exec(absolutePath);
  return match ? { name: match[1], rest: (match[2] ?? '').replace(/\.(ts|tsx|js)$/, '') } : null;
}

const rule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      internal:
        'No importes archivos internos del modulo "{{module}}" ({{rest}}). Usa su archivo padre ({{module}}.module o index).',
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

      const esPadre = to.rest === '' || to.rest === 'index' || to.rest === `${to.name}.module`;
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
