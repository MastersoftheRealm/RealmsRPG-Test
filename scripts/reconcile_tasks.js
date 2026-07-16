#!/usr/bin/env node
/**
 * Reconcile AI tasks against git history.
 * Sources: ACTIVE_TASKS.md + archive/TASK_QUEUE_DONE*.md
 * --strict fails when a done task has no matching commits (after baseline allowlist).
 * --strict-since=YYYY-MM-DD only enforces done tasks with completed_at on/after that date.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    const id = block.match(/- id:\s*(TASK-\d+)/)?.[1] || null;
    const title = block.match(/\n\s*title:\s*(.+)/)?.[1]?.trim() || '';
    const status = block.match(/\n\s*status:\s*(.+)/)?.[1]?.trim() || '';
    const completed_at = block.match(/\n\s*completed_at:\s*(.+)/)?.[1]?.trim() || '';
    const relatedMatch = block.match(/\n\s*related_files:\n([\s\S]*?)(\n\S|$)/);
    let related_files = [];
    if (relatedMatch) {
      related_files = relatedMatch[1]
        .split('\n')
        .map((l) => l.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean);
    }
    return { id, title, status, completed_at, related_files, source: path.relative(repoRoot, filePath), raw: block };
  });
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

const byId = new Map();
for (const file of collectTaskFiles()) {
  for (const t of parseTasksFromFile(file)) {
    if (!t.id) continue;
    // Prefer ACTIVE_TASKS over archive duplicates
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
