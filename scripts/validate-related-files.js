#!/usr/bin/env node
/**
 * Validate related_files paths on open tasks in ACTIVE_TASKS.md + WAITING_TASKS.md.
 * Exit 2 if any listed path is missing (skips globs / obvious placeholders).
 */
const fs = require('fs');
const path = require('path');
const { parseRelatedFilesFromBlock } = require('./parse-related-files');

const repoRoot = path.resolve(__dirname, '..');
const queueFiles = ['src/docs/ai/ACTIVE_TASKS.md', 'src/docs/ai/WAITING_TASKS.md'];

const missing = [];
for (const queueRel of queueFiles) {
  const activePath = path.join(repoRoot, queueRel);
  if (!fs.existsSync(activePath)) continue;
  const raw = fs.readFileSync(activePath, 'utf8');
  const blocks = raw
    .split(/\n(?=- id: TASK-)/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('- id: TASK-'));

  for (const block of blocks) {
    const id = block.match(/- id:\s*(TASK-\d+)/)?.[1];
    const status = block.match(/\n\s*status:\s*(.+)/)?.[1]?.trim();
    if (!['not-started', 'in-progress', 'partial', 'blocked'].includes(status || '')) continue;
    const files = parseRelatedFilesFromBlock(block);
    if (!files.length) continue;
    for (const f of files) {
      if (f.includes('*') || f.includes('…') || f.startsWith('http')) continue;
      const abs = path.join(repoRoot, f);
      if (!fs.existsSync(abs)) missing.push({ id, file: f, queue: queueRel });
    }
  }
}

if (missing.length) {
  console.error('Open tasks with missing related_files:');
  for (const m of missing) console.error(`  ${m.id} (${m.queue}): ${m.file}`);
  process.exit(2);
}
console.log('related_files paths OK for ACTIVE + WAITING tasks.');
