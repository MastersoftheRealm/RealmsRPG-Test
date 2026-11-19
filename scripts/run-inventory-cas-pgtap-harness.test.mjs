import { describe, expect, it } from 'vitest';
import {
  PREF_FIX_ANON_EXECUTE_OFFENDERS,
  validateMasterLwwNegativeOutput,
  validatePreFixCasAnonExecuteNegativeOutput,
} from './lib/inventory-cas-pgtap-harness.mjs';

describe('inventory-cas-pgtap negative harness validators', () => {
  it('rejects pre-fix output that contains psql ERROR:', () => {
    const r = validatePreFixCasAnonExecuteNegativeOutput(
      'psql:foo.sql:50: ERROR:  function bag_eq(text[], text[], unknown) does not exist\n',
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ERROR/);
  });

  it('accepts pre-fix anon gate ACL failure with exact offender set', () => {
    const have = PREF_FIX_ANON_EXECUTE_OFFENDERS.map((name, i) =>
      i === 0 || name.includes('jsonb') ? `"${name}"` : name,
    ).join(',');
    const combined = [
      'not ok 3 - no unlisted public non-trigger functions are EXECUTE-able by anon',
      `#         have: {${have}}`,
      '#         want: {}',
      '# Looks like you failed 1 test of 3',
    ].join('\n');
    const r = validatePreFixCasAnonExecuteNegativeOutput(combined);
    expect(r.ok).toBe(true);
  });

  it('rejects master LWW output with ERROR:', () => {
    const r = validateMasterLwwNegativeOutput('ERROR: syntax error at end of input\n');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ERROR/);
  });

  it('accepts master LWW behavioral not ok', () => {
    const combined = [
      'not ok 1 - two-tab item edit: bed roll qty 3 must survive concurrent energy edit (CAS on branch)',
      '#         have: NULL',
      '#         want: (3)',
      '# Looks like you failed 1 test of 1',
    ].join('\n');
    const r = validateMasterLwwNegativeOutput(combined);
    expect(r.ok).toBe(true);
  });
});