import { describe, expect, it } from 'vitest';
import {
  findGrantViolations,
  isIgnoredSqlGrantCheckPath,
  sqlDefinesCreateTableWithoutGrant,
} from './check-sql-table-grants.mjs';

describe('sqlDefinesCreateTableWithoutGrant', () => {
  it('flags CREATE TABLE without GRANT', () => {
    expect(sqlDefinesCreateTableWithoutGrant('CREATE TABLE public.foo (id int);')).toBe(true);
  });

  it('passes when GRANT is present', () => {
    const sql = `CREATE TABLE public.foo (id int);
GRANT SELECT ON public.foo TO authenticated;`;
    expect(sqlDefinesCreateTableWithoutGrant(sql)).toBe(false);
  });

  it('ignores files with no CREATE TABLE', () => {
    expect(sqlDefinesCreateTableWithoutGrant('ALTER TABLE public.foo ADD COLUMN x int;')).toBe(
      false,
    );
  });
});

describe('isIgnoredSqlGrantCheckPath', () => {
  it('ignores template and schema baselines', () => {
    expect(isIgnoredSqlGrantCheckPath('sql/_TEMPLATE_new_table.sql')).toBe(true);
    expect(isIgnoredSqlGrantCheckPath('sql/schema/0000_baseline_2026-08-13.sql')).toBe(true);
    expect(isIgnoredSqlGrantCheckPath('sql/new-feature.sql')).toBe(false);
  });
});

describe('findGrantViolations', () => {
  it('skips ignored paths', () => {
    expect(
      findGrantViolations(['sql/_TEMPLATE_new_table.sql', 'sql/schema/0000_baseline.sql']),
    ).toEqual([]);
  });
});
