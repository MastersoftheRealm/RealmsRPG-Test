import { afterEach, describe, expect, it, vi } from 'vitest';

const spawnSyncMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  spawnSync: spawnSyncMock,
}));

import {
  assertNpmAuditReport,
  evaluateProductionNpmAuditReport,
  evaluateProductionVulnerabilities,
  findBlockingHighProductionVulnerabilities,
  runProductionNpmAuditGate,
} from './check-production-npm-audit.mjs';

const GHSA_A = 'GHSA-AAAA-AAAA-AAAA';
const GHSA_B = 'GHSA-BBBB-BBBB-BBBB';

const validSpawn = {
  status: 0,
  stdout: '',
  stderr: '',
  pid: 1,
  output: ['', ''],
  signal: null,
  error: undefined,
};

/** @param {import('node:child_process').SpawnSyncReturns<string>} result */
function gateFromParsedReport(result, report) {
  return evaluateProductionNpmAuditReport(result, report);
}

describe('evaluateProductionNpmAuditReport (full gate through JSON)', () => {
  it('rejects npm audit error JSON', () => {
    const result = gateFromParsedReport(validSpawn, {
      message: 'request to https://invalid.registry.example failed',
      error: { summary: '', detail: '' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/npm audit error:/);
  });

  it('rejects empty parsed report', () => {
    const emptySpawn = { ...validSpawn, status: 1, stdout: '', stderr: '' };
    const result = gateFromParsedReport(emptySpawn, null);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/invalid JSON/);
  });

  it('rejects JSON missing auditReportVersion', () => {
    const result = gateFromParsedReport(validSpawn, { vulnerabilities: {} });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/missing auditReportVersion/);
  });

  it('rejects JSON missing vulnerabilities object', () => {
    const result = gateFromParsedReport(validSpawn, {
      auditReportVersion: 2,
      vulnerabilities: [],
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/missing vulnerabilities object/);
  });

  it('passes a clean high+ production report', () => {
    const result = gateFromParsedReport(validSpawn, {
      auditReportVersion: 2,
      vulnerabilities: {
        lodash: {
          severity: 'moderate',
          via: [{ url: 'https://github.com/advisories/GHSA-xxxx', severity: 'moderate' }],
        },
      },
    });
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Production npm audit OK/);
    expect(result.message).not.toMatch(/allowlist/i);
  });
});

describe('assertNpmAuditReport', () => {
  it('accepts a normal audit report shape', () => {
    const report = assertNpmAuditReport(validSpawn, {
      auditReportVersion: 2,
      vulnerabilities: {},
    });
    expect(report.vulnerabilities).toEqual({});
  });
});

describe('findBlockingHighProductionVulnerabilities', () => {
  it('blocks when the same package carries two high/critical GHSAs (each advisory judged)', () => {
    const vulnerabilities = {
      'vuln-pkg': {
        severity: 'high',
        via: [
          {
            url: `https://github.com/advisories/${GHSA_A}`,
            severity: 'high',
          },
          {
            url: `https://github.com/advisories/${GHSA_B}`,
            severity: 'critical',
          },
        ],
      },
    };
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities)).toEqual(['vuln-pkg']);
  });

  it('blocks on a high/critical advisory without a GHSA URL alongside a allowlisted-style GHSA entry', () => {
    const vulnerabilities = {
      'vuln-pkg': {
        severity: 'high',
        via: [
          {
            url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
            severity: 'high',
          },
          {
            severity: 'critical',
            title: 'second advisory without url',
          },
        ],
      },
    };
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities)).toEqual(['vuln-pkg']);
  });

  it('still evaluates transitive deps when direct GHSAs exist on the package', () => {
    const vulnerabilities = {
      leaf: {
        severity: 'high',
        via: [
          {
            url: `https://github.com/advisories/${GHSA_A}`,
            severity: 'high',
          },
        ],
      },
      parent: {
        severity: 'high',
        via: [
          {
            url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
            severity: 'high',
          },
          'leaf',
        ],
      },
    };
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities)).toEqual(['leaf', 'parent']);
  });

  it('fails when a via string names a dependency missing from the report', () => {
    const vulnerabilities = {
      parent: {
        severity: 'high',
        via: ['missing-child'],
      },
    };
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities)).toEqual(['parent']);
  });

  it('fails on unknown non-object via entries on a high package', () => {
    const vulnerabilities = {
      broken: {
        severity: 'high',
        via: [null, 42],
      },
    };
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities)).toEqual(['broken']);
  });

  it('blocks a standalone high package with a different GHSA', () => {
    const vulnerabilities = {
      'some-package': {
        severity: 'high',
        via: [
          {
            url: `https://github.com/advisories/${GHSA_B}`,
            severity: 'high',
          },
        ],
      },
    };
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities)).toEqual(['some-package']);
  });
});

describe('evaluateProductionVulnerabilities', () => {
  it('returns structured failure when blocking packages exist', () => {
    const result = evaluateProductionVulnerabilities({
      bad: {
        severity: 'critical',
        via: [{ url: `https://github.com/advisories/${GHSA_A}`, severity: 'critical' }],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/high\/critical package\(s\)/);
    expect(result.errors[0]).toContain('bad');
  });
});

describe('runProductionNpmAuditGate with mocked npm', () => {
  afterEach(() => {
    spawnSyncMock.mockReset();
  });

  it('fails when npm spawn returns unparseable output', () => {
    spawnSyncMock.mockReturnValue({
      status: 1,
      stdout: '<<garbage>>',
      stderr: '',
      output: ['<<garbage>>', ''],
      pid: 1,
      signal: null,
      error: undefined,
    });
    const result = runProductionNpmAuditGate();
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/failed to parse/);
  });

  it('fails when npm spawn returns empty stdout', () => {
    spawnSyncMock.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: '',
      output: ['', ''],
      pid: 1,
      signal: null,
      error: undefined,
    });
    const result = runProductionNpmAuditGate();
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/failed to parse/);
  });

  it('passes when mocked npm returns a clean audit report', () => {
    spawnSyncMock.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ auditReportVersion: 2, vulnerabilities: {} }),
      stderr: '',
      output: ['', ''],
      pid: 1,
      signal: null,
      error: undefined,
    });
    const result = runProductionNpmAuditGate();
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Production npm audit OK/);
  });

  it('fails when mocked npm returns audit JSON with a blocking vulnerability', () => {
    spawnSyncMock.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        auditReportVersion: 2,
        vulnerabilities: {
          evil: {
            severity: 'high',
            via: [
              {
                url: `https://github.com/advisories/${GHSA_A}`,
                severity: 'high',
              },
            ],
          },
        },
      }),
      stderr: '',
      output: ['', ''],
      pid: 1,
      signal: null,
      error: undefined,
    });
    const result = runProductionNpmAuditGate();
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('evil');
  });

  it('fails when mocked npm returns audit error JSON', () => {
    spawnSyncMock.mockReturnValue({
      status: 1,
      stdout: JSON.stringify({
        error: { summary: 'Registry down', detail: '' },
        message: 'Registry down',
      }),
      stderr: '',
      output: ['', ''],
      pid: 1,
      signal: null,
      error: undefined,
    });
    const result = runProductionNpmAuditGate();
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/npm audit error:/);
  });
});
