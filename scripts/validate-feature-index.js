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

const unusedScan = spawnSync(
  process.execPath,
  [path.join(__dirname, 'unused-production-exports.mjs')],
  {
    encoding: 'utf8',
  },
);
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

const SKILL_MATH_BUG_IDS = [
  'feat-skill-req-first-ability-vs-sheet-highest',
  'guided-skill-total-omits-rules-on-getTotalSkillPoints',
];

const CHARACTER_PATH_MATH_BUG_IDS = ['legality-skill-spent-floor-vs-allocation-spent'];

const CREATURE_BUDGET_MATH_BUG_IDS = ['creature-training-stored-tp-without-parts'];

const PROFICIENCY_TRAINING_MATH_BUG_IDS = ['guided-tp-bar-max-of-dedupe-vs-listed'];

const DEFENSE_WEAPON_MATH_BUG_IDS = ['weapon-derive-utilized-vs-get-attack-ability'];

const CRAFTING_COST_MATH_BUG_IDS = ['official-armament-codex-stored-currency-vs-item-calc'];

const CRAFTING_COST_MATH_DEFERRED_IDS = [
  'crafting-codex-stored-currency-vs-library-resolve-market',
  'crafting-codex-currency-vs-persist-equipment-cost',
  'crafting-hub-currency-column-vs-requirements-market-price',
];

/** Fixed: notes tab carry uses live SIZES (ClickUp 1dfe8wf3xf0 / PR #588). */
const SIZE_PATH_MATH_BUG_IDS = [];

/** Guards `math-disagree-unclassified` documentation in FEATURE_INDEX (intro + math sections). */
const MATH_DISAGREE_UNCLASSIFIED_DOCUMENTATION_MENTIONS = 3;

/** When present, each id must appear as `math-disagree-unclassified:<id>:` in a ### Disagreements slice. */
const MATH_DISAGREE_UNCLASSIFIED_IDS = [];

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
requireDisagreementTokens(
  healthDisagreements,
  'math-disagree-bug',
  MATH_DISAGREEMENT_BUG_IDS,
  'bug',
);

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
requireDisagreementTokens(skillDisagreements, 'math-disagree-bug', SKILL_MATH_BUG_IDS, 'skill bug');

const characterMathSection = mathSectionSlice(indexText, '## Character-check and path math');
if (!characterMathSection) {
  console.error('FEATURE_INDEX is missing the character-check and path math section.');
  process.exit(2);
}
if (!characterMathSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX character/path math section is missing ### Disagreements.');
  process.exit(2);
}
const characterDisagreements = disagreementsSubsection(characterMathSection);
if (!characterDisagreements) {
  console.error('FEATURE_INDEX character/path math section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  characterDisagreements,
  'math-disagree-bug',
  CHARACTER_PATH_MATH_BUG_IDS,
  'character/path bug',
);

const creatureBudgetSection = mathSectionSlice(indexText, '## Creature creator budget math');
if (!creatureBudgetSection) {
  console.error('FEATURE_INDEX is missing the creature creator budget math section.');
  process.exit(2);
}
if (!creatureBudgetSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX creature budget section is missing ### Disagreements.');
  process.exit(2);
}
const creatureBudgetDisagreements = disagreementsSubsection(creatureBudgetSection);
if (!creatureBudgetDisagreements) {
  console.error('FEATURE_INDEX creature budget section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  creatureBudgetDisagreements,
  'math-disagree-bug',
  CREATURE_BUDGET_MATH_BUG_IDS,
  'creature budget bug',
);

const proficiencyMathSection = mathSectionSlice(
  indexText,
  '## Player proficiency and training math',
);
if (!proficiencyMathSection) {
  console.error('FEATURE_INDEX is missing the player proficiency and training math section.');
  process.exit(2);
}
if (!proficiencyMathSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX proficiency/training section is missing ### Disagreements.');
  process.exit(2);
}
const proficiencyDisagreements = disagreementsSubsection(proficiencyMathSection);
if (!proficiencyDisagreements) {
  console.error('FEATURE_INDEX proficiency/training section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  proficiencyDisagreements,
  'math-disagree-bug',
  PROFICIENCY_TRAINING_MATH_BUG_IDS,
  'proficiency/training bug',
);

const defenseWeaponSection = mathSectionSlice(
  indexText,
  '## Defense targeting and weapon attack math',
);
if (!defenseWeaponSection) {
  console.error('FEATURE_INDEX is missing the defense targeting and weapon attack math section.');
  process.exit(2);
}
if (!defenseWeaponSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX defense/weapon section is missing ### Disagreements.');
  process.exit(2);
}
const defenseWeaponDisagreements = disagreementsSubsection(defenseWeaponSection);
if (!defenseWeaponDisagreements) {
  console.error('FEATURE_INDEX defense/weapon section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  defenseWeaponDisagreements,
  'math-disagree-bug',
  DEFENSE_WEAPON_MATH_BUG_IDS,
  'defense/weapon bug',
);

const craftingCostSection = mathSectionSlice(indexText, '## Crafting cost math');
if (!craftingCostSection) {
  console.error('FEATURE_INDEX is missing the crafting cost math section.');
  process.exit(2);
}
if (!craftingCostSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX crafting cost section is missing ### Disagreements.');
  process.exit(2);
}
if (!craftingCostSection.includes('### Read to the end')) {
  console.error('FEATURE_INDEX crafting cost section is missing ### Read to the end.');
  process.exit(2);
}
const craftingCostDisagreements = disagreementsSubsection(craftingCostSection);
if (!craftingCostDisagreements) {
  console.error('FEATURE_INDEX crafting cost section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  craftingCostDisagreements,
  'math-disagree-bug',
  CRAFTING_COST_MATH_BUG_IDS,
  'crafting cost bug',
);
requireDisagreementTokens(
  craftingCostDisagreements,
  'math-disagree-deferred',
  CRAFTING_COST_MATH_DEFERRED_IDS,
  'crafting cost deferred',
);

const sizePathSection = mathSectionSlice(indexText, '## Size and path recommendation math');
if (!sizePathSection) {
  console.error('FEATURE_INDEX is missing the size and path recommendation math section.');
  process.exit(2);
}
if (!sizePathSection.includes('### Disagreements')) {
  console.error('FEATURE_INDEX size/path section is missing ### Disagreements.');
  process.exit(2);
}
if (!sizePathSection.includes('### Read to the end')) {
  console.error('FEATURE_INDEX size/path section is missing ### Read to the end.');
  process.exit(2);
}
const sizePathDisagreements = disagreementsSubsection(sizePathSection);
if (!sizePathDisagreements) {
  console.error('FEATURE_INDEX size/path section has no ### Disagreements body.');
  process.exit(2);
}
requireDisagreementTokens(
  sizePathDisagreements,
  'math-disagree-bug',
  SIZE_PATH_MATH_BUG_IDS,
  'size/path bug',
);

const unclassifiedDocMentions = indexText.match(/math-disagree-unclassified/g);
if ((unclassifiedDocMentions?.length ?? 0) < MATH_DISAGREE_UNCLASSIFIED_DOCUMENTATION_MENTIONS) {
  console.error(
    `FEATURE_INDEX must document math-disagree-unclassified in at least ${MATH_DISAGREE_UNCLASSIFIED_DOCUMENTATION_MENTIONS} places; found ${unclassifiedDocMentions?.length ?? 0}.`,
  );
  process.exit(2);
}

const discoveredUnclassifiedIds = [
  ...new Set(
    [...indexText.matchAll(/math-disagree-unclassified:([a-z0-9-]+):/g)].map((match) => match[1]),
  ),
];
for (const id of discoveredUnclassifiedIds) {
  if (!MATH_DISAGREE_UNCLASSIFIED_IDS.includes(id)) {
    console.error(
      'FEATURE_INDEX has math-disagree-unclassified line not listed in validator MATH_DISAGREE_UNCLASSIFIED_IDS:',
      id,
    );
    process.exit(2);
  }
}

const mathDisagreementSections = [
  healthDisagreements,
  skillDisagreements,
  characterDisagreements,
  creatureBudgetDisagreements,
  proficiencyDisagreements,
  defenseWeaponDisagreements,
  craftingCostDisagreements,
  sizePathDisagreements,
];
for (const disagreements of mathDisagreementSections) {
  if (disagreements) {
    requireDisagreementTokens(
      disagreements,
      'math-disagree-unclassified',
      MATH_DISAGREE_UNCLASSIFIED_IDS,
      'unclassified',
    );
  }
}

const mathDisagreementCount =
  MATH_DISAGREEMENT_INTENTIONAL_IDS.length +
  MATH_DISAGREEMENT_BUG_IDS.length +
  SKILL_MATH_BUG_IDS.length +
  CHARACTER_PATH_MATH_BUG_IDS.length +
  CREATURE_BUDGET_MATH_BUG_IDS.length +
  PROFICIENCY_TRAINING_MATH_BUG_IDS.length +
  DEFENSE_WEAPON_MATH_BUG_IDS.length +
  CRAFTING_COST_MATH_BUG_IDS.length +
  CRAFTING_COST_MATH_DEFERRED_IDS.length +
  SIZE_PATH_MATH_BUG_IDS.length +
  MATH_DISAGREE_UNCLASSIFIED_IDS.length;
console.log(`FEATURE_INDEX math-disagreement check OK (${mathDisagreementCount} guarded lines).`);

const CHARACTER_CREATOR_SCREEN_NOTE_IDS = [
  'custom-and-guided-share-one-shell',
  'character-creator-shell-fork',
  'guided-skills-panel-vs-skills-allocation-page',
  'guided-ability-grid-vs-creature-ability-editor',
  'legacy-character-creator-store-removed',
];

const characterCreatorScreensSection = mathSectionSlice(indexText, '## Character creator screens');
if (!characterCreatorScreensSection) {
  console.error('FEATURE_INDEX is missing the character creator screens section.');
  process.exit(2);
}
if (!characterCreatorScreensSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX character creator section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const screenBehaviorStart = characterCreatorScreensSection.indexOf(
  '### Same job, different behavior',
);
const screenDeadStart = characterCreatorScreensSection.indexOf('### Dead or unreachable paths');
if (screenBehaviorStart < 0 || screenDeadStart < 0) {
  console.error('FEATURE_INDEX character creator section missing behavior or dead-path headings.');
  process.exit(2);
}
const screenBehaviorBody = characterCreatorScreensSection.slice(
  screenBehaviorStart,
  screenDeadStart,
);
const screenDeadBody = characterCreatorScreensSection.slice(screenDeadStart);
for (const id of CHARACTER_CREATOR_SCREEN_NOTE_IDS) {
  const inBehavior = screenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = screenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required character-creator screen note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX character-creator screen check OK (${CHARACTER_CREATOR_SCREEN_NOTE_IDS.length} notes).`,
);

const LIBRARY_ENTITY_CREATOR_SCREEN_NOTE_IDS = [
  'empowered-technique-separate-screen',
  'power-composition-variants-vs-technique-single-flow',
  'power-facade-sections-vs-technique-monolith-editor',
  'species-creator-guest-load',
  'item-creator-type-query-vs-session-key',
  'no-empowered-mode-on-power-or-technique-routes',
];

const libraryEntityCreatorScreensSection = mathSectionSlice(
  indexText,
  '## Library entity creator screens',
);
if (!libraryEntityCreatorScreensSection) {
  console.error('FEATURE_INDEX is missing the library entity creator screens section.');
  process.exit(2);
}
if (!libraryEntityCreatorScreensSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX library entity creator section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const entityScreenBehaviorStart = libraryEntityCreatorScreensSection.indexOf(
  '### Same job, different behavior',
);
const entityScreenDeadStart = libraryEntityCreatorScreensSection.indexOf(
  '### Dead or unreachable paths',
);
if (entityScreenBehaviorStart < 0 || entityScreenDeadStart < 0) {
  console.error(
    'FEATURE_INDEX library entity creator section missing behavior or dead-path headings.',
  );
  process.exit(2);
}
const entityScreenBehaviorBody = libraryEntityCreatorScreensSection.slice(
  entityScreenBehaviorStart,
  entityScreenDeadStart,
);
const entityScreenDeadBody = libraryEntityCreatorScreensSection.slice(entityScreenDeadStart);
for (const id of LIBRARY_ENTITY_CREATOR_SCREEN_NOTE_IDS) {
  const inBehavior = entityScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = entityScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required library-entity-creator screen note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX library-entity-creator screen check OK (${LIBRARY_ENTITY_CREATOR_SCREEN_NOTE_IDS.length} notes).`,
);

const ENCOUNTER_SCREEN_NOTE_IDS = [
  'mixed-one-roll-log-vs-view-embedded-log',
  'skill-unload-keepalive-autosave',
  'add-combatant-modal-combat-vs-skill-mode',
  'combatant-card-vs-skill-participant-card',
  'duplicate-sort-initiative-in-combat-and-skill-sidebars',
  'mixed-view-tab-session-only',
  'encounter-id-redirect-no-type-page',
];

const encounterScreensSection = mathSectionSlice(indexText, '## Encounter screens');
if (!encounterScreensSection) {
  console.error('FEATURE_INDEX is missing the encounter screens section.');
  process.exit(2);
}
if (!encounterScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX encounter section is missing ### Same job, different behavior.');
  process.exit(2);
}
const encounterScreenBehaviorStart = encounterScreensSection.indexOf(
  '### Same job, different behavior',
);
const encounterScreenDeadStart = encounterScreensSection.indexOf('### Dead or unreachable paths');
if (encounterScreenBehaviorStart < 0 || encounterScreenDeadStart < 0) {
  console.error('FEATURE_INDEX encounter section missing behavior or dead-path headings.');
  process.exit(2);
}
const encounterScreenBehaviorBody = encounterScreensSection.slice(
  encounterScreenBehaviorStart,
  encounterScreenDeadStart,
);
const encounterScreenDeadBody = encounterScreensSection.slice(encounterScreenDeadStart);
for (const id of ENCOUNTER_SCREEN_NOTE_IDS) {
  const inBehavior = encounterScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = encounterScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required encounter screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX encounter screen check OK (${ENCOUNTER_SCREEN_NOTE_IDS.length} notes).`);

const LIBRARY_SCREEN_NOTE_IDS = [
  'library-my-vs-realms-one-page-toggle',
  'library-guest-realms-read-only',
  'library-enhanced-tab-my-only',
  'library-techniques-tab-empowered-dual-hook',
  'library-realms-add-official-vs-my-sync',
  'library-creatures-tab-embeds-roll-log',
  'library-enhanced-edit-via-crafting-route',
  'library-no-species-tab',
  'legacy-browse-alias-redirect',
];

const libraryScreensSection = mathSectionSlice(indexText, '## Library screens');
if (!libraryScreensSection) {
  console.error('FEATURE_INDEX is missing the library screens section.');
  process.exit(2);
}
if (!libraryScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX library section is missing ### Same job, different behavior.');
  process.exit(2);
}
const libraryScreenBehaviorStart = libraryScreensSection.indexOf(
  '### Same job, different behavior',
);
const libraryScreenDeadStart = libraryScreensSection.indexOf('### Dead or unreachable paths');
if (libraryScreenBehaviorStart < 0 || libraryScreenDeadStart < 0) {
  console.error('FEATURE_INDEX library section missing behavior or dead-path headings.');
  process.exit(2);
}
const libraryScreenBehaviorBody = libraryScreensSection.slice(
  libraryScreenBehaviorStart,
  libraryScreenDeadStart,
);
const libraryScreenDeadBody = libraryScreensSection.slice(libraryScreenDeadStart);
for (const id of LIBRARY_SCREEN_NOTE_IDS) {
  const inBehavior = libraryScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = libraryScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required library screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX library screen check OK (${LIBRARY_SCREEN_NOTE_IDS.length} notes).`);

const CHARACTER_SHEET_SCREEN_NOTE_IDS = [
  'sheet-mobile-carousel-vs-desktop-layout',
  'sheet-edit-and-temp-modes-exclusive',
  'sheet-library-sub-edit-toggle',
  'sheet-library-tab-visibility-play-mode',
  'sheet-guest-owner-local-save',
  'sheet-viewer-omits-toolbar-and-handlers',
  'sheet-empowered-in-add-power-modal',
  'sheet-skills-skill-row-vs-guided-guided-skill-row',
  'sheet-no-standalone-empowered-library-tab',
];

const characterSheetScreensSection = mathSectionSlice(indexText, '## Character sheet screens');
if (!characterSheetScreensSection) {
  console.error('FEATURE_INDEX is missing the character sheet screens section.');
  process.exit(2);
}
if (!characterSheetScreensSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX character sheet section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const sheetScreenBehaviorStart = characterSheetScreensSection.indexOf(
  '### Same job, different behavior',
);
const sheetScreenDeadStart = characterSheetScreensSection.indexOf('### Dead or unreachable paths');
if (sheetScreenBehaviorStart < 0 || sheetScreenDeadStart < 0) {
  console.error('FEATURE_INDEX character sheet section missing behavior or dead-path headings.');
  process.exit(2);
}
const sheetScreenBehaviorBody = characterSheetScreensSection.slice(
  sheetScreenBehaviorStart,
  sheetScreenDeadStart,
);
const sheetScreenDeadBody = characterSheetScreensSection.slice(sheetScreenDeadStart);
for (const id of CHARACTER_SHEET_SCREEN_NOTE_IDS) {
  const inBehavior = sheetScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = sheetScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required character-sheet screen note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX character-sheet screen check OK (${CHARACTER_SHEET_SCREEN_NOTE_IDS.length} notes).`,
);

const CAMPAIGN_SCREEN_NOTE_IDS = [
  'campaigns-guest-sign-in-wall',
  'campaign-join-list-tab-vs-rm-detail-add',
  'campaign-detail-roll-feed-vs-sheet-roll-log',
  'campaign-embedded-sheet-campaign-view-hook',
  'campaign-view-sheet-link-rm-other-players-only',
  'campaign-remove-rm-or-own-character',
  'campaign-visibility-bump-on-join',
  'campaign-player-no-peer-sheet-from-roster',
  'campaign-tabletop-not-on-detail-page',
];

const campaignScreensSection = mathSectionSlice(indexText, '## Campaign screens');
if (!campaignScreensSection) {
  console.error('FEATURE_INDEX is missing the campaign screens section.');
  process.exit(2);
}
if (!campaignScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX campaign section is missing ### Same job, different behavior.');
  process.exit(2);
}
const campaignScreenBehaviorStart = campaignScreensSection.indexOf(
  '### Same job, different behavior',
);
const campaignScreenDeadStart = campaignScreensSection.indexOf('### Dead or unreachable paths');
if (campaignScreenBehaviorStart < 0 || campaignScreenDeadStart < 0) {
  console.error('FEATURE_INDEX campaign section missing behavior or dead-path headings.');
  process.exit(2);
}
const campaignScreenBehaviorBody = campaignScreensSection.slice(
  campaignScreenBehaviorStart,
  campaignScreenDeadStart,
);
const campaignScreenDeadBody = campaignScreensSection.slice(campaignScreenDeadStart);
for (const id of CAMPAIGN_SCREEN_NOTE_IDS) {
  const inBehavior = campaignScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = campaignScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required campaign screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX campaign screen check OK (${CAMPAIGN_SCREEN_NOTE_IDS.length} notes).`);

const CAMPAIGN_TABLETOP_SCREEN_NOTE_IDS = [
  'tabletop-entry-via-encounter-open-not-campaign-hub',
  'tabletop-scene-query-vs-active-scene-fetch',
  'tabletop-sync-duplicates-encounter-combatants',
  'tabletop-rm-drag-vs-player-move-request',
  'tabletop-monster-usm-vs-encounter-add-combatant-modal',
  'tabletop-roll-log-vs-campaign-detail-roll-section',
  'tabletop-skill-encounter-no-open-button',
  'tabletop-direct-url-without-active-scene',
  'tabletop-encounter-without-campaign-id',
];

const campaignTabletopScreensSection = mathSectionSlice(indexText, '## Campaign tabletop screen');
if (!campaignTabletopScreensSection) {
  console.error('FEATURE_INDEX is missing the campaign tabletop screen section.');
  process.exit(2);
}
if (!campaignTabletopScreensSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX campaign tabletop section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const tabletopScreenBehaviorStart = campaignTabletopScreensSection.indexOf(
  '### Same job, different behavior',
);
const tabletopScreenDeadStart = campaignTabletopScreensSection.indexOf(
  '### Dead or unreachable paths',
);
if (tabletopScreenBehaviorStart < 0 || tabletopScreenDeadStart < 0) {
  console.error('FEATURE_INDEX campaign tabletop section missing behavior or dead-path headings.');
  process.exit(2);
}
const tabletopScreenBehaviorBody = campaignTabletopScreensSection.slice(
  tabletopScreenBehaviorStart,
  tabletopScreenDeadStart,
);
const tabletopScreenDeadBody = campaignTabletopScreensSection.slice(tabletopScreenDeadStart);
for (const id of CAMPAIGN_TABLETOP_SCREEN_NOTE_IDS) {
  const inBehavior = tabletopScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = tabletopScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required campaign-tabletop screen note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX campaign-tabletop screen check OK (${CAMPAIGN_TABLETOP_SCREEN_NOTE_IDS.length} notes).`,
);

const ADMIN_SCREEN_NOTE_IDS = [
  'admin-layout-blocks-non-admin',
  'admin-codex-list-modal-vs-spreadsheet',
  'admin-codex-vs-official-library-data-split',
  'admin-official-library-edit-via-creator-routes',
  'admin-species-codex-tab-vs-official-species-tab',
  'admin-core-rules-archetypes-vs-codex-archetypes-tab',
  'admin-users-role-assign-vs-roles-quotas',
  'admin-sources-membership-vs-codex-row-editor',
  'admin-non-admin-direct-url-redirect',
  'admin-changelogs-no-undo',
];

const adminScreensSection = mathSectionSlice(indexText, '## Admin screens');
if (!adminScreensSection) {
  console.error('FEATURE_INDEX is missing the admin screens section.');
  process.exit(2);
}
if (!adminScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX admin section is missing ### Same job, different behavior.');
  process.exit(2);
}
const adminScreenBehaviorStart = adminScreensSection.indexOf('### Same job, different behavior');
const adminScreenDeadStart = adminScreensSection.indexOf('### Dead or unreachable paths');
if (adminScreenBehaviorStart < 0 || adminScreenDeadStart < 0) {
  console.error('FEATURE_INDEX admin section missing behavior or dead-path headings.');
  process.exit(2);
}
const adminScreenBehaviorBody = adminScreensSection.slice(
  adminScreenBehaviorStart,
  adminScreenDeadStart,
);
const adminScreenDeadBody = adminScreensSection.slice(adminScreenDeadStart);
for (const id of ADMIN_SCREEN_NOTE_IDS) {
  const inBehavior = adminScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = adminScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required admin screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX admin screen check OK (${ADMIN_SCREEN_NOTE_IDS.length} notes).`);

const CRAFTING_SCREEN_NOTE_IDS = [
  'crafting-guest-no-cloud-sessions',
  'crafting-autosave-session-json-not-enhanced-row',
  'crafting-creator-layout-vs-item-creator-page',
  'crafting-item-modal-vs-full-library-picker',
  'crafting-rules-from-core-rules-not-hardcoded',
  'crafting-hub-planned-in-in-progress-tab',
  'library-enhanced-cta-vs-hub-start',
  'library-enhanced-edit-not-session-id',
  'crafting-new-redirects-to-hub',
];

const craftingScreensSection = mathSectionSlice(indexText, '## Crafting screens');
if (!craftingScreensSection) {
  console.error('FEATURE_INDEX is missing the crafting screens section.');
  process.exit(2);
}
if (!craftingScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX crafting section is missing ### Same job, different behavior.');
  process.exit(2);
}
const craftingScreenBehaviorStart = craftingScreensSection.indexOf(
  '### Same job, different behavior',
);
const craftingScreenDeadStart = craftingScreensSection.indexOf('### Dead or unreachable paths');
if (craftingScreenBehaviorStart < 0 || craftingScreenDeadStart < 0) {
  console.error('FEATURE_INDEX crafting section missing behavior or dead-path headings.');
  process.exit(2);
}
const craftingScreenBehaviorBody = craftingScreensSection.slice(
  craftingScreenBehaviorStart,
  craftingScreenDeadStart,
);
const craftingScreenDeadBody = craftingScreensSection.slice(craftingScreenDeadStart);
for (const id of CRAFTING_SCREEN_NOTE_IDS) {
  const inBehavior = craftingScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = craftingScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required crafting screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX crafting screen check OK (${CRAFTING_SCREEN_NOTE_IDS.length} notes).`);

const MARKETING_SCREEN_NOTE_IDS = [
  'marketing-hero-returning-vs-new-cta-targets',
  'marketing-rules-in-app-vs-google-doc',
  'marketing-footer-full-vs-auth-minimal-legal',
  'marketing-home-about-footer-duplicate-ctas',
  'marketing-login-returnTo-guest-migration',
  'marketing-resources-coming-soon-no-links',
  'marketing-rules-welcome-slug-redirects-index',
  'marketing-reset-password-without-session',
];

const marketingScreensSection = mathSectionSlice(
  indexText,
  '## Marketing and public entry screens',
);
if (!marketingScreensSection) {
  console.error('FEATURE_INDEX is missing the marketing and public entry screens section.');
  process.exit(2);
}
if (!marketingScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX marketing section is missing ### Same job, different behavior.');
  process.exit(2);
}
const marketingScreenBehaviorStart = marketingScreensSection.indexOf(
  '### Same job, different behavior',
);
const marketingScreenDeadStart = marketingScreensSection.indexOf('### Dead or unreachable paths');
if (marketingScreenBehaviorStart < 0 || marketingScreenDeadStart < 0) {
  console.error('FEATURE_INDEX marketing section missing behavior or dead-path headings.');
  process.exit(2);
}
const marketingScreenBehaviorBody = marketingScreensSection.slice(
  marketingScreenBehaviorStart,
  marketingScreenDeadStart,
);
const marketingScreenDeadBody = marketingScreensSection.slice(marketingScreenDeadStart);
for (const id of MARKETING_SCREEN_NOTE_IDS) {
  const inBehavior = marketingScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = marketingScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required marketing screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX marketing screen check OK (${MARKETING_SCREEN_NOTE_IDS.length} notes).`);

const ACCOUNT_SCREEN_NOTE_IDS = [
  'account-protected-route-login-returnTo',
  'account-oauth-hides-email-password-cards',
  'account-send-reset-email-vs-forgot-password-page',
  'account-change-password-vs-reset-password-route',
  'account-picture-upload-gated-by-role-policy',
  'account-role-limits-read-only-vs-admin-roles',
  'account-tutorials-toggle-local-not-profile',
  'account-guest-cannot-open-settings',
];

const accountScreensSection = mathSectionSlice(indexText, '## My Account screen');
if (!accountScreensSection) {
  console.error('FEATURE_INDEX is missing the My Account screen section.');
  process.exit(2);
}
if (!accountScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX My Account section is missing ### Same job, different behavior.');
  process.exit(2);
}
const accountScreenBehaviorStart = accountScreensSection.indexOf(
  '### Same job, different behavior',
);
const accountScreenDeadStart = accountScreensSection.indexOf('### Dead or unreachable paths');
if (accountScreenBehaviorStart < 0 || accountScreenDeadStart < 0) {
  console.error('FEATURE_INDEX My Account section missing behavior or dead-path headings.');
  process.exit(2);
}
const accountScreenBehaviorBody = accountScreensSection.slice(
  accountScreenBehaviorStart,
  accountScreenDeadStart,
);
const accountScreenDeadBody = accountScreensSection.slice(accountScreenDeadStart);
for (const id of ACCOUNT_SCREEN_NOTE_IDS) {
  const inBehavior = accountScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = accountScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required My Account screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX My Account screen check OK (${ACCOUNT_SCREEN_NOTE_IDS.length} notes).`);

const CODEX_SCREEN_NOTE_IDS = [
  'codex-public-read-only-vs-admin-codex-editor',
  'codex-vs-library-publishable-entities',
  'codex-species-public-vs-my-user-species',
  'codex-my-species-vs-species-creator-save',
  'codex-my-equipment-empty-points-library',
  'codex-feats-skills-character-filter-shared-persistence',
  'codex-advanced-collapse-resets-tab',
  'codex-my-non-species-tabs-placeholder',
  'codex-no-save-on-browse-page',
];

const codexScreensSection = mathSectionSlice(indexText, '## Codex screen');
if (!codexScreensSection) {
  console.error('FEATURE_INDEX is missing the Codex screen section.');
  process.exit(2);
}
if (!codexScreensSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX Codex section is missing ### Same job, different behavior.');
  process.exit(2);
}
const codexScreenBehaviorStart = codexScreensSection.indexOf('### Same job, different behavior');
const codexScreenDeadStart = codexScreensSection.indexOf('### Dead or unreachable paths');
if (codexScreenBehaviorStart < 0 || codexScreenDeadStart < 0) {
  console.error('FEATURE_INDEX Codex section missing behavior or dead-path headings.');
  process.exit(2);
}
const codexScreenBehaviorBody = codexScreensSection.slice(
  codexScreenBehaviorStart,
  codexScreenDeadStart,
);
const codexScreenDeadBody = codexScreensSection.slice(codexScreenDeadStart);
for (const id of CODEX_SCREEN_NOTE_IDS) {
  const inBehavior = codexScreenBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = codexScreenDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required Codex screen note:', id);
    process.exit(2);
  }
}
console.log(`FEATURE_INDEX Codex screen check OK (${CODEX_SCREEN_NOTE_IDS.length} notes).`);

const CODEX_EXPANDED_ROW_NOTE_IDS = [
  'codex-expand-detailSections-vs-expandedContent',
  'codex-expand-feats-vs-creature-feats-detail-builders',
  'codex-expand-skills-only-tab-with-outcome-chips',
  'codex-expand-parts-always-type-section',
  'codex-expand-properties-traits-may-collapse-only',
  'codex-expand-equipment-calculated-property-chips',
  'codex-expand-species-my-codex-edit-on-row-not-in-panel',
  'codex-expand-archetype-recommendations-not-links',
  'codex-expand-public-no-inline-mutations',
  'codex-expand-no-body-no-expander',
];

const codexExpandedRowsSection = mathSectionSlice(indexText, '## Codex expanded rows');
if (!codexExpandedRowsSection) {
  console.error('FEATURE_INDEX is missing the Codex expanded rows section.');
  process.exit(2);
}
if (!codexExpandedRowsSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX Codex expanded rows section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const codexExpandedBehaviorStart = codexExpandedRowsSection.indexOf(
  '### Same job, different behavior',
);
const codexExpandedDeadStart = codexExpandedRowsSection.indexOf('### Dead or unreachable paths');
if (codexExpandedBehaviorStart < 0 || codexExpandedDeadStart < 0) {
  console.error(
    'FEATURE_INDEX Codex expanded rows section missing behavior or dead-path headings.',
  );
  process.exit(2);
}
const codexExpandedBehaviorBody = codexExpandedRowsSection.slice(
  codexExpandedBehaviorStart,
  codexExpandedDeadStart,
);
const codexExpandedDeadBody = codexExpandedRowsSection.slice(codexExpandedDeadStart);
for (const id of CODEX_EXPANDED_ROW_NOTE_IDS) {
  const inBehavior = codexExpandedBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = codexExpandedDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required Codex expanded row note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX Codex expanded rows check OK (${CODEX_EXPANDED_ROW_NOTE_IDS.length} notes).`,
);

const ADMIN_CODEX_SPREADSHEET_NOTE_IDS = [
  'admin-codex-spreadsheet-same-updateCodexDoc-as-list-modals',
  'admin-codex-spreadsheet-archetypes-skip-saveArchetypeWithPath',
  'admin-codex-spreadsheet-feats-list-level-modal-vs-rows',
  'admin-codex-spreadsheet-species-list-catalog-listing-ui',
  'admin-codex-spreadsheet-derived-vs-writable-columns',
  'admin-codex-spreadsheet-json-cells-vs-modal-pickers',
  'admin-codex-spreadsheet-feat-tag-normalize-on-server',
  'admin-codex-spreadsheet-no-delete-row',
  'admin-codex-spreadsheet-id-edit-dead-end',
  'admin-codex-spreadsheet-derived-columns-not-in-grid',
];

const adminCodexSpreadsheetSection = mathSectionSlice(indexText, '## Admin codex spreadsheet');
if (!adminCodexSpreadsheetSection) {
  console.error('FEATURE_INDEX is missing the Admin codex spreadsheet section.');
  process.exit(2);
}
if (!adminCodexSpreadsheetSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX Admin codex spreadsheet section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const adminSpreadsheetBehaviorStart = adminCodexSpreadsheetSection.indexOf(
  '### Same job, different behavior',
);
const adminSpreadsheetDeadStart = adminCodexSpreadsheetSection.indexOf(
  '### Dead or unreachable paths',
);
if (adminSpreadsheetBehaviorStart < 0 || adminSpreadsheetDeadStart < 0) {
  console.error(
    'FEATURE_INDEX Admin codex spreadsheet section missing behavior or dead-path headings.',
  );
  process.exit(2);
}
const adminSpreadsheetBehaviorBody = adminCodexSpreadsheetSection.slice(
  adminSpreadsheetBehaviorStart,
  adminSpreadsheetDeadStart,
);
const adminSpreadsheetDeadBody = adminCodexSpreadsheetSection.slice(adminSpreadsheetDeadStart);
for (const id of ADMIN_CODEX_SPREADSHEET_NOTE_IDS) {
  const inBehavior = adminSpreadsheetBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = adminSpreadsheetDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required Admin codex spreadsheet note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX Admin codex spreadsheet check OK (${ADMIN_CODEX_SPREADSHEET_NOTE_IDS.length} notes).`,
);

const ONSITE_RULEBOOK_CHAPTER_NOTE_IDS = [
  'rulebook-welcome-index-not-slug-url',
  'rulebook-google-doc-not-a-chapter',
  'rulebook-nav-tree-vs-pager-order',
  'rulebook-json-mdx-registry-must-match',
  'rulebook-glossary-realms-metadata-unfinished',
  'rulebook-unknown-slug-notFound',
  'rulebook-welcome-slug-route-dead-end',
];

const onsiteRulebookSection = mathSectionSlice(indexText, '## On-site rulebook chapters');
if (!onsiteRulebookSection) {
  console.error('FEATURE_INDEX is missing the On-site rulebook chapters section.');
  process.exit(2);
}
if (!onsiteRulebookSection.includes('### Same job, different behavior')) {
  console.error(
    'FEATURE_INDEX On-site rulebook section is missing ### Same job, different behavior.',
  );
  process.exit(2);
}
const rulebookBehaviorStart = onsiteRulebookSection.indexOf('### Same job, different behavior');
const rulebookDeadStart = onsiteRulebookSection.indexOf('### Dead or unreachable paths');
if (rulebookBehaviorStart < 0 || rulebookDeadStart < 0) {
  console.error('FEATURE_INDEX On-site rulebook section missing behavior or dead-path headings.');
  process.exit(2);
}
const rulebookBehaviorBody = onsiteRulebookSection.slice(rulebookBehaviorStart, rulebookDeadStart);
const rulebookDeadBody = onsiteRulebookSection.slice(rulebookDeadStart);
for (const id of ONSITE_RULEBOOK_CHAPTER_NOTE_IDS) {
  const inBehavior = rulebookBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = rulebookDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required On-site rulebook chapter note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX On-site rulebook chapters check OK (${ONSITE_RULEBOOK_CHAPTER_NOTE_IDS.length} notes).`,
);

const CREATOR_SECTION_ISLAND_NOTE_IDS = [
  'creator-islands-workspace-not-autosave',
  'power-editor-facade-files-vs-technique-inline-sections',
  'power-parts-vs-mechanics-two-collapsibles',
  'technique-parts-no-apply-duration-on-card',
  'item-armor-only-armor-island',
  'empowered-damage-before-parts-order',
  'empowered-technique-damage-labeled-separate',
  'power-hide-parts-damage-shared-randomize',
  'item-weapon-fields-hidden-on-armor-type',
];

const creatorSectionIslandsSection = mathSectionSlice(
  indexText,
  '## Creator editor section islands',
);
if (!creatorSectionIslandsSection) {
  console.error('FEATURE_INDEX is missing the Creator editor section islands section.');
  process.exit(2);
}
if (!creatorSectionIslandsSection.includes('### Same job, different behavior')) {
  console.error('FEATURE_INDEX creator section islands missing ### Same job, different behavior.');
  process.exit(2);
}
const creatorIslandsBehaviorStart = creatorSectionIslandsSection.indexOf(
  '### Same job, different behavior',
);
const creatorIslandsDeadStart = creatorSectionIslandsSection.indexOf(
  '### Dead or unreachable paths',
);
if (creatorIslandsBehaviorStart < 0 || creatorIslandsDeadStart < 0) {
  console.error('FEATURE_INDEX creator section islands missing behavior or dead-path headings.');
  process.exit(2);
}
const creatorIslandsBehaviorBody = creatorSectionIslandsSection.slice(
  creatorIslandsBehaviorStart,
  creatorIslandsDeadStart,
);
const creatorIslandsDeadBody = creatorSectionIslandsSection.slice(creatorIslandsDeadStart);
for (const id of CREATOR_SECTION_ISLAND_NOTE_IDS) {
  const inBehavior = creatorIslandsBehaviorBody.includes(`screen-behavior-note:${id}:`);
  const inDead = creatorIslandsDeadBody.includes(`screen-behavior-note:${id}:`);
  if (!inBehavior && !inDead) {
    console.error('FEATURE_INDEX missing required creator section island note:', id);
    process.exit(2);
  }
}
console.log(
  `FEATURE_INDEX creator section islands check OK (${CREATOR_SECTION_ISLAND_NOTE_IDS.length} notes).`,
);

const gen = spawnSync(
  process.execPath,
  [path.join(__dirname, 'generate-feature-index-barrels.js'), '--check'],
  { encoding: 'utf8' },
);
if (gen.stdout) process.stdout.write(gen.stdout);
if (gen.stderr) process.stderr.write(gen.stderr);
if (gen.status !== 0) process.exit(gen.status || 2);
