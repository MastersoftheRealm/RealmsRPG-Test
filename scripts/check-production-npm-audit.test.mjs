import { describe, expect, it } from 'vitest';
import {
  activeIgnoredGhsas,
  assertNpmAuditReport,
  findBlockingHighProductionVulnerabilities,
} from './check-production-npm-audit.mjs';

const PICOMATCH_GHSA = 'GHSA-FC5Q-39XC-VJPF';
const OTHER_GHSA = 'GHSA-0000-0000-0001';

describe('assertNpmAuditReport', () => {
  const validSpawn = {
    status: 0,
    stdout: '',
    stderr: '',
    pid: 1,
    output: ['', ''],
    signal: null,
    error: undefined,
  };

  it('rejects npm audit error JSON (registry unreachable)', () => {
    const report = {
      message: 'request to https://invalid.registry.example failed',
      error: { summary: '', detail: '' },
    };
    expect(() => assertNpmAuditReport(validSpawn, report)).toThrow(/npm audit error:/);
  });

  it('rejects JSON without auditReportVersion or vulnerabilities', () => {
    expect(() => assertNpmAuditReport(validSpawn, { vulnerabilities: {} })).toThrow(
      /missing auditReportVersion/,
    );
    expect(() =>
      assertNpmAuditReport(validSpawn, { auditReportVersion: 2, vulnerabilities: [] }),
    ).toThrow(/missing vulnerabilities object/);
  });

  it('accepts a normal audit report shape', () => {
    const report = assertNpmAuditReport(validSpawn, {
      auditReportVersion: 2,
      vulnerabilities: {},
    });
    expect(report.vulnerabilities).toEqual({});
  });
});

describe('findBlockingHighProductionVulnerabilities', () => {
  it('allows picomatch and its exclusive dependents when only GHSA-fc5q-39xc-vjpf is ignored', () => {
    const vulnerabilities = {
      picomatch: {
        severity: 'high',
        via: [
          {
            source: 1,
            name: 'picomatch',
            url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
            severity: 'high',
          },
        ],
      },
      '@rollup/plugin-commonjs': {
        severity: 'high',
        via: ['picomatch'],
      },
    };
    const ignored = activeIgnoredGhsas(new Set([PICOMATCH_GHSA]));
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities, ignored)).toEqual([]);
  });

  it('still blocks a different high GHSA', () => {
    const vulnerabilities = {
      picomatch: {
        severity: 'high',
        via: [
          {
            url: `https://github.com/advisories/${PICOMATCH_GHSA}`,
            severity: 'high',
          },
        ],
      },
      'some-package': {
        severity: 'high',
        via: [
          {
            url: `https://github.com/advisories/${OTHER_GHSA}`,
            severity: 'high',
          },
        ],
      },
    };
    const ignored = activeIgnoredGhsas(new Set([PICOMATCH_GHSA]));
    expect(findBlockingHighProductionVulnerabilities(vulnerabilities, ignored)).toEqual([
      'some-package',
    ]);
  });
});
