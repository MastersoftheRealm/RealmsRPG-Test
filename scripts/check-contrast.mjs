#!/usr/bin/env node
/**
 * Design-token contrast checker (WCAG 2.1 AA)
 * ===========================================
 * Parses semantic color tokens out of `src/app/globals.css`, resolves each token's
 * concrete color in BOTH the light and dark themes (following `var(--x)` indirection),
 * and asserts that every documented foreground/background pairing meets the required
 * contrast ratio (4.5:1 normal text, 3:1 large text / UI).
 *
 * Why this exists: the UI audit could only inspect code statically. This script gives
 * us measured, deterministic contrast feedback in CI without manual eyeballing — the
 * primary mitigation for "no human visual QA" on the dark theme in particular.
 *
 * Ratchet behaviour: the CURRENT (pre-migration) set of failures is recorded in
 * `scripts/contrast-baseline.json`. The build fails only when a NEW failure appears
 * (a regression), so we can hard-gate immediately without a red baseline on legacy
 * tokens. As the token re-architecture (Phase 0) lands, run with `--update-baseline`
 * to shrink the accepted-failure list toward zero.
 *
 * Usage:
 *   node scripts/check-contrast.mjs                 # check (CI)
 *   node scripts/check-contrast.mjs --update-baseline
 *   node scripts/check-contrast.mjs --report        # print full table, never fail
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSS_PATH = join(ROOT, 'src', 'app', 'globals.css');
const BASELINE_PATH = join(__dirname, 'contrast-baseline.json');

const args = new Set(process.argv.slice(2));
const UPDATE_BASELINE = args.has('--update-baseline');
const REPORT_ONLY = args.has('--report');

/* --------------------------------------------------------------------------
 * Token extraction
 * ------------------------------------------------------------------------ */

/** Find the index where `selector` is immediately followed (after whitespace) by `{`. */
function findSelectorBrace(css, selector) {
  let from = 0;
  for (;;) {
    const start = css.indexOf(selector, from);
    if (start === -1) return -1;
    let j = start + selector.length;
    while (j < css.length && /\s/.test(css[j])) j++;
    if (css[j] === '{') return j;
    from = start + selector.length;
  }
}

/** Extract `--name: value;` declarations from inside the first `selector { ... }` rule. */
function extractBlock(css, selector) {
  const braceStart = findSelectorBrace(css, selector);
  if (braceStart === -1) return {};
  let depth = 0;
  let i = braceStart;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = css.slice(braceStart + 1, i);
  const out = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body))) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function buildThemes(css) {
  const theme = extractBlock(css, '@theme');
  const root = extractBlock(css, ':root');
  const dark = extractBlock(css, '.dark');
  // Light = @theme overlaid with :root legacy aliases.
  const light = { ...theme, ...root };
  // Dark = light overlaid with .dark overrides.
  const darkMap = { ...light, ...dark };
  return { light, dark: darkMap };
}

/* --------------------------------------------------------------------------
 * Color resolution + contrast math
 * ------------------------------------------------------------------------ */

function resolveVar(value, map, seen = new Set()) {
  if (!value) return null;
  let v = value.trim();
  // Strip Tailwind/legacy fallbacks like `var(--x, #fff)` -> follow --x, else fallback.
  const varMatch = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (varMatch) {
    const ref = varMatch[1];
    if (seen.has(ref)) return varMatch[2] ? resolveVar(varMatch[2], map, seen) : null;
    seen.add(ref);
    if (map[ref] != null) return resolveVar(map[ref], map, seen);
    if (varMatch[2]) return resolveVar(varMatch[2], map, seen);
    return null;
  }
  return v;
}

function parseColor(input) {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  // Skip gradients / non-solid values.
  if (v.includes('gradient') || v.includes('url(')) return null;

  // #rgb / #rgba / #rrggbb / #rrggbbaa
  let m = v.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('') + 'ff';
    else if (hex.length === 4) hex = hex.split('').map((c) => c + c).join('');
    else if (hex.length === 6) hex = hex + 'ff';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = parseInt(hex.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }

  // rgb()/rgba()
  m = v.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[,/\s]+/).filter(Boolean);
    const r = parseFloat(parts[0]);
    const g = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    const a = parts[3] != null ? parseFloat(parts[3]) : 1;
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b, a };
  }
  return null;
}

/** Composite a (possibly translucent) color over an opaque backdrop. */
function flatten(color, backdrop) {
  if (color.a >= 1) return color;
  const a = color.a;
  return {
    r: Math.round(color.r * a + backdrop.r * (1 - a)),
    g: Math.round(color.g * a + backdrop.g * (1 - a)),
    b: Math.round(color.b * a + backdrop.b * (1 - a)),
    a: 1,
  };
}

function relLuminance({ r, g, b }) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* --------------------------------------------------------------------------
 * Pairings to verify (semantic intent). minRatio: 4.5 normal text, 3 large/UI.
 * Tokens are referenced by their CSS custom-property name. Pairs that reference
 * a token which does not exist (yet) are reported as SKIP, not FAIL.
 * ------------------------------------------------------------------------ */
const PAIRS = [
  // Core text on core surfaces
  ['--color-text-primary', '--color-surface', 4.5, 'Body text on card surface'],
  ['--color-text-primary', '--color-background', 4.5, 'Body text on app background'],
  ['--color-text-secondary', '--color-surface', 4.5, 'Secondary text on surface'],
  ['--color-text-muted', '--color-surface', 4.5, 'Muted text on surface'],
  ['--color-text-muted', '--color-surface-alt', 4.5, 'Muted text on alt surface'],
  ['--color-title', '--color-surface', 4.5, 'Title text on surface'],
  // Primary button — theme-aware bg token stays dark enough for white in both themes
  ['--color-primary-foreground', '--color-primary-button', 4.5, 'Button label on primary'],
  ['--color-primary-fg', '--color-surface', 4.5, 'Primary fg on surface'],
  ['--color-primary-link-fg', '--color-surface', 4.5, 'Primary link on surface'],
  ['--color-primary-outline-fg', '--color-surface', 4.5, 'Primary outline label on surface'],
  ['--color-primary-chip-fg', '--color-primary-chip-bg', 4.5, 'Primary chip label'],
  ['--color-primary-subtle-fg', '--color-primary-subtle-bg', 4.5, 'Primary subtle label on subtle bg'],
  ['--color-primary-foreground', '--color-danger-button', 4.5, 'Danger button label'],
  // Status text on status-light backgrounds (theme-aware foreground tokens)
  ['--color-success-fg', '--color-success-light', 4.5, 'Success text on success bg'],
  ['--color-danger-fg', '--color-danger-light', 4.5, 'Danger text on danger bg'],
  ['--color-warning-fg', '--color-warning-light', 4.5, 'Warning text on warning bg'],
  ['--color-info-fg', '--color-info-light', 4.5, 'Info text on info bg'],
  // Category chips (fg/bg/border tokens)
  ['--color-category-action-text', '--color-category-action', 4.5, 'Action chip'],
  ['--color-category-activation-text', '--color-category-activation', 4.5, 'Activation chip'],
  ['--color-category-area-text', '--color-category-area', 4.5, 'Area chip'],
  ['--color-category-duration-text', '--color-category-duration', 4.5, 'Duration chip'],
  ['--color-category-target-text', '--color-category-target', 4.5, 'Target chip'],
  ['--color-category-special-text', '--color-category-special', 4.5, 'Special chip'],
  ['--color-category-restriction-text', '--color-category-restriction', 4.5, 'Restriction chip'],
  // Game semantic tokens (theme-aware archetype foreground tokens)
  ['--color-power-fg', '--color-power-light', 4.5, 'Power text on power bg'],
  ['--color-martial-fg', '--color-martial-light', 4.5, 'Martial text on martial bg'],
  ['--color-tp-text', '--color-tp-light', 4.5, 'TP cost text on TP bg'],
  ['--color-ip-text', '--color-ip-light', 4.5, 'IP cost text on IP bg'],
  ['--color-currency-text', '--color-currency-light', 4.5, 'Currency text on currency bg'],
  ['--color-health-text', '--color-health-light', 4.5, 'Health text on health bg'],
  ['--color-energy-text', '--color-energy-light', 4.5, 'Energy text on energy bg'],
  // Combatant chips (encounter tools)
  ['--color-ally-text', '--color-ally-light', 4.5, 'Ally chip'],
  ['--color-enemy-text', '--color-enemy-light', 4.5, 'Enemy chip'],
  ['--color-companion-text', '--color-companion-light', 4.5, 'Companion chip'],
];

function evaluate(theme, map) {
  const results = [];
  // Backdrop used to flatten translucent values: the app background for that theme.
  const backdropHex = resolveVar(map['--color-background'] || map['--background'] || '#ffffff', map);
  const backdrop = parseColor(backdropHex) || { r: 255, g: 255, b: 255, a: 1 };

  for (const [fgName, bgName, minRatio, label] of PAIRS) {
    const fgRaw = resolveVar(map[fgName], map);
    const bgRaw = resolveVar(map[bgName], map);
    const fg = parseColor(fgRaw);
    const bg = parseColor(bgRaw);
    if (!fg || !bg) {
      results.push({ theme, label, fgName, bgName, status: 'SKIP', ratio: null, minRatio });
      continue;
    }
    const bgFlat = flatten(bg, backdrop);
    const fgFlat = flatten(fg, bgFlat);
    const ratio = contrastRatio(fgFlat, bgFlat);
    results.push({
      theme,
      label,
      fgName,
      bgName,
      status: ratio >= minRatio ? 'PASS' : 'FAIL',
      ratio: Math.round(ratio * 100) / 100,
      minRatio,
    });
  }
  return results;
}

/* --------------------------------------------------------------------------
 * Run
 * ------------------------------------------------------------------------ */
const css = readFileSync(CSS_PATH, 'utf8');
const { light, dark } = buildThemes(css);
const results = [...evaluate('light', light), ...evaluate('dark', dark)];

const keyOf = (r) => `${r.theme}:${r.fgName} on ${r.bgName}`;
const failures = results.filter((r) => r.status === 'FAIL');
const failKeys = failures.map(keyOf).sort();

if (REPORT_ONLY) {
  const fmt = (r) =>
    `  [${r.status.padEnd(4)}] ${r.theme.padEnd(5)} ${String(r.ratio ?? '-').padStart(5)} (min ${r.minRatio})  ${r.label}  (${r.fgName} on ${r.bgName})`;
  console.log('\nContrast report (all pairs):');
  for (const r of results) console.log(fmt(r));
  console.log(`\n${failures.length} FAIL, ${results.filter((r) => r.status === 'SKIP').length} SKIP, ${results.filter((r) => r.status === 'PASS').length} PASS\n`);
  process.exit(0);
}

if (UPDATE_BASELINE) {
  writeFileSync(BASELINE_PATH, JSON.stringify({ allowedFailures: failKeys }, null, 2) + '\n');
  console.log(`Updated contrast baseline: ${failKeys.length} accepted failure(s) recorded.`);
  process.exit(0);
}

const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).allowedFailures || []
  : [];
const baselineSet = new Set(baseline);
const newFailures = failures.filter((r) => !baselineSet.has(keyOf(r)));
const fixed = baseline.filter((k) => !failKeys.includes(k));

if (fixed.length) {
  console.log(`\nNice — ${fixed.length} baseline contrast failure(s) now PASS. Run --update-baseline to lock them in:`);
  for (const k of fixed) console.log(`  + ${k}`);
}

if (newFailures.length) {
  console.error(`\nContrast regression: ${newFailures.length} NEW failing pair(s) (not in baseline):`);
  for (const r of newFailures) {
    console.error(`  [FAIL] ${r.theme} ${r.ratio} (min ${r.minRatio})  ${r.label}  (${r.fgName} on ${r.bgName})`);
  }
  console.error('\nFix the contrast or, if intentional, run: node scripts/check-contrast.mjs --update-baseline\n');
  process.exit(1);
}

console.log(`Contrast check passed. ${failures.length} known/accepted failure(s) in baseline, no new regressions.`);
process.exit(0);
