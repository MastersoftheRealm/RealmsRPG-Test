#!/usr/bin/env node
/**
 * CI blocking gate: production deps (`npm audit --omit=dev`) at high+, minus allowlisted GHSAs.
 *
 *   node scripts/check-production-npm-audit.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PRODUCTION_AUDIT_GHSA_EXCEPTIONS } from './lib/production-npm-audit-exceptions.mjs';

const AUDIT_LEVEL = 'high';

/** @param {unknown} entry */
function ghsaFromAdvisoryEntry(entry) {
  if (!entry || typeof entry !== 'object' || typeof entry.url !== 'string') return null;
  const match = entry.url.match(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i);
  return match ? match[0].toUpperCase() : null;
}

/** @param {import('./lib/production-npm-audit-exceptions.mjs').PRODUCTION_AUDIT_GHSA_EXCEPTIONS[number]['expires']} expires */
function assertExceptionsNotExpired(today = new Date()) {
  const errors = [];
  for (const row of PRODUCTION_AUDIT_GHSA_EXCEPTIONS) {
    const end = new Date(`${row.expires}T23:59:59.999Z`);
    if (Number.isNaN(end.getTime())) {
      errors.push(`${row.ghsa}: invalid expires date ${row.expires}`);
      continue;
    }
    if (today > end) {
      errors.push(
        `${row.ghsa}: temporary allowlist expired on ${row.expires}. Remove the entry from scripts/lib/production-npm-audit-exceptions.mjs and fix the dependency (picomatch >= 4.0.8 on npm).`,
      );
    }
  }
  return errors;
}

/**
 * @param {Record<string, { severity?: string, via?: unknown[] }>} vulnerabilities
 * @param {string} pkg
 * @param {Set<string>} activeIgnoredGhsas
 * @param {Set<string>} stack
 */
function packageBlockedByHigh(vulnerabilities, pkg, activeIgnoredGhsas, stack) {
  const vuln = vulnerabilities[pkg];
  if (!vuln || (vuln.severity !== 'high' && vuln.severity !== 'critical')) {
    return false;
  }
  if (stack.has(pkg)) return false;
  stack.add(pkg);

  const directGhsas = new Set();
  const deps = [];
  for (const via of vuln.via ?? []) {
    if (typeof via === 'string') {
      deps.push(via);
      continue;
    }
    const ghsa = ghsaFromAdvisoryEntry(via);
    if (ghsa) directGhsas.add(ghsa);
  }

  if (directGhsas.size > 0) {
    const blocked = [...directGhsas].filter((g) => !activeIgnoredGhsas.has(g));
    stack.delete(pkg);
    return blocked.length > 0;
  }

  if (deps.length === 0) {
    stack.delete(pkg);
    return true;
  }

  const blocked = deps.some((dep) =>
    packageBlockedByHigh(vulnerabilities, dep, activeIgnoredGhsas, stack),
  );
  stack.delete(pkg);
  return blocked;
}

/**
 * @param {Record<string, { severity?: string, via?: unknown[] }>} vulnerabilities
 * @param {Set<string>} activeIgnoredGhsas
 */
export function findBlockingHighProductionVulnerabilities(vulnerabilities, activeIgnoredGhsas) {
  const blocked = [];
  for (const [name, vuln] of Object.entries(vulnerabilities)) {
    if (vuln.severity !== 'high' && vuln.severity !== 'critical') continue;
    if (packageBlockedByHigh(vulnerabilities, name, activeIgnoredGhsas, new Set())) {
      blocked.push(name);
    }
  }
  return blocked.sort();
}

/** @returns {{ vulnerabilities: Record<string, unknown> }} */
export function runNpmProductionAuditJson() {
  const result = spawnSync(
    'npm',
    ['audit', '--json', '--audit-level', AUDIT_LEVEL, '--omit', 'dev'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  const stdout = result.stdout ?? '';
  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    throw new Error(
      `npm audit --json failed to parse (exit ${result.status}): ${(stdout || result.stderr || '').slice(0, 400)}`,
    );
  }
  return report;
}

/** @param {Set<string>} [ignored] */
export function activeIgnoredGhsas(
  ignored = new Set(PRODUCTION_AUDIT_GHSA_EXCEPTIONS.map((row) => row.ghsa.toUpperCase())),
) {
  return new Set([...ignored].map((g) => g.toUpperCase()));
}

export function runProductionNpmAuditGate() {
  const expiryErrors = assertExceptionsNotExpired();
  if (expiryErrors.length > 0) {
    return { ok: false, errors: expiryErrors };
  }

  const ignored = activeIgnoredGhsas();
  const report = runNpmProductionAuditJson();
  const vulnerabilities = report.vulnerabilities ?? {};
  const blocking = findBlockingHighProductionVulnerabilities(vulnerabilities, ignored);

  if (blocking.length > 0) {
    return {
      ok: false,
      errors: [
        `Production npm audit: ${blocking.length} high/critical package(s) outside allowlist: ${blocking.join(', ')}`,
        'Run: npm audit --audit-level=high --omit=dev',
      ],
    };
  }

  const ignoredList = [...ignored].join(', ');
  return {
    ok: true,
    errors: [],
    message: `Production npm audit OK (high+, omit=dev). Temporarily allowlisted GHSA(s): ${ignoredList}.`,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runProductionNpmAuditGate();
  if (!result.ok) {
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log(result.message);
}
