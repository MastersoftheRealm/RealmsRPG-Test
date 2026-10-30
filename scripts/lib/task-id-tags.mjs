/**
 * Task / audit tag patterns for the C4 ratchet (count-only; no auto-fix).
 * Each pattern is measured separately; overlapping text may match multiple patterns.
 */

/** @typedef {{ id: string, label: string, re: RegExp }} TaskIdPattern */

/** @type {TaskIdPattern[]} */
export const TASK_ID_PATTERNS = [
  {
    id: 'taskNumeric',
    label: 'Internal TASK-### references',
    re: /\bTASK-\d+\b/g,
  },
  {
    id: 'clickupLegacy',
    label: 'Legacy ClickUp custom IDs (86e3…)',
    re: /\b86e3[a-z0-9]{4,}\b/gi,
  },
  {
    id: 'clickupCustom',
    label: 'ClickUp custom task IDs (1… lowercase alphanumeric)',
    re: /\b1[a-z][a-z0-9]{8,10}\b/g,
  },
  {
    id: 'devNumeric',
    label: 'DEV-### workflow references',
    re: /\bDEV-\d+\b/g,
  },
  {
    id: 'devVerification',
    label: 'DEV-V-… verification case IDs',
    re: /\bDEV-[A-Z0-9]+(?:-[A-Z0-9]+)+\b/g,
  },
  {
    id: 'adrReference',
    label: 'ADR-#### architecture doc references in code comments',
    re: /\bADR-\d{4}\b/g,
  },
  {
    id: 'auditFinding',
    label: 'Audit finding codes (PREFIX-###, e.g. CROSS-001 / API-003)',
    re: /\b(?:CROSS|API|UI|AUTH|SQL|SEC|DOC|TEST|CI|VTT|PERM|RLS|DEPLOY|LINT|A11Y|MOBILE|COPY|ARCH|DATA|PERF|ROUTE|HOOK|STORE|COMP|TYPE|FEAT|BUG|ADMIN|CODEX|ENC|CHAR|CREATOR|GLR|WORKFLOW|AUDIT|COMMENT|NARR|DEAD)-\d{3}\b/g,
  },
];

const KEEP_IN_SYNC_RE = /keep in sync/gi;

/** Ratchet implementation files (string literals mention the same phrases). */
const TASK_ID_RATCHET_IGNORED = new Set([
  'scripts/check-task-id-ratchet.mjs',
  'scripts/check-test-source-read-ratchet.mjs',
  'scripts/lib/task-id-tags.mjs',
  'scripts/lib/test-source-reads.mjs',
  'scripts/lib/count-ratchet.mjs',
]);

/**
 * Count "keep in sync" only in comment lines (not string literals in checks).
 * @param {string} text
 */
export function countKeepInSyncCommentLines(text) {
  let n = 0;
  for (const line of text.split('\n')) {
    if (!KEEP_IN_SYNC_RE.test(line)) continue;
    KEEP_IN_SYNC_RE.lastIndex = 0;
    const trimmed = line.trim();
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*') ||
      trimmed.includes('— keep in sync') ||
      trimmed.includes('- keep in sync')
    ) {
      n += (line.match(/keep in sync/gi) || []).length;
    }
  }
  return n;
}

/**
 * @param {string} text
 * @returns {{ byPattern: Record<string, number>, total: number, keepInSync: number }}
 */
export function countTaskIdTagsInText(text) {
  /** @type {Record<string, number>} */
  const byPattern = {};
  let total = 0;
  for (const { id, re } of TASK_ID_PATTERNS) {
    const matches = text.match(re);
    const n = matches ? matches.length : 0;
    byPattern[id] = n;
    total += n;
  }
  const keepInSync = countKeepInSyncCommentLines(text);
  return { byPattern, total, keepInSync };
}

/**
 * @param {string} relPath posix path under repo root
 */
export function isTaskIdRatchetScopeFile(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (TASK_ID_RATCHET_IGNORED.has(normalized)) return false;
  if (normalized.endsWith('.md')) return false;
  if (!/^(src|scripts|sql)\//.test(normalized)) return false;
  if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(normalized)) return false;
  if (normalized.endsWith('.test.mjs')) return false;
  return /\.(ts|tsx|js|jsx|mjs|cjs|sql)$/.test(normalized);
}

/**
 * Per-pattern counts for one file (used for baseline entries).
 * @param {string} text
 * @returns {Record<string, number>}
 */
export function perPatternCounts(text) {
  const { byPattern, keepInSync } = countTaskIdTagsInText(text);
  /** @type {Record<string, number>} */
  const out = {};
  for (const [id, n] of Object.entries(byPattern)) {
    if (n > 0) out[id] = n;
  }
  if (keepInSync > 0) out.keepInSync = keepInSync;
  return out;
}

/**
 * @param {Record<string, number>} counts
 */
export function totalFromPerPattern(counts) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

/**
 * Compare measured per-file counts to baseline.
 * @param {Record<string, Record<string, number>>} measured relPath -> pattern -> count
 * @param {Record<string, Record<string, number>>} baseline
 */
export function diffTaskIdRatchet(measured, baseline) {
  /** @type {string[]} */
  const errors = [];
  const allPaths = new Set([...Object.keys(measured), ...Object.keys(baseline)]);

  for (const relPath of [...allPaths].sort()) {
    const cur = measured[relPath] || {};
    const baseEntry = baseline[relPath];
    const isNewFile = baseEntry === undefined;

    if (isNewFile) {
      const total = totalFromPerPattern(cur);
      if (total > 0) {
        errors.push(
          `${relPath}: new file with ${total} task/audit tag(s). Do not add narrating task IDs to production code; remove them before merging.`,
        );
      }
      continue;
    }

    const base = baseEntry || {};
    const patternIds = new Set([...Object.keys(cur), ...Object.keys(base)]);

    for (const patternId of patternIds) {
      const c = cur[patternId] || 0;
      const b = base[patternId] || 0;
      if (c > b) {
        errors.push(
          `${relPath}: ${patternId} ${c} > baseline ${b} (+${c - b}). Remove or relocate task/audit tags, then run npm run tasks:task-id-ratchet:update to lower the baseline.`,
        );
      }
    }
  }

  return errors;
}

export function formatTaskIdRatchetFailure(errors) {
  return [
    'Task/audit tag ratchet failed — counts must not increase (C4 / ClickUp 1dfe8wf2ga8).',
    'Do not add TASK-###, ClickUp IDs, DEV-###, ADR-#### in comments, or "keep in sync" notes to src/, scripts/, or sql/.',
    'When you remove tags in a cleanup PR, run: npm run tasks:task-id-ratchet:update',
    '',
    ...errors.map((e) => `  • ${e}`),
  ].join('\n');
}
