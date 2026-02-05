#!/usr/bin/env node
/*
 Simple extractor: reads ALL_FEEDBACK_CLEAN.md raw entries and appends basic tasks to AI_TASK_QUEUE.md.
 - Naive parser: looks for '### Raw Entries' then date-prefixed entries like `2/3/2026 ...`.
 - Converts each raw entry into a minimal YAML task entry and appends it if not already present.

 Usage:
   node scripts/extract_feedback.js

 NOTE: This is intentionally simple. Review output before merging.
*/

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const feedbackPath = path.join(repoRoot, 'src', 'docs', 'ALL_FEEDBACK_CLEAN.md');
const queuePath = path.join(repoRoot, 'src', 'docs', 'ai', 'AI_TASK_QUEUE.md');

if (!fs.existsSync(feedbackPath)) {
  console.error('ALL_FEEDBACK_CLEAN.md not found at', feedbackPath);
  process.exit(1);
}
if (!fs.existsSync(queuePath)) {
  console.error('AI_TASK_QUEUE.md not found at', queuePath);
  process.exit(1);
}

const feedback = fs.readFileSync(feedbackPath, 'utf8');
const queue = fs.readFileSync(queuePath, 'utf8');

const rawSectionMatch = feedback.match(/#{2,} Raw Entries[\s\S]*$/i);
if (!rawSectionMatch) {
  console.error('Raw Entries section not found in ALL_FEEDBACK_CLEAN.md');
  process.exit(1);
}

const rawSection = rawSectionMatch[0];
// Split entries by lines that look like a date at start (e.g., 2/3/2026 20:27)
const lines = rawSection.split(/\r?\n/);
const entries = [];
let current = null;
const dateLineRegex = /^\s*\d{1,2}\/\d{1,2}\/\d{4}/;
for (const line of lines) {
  if (dateLineRegex.test(line)) {
    if (current) entries.push(current);
    current = line + '\n';
  } else if (current) {
    current += line + '\n';
  }
}
if (current) entries.push(current);

if (entries.length === 0) {
  console.log('No raw entries found to parse.');
  process.exit(0);
}

// Determine next task id
const existingTaskIds = (queue.match(/id:\s*TASK-(\d+)/g) || []).map(m => parseInt(m.replace(/id:\s*TASK-(\d+)/, '$1'), 10));
const maxExisting = existingTaskIds.length ? Math.max(...existingTaskIds) : 0;
let nextId = maxExisting + 1;

// helper: infer priority from keywords
function inferPriority(text) {
  const lower = text.toLowerCase();
  if (/critical|urgent|blocker|security|crash|fail|error/.test(lower)) return 'critical';
  if (/fix|bug|broken|not working|doesn't|does not|missing/.test(lower)) return 'high';
  if (/improv|improve|refactor|unify|polish|nice to have/.test(lower)) return 'medium';
  return 'low';
}

let newTasks = [];
for (const entry of entries) {
  if (entry.toLowerCase().includes('raw entry template') || entry.trim().length < 20) continue;
  const firstLines = entry.split('\n').map(l=>l.trim()).filter(Boolean);
  const summaryLine = firstLines.slice(0,2).join(' ').replace(/"/g, "'").trim();
  const title = summaryLine.length > 80 ? summaryLine.slice(0,77) + '...' : summaryLine;
  const priority = inferPriority(entry);
  const created_at = new Date().toISOString().slice(0,10);

  // Deduplication: check if title or a short snippet exists in queue
  const snippet = summaryLine.slice(0,50);
  const duplicate = queue.includes(snippet) || queue.includes(title);
  if (duplicate) {
    console.log('Skipping duplicate entry:', title);
    continue;
  }

  const taskId = `TASK-${String(nextId).padStart(3,'0')}`;
  nextId += 1;

  const yaml = `- id: ${taskId}\n  title: ${title}\n  priority: ${priority}\n  status: not-started\n  related_files: []\n  created_at: ${created_at}\n  created_by: owner\n  description: |\n    ${entry.replace(/\n/g, '\n    ').trim()}\n  acceptance_criteria:\n    - Review and triage\n  notes: "auto-extracted from ALL_FEEDBACK_CLEAN.md"\n\n`;
  newTasks.push({ id: taskId, title, priority, yaml });
}

if (newTasks.length === 0) {
  console.log('No new tasks detected (duplicates skipped).');
  process.exit(0);
}

console.log(`Detected ${newTasks.length} new task(s):`);
for (const t of newTasks) console.log(` - ${t.id} | ${t.priority} | ${t.title}`);

const apply = process.argv.includes('--apply');
if (!apply) {
  console.log('\nDry-run mode (no files changed). Re-run with --apply to append tasks to AI_TASK_QUEUE.md');
  process.exit(0);
}

// Append tasks
let newEntriesText = '\n';
for (const t of newTasks) newEntriesText += t.yaml;
fs.appendFileSync(queuePath, newEntriesText, 'utf8');
console.log(`Appended ${newTasks.length} new task(s) to ${queuePath}`);
