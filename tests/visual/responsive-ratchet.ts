import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Responsive-layout ratchet (ADR-0023 / TASK-831).
 *
 * Stores per-route / per-width counts for overflow, clipping, and fixed-element
 * collisions. CI fails only when a count *increases* so known defects (TASK-826
 * etc.) stay recorded until they are fixed, then drop out of the baseline.
 *
 * Update: `UPDATE_RESPONSIVE_BASELINE=1` with `--workers=1`.
 */
const BASELINE_PATH = join(process.cwd(), 'tests', 'visual', 'responsive-baseline.json');

export const isUpdateMode = !!process.env.UPDATE_RESPONSIVE_BASELINE;

export type ResponsiveMetric =
  | 'horizontalPageScroll'
  | 'overflowRight'
  | 'textClippedNoEllipsis'
  | 'fixedOverlaps';

export type ResponsiveCounts = Record<ResponsiveMetric, number>;

export function keyFor(path: string, width: number, metric: ResponsiveMetric): string {
  return `${path}|${width}|${metric}`;
}

export function loadBaseline(): Record<string, number> {
  if (!existsSync(BASELINE_PATH)) return {};
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as {
      allowed?: Record<string, number>;
    };
    return parsed.allowed ?? {};
  } catch {
    return {};
  }
}

/** Serial-mode only (`--workers=1`): merge recorded counts into the baseline. */
export function recordCounts(counts: Record<string, number>): void {
  const current = loadBaseline();
  for (const [k, v] of Object.entries(counts)) current[k] = v;
  const sorted = Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE_PATH, JSON.stringify({ allowed: sorted }, null, 2) + '\n');
}
