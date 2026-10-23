import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

function splitDeclarations(input: string): string[] {
  const out: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;
  for (const ch of input) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      out.push(current);
      current = '';
    } else current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

const toCamel = (prop: string) =>
  prop.startsWith('--')
    ? prop
    : prop
        .replace(/^-(\w)/, (_m, c: string) => c.toUpperCase())
        .replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());

/**
 * Convierte un string CSS inline ("a:b; c:d") en objeto `style` de React.
 * Se usa cuando el estilo del diseno lleva valores calculados por la logica.
 */
export function css(input: string): CSSProperties {
  const hit = cache.get(input);
  if (hit) return hit;
  const style: Record<string, string> = {};
  for (const decl of splitDeclarations(input)) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const key = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (key && value) style[toCamel(key)] = value;
  }
  if (cache.size > 500) cache.clear();
  cache.set(input, style as CSSProperties);
  return style as CSSProperties;
}
