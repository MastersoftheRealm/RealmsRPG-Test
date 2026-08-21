#!/usr/bin/env node
/**
 * Validate markdown links / referenced paths in agent-visible docs.
 * Exit 2 on broken local file links or missing GitHub-GFM heading fragments.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const targets = [
  'AGENTS.md',
  'src/docs/ai/ARCHITECTURE_CONSTITUTION.md',
  'src/docs/ai/ACTIVE_TASKS.md',
  'src/docs/ai/WAITING_TASKS.md',
  'src/docs/ai/AI_TASK_QUEUE.md',
  'src/docs/ai/DESIGN_INTENT.md',
  'src/docs/ai/PR_CHECKLIST.md',
  'src/docs/ai/FEATURE_INDEX.md',
  'src/docs/ai/FEATURE_INDEX_BARRELS.generated.md',
  'src/docs/ai/BUILD_VALIDATION.md',
  'src/docs/ai/DEVELOPER_TASK_QUEUE.md',
  'src/docs/ai/ADR/README.md',
  '.cursor/rules/realms-tasks.mdc',
  '.cursor/rules/realms-project.mdc',
  '.cursor/rules/realms-accessibility.mdc',
];

const MARKDOWN_EXT = /\.(md|mdc|markdown)$/i;
const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
const barePathHints = [
  /`((?:src|\.cursor)\/[^`\s]+\.[a-zA-Z0-9]+)`/g,
  /`((?:AGENTS|package)\.md)`/g,
];
/** github-slugger v2: drop punctuation, keep letters/marks/numbers/connector/hyphen/space. */
const GFM_DROP = /[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu;

const headingIdCache = new Map();
const broken = [];

function gfmSlugBase(text) {
  return String(text).toLowerCase().replace(GFM_DROP, '').replace(/ /g, '-');
}

function collectHeadingIds(markdown) {
  const ids = new Set();
  const occurrences = Object.create(null);
  const lines = String(markdown).split(/\r?\n/);
  let fence = null;

  for (const line of lines) {
    const fenceOpen = /^( {0,3})(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const close = new RegExp(`^ {0,3}\\${fence.char}{${fence.len},}\\s*$`).exec(line);
      if (close) fence = null;
      continue;
    }
    if (fenceOpen) {
      fence = { char: fenceOpen[2][0], len: fenceOpen[2].length };
      continue;
    }

    const atx = /^( {0,3})(#{1,6})(?:[ \t]+(.+?))?[ \t]*$/.exec(line);
    if (!atx || !atx[3]) continue;
    const raw = atx[3].replace(/[ \t]+#+$/, '').trim();
    if (!raw) continue;

    let slug = gfmSlugBase(raw);
    if (!slug) continue;
    const original = slug;
    while (Object.prototype.hasOwnProperty.call(occurrences, slug)) {
      occurrences[original] += 1;
      slug = `${original}-${occurrences[original]}`;
    }
    occurrences[slug] = 0;
    ids.add(slug);
  }

  return ids;
}

function headingIdsFor(absPath) {
  const key = path.normalize(absPath);
  if (headingIdCache.has(key)) return headingIdCache.get(key);
  const ids = collectHeadingIds(fs.readFileSync(absPath, 'utf8'));
  headingIdCache.set(key, ids);
  return ids;
}

function splitHref(href) {
  const trimmed = String(href).trim();
  const hashAt = trimmed.indexOf('#');
  if (hashAt === -1) return { filePart: trimmed.split('?')[0], fragment: '' };
  const before = trimmed.slice(0, hashAt).split('?')[0];
  let fragment = trimmed.slice(hashAt + 1);
  try {
    fragment = decodeURIComponent(fragment);
  } catch {
    // keep raw fragment
  }
  return { filePart: before, fragment };
}

function isRemote(href) {
  return /^(https?:|mailto:)/i.test(href);
}

function resolveLocalFile(fromFile, filePart) {
  if (!filePart) return path.join(repoRoot, fromFile);
  const baseDir = path.dirname(path.join(repoRoot, fromFile));
  return path.resolve(baseDir, filePart);
}

function assertKnownSlugs() {
  const cases = [
    [
      'DEV-V-001 — Advanced character creator step guards',
      'dev-v-001--advanced-character-creator-step-guards',
    ],
    [
      'DEV-V-010 — Feat/trait custom name + note (TASK-377)',
      'dev-v-010--feattrait-custom-name--note-task-377',
    ],
    ['Pending owner QA (implementation done)', 'pending-owner-qa-implementation-done'],
  ];
  for (const [heading, expected] of cases) {
    const actual = gfmSlugBase(heading);
    if (actual !== expected) {
      console.error(`GFM slug self-check failed: ${JSON.stringify(heading)}`);
      console.error(`  expected ${expected}`);
      console.error(`  actual   ${actual}`);
      process.exit(2);
    }
  }
  const dupes = collectHeadingIds('## Same\n## Same\n');
  if (!dupes.has('same') || !dupes.has('same-1')) {
    console.error('GFM slug self-check failed: duplicate headings should be same / same-1');
    process.exit(2);
  }
}

assertKnownSlugs();

for (const rel of targets) {
  const abs = path.join(repoRoot, rel);
  if (!fs.existsSync(abs)) {
    broken.push({ file: rel, link: '(missing file itself)', target: abs });
    continue;
  }
  const text = fs.readFileSync(abs, 'utf8');
  let m;
  while ((m = linkRe.exec(text))) {
    const href = m[2].trim();
    if (!href || isRemote(href)) continue;

    const { filePart, fragment } = splitHref(href);
    const targetAbs = resolveLocalFile(rel, filePart);

    if (filePart) {
      if (!fs.existsSync(targetAbs)) {
        broken.push({
          file: rel,
          link: href,
          target: `${path.relative(repoRoot, targetAbs)} (missing file)`,
        });
        continue;
      }
    }

    if (!fragment) continue;
    if (!MARKDOWN_EXT.test(targetAbs)) continue;
    if (!fs.existsSync(targetAbs)) continue;

    const ids = headingIdsFor(targetAbs);
    if (!ids.has(fragment)) {
      broken.push({
        file: rel,
        link: href,
        target: `${path.relative(repoRoot, targetAbs)} (missing heading #${fragment})`,
      });
    }
  }
  for (const re of barePathHints) {
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      const p = m[1];
      const candidate = path.join(repoRoot, p);
      if (!fs.existsSync(candidate)) {
        const fromAi = path.join(repoRoot, 'src/docs/ai', p);
        if (!fs.existsSync(fromAi)) {
          broken.push({ file: rel, link: p, target: p });
        }
      }
    }
  }
}

if (broken.length) {
  console.error('Broken doc links/paths:');
  for (const b of broken) console.error(`  ${b.file} → ${b.link} (${b.target})`);
  process.exit(2);
}
console.log('Agent doc links OK (', targets.length, 'files ).');
