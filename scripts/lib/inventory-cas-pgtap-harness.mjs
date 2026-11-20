/**
 * Negative-leg validators for inventory CAS pgTAP (reject harness/syntax false positives).
 */

export const PREF_FIX_ANON_EXECUTE_OFFENDERS = [
  'apply_character_inventory_patch(text,text,jsonb)',
  'inventory_patch_bucket_category(text)',
  'inventory_patch_field_clear(jsonb,text)',
  'inventory_row_cas_snapshot(character_inventory)',
].sort();

export const ANON_GATE_NEGATIVE_LABEL =
  'no unlisted public non-trigger functions are EXECUTE-able by anon';

export const MASTER_LWW_NEGATIVE_LABEL =
  'two-tab item edit: bed roll qty 3 must survive concurrent energy edit (CAS on branch)';

/** @param {string} combined */
export function outputContainsPgError(combined) {
  return /\bERROR:\s/m.test(combined) || /^psql:.*\nERROR:/m.test(combined);
}

/** @param {string} inner */
function parseBraceOffenderList(inner) {
  const parts = [];
  let cur = '';
  let inQuote = false;
  for (const ch of inner) {
    if (ch === '"') {
      inQuote = !inQuote;
      cur += ch;
      continue;
    }
    if (ch === ',' && !inQuote) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.map((p) => p.replace(/^"|"$/g, ''));
}

/** @param {string} combined */
export function parseAnonGateOffenders(combined) {
  const blockRe = new RegExp(
    `not ok \\d+ - ${escapeRegExp(ANON_GATE_NEGATIVE_LABEL)}[\\s\\S]*?#\\s+have:\\s*(\\{[^}]+\\})`,
    'm',
  );
  const m = combined.match(blockRe);
  if (!m) return null;
  return parseBraceOffenderList(m[1].slice(1, -1));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sameSortedStringArrays(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/**
 * @param {string} combined psql stdout+stderr from anon execute gate run (must fail TAP)
 * @returns {{ ok: true, reason: 'negative' } | { ok: false, error: string }}
 */
export function validatePreFixCasAnonExecuteNegativeOutput(combined) {
  if (!combined.trim()) {
    return { ok: false, error: 'pre-fix anon gate: empty psql output (harness failure)' };
  }
  if (outputContainsPgError(combined)) {
    return { ok: false, error: 'pre-fix anon gate: psql ERROR (harness failure, not ACL negative)' };
  }
  if (!new RegExp(`not ok \\d+ - ${escapeRegExp(ANON_GATE_NEGATIVE_LABEL)}`).test(combined)) {
    return {
      ok: false,
      error: `pre-fix anon gate: missing not ok for "${ANON_GATE_NEGATIVE_LABEL}"`,
    };
  }
  const offenders = parseAnonGateOffenders(combined);
  if (!offenders?.length) {
    return { ok: false, error: 'pre-fix anon gate: could not parse # have: {…} offender set' };
  }
  if (!sameSortedStringArrays(offenders, PREF_FIX_ANON_EXECUTE_OFFENDERS)) {
    return {
      ok: false,
      error: `pre-fix anon gate: offender set mismatch.\n  have: ${JSON.stringify([...offenders].sort())}\n  want: ${JSON.stringify(PREF_FIX_ANON_EXECUTE_OFFENDERS)}`,
    };
  }
  return { ok: true, reason: 'negative' };
}

/**
 * @param {string} combined psql output from inventory_cas_pgtap_master_negative.sql
 * @returns {{ ok: true, reason: 'negative' } | { ok: false, error: string }}
 */
export function validateMasterLwwNegativeOutput(combined) {
  if (!combined.trim()) {
    return { ok: false, error: 'master LWW negative: empty psql output (harness failure)' };
  }
  if (outputContainsPgError(combined)) {
    return {
      ok: false,
      error: 'master LWW negative: psql ERROR (harness failure, not behavioral negative)',
    };
  }
  const notOkRe = new RegExp(
    `not ok 1 - ${escapeRegExp(MASTER_LWW_NEGATIVE_LABEL)}`,
    'm',
  );
  if (!notOkRe.test(combined)) {
    return {
      ok: false,
      error: `master LWW negative: missing not ok 1 for "${MASTER_LWW_NEGATIVE_LABEL}"`,
    };
  }
  if (!/#\s+want:\s*\(3\)/m.test(combined)) {
    return {
      ok: false,
      error: 'master LWW negative: results_eq must want bed roll quantity (3)',
    };
  }
  if (!/#\s+have:\s+/m.test(combined)) {
    return {
      ok: false,
      error: 'master LWW negative: missing results_eq have: line (expected LWW loss)',
    };
  }
  if (!/# Looks like you failed 1 test of 1/m.test(combined)) {
    return { ok: false, error: 'master LWW negative: expected exactly one failed test' };
  }
  return { ok: true, reason: 'negative' };
}