import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Accessibility ratchet
 * =====================
 * Stores the CURRENT set of axe violations (keyed by `path|theme|ruleId`) so CI
 * can hard-fail on NEW regressions without a red baseline on pre-existing issues.
 * Shrink the baseline as the migration fixes things.
 *
 * Update mode (`UPDATE_A11Y_BASELINE=1`, run with --workers=1) rewrites the file.
 */
const BASELINE_PATH = join(process.cwd(), 'tests', 'visual', 'a11y-baseline.json');

export const isUpdateMode = !!process.env.UPDATE_A11Y_BASELINE;

export function keyFor(path: string, theme: string, ruleId: string): string {
  return `${path}|${theme}|${ruleId}`;
}

export function loadBaseline(): Set<string> {
  if (!existsSync(BASELINE_PATH)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return new Set<string>(parsed.allowed ?? []);
  } catch {
    return new Set();
  }
}

/** Serial-mode only (UPDATE_A11Y_BASELINE with --workers=1): merge keys into the baseline file. */
export function recordKeys(keys: string[]): void {
  const current = loadBaseline();
  for (const k of keys) current.add(k);
  const sorted = [...current].sort();
  writeFileSync(BASELINE_PATH, JSON.stringify({ allowed: sorted }, null, 2) + '\n');
}
