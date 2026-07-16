#!/usr/bin/env node
/**
 * Validate FEATURE_INDEX.md paths exist + barrel inventory is up to date.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const indexPath = path.join(repoRoot, 'src/docs/ai/FEATURE_INDEX.md');

const indexText = fs.readFileSync(indexPath, 'utf8');
const pathRe = /(?:`|(?:\[[^\]]*\]\())((?:src\/)[^`)\s]+\.[a-zA-Z0-9]+)(?:`|\))/g;
const listedPaths = new Set();
let m;
while ((m = pathRe.exec(indexText))) listedPaths.add(m[1].replace(/\\/g, '/'));

const missingFiles = [];
for (const p of listedPaths) {
  if (!fs.existsSync(path.join(repoRoot, p))) missingFiles.push(p);
}

if (missingFiles.length) {
  console.error('FEATURE_INDEX lists missing files:');
  missingFiles.forEach((p) => console.error(' ', p));
  process.exit(2);
}

console.log(`FEATURE_INDEX path check OK (${listedPaths.size} paths).`);

const gen = spawnSync(
  process.execPath,
  [path.join(__dirname, 'generate-feature-index-barrels.js'), '--check'],
  { encoding: 'utf8' }
);
if (gen.stdout) process.stdout.write(gen.stdout);
if (gen.stderr) process.stderr.write(gen.stderr);
if (gen.status !== 0) process.exit(gen.status || 2);
