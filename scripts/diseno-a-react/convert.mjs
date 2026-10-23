// Convierte docs/diseno/pantallas/*.dc.html en modulos de React (apps/web/src/modules/*).
// Uso: node scripts/diseno-a-react/convert.mjs   (luego: pnpm format)
// Ver scripts/diseno-a-react/README.md.
// RETIRADO: las pantallas de apps/web ya se mantienen a mano (iconos, barra lateral y partes con nombre
// compartidos). Correr esto de nuevo SOBRESCRIBE ese trabajo. Solo con --force (ver README de esta carpeta).
if (!process.argv.includes('--force')) {
  console.error('El conversor esta retirado: sobrescribiria las pantallas editadas. Usa --force solo si sabes lo que haces.');
  process.exit(1);
}
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertTemplate } from './template.mjs';
import { convertLogic, hookSource, routeMap } from './logic.mjs';
import { SCREENS, PAGES, ROUTES, MODULES } from './screens.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const designDir = path.join(root, 'docs/diseno/pantallas');
const modulesDir = path.join(root, 'apps/web/src/modules');
Object.assign(routeMap, ROUTES);

const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

function rootStyleFor(screen) {
  return (style) => {
    let s = style.replace(/width:\s*\d+px/, 'width:100%');
    if (screen.fit === 'auto') s = s.replace(/height:\s*\d+px/, 'min-height:100dvh');
    else if (screen.fit === 'app') s = s.replace(/height:\s*\d+px/, 'height:100dvh');
    if (screen.mobile) s += '; max-width:560px; margin:0 auto';
    if (screen.maxWidth) s += `; max-width:${screen.maxWidth}px; margin:0 auto`;
    return s;
  };
}

function importsFor(code, { needsVals }) {
  const imp = ["'use client';"];
  if (code.includes(': any')) imp.push('/* eslint-disable @typescript-eslint/no-explicit-any */');
  if (code.includes('<Link')) imp.push("import Link from 'next/link';");
  if (code.includes('<Fragment')) imp.push("import { Fragment } from 'react';");
  if (code.includes('as CSSProperties')) imp.push("import type { CSSProperties } from 'react';");
  const dc = [];
  if (/\bcss\(/.test(code)) dc.push('css');
  if (needsVals) dc.push('type Vals');
  if (dc.length) imp.push(`import { ${dc.join(', ')} } from '@/lib/dc';`);
  if (/\bbrand\./.test(code)) imp.push("import { brand } from '@/config';");
  if (code.includes('whatsappUrl(')) imp.push("import { whatsappUrl } from '@/lib/whatsapp';");
  if (code.includes('toggleDark')) imp.push("import { useTheme } from '@/lib/theme';");
  return imp;
}

const prelude = (code) =>
  code.includes('toggleDark') ? '  const { toggleDark } = useTheme();\n' : '';

function build(screen) {
  const source = fs.readFileSync(path.join(designDir, `${screen.file}.dc.html`), 'utf8');
  const logicSource = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(source)[1];
  const logic = convertLogic(logicSource);
  const comp = screen.comp;
  const parts = [];
  const { jsx, css } = convertTemplate(source, {
    scopeClass: `ds-${comp.toLowerCase()}`,
    suffix: comp.toLowerCase(),
    rootStyle: rootStyleFor(screen),
    inject: { 'Cambiar modo claro u oscuro': 'onClick={toggleDark}' },
    reveal: !!screen.reveal,
    textInject: screen.textInject,
    threshold: 4200,
    addPart: (code) => {
      const name = `${comp}Section${parts.length + 1}`;
      parts.push({ name, code });
      return name;
    },
  });

  const dir = path.join(modulesDir, screen.module, 'components', comp);
  const needsVals = !!logic;
  // Partes de una corrida anterior (el corte en secciones puede cambiar entre corridas).
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (/Section\d+\.tsx$/.test(f)) fs.unlinkSync(path.join(dir, f));
    }
  }
  const hookName = `use${comp}`;

  // Una seccion recibe `v` solo si ella (o una seccion hija) lo usa.
  const usesV = new Map(parts.map((p) => [p.name, false]));
  for (let changed = true; changed;) {
    changed = false;
    for (const p of parts) {
      if (usesV.get(p.name)) continue;
      const direct = /\bv\./.test(p.code.replaceAll(' v={v}', ''));
      const viaChild = parts.some((c) => usesV.get(c.name) && p.code.includes(`<${c.name} v={v}`));
      if (direct || viaChild) {
        usesV.set(p.name, true);
        changed = true;
      }
    }
  }
  const fixStubs = (code) =>
    parts.reduce(
      (acc, p) =>
        usesV.get(p.name) ? acc : acc.replaceAll(`<${p.name} v={v} />`, `<${p.name} />`),
      code,
    );

  for (const part of parts) {
    const code = fixStubs(part.code);
    const used = parts.filter((p) => p.name !== part.name && code.includes(`<${p.name} `));
    const takesV = usesV.get(part.name);
    const imports = [
      ...importsFor(code, { needsVals: takesV }),
      ...used.map((p) => `import { ${p.name} } from './${p.name}';`),
    ];
    const signature = takesV ? '{ v }: { v: Vals }' : '';
    write(
      path.join(dir, `${part.name}.tsx`),
      `${imports.join('\n')}\n\nexport function ${part.name}(${signature}) {\n${prelude(code)}  return (\n${code}\n  );\n}\n`,
    );
  }

  const rootJsx = fixStubs(jsx);
  const used = parts.filter((p) => rootJsx.includes(`<${p.name} `));
  const imports = [
    ...importsFor(rootJsx, { needsVals: false }),
    `import './${comp.toLowerCase()}.css';`,
    ...(logic ? [`import { ${hookName} } from '../../hooks/${hookName}';`] : []),
    ...used.map((p) => `import { ${p.name} } from './${p.name}';`),
  ];
  write(
    path.join(dir, `${comp}.tsx`),
    `${imports.join('\n')}\n\nexport function ${comp}() {\n${logic ? `  const v = ${hookName}();\n` : ''}${prelude(rootJsx)}  return (\n${rootJsx}\n  );\n}\n`,
  );
  write(path.join(dir, `${comp.toLowerCase()}.css`), css);
  write(path.join(dir, 'index.ts'), `export { ${comp} } from './${comp}';\n`);
  if (logic)
    write(
      path.join(modulesDir, screen.module, 'hooks', `${hookName}.ts`),
      hookSource(hookName, logic),
    );
  return { comp, parts: parts.length, needsVals };
}

for (const screen of SCREENS) {
  if (screen.handEdited) {
    console.log(`${screen.file.padEnd(12)} -> (editada a mano, se omite)`);
    continue;
  }
  const r = build(screen);
  console.log(`${screen.file.padEnd(12)} -> ${r.comp} (${r.parts} partes)`);
}

for (const page of PAGES) {
  if (page.handEdited) continue;
  const imports = ["import { Responsive } from '@/components/Responsive';"];
  const comps = [page.desktop, page.mobile]
    .filter(Boolean)
    .map((f) => SCREENS.find((s) => s.file === f).comp);
  for (const c of comps) imports.push(`import { ${c} } from './${c}';`);
  // Pantallas solo de escritorio muestran un aviso amable en el telefono.
  if (page.mobileNotice)
    imports.push("import { DesktopOnlyNotice } from '@/components/DesktopOnlyNotice';");
  const mobileNode = page.mobile
    ? `<${comps[1]} />`
    : page.mobileNotice
      ? '<DesktopOnlyNotice />'
      : null;
  const body = mobileNode
    ? `<Responsive desktop={<${comps[0]} />} mobile={${mobileNode}} />`
    : `<${comps[0]} />`;
  write(
    path.join(modulesDir, page.module, 'components', `${page.name}.tsx`),
    `${mobileNode ? imports.join('\n') : imports.slice(1).join('\n')}\n\nexport function ${page.name}() {\n  return ${body};\n}\n`,
  );
}

for (const mod of [...new Set(SCREENS.map((s) => s.module))]) {
  const pages = PAGES.filter((p) => p.module === mod);
  write(
    path.join(modulesDir, mod, 'index.ts'),
    `// Archivo padre del modulo ${mod}: unico punto de entrada.\n${pages.map((p) => `export { ${p.name} } from './components/${p.name}';`).join('\n')}\n`,
  );
  if (!pages.every((p) => p.handEdited)) {
    write(path.join(modulesDir, mod, 'README.md'), moduleReadme(mod, pages));
  }
}

function moduleReadme(mod, pages) {
  const info = MODULES[mod];
  const screens = SCREENS.filter((s) => s.module === mod);
  const pageRows = pages
    .map((p) => {
      const route = ROUTES[p.desktop];
      const mobile = p.mobile
        ? ` + \`${SCREENS.find((s) => s.file === p.mobile).comp}\` (móvil)`
        : '';
      return `| \`${route}\` | \`${p.name}\` | \`${SCREENS.find((s) => s.file === p.desktop).comp}\`${mobile} | \`docs/diseno/pantallas/${p.desktop}.dc.html\` |`;
    })
    .join('\n');
  const hooks = screens
    .filter((s) => fs.existsSync(path.join(modulesDir, mod, 'hooks', `use${s.comp}.ts`)))
    .map((s) => `- \`hooks/use${s.comp}.ts\` — estado y datos de ejemplo de \`${s.comp}\`.`)
    .join('\n');
  return `# Módulo \`${mod}\`

${info}

## Qué contiene

| Ruta | Página (la que importa \`app/\`) | Pantallas | Diseño de origen |
|---|---|---|---|
${pageRows}

\`\`\`
${mod}/
  index.ts                 # PADRE: único punto de entrada (exporta las páginas)
  components/
    <Pagina>.tsx           # elige escritorio o móvil con <Responsive>
    <Pantalla>/            # una carpeta por pantalla: <Pantalla>.tsx, SectionN.tsx (partes), estilos .css
  hooks/                   # lógica de cada pantalla (estado, datos de ejemplo, handlers)
\`\`\`

${hooks}

## Cómo funciona

- Cada pantalla es el diseño convertido a React: el JSX conserva los estilos del diseño y el CSS
  de la pantalla va **acotado** bajo su clase raíz (\`.ds-<pantalla>\`), así no se pisa con otras.
- La lógica vive en el hook de la pantalla y devuelve un objeto \`v\` que el JSX consume (equivale al
  \`renderVals()\` del diseño). Los **datos son de ejemplo** y están dentro del hook: al conectar el API
  se reemplazan por llamadas a \`services/\` (TanStack Query) sin tocar el JSX.
- El tema (color de marca \`--ac\` y modo noche) sale de \`src/app/globals.css\` + \`ThemeProvider\`.
- Escritorio y móvil se alternan por CSS (\`<Responsive>\`, corte en 900 px).
- Los avisos (\`toast\`) y la navegación entre pantallas vienen de \`scripts/diseno-a-react/enhance.mjs\`.

## Reglas

- Fuera de este módulo solo se importa \`index.ts\` (regla ESLint \`local/no-internal-imports\`).
- Máximo 600 líneas por archivo: las pantallas grandes se parten en \`SectionN.tsx\`.
- **Si editas a mano un archivo de aquí, no vuelvas a correr el conversor sobre él**: el conversor es
  una herramienta de arranque (ver \`scripts/diseno-a-react/README.md\`).
`;
}
console.log('Listo. Ejecuta: pnpm format');
