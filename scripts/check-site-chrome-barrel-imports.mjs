#!/usr/bin/env node
/**
 * Site chrome must not import `@/components/patterns` (root barrel).
 * That barrel forced a ~250KB shared chunk on every top view and hurt lab LCP.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SITE_CHROME_FILES = [
  'src/components/layout/header.tsx',
  'src/components/layout/footer.tsx',
  'src/components/layout/main-app-chrome.tsx',
  'src/components/layout/main-content-boundary.tsx',
];

/** @returns {string[]} relative paths that import the patterns root barrel */
export function findForbiddenBarrelImports(source) {
  return /@\/components\/patterns['"]/.test(source) ? ['patterns-barrel'] : [];
}

function main() {
  const violations = [];
  for (const relative of SITE_CHROME_FILES) {
    const absolute = path.join(REPO_ROOT, relative);
    const source = fs.readFileSync(absolute, 'utf8');
    if (findForbiddenBarrelImports(source).length > 0) {
      violations.push(relative);
    }
  }
  if (violations.length) {
    console.error(
      'Site chrome must not import `@/components/patterns`; use a subpath (e.g. chrome/theme-toggle).',
    );
    for (const file of violations) {
      console.error(`  ${file}`);
    }
    process.exit(1);
  }
  console.log('Site chrome patterns import check OK.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
