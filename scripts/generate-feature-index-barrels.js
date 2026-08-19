#!/usr/bin/env node
/**
 * Generate FEATURE_INDEX_BARRELS.generated.md from patterns/ui/hooks/services barrels.
 * Curated FEATURE_INDEX.md stays human-authored; this file is the machine-checked inventory.
 *
 * Usage:
 *   node scripts/generate-feature-index-barrels.js          # write file
 *   node scripts/generate-feature-index-barrels.js --check  # exit 2 if stale
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outRel = 'src/docs/ai/FEATURE_INDEX_BARRELS.generated.md';
const outPath = path.join(repoRoot, outRel);
const barrels = [
  'src/components/patterns/index.ts',
  'src/components/ui/index.ts',
  'src/hooks/index.ts',
  'src/services/index.ts',
];

function parseBarrelExports(fileRel) {
  const abs = path.join(repoRoot, fileRel);
  const text = fs.readFileSync(abs, 'utf8');
  const names = new Set();
  let m;
  const exportNamed = /export\s*\{([^}]+)\}/g;
  while ((m = exportNamed.exec(text))) {
    for (const part of m[1].split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name && /^[A-Za-z_]/.test(name)) names.add(name);
    }
  }
  const exportDecl =
    /export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+([A-Za-z_][\w]*)/g;
  while ((m = exportDecl.exec(text))) names.add(m[1]);
  return [...names].sort((a, b) => a.localeCompare(b));
}

const lines = [
  '# FEATURE_INDEX — barrel inventory (generated)',
  '',
  '> **Do not edit by hand.** Run `npm run tasks:generate-index` after changing barrel exports.',
  '> Curated narrative map: [`FEATURE_INDEX.md`](FEATURE_INDEX.md).',
  '',
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  '',
];

for (const barrel of barrels) {
  const names = parseBarrelExports(barrel);
  lines.push(`## \`${barrel}\``, '', ...names.map((n) => `- ${n}`), '');
}

const next = `${lines.join('\n').trimEnd()}\n`;
const check = process.argv.includes('--check');

if (check) {
  if (!fs.existsSync(outPath)) {
    console.error(`Missing ${outRel}. Run: npm run tasks:generate-index`);
    process.exit(2);
  }
  const prev = fs.readFileSync(outPath, 'utf8');
  // Ignore the Generated: date line when comparing
  const stripDate = (s) => s.replace(/^Generated:.*$/m, 'Generated: <date>');
  if (stripDate(prev) !== stripDate(next)) {
    console.error(`${outRel} is stale. Run: npm run tasks:generate-index`);
    process.exit(2);
  }
  console.log(`${outRel} is up to date.`);
  process.exit(0);
}

fs.writeFileSync(outPath, next);
console.log(`Wrote ${outRel} (${next.split('\n').length} lines).`);
