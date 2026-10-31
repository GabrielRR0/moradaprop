import fs from 'node:fs';
import path from 'node:path';
import { Injectable, InternalServerErrorException, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';
import ts from 'typescript';

/**
 * Verifica, en las pruebas e2e, que lo que cada ruta DEVUELVE coincide con el Resource que declara en su firma
 * (`Promise<PropertyCardResource>`). Una interface no existe en tiempo de ejecucion, asi que se leen los archivos
 * con la API del compilador y se comparan con la respuesta real:
 *   - cada propiedad obligatoria debe estar presente y ser del tipo declarado,
 *   - una propiedad que el Resource no declara se rechaza (asi se detecta una fuga, ej. una clave interna),
 *   - los enums de la base y los tipos que no se pueden resolver se aceptan como texto o cualquier valor.
 * Se activa solo en test-app.ts; apagalo con RESOURCE_CONTRACT=off.
 */

const SRC = path.resolve(__dirname, '../../src');

type PropInfo = { name: string; optional: boolean; type: ts.TypeNode | undefined };
type Decl = { kind: 'interface'; props: PropInfo[]; extends: string[] } | { kind: 'alias'; node: ts.TypeNode };

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

const parse = (file: string) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true);

const DECLS = new Map<string, Decl>();
const HANDLERS = new Map<string, ts.TypeNode>();

function load() {
  const files = walk(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts'));
  // Los archivos de Resources primero: si un nombre se repite, gana el Resource.
  files.sort((a, b) => Number(b.includes('resource')) - Number(a.includes('resource')));

  for (const file of files) {
    const source = parse(file);
    const isController = file.endsWith('.controller.ts');
    source.forEachChild((node) => {
      if (ts.isInterfaceDeclaration(node) && !DECLS.has(node.name.text)) {
        const props: PropInfo[] = node.members.filter(ts.isPropertySignature).map((m) => ({
          name: m.name.getText(source),
          optional: Boolean(m.questionToken),
          type: m.type,
        }));
        const parents = (node.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.expression.getText(source)));
        DECLS.set(node.name.text, { kind: 'interface', props, extends: parents });
      } else if (ts.isTypeAliasDeclaration(node) && !DECLS.has(node.name.text)) {
        DECLS.set(node.name.text, { kind: 'alias', node: node.type });
      } else if (isController && ts.isClassDeclaration(node) && node.name) {
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member) && member.type) HANDLERS.set(`${node.name.text}.${member.name.getText(source)}`, member.type);
        }
      }
    });
  }
}

const describe = (value: unknown): string => (value === null ? 'null' : Array.isArray(value) ? 'array' : value instanceof Date ? 'Date' : typeof value);

function propsOf(name: string, seen = new Set<string>()): PropInfo[] | undefined {
  const decl = DECLS.get(name);
  if (!decl || decl.kind !== 'interface' || seen.has(name)) return undefined;
  seen.add(name);
  const inherited = decl.extends.flatMap((parent) => propsOf(parent, seen) ?? []);
  return [...inherited, ...decl.props];
}

/** Lista de diferencias entre `value` y el tipo `node` (vacia si cumple). */
function conforms(value: unknown, node: ts.TypeNode, where: string): string[] {
  if (ts.isParenthesizedTypeNode(node)) return conforms(value, node.type, where);

  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return typeof value === 'string' ? [] : [`${where}: se esperaba string y llego ${describe(value)}`];
    case ts.SyntaxKind.NumberKeyword:
      return typeof value === 'number' ? [] : [`${where}: se esperaba number y llego ${describe(value)}`];
    case ts.SyntaxKind.BooleanKeyword:
      return typeof value === 'boolean' ? [] : [`${where}: se esperaba boolean y llego ${describe(value)}`];
    case ts.SyntaxKind.UndefinedKeyword:
      return value === undefined ? [] : [`${where}: se esperaba undefined y llego ${describe(value)}`];
    case ts.SyntaxKind.VoidKeyword:
    case ts.SyntaxKind.UnknownKeyword:
    case ts.SyntaxKind.AnyKeyword:
    case ts.SyntaxKind.ObjectKeyword:
      return [];
    default:
  }

  if (ts.isLiteralTypeNode(node)) {
    const lit = node.literal;
    if (lit.kind === ts.SyntaxKind.NullKeyword) return value === null ? [] : [`${where}: se esperaba null y llego ${describe(value)}`];
    const expected = lit.kind === ts.SyntaxKind.TrueKeyword ? true : lit.kind === ts.SyntaxKind.FalseKeyword ? false : ts.isStringLiteral(lit) ? lit.text : ts.isNumericLiteral(lit) ? Number(lit.text) : undefined;
    return expected === undefined || value === expected ? [] : [`${where}: se esperaba ${JSON.stringify(expected)} y llego ${JSON.stringify(value)}`];
  }

  if (ts.isArrayTypeNode(node)) {
    if (!Array.isArray(value)) return [`${where}: se esperaba un arreglo y llego ${describe(value)}`];
    return value.flatMap((item, i) => conforms(item, node.elementType, `${where}[${i}]`));
  }

  if (ts.isUnionTypeNode(node)) {
    let best: string[] | undefined;
    for (const member of node.types) {
      const errors = conforms(value, member, where);
      if (errors.length === 0) return [];
      if (!best || errors.length < best.length) best = errors;
    }
    return best ?? [];
  }

  if (ts.isTypeLiteralNode(node)) {
    const props: PropInfo[] = node.members.filter(ts.isPropertySignature).map((m) => ({ name: m.name.getText(), optional: Boolean(m.questionToken), type: m.type }));
    return checkObject(value, props, where);
  }

  if (ts.isTypeReferenceNode(node)) {
    const name = ts.isIdentifier(node.typeName) ? node.typeName.text : undefined;
    if (!name) return []; // DbSupport.Role y similares: enums de la base (texto)
    if (name === 'Promise') return node.typeArguments?.[0] ? conforms(value, node.typeArguments[0], where) : [];
    if (name === 'Array') return node.typeArguments?.[0] ? conforms(value, ts.factory.createArrayTypeNode(node.typeArguments[0]), where) : [];
    if (name === 'Date') return value instanceof Date || (typeof value === 'string' && !Number.isNaN(Date.parse(value))) ? [] : [`${where}: se esperaba una fecha y llego ${describe(value)}`];
    if (name === 'Record') return value !== null && typeof value === 'object' ? [] : [`${where}: se esperaba un objeto y llego ${describe(value)}`];

    const props = propsOf(name);
    if (props) return checkObject(value, props, where);
    const decl = DECLS.get(name);
    if (decl?.kind === 'alias') return conforms(value, decl.node, where);
    return []; // tipo que no se puede resolver aqui (de una libreria): se acepta
  }

  return [];
}

function checkObject(value: unknown, props: PropInfo[], where: string): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [`${where}: se esperaba un objeto y llego ${describe(value)}`];
  const record = value as Record<string, unknown>;
  const errors: string[] = [];
  for (const prop of props) {
    const v = record[prop.name];
    if (v === undefined) {
      if (!prop.optional) errors.push(`${where}.${prop.name}: falta (el Resource lo declara obligatorio)`);
      continue;
    }
    if (prop.type) errors.push(...conforms(v, prop.type, `${where}.${prop.name}`));
  }
  const declared = new Set(props.map((p) => p.name));
  for (const key of Object.keys(record)) {
    if (!declared.has(key)) errors.push(`${where}.${key}: el Resource no lo declara (¿se esta filtrando un dato interno?)`);
  }
  return errors;
}

let loaded = false;

@Injectable()
export class ResourceContractInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    if (process.env.RESOURCE_CONTRACT === 'off' || context.getType() !== 'http') return next.handle();
    if (!loaded) {
      load();
      loaded = true;
      if (process.env.CONTRACT_LOG) {
        const declared = [...HANDLERS.keys()].map((key) => `declared ${key}\n`).join('');
        fs.appendFileSync(process.env.CONTRACT_LOG, `total ${HANDLERS.size}\n${declared}`);
      }
    }
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const declared = HANDLERS.get(route);
    if (!declared) return next.handle();

    return next.handle().pipe(
      map((data) => {
        const errors = conforms(data, declared, route).slice(0, 8);
        if (errors.length > 0) {
          // Jest oculta el cuerpo de un 500: si CONTRACT_LOG apunta a un archivo, la violacion queda anotada ahi.
          if (process.env.CONTRACT_LOG) fs.appendFileSync(process.env.CONTRACT_LOG, `${route}\n  - ${errors.join('\n  - ')}\n`);
          throw new InternalServerErrorException(`[contrato] ${route} no cumple ${declared.getText()}:\n  - ${errors.join('\n  - ')}`);
        }
        if (process.env.CONTRACT_LOG) fs.appendFileSync(process.env.CONTRACT_LOG, `ok ${route}\n`);
        return data;
      }),
    );
  }
}
