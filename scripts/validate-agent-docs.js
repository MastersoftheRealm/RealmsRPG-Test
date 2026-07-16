#!/usr/bin/env node
/**
 * Validate markdown links / referenced paths in agent-visible docs.
 * Exit 2 on broken local file links.
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
  'src/docs/ai/ADR/README.md',
  '.cursor/rules/realms-tasks.mdc',
  '.cursor/rules/realms-project.mdc',
  '.cursor/rules/realms-accessibility.mdc',
];

const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
const barePathHints = [
  /`((?:src|\.cursor)\/[^`\s]+\.[a-zA-Z0-9]+)`/g,
  /`((?:AGENTS|package)\.md)`/g,
];

const broken = [];

function resolveLink(fromFile, href) {
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) {
    return null;
  }
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  const baseDir = path.dirname(path.join(repoRoot, fromFile));
  const abs = path.resolve(baseDir, clean);
  return abs;
}

for (const rel of targets) {
  const abs = path.join(repoRoot, rel);
  if (!fs.existsSync(abs)) {
    broken.push({ file: rel, link: '(missing file itself)', target: abs });
    continue;
  }
  const text = fs.readFileSync(abs, 'utf8');
  let m;
  while ((m = linkRe.exec(text))) {
    const target = resolveLink(rel, m[2]);
    if (target && !fs.existsSync(target)) {
      broken.push({ file: rel, link: m[2], target: path.relative(repoRoot, target) });
    }
  }
  for (const re of barePathHints) {
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      const p = m[1];
      const candidate = path.join(repoRoot, p);
      if (!fs.existsSync(candidate)) {
        // Skip paths that are clearly relative to ai/ without src prefix ambiguity
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
