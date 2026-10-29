#!/usr/bin/env node
/**
 * Historical TASK-### identity checks ran against src/docs/ai/archive/ until
 * that folder was removed (2026-10-29). CI still invokes this script; it
 * writes reports/task-reconcile-report.json and exits 0.
 *
 * Legacy flags (--strict, --strict-since, --allow-uncommitted-done, --apply)
 * are accepted and ignored.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(repoRoot, 'reports');

if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

const report = {
  generated_at: new Date().toISOString(),
  archive_checks: 'retired',
  note: 'src/docs/ai/archive/ removed; ClickUp is the task record. Duplicate TASK-### checks no longer run.',
  task_count: 0,
};
const outPath = path.join(reportsDir, 'task-reconcile-report.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Wrote reconcile report to', outPath);

if (process.argv.includes('--apply')) {
  console.log('Changelog append retired. Nothing written.');
}

console.log('Reconciliation complete.', { tasks: 0, archive_checks: 'retired' });
