// Convierte la clase `Component extends DCLogic` del diseno en un hook de React.
import { matchingBrace } from './css.mjs';
import { applyHookPatches, needsRouter } from './enhance.mjs';

/** Mapa de pantallas del diseno -> ruta real de la app. Lo llena convert.mjs. */
export const routeMap = {};

export function mapRoutes(code) {
  return code.replace(/(['"`])([A-Za-z]+)\.dc\.html\1/g, (all, q, name) =>
    routeMap[name] ? `${q}${routeMap[name]}${q}` : all,
  );
}

/**
 * @returns {{ initial: string, body: string } | null} null si la pantalla no tiene logica.
 */
export function convertLogic(source) {
  const bodyStart = source.indexOf('renderVals()');
  if (bodyStart === -1) return null;
  const open = source.indexOf('{', bodyStart);
  const close = matchingBrace(source, open);
  let body = source.slice(open + 1, close);
  if (/^\s*return \{\};?\s*$/.test(body)) return null;

  const stateMatch = /^\s*state = (.*);\s*$/m.exec(source);
  const initial = stateMatch ? stateMatch[1] : '{}';

  // El tema (modo noche + color de marca) vive ahora en CSS (globals.css) y en ThemeProvider.
  const lines = body.split('\n');
  const first = lines.findIndex((l) => l.includes('const dark ='));
  const last = lines.findIndex((l) => l.includes('const themeStyle ='));
  if (first !== -1 && last !== -1) {
    const rest = lines.slice(last + 1).join(' ');
    const usesAc = /(?<![-\w])ac(?![-\w])/.test(rest);
    lines.splice(first, last - first + 1, ...(usesAc ? ["    const ac = 'var(--ac)';"] : []));
  }
  body = lines.join('\n');

  body = body
    .replace(/this\.state/g, 'state')
    .replace(/this\.setState\(/g, 'setState(')
    .replace(/\(e\) =>/g, '(e: ChangeEvent<HTMLInputElement>) =>');
  body = mapRoutes(body);
  // themeStyle ya no existe: se quita del objeto que devuelve el hook.
  body = body.replace(/\bthemeStyle,\s*/g, '');
  return { initial, body };
}

export function hookSource(hookName, logic) {
  const body = applyHookPatches(hookName, logic.body);
  const usesEvent = body.includes('ChangeEvent');
  const router = needsRouter.has(hookName);
  const imports = [
    "import { useState } from 'react';",
    usesEvent ? "import type { ChangeEvent } from 'react';" : '',
    router ? "import { useRouter } from 'next/navigation';" : '',
    "import type { Vals } from '@/lib/dc';",
    body.includes('toast(') ? "import { toast } from '@/lib/toast';" : '',
  ].filter(Boolean);
  return `/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck -- logica copiada del diseno (JS); se tipa al conectar el API real.
// Generado desde docs/diseno/pantallas con scripts/diseno-a-react. La logica es la del diseno.
${imports.join('\n')}

export function ${hookName}(): Vals {
  const [state, setRawState] = useState<any>(${logic.initial});
  const setState = (patch: any) => setRawState((prev: any) => ({ ...prev, ...patch }));
${router ? '  const router = useRouter();\n' : ''}${body}
}
`;
}
