#!/usr/bin/env node
/**
 * CI blocking gate: production deps (`npm audit --omit=dev`) at high+.
 *
 *   node scripts/check-production-npm-audit.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AUDIT_LEVEL = 'high';

/** @param {unknown} entry */
function ghsaFromAdvisoryEntry(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.url !== 'string') return null;
  const match = entry.url.match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i);
  return match ? match[0].toUpperCase() : null;
}

/** @param {unknown} entry */
function advisoryIsHighOrCritical(entry) {
  return (
    !!entry &&
    typeof entry === 'object' &&
    /** @type {{ severity?: string }} */ ((entry).severity === 'high' ||
      /** @type {{ severity?: string }} */ (entry).severity === 'critical')
  );
}

/**
 * @param {Record<string, { severity?: string, via?: unknown[] }>} vulnerabilities
 * @param {string} pkg
 * @param {Set<string>} stack
 */
function packageBlockedByHigh(vulnerabilities, pkg, stack) {
  if (stack.has(pkg)) return false;

  const vuln = vulnerabilities[pkg];
  if (!vuln) {
    return true;
  }
  if (vuln.severity !== 'high' && vuln.severity !== 'critical') {
    return false;
  }

  stack.add(pkg);

  let blockedByDirectAdvisory = false;
  const deps = [];
  for (const via of vuln.via ?? []) {
    if (typeof via === 'string') {
      deps.push(via);
      continue;
    }
    if (!via || typeof via !== 'object') {
      blockedByDirectAdvisory = true;
      continue;
    }
    const ghsa = ghsaFromAdvisoryEntry(via);
    if (ghsa) {
      if (advisoryIsHighOrCritical(via)) {
        blockedByDirectAdvisory = true;
      }
      continue;
    }
    if (advisoryIsHighOrCritical(via)) {
      blockedByDirectAdvisory = true;
    }
  }

  const blockedByDeps =
    deps.length > 0 && deps.some((dep) => packageBlockedByHigh(vulnerabilities, dep, stack));

  const blocked =
    blockedByDirectAdvisory ||
    blockedByDeps ||
    (deps.length === 0 && (vuln.via ?? []).length === 0);

  stack.delete(pkg);
  return blocked;
}

/**
 * @param {Record<string, { severity?: string, via?: unknown[] }>} vulnerabilities
 */
export function findBlockingHighProductionVulnerabilities(vulnerabilities) {
  const blocked = [];
  for (const [name, vuln] of Object.entries(vulnerabilities)) {
    if (vuln.severity !== 'high' && vuln.severity !== 'critical') continue;
    if (packageBlockedByHigh(vulnerabilities, name, new Set())) {
      blocked.push(name);
    }
  }
  return blocked.sort();
}

/**
 * @param {import('node:child_process').SpawnSyncReturns<string>} result
 * @param {unknown} report
 */
export function assertNpmAuditReport(result, report) {
  if (result.error) {
    throw new Error(`npm audit failed to run: ${result.error.message}`);
  }

  if (!report || typeof report !== 'object') {
    const snippet = (result.stdout || result.stderr || '').trim().slice(0, 400);
    throw new Error(
      `npm audit returned invalid JSON (exit ${result.status ?? '?'}): ${snippet || '(empty output)'}`,
    );
  }

  const payload = /** @type {Record<string, unknown>} */ (report);
  if (payload.error) {
    const errObj =
      typeof payload.error === 'object' && payload.error
        ? /** @type {{ summary?: string, detail?: string }} */ (payload.error)
        : {};
    const message =
      (typeof payload.message === 'string' && payload.message) ||
      errObj.summary ||
      errObj.detail ||
      'npm audit reported an error';
    throw new Error(`npm audit error: ${message}`);
  }

  if (typeof payload.auditReportVersion !== 'number') {
    const snippet = (result.stdout || result.stderr || '').trim().slice(0, 400);
    throw new Error(
      `npm audit JSON missing auditReportVersion (exit ${result.status ?? '?'}): ${snippet || '(empty output)'}`,
    );
  }

  if (
    !payload.vulnerabilities ||
    typeof payload.vulnerabilities !== 'object' ||
    Array.isArray(payload.vulnerabilities)
  ) {
    throw new Error('npm audit JSON missing vulnerabilities object');
  }

  return /** @type {{ vulnerabilities: Record<string, unknown> }} */ (payload);
}

/** @returns {{ vulnerabilities: Record<string, unknown> }} */
export function runNpmProductionAuditJson() {
  const result = spawnSync(
    'npm',
    ['audit', '--json', '--audit-level', AUDIT_LEVEL, '--omit', 'dev'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  const stdout = result.stdout ?? '';
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(
      `npm audit --json failed to parse (exit ${result.status ?? '?'}): ${(stdout || result.stderr || '').trim().slice(0, 400) || '(empty output)'}`,
    );
  }
  return assertNpmAuditReport(result, parsed);
}

/**
 * @param {import('node:child_process').SpawnSyncReturns<string>} auditResult
 * @param {unknown} parsedReport
 */
/**
 * @param {Record<string, { severity?: string, via?: unknown[] }>} vulnerabilities
 */
export function evaluateProductionVulnerabilities(vulnerabilities) {
  const blocking = findBlockingHighProductionVulnerabilities(vulnerabilities);

  if (blocking.length > 0) {
    return {
      ok: false,
      errors: [
        `Production npm audit: ${blocking.length} high/critical package(s): ${blocking.join(', ')}`,
        'Run: npm audit --audit-level=high --omit=dev',
      ],
    };
  }

  return {
    ok: true,
    errors: [],
    message: 'Production npm audit OK (high+, omit=dev).',
  };
}

/**
 * @param {import('node:child_process').SpawnSyncReturns<string>} auditResult
 * @param {unknown} parsedReport
 */
export function evaluateProductionNpmAuditReport(auditResult, parsedReport) {
  let report;
  try {
    report = assertNpmAuditReport(auditResult, parsedReport);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [msg] };
  }

  return evaluateProductionVulnerabilities(
    /** @type {Record<string, { severity?: string, via?: unknown[] }>} */ (report.vulnerabilities),
  );
}

export function runProductionNpmAuditGate() {
  try {
    const report = runNpmProductionAuditJson();
    return evaluateProductionVulnerabilities(
      /** @type {Record<string, { severity?: string, via?: unknown[] }>} */ (
        report.vulnerabilities
      ),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [msg] };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runProductionNpmAuditGate();
  if (!result.ok) {
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log(result.message);
}
