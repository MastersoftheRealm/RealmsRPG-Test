#!/usr/bin/env node
/**
 * Fail if new files appear under src/components/shared|ui without being on the allowlist.
 * Architect path: add ADR + append path to scripts/shared-ui-allowlist.json.
 *
 * Usage:
 *   node scripts/validate-shared-ui-allowlist.js
 *   node scripts/validate-shared-ui-allowlist.js --write  # regenerate allowlist from disk
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const allowPath = path.join(repoRoot, 'scripts/shared-ui-allowlist.json');
const roots = ['src/components/shared', 'src/components/ui'];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(ent.name) && !/\.(test|spec)\.(tsx?|jsx?)$/.test(ent.name)) {
      // Colocated unit tests are not Architect shared/ui surface area.
      acc.push(path.relative(repoRoot, p).replace(/\\/g, '/'));
    }
  }
  return acc;
}

const onDisk = roots.flatMap((r) => walk(path.join(repoRoot, r))).sort();

if (process.argv.includes('--write')) {
  fs.writeFileSync(allowPath, JSON.stringify({ files: onDisk }, null, 2) + '\n');
  console.log(`Wrote allowlist (${onDisk.length} files).`);
  process.exit(0);
}

if (!fs.existsSync(allowPath)) {
  console.error('Missing scripts/shared-ui-allowlist.json — run with --write once.');
  process.exit(2);
}

const allow = new Set(JSON.parse(fs.readFileSync(allowPath, 'utf8')).files || []);
const extras = onDisk.filter((f) => !allow.has(f));
const missing = [...allow].filter((f) => !onDisk.includes(f));

if (extras.length) {
  console.error('New shared/ui files not on allowlist (Architect: ADR + update allowlist):');
  extras.forEach((f) => console.error(' ', f));
  process.exit(2);
}

if (missing.length) {
  console.warn(
    `Allowlist has ${missing.length} path(s) no longer on disk (run --write after intentional deletes).`
  );
}

console.log(`Shared/ui allowlist OK (${onDisk.length} files).`);
