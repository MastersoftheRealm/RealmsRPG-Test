#!/usr/bin/env node
/*
 Session submit helper
 - Append raw feedback (from arg or stdin) to ALL_FEEDBACK_CLEAN.md using the Raw Entry Template
 - Run extractor (apply) to convert to tasks
 - Run triage (apply) to infer related_files
 - Optionally attempt to create branches/PRs for low-risk tasks if `--autopush` and `GH_TOKEN` available

 Usage:
  node scripts/session_submit.js "My raw feedback text..."
  cat feedback.txt | node scripts/session_submit.js
  node scripts/session_submit.js --autopush "..."
*/

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const feedbackPath = path.join(repoRoot, 'src', 'docs', 'ALL_FEEDBACK_CLEAN.md');

function usage() {
  console.log('Usage: node scripts/session_submit.js [--autopush] "raw feedback text"');
  process.exit(1);
}

const args = process.argv.slice(2);
let autopush = false;
let text = null;
if (args.includes('--autopush')) {
  autopush = true;
  args.splice(args.indexOf('--autopush'),1);
}
if (args.length>0) text = args.join(' ');
if (!text) {
  // read stdin
  const stat = fs.fstatSync(0);
  if (stat.size>0) {
    text = fs.readFileSync(0,'utf8').trim();
  }
}
if (!text) usage();

// Append to ALL_FEEDBACK_CLEAN.md raw log
const now = new Date();
const stamp = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
const entry = `\n${stamp} — Manual Submission\n- \"${text.replace(/\"/g, "'\"")}\"\n`;
fs.appendFileSync(feedbackPath, entry, 'utf8');
console.log('Appended raw feedback to', feedbackPath);

// Run extractor --apply
console.log('Running extractor (apply)...');
try {
  const out = execSync('node scripts/extract_feedback.js --apply', { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe'});
  console.log(out);
} catch(e) {
  console.error('Extractor failed:', e.stdout || e.message);
}

// Run triage --apply
console.log('Running triage (apply)...');
try {
  const out = execSync('node scripts/triage_tasks.js --apply', { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe'});
  console.log(out);
} catch(e) {
  console.error('Triage failed:', e.stdout || e.message);
}

// Optional: autopush - create branches for low-risk tasks and open PRs using gh (if available)
if (autopush) {
  console.log('Autopush requested. Attempting to create branches and PRs for low-risk tasks.');
  // require gh CLI
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch(e) {
    console.error('gh CLI not available. Install GitHub CLI and authenticate to enable autopush.');
    process.exit(1);
  }

  // read task queue and find low/medium priority not-started tasks
  const queue = fs.readFileSync(path.join(repoRoot,'src','docs','ai','AI_TASK_QUEUE.md'),'utf8');
  const matches = queue.match(/- id: TASK-\d+[\s\S]*?(?=- id: TASK-|$)/g) || [];
  for (const m of matches) {
    const idMatch = m.match(/- id: (TASK-\d+)/);
    const prioMatch = m.match(/priority:\s*(\w+)/);
    const statusMatch = m.match(/status:\s*(\w+)/);
    if (!idMatch || !prioMatch || !statusMatch) continue;
    const id = idMatch[1];
    const prio = prioMatch[1];
    const status = statusMatch[1];
    if (status !== 'not-started') continue;
    if (!/low|medium/.test(prio)) continue; // only auto for low/medium

    const titleMatch = m.match(/\n\s*title:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim().replace(/[^a-z0-9\- ]/ig,'').slice(0,50) : id;
    const branch = `ai/${id.toLowerCase()}-${title.replace(/\s+/g,'-').toLowerCase()}`;

    try {
      console.log(`Creating branch ${branch} and pushing...`);
      execSync(`git checkout -b ${branch}`, { cwd: repoRoot, stdio: 'inherit' });
      // create a small placeholder commit to open the PR from — agent will replace with real work later
      fs.writeFileSync(path.join(repoRoot,'docs','ai','PLACEHOLDER_'+id+'.md'), `Placeholder for ${id}\n`, 'utf8');
      execSync(`git add . && git commit -m "[${id}] Create branch for auto-implementation"`, { cwd: repoRoot, stdio: 'inherit' });
      execSync(`git push -u origin ${branch}`, { cwd: repoRoot, stdio: 'inherit' });
      // open PR
      const prTitle = `[${id}] ${title}`;
      execSync(`gh pr create --fill --title "${prTitle}" --body "Auto-created PR for ${id}. Agent will implement changes and update this PR."`, { cwd: repoRoot, stdio: 'inherit' });
    } catch(e) {
      console.error('Autopush step failed for', id, e.message || e);
      try { execSync('git checkout -', { cwd: repoRoot }); } catch(_){}
    }
  }
}

console.log('Session submit complete.');
