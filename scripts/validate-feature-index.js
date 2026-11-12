#!/usr/bin/env node
/**
 * Validate FEATURE_INDEX.md paths exist, the route/barrel/gap lists are
 * complete, and the barrel inventory is up to date.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const indexPath = path.join(repoRoot, 'src/docs/ai/FEATURE_INDEX.md');

const APP_ENTRY = new Set([
  'page.tsx',
  'page.ts',
  'route.ts',
  'route.tsx',
  'layout.tsx',
  'layout.ts',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'template.tsx',
  'default.tsx',
  'global-error.tsx',
  'opengraph-image.tsx',
  'robots.ts',
  'sitemap.ts',
]);

const BARREL_GAP_DIRS = [
  'src/lib/game',
  'src/lib/calculators',
  'src/hooks',
  'src/services',
  'src/stores',
  'src/components/ui',
];

/** Non-test source under these trees must be named. Tests are not required. */
const FOLDER_FILE_DIRS = [
  'src/components/patterns',
  'src/components/character-sheet',
  'src/components/guided-creator',
  'src/components/creator',
  'src/components/crafting',
  'src/components/encounters',
  'src/app/(main)/power-creator',
  'src/app/(main)/technique-creator',
  'src/app/(main)/empowered-technique-creator',
  'src/app/(main)/item-creator',
  'src/app/(main)/species-creator',
  'src/app/(main)/creature-creator',
  'src/app/(main)/crafting',
  'src/components/character',
  'src/components/codex',
  'src/app/(main)/encounters/[id]/_components',
  'src/app/(detail)/campaigns/[id]/_components',
  'src/components/rolls',
  'src/components/rules',
  'src/components/tabletop',
  'src/components/layout',
  'src/components/landing',
  'src/components/about',
  'src/components/auth',
  'src/components/legal',
  'src/components/onboarding',
  'src/components/providers',
  'src/app/(main)/my-account/_components',
  'src/components/ui',
  'src/app/(main)/admin/codex',
  'src/app/(main)/admin/changelogs',
  'src/app/(main)/admin/core-rules',
  'src/app/(main)/admin/images',
  'src/app/(main)/admin/public-library',
  'src/app/(main)/admin/roles',
  'src/app/(main)/admin/sources',
  'src/app/(main)/admin/users',
  'src/lib/codex',
  'src/lib/character',
  'src/lib/library',
  'src/lib/auth',
  'src/lib/guided-creator',
];

/** Single files outside those folders. */
const EXTRA_REQUIRED_FILES = ['src/lib/password-policy.ts'];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.next') continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function toRel(root, abs) {
  return path.relative(root, abs).replaceAll('\\', '/');
}

function barrelSources(indexFile) {
  const text = fs.readFileSync(indexFile, 'utf8');
  const specs = new Set();
  const re = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    specs.add(match[1].replace(/^\.\//, '').replace(/\.(ts|tsx)$/, ''));
  }
  return specs;
}

function requiredFeatureIndexPaths(root) {
  const appEntries = walk(path.join(root, 'src/app'))
    .filter((abs) => APP_ENTRY.has(path.basename(abs)))
    .map((abs) => toRel(root, abs));
  const rootEntries = ['src/proxy.ts', 'src/instrumentation.ts', 'src/instrumentation-client.ts'];
  const barrels = walk(path.join(root, 'src'))
    .filter((abs) => {
      const base = path.basename(abs);
      return base === 'index.ts' || base === 'index.tsx';
    })
    .map((abs) => toRel(root, abs));
  const gaps = [];
  for (const dirRel of BARREL_GAP_DIRS) {
    const dir = path.join(root, dirRel);
    const specs = barrelSources(path.join(dir, 'index.ts'));
    for (const name of fs.readdirSync(dir)) {
      if (!/\.(ts|tsx)$/.test(name)) continue;
      if (name.endsWith('.d.ts') || /\.(test|spec)\./.test(name)) continue;
      if (name === 'index.ts' || name === 'index.tsx') continue;
      const abs = path.join(dir, name);
      if (!fs.statSync(abs).isFile()) continue;
      if (!specs.has(name.replace(/\.(ts|tsx)$/, ''))) gaps.push(`${dirRel}/${name}`);
    }
  }
  const folderFiles = [];
  for (const dirRel of FOLDER_FILE_DIRS) {
    for (const abs of walk(path.join(root, dirRel))) {
      const name = path.basename(abs);
      if (!/\.(ts|tsx)$/.test(name)) continue;
      if (name.endsWith('.d.ts') || /\.(test|spec)\./.test(name)) continue;
      if (!fs.statSync(abs).isFile()) continue;
      folderFiles.push(toRel(root, abs));
    }
  }
  return [...appEntries, ...rootEntries, ...barrels, ...gaps, ...folderFiles, ...EXTRA_REQUIRED_FILES];
}

const indexText = fs.readFileSync(indexPath, 'utf8');
const pathRe = /(?:`|(?:\[[^\]]*\]\())((?:src\/)[^`)\s]+\.[a-zA-Z0-9]+)(?:`|\))/g;
const listedPaths = new Set();
let m;
while ((m = pathRe.exec(indexText))) listedPaths.add(m[1].replace(/\\/g, '/'));

const missingFiles = [];
for (const p of listedPaths) {
  if (!fs.existsSync(path.join(repoRoot, p))) missingFiles.push(p);
}

if (missingFiles.length) {
  console.error('FEATURE_INDEX lists missing files:');
  missingFiles.forEach((p) => console.error(' ', p));
  process.exit(2);
}

console.log(`FEATURE_INDEX path check OK (${listedPaths.size} paths).`);

const required = requiredFeatureIndexPaths(repoRoot);
const omitted = required.filter((file) => !indexText.includes(file)).sort();
if (omitted.length) {
  console.error('FEATURE_INDEX omits files the coverage check requires:');
  omitted.forEach((p) => console.error(' ', p));
  process.exit(2);
}

console.log(`FEATURE_INDEX coverage check OK (${required.length} required paths).`);

const gen = spawnSync(
  process.execPath,
  [path.join(__dirname, 'generate-feature-index-barrels.js'), '--check'],
  { encoding: 'utf8' },
);
if (gen.stdout) process.stdout.write(gen.stdout);
if (gen.stderr) process.stderr.write(gen.stderr);
if (gen.status !== 0) process.exit(gen.status || 2);
