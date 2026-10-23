// Convierte el marcado de un `.dc.html` (<x-dc>) del diseno en JSX de React.
import { parseDocument } from 'htmlparser2';
import { renameAnimations, scopeCss } from './css.mjs';
import { routeMap } from './logic.mjs';

const HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
const hasHole = (s) => s.includes('{{');
const NUMERIC_ATTRS = new Set(['maxlength', 'rows']);
const ATTR_NAMES = { class: 'className', for: 'htmlFor', maxlength: 'maxLength', rows: 'rows' };

const esc = (s) => s.replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${');

function expr(path, scope) {
  const p = path.trim();
  if (p === 'true' || p === 'false') return p;
  const first = p.split('.')[0];
  return scope.has(first) || first === '$index' ? p : `v.${p}`;
}

function tpl(raw, scope) {
  let out = '';
  let last = 0;
  for (const m of raw.matchAll(HOLE)) {
    out += `${esc(raw.slice(last, m.index))}\${${expr(m[1], scope)}}`;
    last = m.index + m[0].length;
  }
  return `\`${out}${esc(raw.slice(last))}\``;
}

/** Valor de un atributo -> codigo JSX (`"texto"`, `{expr}` o `{`plantilla`}`). */
function attrValue(name, raw, scope) {
  if (!hasHole(raw)) {
    if (NUMERIC_ATTRS.has(name)) return `{${Number(raw)}}`;
    return /^[^"\\\n&<>{}]*$/.test(raw) ? `"${raw}"` : `{${JSON.stringify(raw)}}`;
  }
  const whole = /^\{\{\s*([^}]*?)\s*\}\}$/.exec(raw.trim());
  return whole && raw.trim().split('{{').length === 2
    ? `{${expr(whole[1], scope)}}`
    : `{${tpl(raw, scope)}}`;
}

function parseDecls(str) {
  const decls = [];
  let cur = '';
  let depth = 0;
  let quote = null;
  for (const ch of str) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      decls.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) decls.push(cur);
  return decls
    .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()])
    .filter(([k, val]) => k && val);
}

const camel = (p) =>
  p.startsWith('--')
    ? p
    : p
        .replace(/^-(\w)/, (_m, c) => c.toUpperCase())
        .replace(/-([a-z])/g, (_m, c) => c.toUpperCase());

function styleAttr(raw, ctx, scope, isRoot) {
  let style = raw.replace(/\{\{\s*themeStyle\s*\}\}\s*;?/g, '');
  if (isRoot) style = ctx.rootStyle(style);
  style = renameAnimations(style, ctx.keyframes);
  if (hasHole(style)) return `style={css(${tpl(style, scope)})}`;
  const pairs = parseDecls(style).map(
    ([k, val]) => `${JSON.stringify(camel(k))}: ${JSON.stringify(val)}`,
  );
  const cast = pairs.some((x) => x.startsWith('"--')) ? ' as CSSProperties' : '';
  return `style={{ ${pairs.join(', ')} }${cast}}`;
}

function textNode(data, scope) {
  if (!data.trim()) return data.includes('\n') ? '' : '{" "}';
  let text = data.replace(/\s+/g, ' ');
  if (text.includes('[NOMBRE]')) text = text.replaceAll('[NOMBRE]', '{{brand.name}}');
  if (hasHole(text)) return `{\`${rebuild(text, scope)}\`}`;
  const trimmed = text.trim() === text;
  return trimmed && /^[^{}<>&]+$/.test(text) ? text : `{${JSON.stringify(text)}}`;
}

function rebuild(text, scope) {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(HOLE)) {
    const p = m[1].trim();
    out += `${esc(text.slice(last, m.index))}\${${p.startsWith('brand.') ? p : expr(p, scope)}}`;
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

function emitAttrs(node, ctx, scope, isRoot) {
  const out = [];
  const a = node.attribs;
  const controlled = 'value' in a && hasHole(a.value) && 'onInput' in a;
  if (isRoot && !('class' in a)) out.push(`className="${ctx.scopeClass}"`);
  for (const [name, raw] of Object.entries(a)) {
    if (name.startsWith('hint-') || name.startsWith('data-dc')) continue;
    if (name === 'style') out.push(styleAttr(raw, ctx, scope, isRoot));
    else if (name === 'class') {
      const withScope = isRoot ? `${ctx.scopeClass} ${raw}` : raw;
      out.push(`className=${attrValue('class', withScope, scope)}`);
    } else if (name === 'href') {
      if (raw === '__WHATSAPP__') {
        out.push('href={whatsappUrl()}', 'target="_blank"', 'rel="noreferrer"');
        continue;
      }
      const mapped = raw.replace(/^([A-Za-z]+)\.dc\.html$/, (_m, n) => routeMap[n] ?? '/');
      out.push(`href=${attrValue('href', mapped, scope)}`);
    } else if (name === 'value' && node.name === 'input') {
      if (controlled) out.push(`value=${attrValue(name, raw, scope)}`);
      else if (hasHole(raw))
        out.push(
          `key=${attrValue(name, raw, scope)}`,
          `defaultValue=${attrValue(name, raw, scope)}`,
        );
      else out.push(`defaultValue=${attrValue(name, raw, scope)}`);
    } else if (name === 'onInput' && controlled)
      out.push(`onChange=${attrValue(name, raw, scope)}`);
    else if (name === 'checked') out.push('defaultChecked');
    else {
      const jsx = ATTR_NAMES[name] ?? (/^(aria|data)-/.test(name) ? name : camel(name));
      out.push(`${jsx}=${attrValue(name, raw, scope)}`);
    }
  }
  if (node.name === 'button' && !('type' in a)) out.push('type="button"');
  if (node.name === 'form') out.push('onSubmit={(e) => e.preventDefault()}');
  if (ctx.inject[a['aria-label']]) out.push(ctx.inject[a['aria-label']]);
  if (node.name === 'a' || node.name === 'button') {
    const text = textOf(node);
    for (const [pattern, handler] of ctx.textInject ?? [])
      if (pattern.test(text)) out.push(handler);
  }
  if (ctx.reveal && node.name === 'section' && ctx.depth <= 2) out.push('data-reveal=""');
  return out;
}

/** Texto visible de un nodo (sin etiquetas), para decidir enlaces y acciones por su rotulo. */
function textOf(node) {
  if (node.type === 'text') return node.data;
  return (node.children ?? []).map(textOf).join('');
}

function emitNode(node, ctx, scope, depth) {
  if (node.type === 'text') return textNode(node.data, scope);
  if (node.type !== 'tag') return '';
  const kids = (s = scope, d = depth + 1) =>
    node.children
      .map((c) => emitNode(c, ctx, s, d))
      .filter(Boolean)
      .join('\n');

  if (node.name === 'sc-for') {
    const as = node.attribs.as;
    const list = expr(node.attribs.list.replace(/[{}]/g, ''), scope);
    const inner = kids(new Set([...scope, as]));
    return `{${list}.map((${as}: any, $index: number) => (<Fragment key={$index}>${inner}</Fragment>))}`;
  }
  if (node.name === 'sc-if') {
    const cond = expr(node.attribs.value.replace(/[{}]/g, ''), scope);
    return `{${cond} && (<>${kids()}</>)}`;
  }

  ctx.depth = depth;
  const isRoot = depth === 0;
  if (node.name === 'a') {
    const text = textOf(node);
    const isWa =
      /whatsapp/i.test(text) ||
      (/^\s*responder\s*$/i.test(text) && /\bwa\b/.test(node.attribs.class ?? ''));
    if (isWa) node.attribs.href = '__WHATSAPP__';
    else if (/ver detalle|ficha completa/i.test(text)) node.attribs.href = 'Ficha.dc.html';
  }
  const external = node.attribs.href === '__WHATSAPP__';
  const tag =
    node.name === 'a' && node.attribs.href !== undefined && !external ? 'Link' : node.name;
  const attrs = emitAttrs(node, ctx, scope, isRoot).join(' ');
  const inner = kids();
  const out = inner ? `<${tag} ${attrs}>${inner}</${tag}>` : `<${tag} ${attrs} />`;

  if (ctx.split && !scope.size && depth >= 1 && out.length > ctx.threshold) {
    return `<${ctx.addPart(out)} v={v} />`;
  }
  return out;
}

/**
 * @param {string} source contenido de un .dc.html
 * @param {object} opts { scopeClass, rootStyle(fn), inject, reveal, threshold, addPart }
 */
export function convertTemplate(source, opts) {
  const inner = /<x-dc>([\s\S]*?)<\/x-dc>/.exec(source)[1];
  const rawCss = /<style>([\s\S]*?)<\/style>/.exec(inner)?.[1] ?? '';
  const markup = inner.replace(/<helmet>[\s\S]*?<\/helmet>/, '').replace(/<br>/g, '<br/>');
  const { css, names } = scopeCss(rawCss, opts.scopeClass, opts.suffix);
  const dom = parseDocument(markup, { xmlMode: true, decodeEntities: true });
  const rootNode = dom.children.find((n) => n.type === 'tag');
  const ctx = { ...opts, keyframes: names, split: true, depth: 0 };
  const jsx = emitNode(rootNode, ctx, new Set(), 0);
  return { jsx, css };
}
