// Utilidades de CSS del conversor: escopa las reglas de cada pantalla bajo su clase raiz
// y renombra los @keyframes para que dos pantallas no se pisen entre si.

/** Indice de la llave que cierra el bloque que abre en `start` (que apunta a "{"). */
export function matchingBrace(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote && text[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  throw new Error('Llave sin cerrar en CSS');
}

/** Renombra los nombres de animacion dentro de las declaraciones `animation` / `animation-name`. */
export function renameAnimations(declarations, names) {
  if (!names.size) return declarations;
  return declarations.replace(/(animation(?:-name)?\s*:)([^;}]*)/g, (_all, prop, value) => {
    const renamed = value.replace(/[A-Za-z_][\w-]*/g, (word) => names.get(word) ?? word);
    return prop + renamed;
  });
}

export function scopeCss(css, scope, suffix) {
  const names = new Map();
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) names.set(m[1], `${m[1]}-${suffix}`);

  function scopeSelector(selector) {
    const s = selector.trim();
    if (s === 'body' || s === 'html') return null;
    if (s === '*') return `.${scope} *`;
    return `.${scope} ${s}`;
  }

  function walk(text) {
    let out = '';
    let i = 0;
    while (i < text.length) {
      while (i < text.length && /\s/.test(text[i])) i++;
      if (i >= text.length) break;
      const open = text.indexOf('{', i);
      const close = matchingBrace(text, open);
      const prelude = text.slice(i, open).trim();
      const body = text.slice(open + 1, close);
      i = close + 1;

      if (prelude.startsWith('@keyframes')) {
        const name = prelude.split(/\s+/)[1];
        out += `@keyframes ${names.get(name)} {${body}}\n`;
      } else if (prelude.startsWith('@')) {
        out += `${prelude} {\n${walk(body)}}\n`;
      } else {
        const selectors = prelude.split(',').map(scopeSelector).filter(Boolean);
        if (selectors.length)
          out += `${selectors.join(',\n')} {${renameAnimations(body, names)}}\n`;
      }
    }
    return out;
  }

  return { css: walk(css), names };
}
