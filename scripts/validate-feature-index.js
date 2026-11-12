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
  'src/lib/character-sheet',
  'src/lib/crafting',
  'src/lib/creator',
  'src/lib/encounter',
  'src/lib/rolls',
  'src/lib/rules',
  'src/lib/tabletop',
  'src/lib/validation',
  'src/lib/constants',
  'src/lib/utils',
  'src/lib/ancestry',
  'src/lib/api',
  'src/lib/chip',
  'src/lib/data-enrichment',
  'src/lib/detail-option',
  'src/lib/glr',
  'src/lib/observability',
  'src/lib/routes',
  'src/lib/security',
  'src/lib/server',
  'src/lib/supabase',
  'src/lib/tooltips',
  'src/lib/ui',
  'src/lib/game',
  'src/lib/calculators',
  'src/app/(main)/codex',
  'src/app/(main)/library',
  'src/app/(detail)/characters',
  'src/app/(main)/characters',
  'src/app/(main)/campaigns',
  'src/app/(detail)/campaigns/[id]',
  'src/app/(auth)',
  'src/app/(main)/encounters/[id]/mixed',
  'src/app/(main)/encounters/[id]/skill',
  'src/app/api/upload/profile-picture',
  'src/app/dev/styleguide',
  'src/hooks',
  'src/services',
  'src/stores',
];

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
  const looseLibFiles = fs
    .readdirSync(path.join(root, 'src/lib'), { withFileTypes: true })
    .filter((ent) => ent.isFile())
    .map((ent) => ent.name)
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .filter((name) => !name.endsWith('.d.ts') && !/\.(test|spec)\./.test(name))
    .map((name) => `src/lib/${name}`);
  return [
    ...new Set([
      ...appEntries,
      ...rootEntries,
      ...barrels,
      ...gaps,
      ...folderFiles,
      ...looseLibFiles,
    ]),
  ];
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

const unusedScan = spawnSync(process.execPath, [path.join(__dirname, 'unused-production-exports.mjs')], {
  encoding: 'utf8',
});
if (unusedScan.status !== 0) {
  if (unusedScan.stderr) process.stderr.write(unusedScan.stderr);
  console.error('unused-production-exports failed');
  process.exit(unusedScan.status || 2);
}
const foundUnused = JSON.parse(unusedScan.stdout);
const foundKey = (row) => `${row.tests ? 'test' : 'none'}|${row.kind}|${row.file}|${row.name}`;
const foundSet = new Set(foundUnused.map(foundKey));

function listedUnusedExports(text) {
  const start = text.indexOf('## Unused exports outside game and calculators');
  if (start < 0) return null;
  const rest = text.slice(start);
  const next = rest.indexOf('\n## ', 10);
  const section = next < 0 ? rest : rest.slice(0, next);
  let tests = null;
  const listed = [];
  for (const line of section.split('\n')) {
    if (line.startsWith('### Only a test imports this')) tests = true;
    else if (line.startsWith('### Nothing imports this')) tests = false;
    const match = line.match(/^- `([^`]+)`: (.+)$/);
    if (!match || tests === null) continue;
    for (const part of match[2].split(', ')) {
      const nameMatch = part.match(/^`([^`]+)`(?: \(type\))?$/);
      if (!nameMatch) {
        console.error('FEATURE_INDEX unused-export line is not readable:', line);
        process.exit(2);
      }
      listed.push({
        tests,
        kind: part.endsWith('(type)') ? 'type' : 'value',
        file: match[1],
        name: nameMatch[1],
      });
    }
  }
  return listed;
}

const listedUnused = listedUnusedExports(indexText);
if (!listedUnused) {
  console.error('FEATURE_INDEX is missing the unused-export section.');
  process.exit(2);
}
const listedSet = new Set(listedUnused.map(foundKey));
const missingNotes = [...foundSet].filter((key) => !listedSet.has(key)).sort();
const staleNotes = [...listedSet].filter((key) => !foundSet.has(key)).sort();
if (missingNotes.length || staleNotes.length) {
  console.error('FEATURE_INDEX unused-export list does not match production imports.');
  missingNotes.slice(0, 40).forEach((key) => console.error('  missing from index:', key));
  staleNotes.slice(0, 40).forEach((key) => console.error('  named but imported, or gone:', key));
  if (missingNotes.length > 40) console.error(`  ... ${missingNotes.length - 40} more missing`);
  if (staleNotes.length > 40) console.error(`  ... ${staleNotes.length - 40} more stale`);
  process.exit(2);
}
console.log(`FEATURE_INDEX unused-export check OK (${foundUnused.length} exports).`);

const MATH_DISAGREEMENT_INTENTIONAL_IDS = [
  'player-vs-creature-max-health',
  'player-vs-creature-max-energy',
  'power-energy-vs-technique-energy',
  'format-energy-intermediate-vs-format-energy-number',
  'modify-variant-ceil-vs-composition-finalize',
];

const MATH_DISAGREEMENT_BUG_IDS = ['innate-remaining-uses-stored-cost'];

const SKILL_MATH_DISAGREEMENT_COPY_IDS = [
  'feat-skill-req-first-ability-vs-sheet-highest',
  'guided-skill-total-omits-rules-on-getTotalSkillPoints',
];

function mathSectionSlice(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return null;
  const rest = text.slice(start);
  const next = rest.indexOf('\n## ', heading.length);
  return next < 0 ? rest : rest.slice(0, next);
}

function disagreementsSubsection(sectionText) {
  const disagStart = sectionText.indexOf('### Disagreements');
  if (disagStart < 0) return null;
  const afterDisag = sectionText.slice(disagStart);
  const disagEnd = afterDisag.indexOf('\n### ', 10);
  return disagEnd < 0 ? afterDisag : afterDisag.slice(0, disagEnd);
}

function requireDisagreementTokens(disagreements, prefix, ids, label) {
  for (const id of ids) {
    const token = `${prefix}:${id}:`;
    if (!disagreements.includes(token)) {
      console.error(`FEATURE_INDEX missing required ${label} math line:`, id);
      process.exit(2);
    }
  }
}

const healthMathSection = mathSectionSlice(indexText, '## Health, energy, and cost math');
if (!healthMathSection) {
  console.error('FEATURE_INDEX is missing the health/energy/cost math section.');
  process.exit(2);
}
if (!healthMathSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX math section is missing ### Disagreements.');
  process.exit(2);
}
if (!healthMathSection.includes('### Read to the end')) {
  console.error('FEATURE_INDEX math section is missing ### Read to the end.');
  process.exit(2);
}
const healthDisagreements = disagreementsSubsection(healthMathSection);
if (!healthDisagreements) {
  console.error('FEATURE_INDEX health math section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  healthDisagreements,
  'math-disagree-intentional',
  MATH_DISAGREEMENT_INTENTIONAL_IDS,
  'intentional',
);
requireDisagreementTokens(healthDisagreements, 'math-disagree-bug', MATH_DISAGREEMENT_BUG_IDS, 'bug');

const skillMathSection = mathSectionSlice(indexText, '## Skill and allocation math');
if (!skillMathSection) {
  console.error('FEATURE_INDEX is missing the skill and allocation math section.');
  process.exit(2);
}
if (!skillMathSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX skill math section is missing ### Disagreements.');
  process.exit(2);
}
const skillDisagreements = disagreementsSubsection(skillMathSection);
if (!skillDisagreements) {
  console.error('FEATURE_INDEX skill math section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  skillDisagreements,
  'math-disagree-copy',
  SKILL_MATH_DISAGREEMENT_COPY_IDS,
  'skill copy',
);

const mathDisagreementCount =
  MATH_DISAGREEMENT_INTENTIONAL_IDS.length +
  MATH_DISAGREEMENT_BUG_IDS.length +
  SKILL_MATH_DISAGREEMENT_COPY_IDS.length;
console.log(`FEATURE_INDEX math-disagreement check OK (${mathDisagreementCount} guarded lines).`);

const gen = spawnSync(
  process.execPath,
  [path.join(__dirname, 'generate-feature-index-barrels.js'), '--check'],
  { encoding: 'utf8' },
);
if (gen.stdout) process.stdout.write(gen.stdout);
if (gen.stderr) process.stderr.write(gen.stderr);
if (gen.status !== 0) process.exit(gen.status || 2);
