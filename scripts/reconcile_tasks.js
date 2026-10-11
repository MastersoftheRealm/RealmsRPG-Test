#!/usr/bin/env node
/**
 * Historical TASK-### identity checks.
 * Duplicate `- id: TASK-###` in ACTIVE, WAITING, or live TASK_QUEUE_DONE.md fails.
 * Non-canonical ids (not TASK- plus digits) fail.
 * Dated snapshot copies are excluded — they reuse IDs by design.
 *
 * The commit-subject gate is retired (2026-10-11). A done task does not need
 * TASK-### in a commit subject. ClickUp id on the branch and the PR is the
 * record for new work. --strict, --strict-since, and --allow-uncommitted-done
 * are accepted and do not fail the process. --apply does not append a changelog.
 */
const fs = require('fs');
const path = require('path');
const { parseRelatedFilesFromBlock } = require('./parse-related-files');

const repoRoot = path.resolve(__dirname, '..');
const aiDir = path.join(repoRoot, 'src', 'docs', 'ai');
const archiveDir = path.join(aiDir, 'archive');
const changelogPath = path.join(archiveDir, 'AI_CHANGELOG.md');
const reportsDir = path.join(repoRoot, 'reports');

if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

function collectTaskFiles() {
  const files = [path.join(archiveDir, 'ACTIVE_TASKS.md')];
  if (fs.existsSync(archiveDir)) {
    for (const name of fs.readdirSync(archiveDir)) {
      if (/^TASK_QUEUE_DONE/i.test(name) && name.endsWith('.md')) {
        files.push(path.join(archiveDir, name));
      }
    }
  }
  const queuePath = path.join(archiveDir, 'AI_TASK_QUEUE.md');
  if (fs.existsSync(queuePath)) files.push(queuePath);
  return files.filter((f) => fs.existsSync(f));
}

function parseTasksFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const blocks = raw
    .split(/\n(?=- id: TASK-)/m)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('- id: TASK-'));
  return blocks.map((block) => {
    const idToken = block.match(/^- id:\s*(\S+)/)?.[1] || null;
    const id = idToken && /^TASK-\d+$/.test(idToken) ? idToken : null;
    const title = block.match(/\n\s*title:\s*(.+)/)?.[1]?.trim() || '';
    const status = block.match(/\n\s*status:\s*(.+)/)?.[1]?.trim() || '';
    const completed_at = block.match(/\n\s*completed_at:\s*(.+)/)?.[1]?.trim() || '';
    const related_files = parseRelatedFilesFromBlock(block);
    return {
      id,
      title,
      status,
      completed_at,
      related_files,
      source: path.relative(repoRoot, filePath),
      raw: block,
    };
  });
}

/** Live queues where a repeated `- id:` is a collision, not a July-15 snapshot copy. */
function liveIdentityFiles() {
  return [
    path.join(archiveDir, 'ACTIVE_TASKS.md'),
    path.join(archiveDir, 'WAITING_TASKS.md'),
    path.join(archiveDir, 'TASK_QUEUE_DONE.md'),
  ].filter((f) => fs.existsSync(f));
}

function duplicateIdGroups(tasks) {
  const byId = new Map();
  for (const t of tasks) {
    if (!t.id) continue;
    if (!byId.has(t.id)) byId.set(t.id, []);
    byId.get(t.id).push(t);
  }
  return Array.from(byId.entries()).filter(([, list]) => list.length > 1);
}

function nonCanonicalIdTokens(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const blocks = raw
    .split(/\n(?=- id: TASK-)/m)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('- id: TASK-'));
  const bad = [];
  for (const block of blocks) {
    const idToken = block.match(/^- id:\s*(\S+)/)?.[1] || '';
    if (!/^TASK-\d+$/.test(idToken)) {
      const title = block.match(/\n\s*title:\s*(.+)/)?.[1]?.trim() || '';
      bad.push({
        source: path.relative(repoRoot, filePath),
        idToken,
        title,
      });
    }
  }
  return bad;
}

const identityFiles = liveIdentityFiles();
const invalidIds = identityFiles.flatMap((file) => nonCanonicalIdTokens(file));
if (invalidIds.length) {
  console.error('Non-canonical task ids (use TASK-### digits only):');
  for (const row of invalidIds) {
    console.error(`  ${row.source} — ${row.idToken} — ${row.title || '(no title)'}`);
  }
  process.exit(2);
}

const identityTasks = identityFiles.flatMap((file) => parseTasksFromFile(file));
const identityDupes = duplicateIdGroups(identityTasks);
if (identityDupes.length) {
  console.error(
    'Duplicate TASK-### in archive/ACTIVE_TASKS.md, archive/WAITING_TASKS.md, and/or archive/TASK_QUEUE_DONE.md (not the dated snapshot):',
  );
  for (const [id, list] of identityDupes) {
    console.error(`  ${id}:`);
    for (const t of list) {
      console.error(`    ${t.source} — ${t.title || '(no title)'}`);
    }
  }
  process.exit(2);
}

const byId = new Map();
for (const file of collectTaskFiles()) {
  for (const t of parseTasksFromFile(file)) {
    if (!t.id) continue;
    if (!byId.has(t.id) || String(t.source).includes('ACTIVE_TASKS')) {
      byId.set(t.id, t);
    }
  }
}
const tasks = Array.from(byId.values());

const report = {
  generated_at: new Date().toISOString(),
  commit_subject_gate: 'retired',
  note: 'TASK-### in a commit subject is not required. ClickUp id on the branch and the PR is the record for new work. Duplicate and non-canonical id checks still run.',
  task_count: tasks.length,
};
const outPath = path.join(reportsDir, 'task-reconcile-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote reconcile report to', outPath);

if (process.argv.includes('--apply')) {
  console.log('Changelog append retired. Nothing written to', changelogPath);
}

console.log('Reconciliation complete.', {
  tasks: tasks.length,
  commit_subject_gate: 'retired',
});
