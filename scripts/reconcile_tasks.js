#!/usr/bin/env node
/*
 Reconcile AI tasks against git history and PR/commit messages.
 - Reads `src/docs/ai/AI_TASK_QUEUE.md` and for each task looks for commits that mention the TASK id (e.g., TASK-001)
 - Produces a JSON report at `reports/task-reconcile-report.json` describing matches and missing tasks.
 - Run locally or in CI. Use `--apply` to append a short evidence note to `src/docs/ai/AI_CHANGELOG.md` (safe-guarded).

 Note: This is a best-effort script that uses `git` to find commits and changed files.
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src', 'docs', 'ai', 'AI_TASK_QUEUE.md');
const changelogPath = path.join(repoRoot, 'src', 'docs', 'ai', 'AI_CHANGELOG.md');
const reportsDir = path.join(repoRoot, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

if (!fs.existsSync(queuePath)) {
  console.error('AI_TASK_QUEUE.md not found at', queuePath);
  process.exit(1);
}

const raw = fs.readFileSync(queuePath, 'utf8');
// Simple parse: split by lines starting with '- id: TASK-'
const taskBlocks = raw.split(/\n(?=- id: TASK-)/m).map(s => s.trim()).filter(Boolean);
const tasks = taskBlocks.map(block => {
  const idMatch = block.match(/- id:\s*(TASK-\d+)/);
  const id = idMatch ? idMatch[1] : null;
  const titleMatch = block.match(/\n\s*title:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const statusMatch = block.match(/\n\s*status:\s*(.+)/);
  const status = statusMatch ? statusMatch[1].trim() : '';
  const relatedMatch = block.match(/\n\s*related_files:\n([\s\S]*?)(\n\S|$)/);
  let related_files = [];
  if (relatedMatch) {
    related_files = relatedMatch[1].split('\n').map(l => l.replace(/[-\s]*/g,'').trim()).filter(Boolean);
  }
  return { id, title, status, related_files, raw: block };
});

function gitGrepTask(taskId) {
  try {
    const out = execSync(`git log --all --pretty=format:%H::%s --grep=${taskId}`, { encoding: 'utf8' });
    if (!out.trim()) return [];
    const lines = out.trim().split('\n');
    return lines.map(l => {
      const [hash, subject] = l.split('::');
      // get changed files for this commit
      let files = [];
      try {
        const f = execSync(`git show --pretty= --name-only ${hash}`, { encoding: 'utf8' });
        files = f.split('\n').map(s=>s.trim()).filter(Boolean);
      } catch(e) {
        files = [];
      }
      return { hash, subject, files };
    });
  } catch(e) {
    return [];
  }
}

const report = { generated_at: new Date().toISOString(), tasks: [] };
for (const t of tasks) {
  if (!t.id) continue;
  const matches = gitGrepTask(t.id);
  const matchedFiles = new Set();
  matches.forEach(m => m.files.forEach(f => matchedFiles.add(f)));
  const relatedOverlap = t.related_files.length ? t.related_files.filter(r => {
    // normalize simple comparisons
    return Array.from(matchedFiles).some(mf => mf.endsWith(r) || mf.includes(r.replace('src/','')) );
  }) : [];
  report.tasks.push({
    id: t.id,
    title: t.title,
    status: t.status,
    matches: matches,
    related_files: t.related_files,
    related_overlap: relatedOverlap
  });
}

const outPath = path.join(reportsDir, 'task-reconcile-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote reconcile report to', outPath);

const apply = process.argv.includes('--apply');
if (apply) {
  // Append a short entry to AI_CHANGELOG.md with the report summary
  const summaryLines = report.tasks.map(t => {
    const ok = t.matches.length ? `matched ${t.matches.length} commit(s)` : 'no matching commits';
    return `- ${t.id} | ${t.title} | status=${t.status} | ${ok}`;
  }).join('\n');
  const entry = `${new Date().toISOString().slice(0,10)} | reconcile-script | Reconcile run\n${summaryLines}\n\n`;
  fs.appendFileSync(changelogPath, entry, 'utf8');
  console.log('Appended summary to', changelogPath);
}

// Exit with non-zero if any task marked done has no matches
const problematic = report.tasks.filter(t => t.status === 'done' && t.matches.length === 0);
if (problematic.length) {
  console.error('Found tasks marked done with no matching commits:', problematic.map(p=>p.id).join(', '));
  process.exit(2);
}

console.log('Reconciliation complete.');
