#!/usr/bin/env node
/**
 * Reconcile AI tasks against git history.
 * Sources: ACTIVE_TASKS.md + archive/TASK_QUEUE_DONE*.md
 * --strict fails when a done task has no matching commits (after baseline allowlist).
 * --strict-since=YYYY-MM-DD only enforces done tasks with completed_at on/after that date.
 * Duplicate `- id: TASK-###` in ACTIVE, WAITING, or live TASK_QUEUE_DONE.md always fails
 * (dated snapshot copies are excluded — they reuse IDs by design).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseRelatedFilesFromBlock } = require('./parse-related-files');

const repoRoot = path.resolve(__dirname, '..');
const aiDir = path.join(repoRoot, 'src', 'docs', 'ai');
const archiveDir = path.join(aiDir, 'archive');
const changelogPath = path.join(aiDir, 'AI_CHANGELOG.md');
const reportsDir = path.join(repoRoot, 'reports');
const baselinePath = path.join(repoRoot, 'scripts', 'task-reconcile-baseline.json');

if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

function collectTaskFiles() {
  const files = [path.join(aiDir, 'ACTIVE_TASKS.md')];
  if (fs.existsSync(archiveDir)) {
    for (const name of fs.readdirSync(archiveDir)) {
      if (/^TASK_QUEUE_DONE/i.test(name) && name.endsWith('.md')) {
        files.push(path.join(archiveDir, name));
      }
    }
  }
  // Legacy fallback if someone still has tasks in the process file
  const queuePath = path.join(aiDir, 'AI_TASK_QUEUE.md');
  if (fs.existsSync(queuePath)) files.push(queuePath);
  return files.filter((f) => fs.existsSync(f));
}

function parseTasksFromFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const blocks = raw.split(/\n(?=- id: TASK-)/m).map((s) => s.trim()).filter((s) => s.startsWith('- id: TASK-'));
  return blocks.map((block) => {
    const idToken = block.match(/^- id:\s*(\S+)/)?.[1] || null;
    const id = idToken && /^TASK-\d+$/.test(idToken) ? idToken : null;
    const title = block.match(/\n\s*title:\s*(.+)/)?.[1]?.trim() || '';
    const status = block.match(/\n\s*status:\s*(.+)/)?.[1]?.trim() || '';
    const completed_at = block.match(/\n\s*completed_at:\s*(.+)/)?.[1]?.trim() || '';
    const related_files = parseRelatedFilesFromBlock(block);
    return { id, title, status, completed_at, related_files, source: path.relative(repoRoot, filePath), raw: block };
  });
}

/** Live queues where a repeated `- id:` is a collision, not a July-15 snapshot copy. */
function liveIdentityFiles() {
  return [
    path.join(aiDir, 'ACTIVE_TASKS.md'),
    path.join(aiDir, 'WAITING_TASKS.md'),
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

function gitGrepTask(taskId) {
  try {
    const out = execSync(`git log --all --pretty=format:%H::%s --grep=${taskId}`, { encoding: 'utf8' });
    if (!out.trim()) return [];
    return out
      .trim()
      .split('\n')
      .map((l) => {
        const [hash, subject] = l.split('::');
        let files = [];
        try {
          const f = execSync(`git show --pretty= --name-only ${hash}`, { encoding: 'utf8' });
          files = f.split('\n').map((s) => s.trim()).filter(Boolean);
        } catch {
          files = [];
        }
        return { hash, subject, files };
      });
  } catch {
    return [];
  }
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
    'Duplicate TASK-### in ACTIVE_TASKS.md, WAITING_TASKS.md, and/or archive/TASK_QUEUE_DONE.md (not the dated snapshot):'
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
    // Snapshot copies may reuse IDs; live ACTIVE/WAITING/TASK_QUEUE_DONE.md uniqueness is gated above.
    if (!byId.has(t.id) || String(t.source).includes('ACTIVE_TASKS')) {
      byId.set(t.id, t);
    }
  }
}
const tasks = Array.from(byId.values());

const report = { generated_at: new Date().toISOString(), tasks: [] };
for (const t of tasks) {
  const matches = gitGrepTask(t.id);
  const matchedFiles = new Set();
  matches.forEach((m) => m.files.forEach((f) => matchedFiles.add(f)));
  const relatedOverlap = t.related_files.length
    ? t.related_files.filter((r) =>
        Array.from(matchedFiles).some((mf) => mf.endsWith(r) || mf.includes(r.replace('src/', '')))
      )
    : [];
  report.tasks.push({
    id: t.id,
    title: t.title,
    status: t.status,
    completed_at: t.completed_at,
    source: t.source,
    matches,
    related_files: t.related_files,
    related_overlap: relatedOverlap,
  });
}

const outPath = path.join(reportsDir, 'task-reconcile-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote reconcile report to', outPath);

if (process.argv.includes('--apply')) {
  const summaryLines = report.tasks
    .map((t) => {
      const ok = t.matches.length ? `matched ${t.matches.length} commit(s)` : 'no matching commits';
      return `- ${t.id} | ${t.title} | status=${t.status} | ${ok}`;
    })
    .join('\n');
  fs.appendFileSync(
    changelogPath,
    `${new Date().toISOString().slice(0, 10)} | reconcile-script | Reconcile run\n${summaryLines}\n\n`,
    'utf8'
  );
  console.log('Appended summary to', changelogPath);
}

const strict = process.argv.includes('--strict');
const sinceArg = process.argv.find((a) => a.startsWith('--strict-since='));
const sinceDate = sinceArg ? sinceArg.split('=')[1] : null;

let baselineIds = new Set();
if (fs.existsSync(baselinePath)) {
  try {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    baselineIds = new Set(baseline.done_without_commits || []);
  } catch {
    baselineIds = new Set();
  }
}

const problematic = report.tasks.filter((t) => {
  if (t.status !== 'done' || t.matches.length > 0) return false;
  if (baselineIds.has(t.id)) return false;
  if (sinceDate && t.completed_at && t.completed_at < sinceDate) return false;
  if (sinceDate && !t.completed_at) return false; // legacy done without date: skip under --strict-since
  return true;
});

if (problematic.length) {
  console.error(
    'Found tasks marked done with no matching commits:',
    problematic.map((p) => p.id).join(', ')
  );
  if (strict) process.exit(2);
}

console.log('Reconciliation complete.', { tasks: tasks.length, problematic: problematic.length });
