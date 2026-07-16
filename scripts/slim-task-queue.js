#!/usr/bin/env node
/**
 * One-shot / reusable: split AI_TASK_QUEUE.md into ACTIVE_TASKS.md (open)
 * and archive done tasks. Safe to re-run only when queue still has done blocks.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const queuePath = path.join(root, 'src/docs/ai/AI_TASK_QUEUE.md');
const activePath = path.join(root, 'src/docs/ai/ACTIVE_TASKS.md');
const archiveDonePath = path.join(root, 'src/docs/ai/archive/TASK_QUEUE_DONE.md');
const snapshotPath = path.join(root, 'src/docs/ai/archive/TASK_QUEUE_DONE_2026-07-15.md');

const raw = fs.readFileSync(queuePath, 'utf8');
const firstTaskIdx = raw.search(/\n- id: TASK-/);
const header = firstTaskIdx >= 0 ? raw.slice(0, firstTaskIdx).trim() : '';
const body = firstTaskIdx >= 0 ? raw.slice(firstTaskIdx + 1) : raw;

const blocks = body.split(/\n(?=- id: TASK-)/).map((s) => s.trim()).filter(Boolean);
const openStatuses = new Set(['not-started', 'in-progress', 'partial', 'blocked']);
const open = [];
const done = [];
for (const block of blocks) {
  const status = (block.match(/\n\s*status:\s*(.+)/)?.[1] || '').trim();
  if (openStatuses.has(status)) open.push(block);
  else done.push(block);
}

const nextIdMatch =
  header.match(/\*\*Next task ID:\*\*\s*(TASK-\d+)/) ||
  header.match(/Next task ID:\s*(TASK-\d+)/);
const nextId = nextIdMatch ? nextIdMatch[1] : 'TASK-474';

const activeHeader = `# Active AI Tasks

**Hot path only** — open statuses: \`not-started\` | \`in-progress\` | \`partial\` | \`blocked\`.
Do **not** read the historical done archive at session start.

**Next task ID:** ${nextId}
**Done archive:** [\`archive/TASK_QUEUE_DONE.md\`](archive/TASK_QUEUE_DONE.md) · snapshot [\`archive/TASK_QUEUE_DONE_2026-07-15.md\`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [\`AI_TASK_QUEUE.md\`](AI_TASK_QUEUE.md) · Template: [\`AI_REQUEST_TEMPLATE.md\`](AI_REQUEST_TEMPLATE.md)

**Agent rules:** Skip \`blocked\` and any task with \`assignee:\` set to a human. Prefer highest \`priority\` among \`not-started\` / continue \`partial\` / \`in-progress\`. Human-only work → \`DEVELOPER_TASK_QUEUE.md\`.

**Counts:** ${open.length} open · ${done.length} archived this run.

---

`;

fs.writeFileSync(activePath, activeHeader + open.join('\n\n') + '\n');

const snapshotHeader = `# Done tasks snapshot — 2026-07-15

Moved out of the session-start hot path during the AI workflow overhaul.
Canonical append-only done list: [\`TASK_QUEUE_DONE.md\`](TASK_QUEUE_DONE.md).

**Count:** ${done.length} tasks.

---

`;
fs.writeFileSync(snapshotPath, snapshotHeader + done.join('\n\n') + '\n');

let existingDone = fs.existsSync(archiveDonePath)
  ? fs.readFileSync(archiveDonePath, 'utf8')
  : '# Done Tasks\n\n';
const appendBanner = `\n\n---\n\n## Appended 2026-07-15 (workflow slim — ${done.length} tasks from active queue)\n\n`;
fs.writeFileSync(archiveDonePath, existingDone.trimEnd() + appendBanner + done.join('\n\n') + '\n');

console.log(JSON.stringify({ open: open.length, done: done.length, nextId }, null, 2));
console.log('Wrote', activePath);
console.log('Wrote', snapshotPath);
