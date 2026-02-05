#!/usr/bin/env node
/*
 Triage tasks by inferring related_files from repo search.
 - Finds tasks in AI_TASK_QUEUE.md with empty related_files and searches repo for keyword matches.
 - Dry-run by default. Use --apply to update `AI_TASK_QUEUE.md`.

 Usage:
   node scripts/triage_tasks.js        # dry-run
   node scripts/triage_tasks.js --apply
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src', 'docs', 'ai', 'AI_TASK_QUEUE.md');

if (!fs.existsSync(queuePath)) {
  console.error('AI_TASK_QUEUE.md not found', queuePath);
  process.exit(1);
}

const raw = fs.readFileSync(queuePath, 'utf8');
const taskBlocks = raw.split(/\n(?=- id: TASK-)/m).map(s=>s.trim()).filter(Boolean);

function extractField(block, field) {
  const re = new RegExp(`\\n\\s*${field}:\\s*([\\s\\S]*?)(\\n-\\s*id:|$)`,'m');
  const m = block.match(re);
  if (!m) return null;
  return m[1].trim();
}

function findFilesForKeywords(keywords) {
  const found = new Map();
  for (const kw of keywords) {
    try {
      const out = execSync(`git grep -n --full-name -i "${kw}" -- . || true`, { cwd: repoRoot, encoding: 'utf8' });
      out.split('\n').filter(Boolean).forEach(line => {
        const file = line.split(':')[0];
        found.set(file, (found.get(file)||0)+1);
      });
    } catch(e) {
      // ignore
    }
  }
  // sort by count desc
  return Array.from(found.entries()).sort((a,b)=>b[1]-a[1]).map(e=>e[0]).slice(0,5);
}

const updates = [];

for (const block of taskBlocks) {
  if (!block.startsWith('- id: TASK-')) continue;
  const idMatch = block.match(/- id:\s*(TASK-\d+)/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const relatedRaw = extractField(block,'related_files');
  const relatedHas = relatedRaw && relatedRaw.includes('-');
  if (relatedHas) continue; // already has related files

  // get title and description to derive keywords
  const title = (block.match(/\n\s*title:\s*(.+)/) || [null,''])[1] || '';
  const desc = (block.match(/\n\s*description:\s*\|([\s\S]*?)(\n\s*acceptance_criteria:|\n-\s*id:|$)/m) || [])[1] || '';
  const text = `${title} ${desc}`;
  const words = Array.from(new Set(text.split(/[^A-Za-z0-9]/).filter(w=>w.length>4).slice(0,20))).slice(0,8);
  if (words.length===0) continue;
  const files = findFilesForKeywords(words);
  if (files.length===0) continue;
  updates.push({ id, files, words });
}

if (updates.length===0) {
  console.log('No triage updates found.');
  process.exit(0);
}

console.log('Triage suggestions:');
for (const u of updates) console.log(` - ${u.id}: ${u.files.slice(0,3).join(', ')} (keywords: ${u.words.join(', ')})`);

const apply = process.argv.includes('--apply');
if (!apply) {
  console.log('\nDry-run. Re-run with --apply to write changes to AI_TASK_QUEUE.md');
  process.exit(0);
}

// Apply updates: insert related_files list into the corresponding task blocks
let newRaw = raw;
for (const u of updates) {
  const repl = `related_files:\n` + u.files.map(f=>`    - ${f}`).join('\n');
  const pattern = new RegExp(`(- id:\s*${u.id}[\s\S]*?)(\n\s*related_files:\s*\[\]?)`, 'm');
  if (pattern.test(newRaw)) {
    newRaw = newRaw.replace(pattern, `$1\n  ${repl}`);
  } else {
    // fallback: find block by id and insert after related_files line
    const idPattern = new RegExp(`(- id:\s*${u.id}[\s\S]*?)(\n\s*created_at:)`, 'm');
    newRaw = newRaw.replace(idPattern, `$1\n  ${repl}\n  created_at:`);
  }
}

fs.writeFileSync(queuePath, newRaw, 'utf8');
console.log('Applied triage updates to', queuePath);
