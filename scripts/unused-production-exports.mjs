/**
 * Exports under src/ that no production file imports.
 * A test import does not count. src/lib/game and src/lib/calculators are skipped.
 * Next.js page, layout, route, proxy, and MDX conventions are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const NEXT_FILE = /(?:^|\/)(page|layout|loading|error|not-found|template|default|global-error|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest|route)\.(ts|tsx)$/;
const NEXT_NAMED = new Set([
  'metadata',
  'generateMetadata',
  'viewport',
  'generateViewport',
  'dynamic',
  'dynamicParams',
  'revalidate',
  'fetchCache',
  'runtime',
  'preferredRegion',
  'maxDuration',
  'generateStaticParams',
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'proxy',
  'register',
  'onRequestError',
  'alt',
  'contentType',
  'size',
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replaceAll('\\', '/');
}

function isTest(p) {
  return /\.(test|spec)\.(ts|tsx)$/.test(p);
}

function isGameOrCalc(p) {
  const r = rel(p);
  return r.startsWith('src/lib/game/') || r.startsWith('src/lib/calculators/');
}

function resolveSpec(fromFile, spec) {
  if (spec.startsWith('@/')) spec = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) spec = path.resolve(path.dirname(fromFile), spec);
  else return null;
  const candidates = [];
  if (/\.(ts|tsx)$/.test(spec)) candidates.push(spec);
  else {
    candidates.push(
      spec + '.ts',
      spec + '.tsx',
      path.join(spec, 'index.ts'),
      path.join(spec, 'index.tsx'),
    );
  }
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function hasModifier(node, kind) {
  return !!node.modifiers?.some((m) => m.kind === kind);
}

function modifiersExport(node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword) && !hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

function collectExports(file, sf) {
  const named = new Map();
  const stars = [];
  const reexports = [];
  let hasDefault = false;
  function add(name, kind) {
    if (!name || name === 'default') {
      hasDefault = true;
      return;
    }
    named.set(name, kind);
  }
  function visit(node) {
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      hasModifier(node, ts.SyntaxKind.DefaultKeyword)
    ) {
      hasDefault = true;
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isModuleDeclaration(node)) &&
      modifiersExport(node) &&
      node.name
    ) {
      const kind =
        ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) ? 'type' : 'value';
      add(node.name.text, kind);
    } else if (ts.isVariableStatement(node) && modifiersExport(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) add(d.name.text, 'value');
      }
    } else if (ts.isExportAssignment(node)) {
      hasDefault = true;
    } else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const target = resolveSpec(file, node.moduleSpecifier.text);
        if (!node.exportClause) {
          if (target) stars.push(target);
        } else if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            const imported = (el.propertyName ?? el.name).text;
            const local = el.name.text;
            add(local, node.isTypeOnly || el.isTypeOnly ? 'type' : 'value');
            if (target) reexports.push({ imported, local, from: target });
          }
        }
      } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          add(el.name.text, node.isTypeOnly || el.isTypeOnly ? 'type' : 'value');
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return { named, stars, reexports, hasDefault };
}

function bindingNames(pattern) {
  const names = [];
  if (!pattern || !ts.isObjectBindingPattern(pattern)) return names;
  for (const el of pattern.elements) {
    if (ts.isIdentifier(el.propertyName ?? el.name)) {
      names.push((el.propertyName ?? el.name).text);
    }
  }
  return names;
}

function collectImports(file, sf) {
  const imports = [];
  function addDynamic(node, target) {
    if (!target) return;
    let parent = node.parent;
    if (
      parent &&
      ts.isPropertyAccessExpression(parent) &&
      parent.name.text === 'then' &&
      parent.parent &&
      ts.isCallExpression(parent.parent)
    ) {
      parent = parent.parent;
    }
    if (parent && ts.isAwaitExpression(parent)) parent = parent.parent;
    if (parent && ts.isVariableDeclaration(parent)) {
      const names = bindingNames(parent.name);
      if (names.length) {
        for (const name of names) imports.push({ target, name, star: false });
        return;
      }
    }
    if (
      parent &&
      ts.isCallExpression(parent) &&
      ts.isPropertyAccessExpression(parent.expression) &&
      parent.expression.name.text === 'then'
    ) {
      const cb = parent.arguments[0];
      const param = cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) ? cb.parameters[0] : undefined;
      const names = param ? bindingNames(param.name) : [];
      if (names.length) {
        for (const name of names) imports.push({ target, name, star: false });
        return;
      }
    }
    imports.push({ target, name: '*', star: true });
  }
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      addDynamic(node, resolveSpec(file, node.arguments[0].text));
    }
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const target = resolveSpec(file, node.moduleSpecifier.text);
      if (target) {
        if (ts.isImportDeclaration(node) && node.importClause) {
          if (node.importClause.name) imports.push({ target, name: 'default', star: false });
          const nb = node.importClause.namedBindings;
          if (nb && ts.isNamedImports(nb)) {
            for (const el of nb.elements) {
              imports.push({
                target,
                name: (el.propertyName ?? el.name).text,
                star: false,
              });
            }
          } else if (nb && ts.isNamespaceImport(nb)) {
            imports.push({ target, name: '*', star: true });
          }
        } else if (ts.isExportDeclaration(node)) {
          if (!node.exportClause) imports.push({ target, name: '*', star: true });
          else if (ts.isNamedExports(node.exportClause)) {
            for (const el of node.exportClause.elements) {
              imports.push({
                target,
                name: (el.propertyName ?? el.name).text,
                star: false,
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return imports;
}

const files = walk(SRC);
const info = new Map();
const importsByFile = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  info.set(file, collectExports(file, sf));
  importsByFile.set(file, collectImports(file, sf));
}

function resolveExport(file, name, seen = new Set()) {
  const key = file + '#' + name;
  if (seen.has(key)) return [];
  seen.add(key);
  const meta = info.get(file);
  if (!meta) return [];
  const hits = [];
  if (name === 'default') {
    if (meta.hasDefault) hits.push(file);
    return hits;
  }
  if (meta.named.has(name) && !meta.reexports.some((r) => r.local === name)) hits.push(file);
  for (const r of meta.reexports) {
    if (r.local === name) hits.push(...resolveExport(r.from, r.imported, seen));
  }
  if (hits.length === 0) {
    for (const star of meta.stars) {
      const nested = resolveExport(star, name, seen);
      hits.push(...nested);
    }
  }
  return [...new Set(hits)];
}

function allExportedNames(file, seen = new Set()) {
  if (seen.has(file)) return [];
  seen.add(file);
  const meta = info.get(file);
  if (!meta) return [];
  const names = [...meta.named.keys()];
  if (meta.hasDefault) names.push('default');
  for (const star of meta.stars) names.push(...allExportedNames(star, seen));
  return names;
}

const used = new Set();
const testUsed = new Set();

for (const file of files) {
  const dest = isTest(file) ? testUsed : used;
  for (const imp of importsByFile.get(file)) {
    if (imp.star) {
      const seen = new Set();
      for (const n of allExportedNames(imp.target, seen)) {
        for (const owner of resolveExport(imp.target, n)) dest.add(owner + '#' + n);
      }
    } else {
      for (const owner of resolveExport(imp.target, imp.name)) dest.add(owner + '#' + imp.name);
    }
  }
}

const unused = [];
for (const [file, meta] of info) {
  if (isTest(file) || isGameOrCalc(file)) continue;
  if (rel(file) === 'src/types/database.types.ts') continue;
  const r = rel(file);
  const names = [...meta.named.entries()];
  if (meta.hasDefault) names.push(['default', 'value']);
  for (const [name, kind] of names) {
    if (meta.reexports.some((re) => re.local === name)) continue;
    const id = file + '#' + name;
    if (used.has(id)) continue;
    if (name === 'default' && NEXT_FILE.test(r)) continue;
    if (NEXT_NAMED.has(name) && (NEXT_FILE.test(r) || r.endsWith('/route.ts') || r === 'src/proxy.ts' || r.startsWith('src/instrumentation'))) continue;
    if (r === 'src/mdx-components.tsx' && name === 'useMDXComponents') continue;
    if (r === 'src/proxy.ts' && name === 'config') continue;
    const tests = testUsed.has(id);
    unused.push({ file: r, name, kind, tests });
  }
}

unused.sort((a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
process.stdout.write(JSON.stringify(unused));
