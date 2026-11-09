import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  changedFilesDiffArgs,
  findCreateTableSetupViolations,
  findGrantViolations,
  isIgnoredSqlGrantCheckPath,
  resolveBaseRef,
  sqlDefinesCreateTableWithoutGrant,
} from './check-sql-table-grants.mjs';

const scriptPath = path.join(process.cwd(), 'scripts/check-sql-table-grants.mjs');

function compliantPublicTableSql(table = 'public.foo') {
  return `CREATE TABLE ${table} (id int);
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own" ON ${table} FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO service_role;`;
}

describe('word-only GRANT gap (CONFIG-017 / TESTS3-010)', () => {
  const partialGrantOnly = `CREATE TABLE public.foo (id int);
GRANT SELECT ON public.foo TO authenticated;`;

  it('legacy word-only check incorrectly treated any GRANT as sufficient', () => {
    const code = partialGrantOnly.replace(/\bgrant\b/i, 'grant');
    const legacyWouldPass = (() => {
      const stripped = code
        .replace(/--[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .toLowerCase();
      return /\bcreate\s+table\b/.test(stripped) && /\bgrant\b/.test(stripped);
    })();
    expect(legacyWouldPass).toBe(true);
    expect(findCreateTableSetupViolations(partialGrantOnly).length).toBeGreaterThan(0);
    expect(sqlDefinesCreateTableWithoutGrant(partialGrantOnly)).toBe(true);
  });

  it('passes when the file matches sql/_TEMPLATE_new_table.sql requirements', () => {
    expect(findCreateTableSetupViolations(compliantPublicTableSql())).toEqual([]);
    expect(sqlDefinesCreateTableWithoutGrant(compliantPublicTableSql())).toBe(false);
  });
});

describe('findCreateTableSetupViolations', () => {
  it('flags CREATE TABLE without RLS, policies, or grants', () => {
    expect(sqlDefinesCreateTableWithoutGrant('CREATE TABLE public.foo (id int);')).toBe(true);
    expect(findCreateTableSetupViolations('CREATE TABLE public.foo (id int);')).toEqual(
      expect.arrayContaining([
        'public.foo: missing ENABLE ROW LEVEL SECURITY in the same file',
        'public.foo: missing CREATE POLICY in the same file',
        expect.stringMatching(/GRANT missing SELECT, INSERT, UPDATE, DELETE TO authenticated/),
        expect.stringMatching(/GRANT missing SELECT, INSERT, UPDATE, DELETE TO service_role/),
      ]),
    );
  });

  it('passes when RLS, policy, and full grants are present', () => {
    expect(sqlDefinesCreateTableWithoutGrant(compliantPublicTableSql())).toBe(false);
  });

  it('ignores files with no CREATE TABLE', () => {
    expect(sqlDefinesCreateTableWithoutGrant('ALTER TABLE public.foo ADD COLUMN x int;')).toBe(
      false,
    );
  });

  it('handles CREATE TABLE IF NOT EXISTS, mixed case, and schema-qualified names', () => {
    expect(
      sqlDefinesCreateTableWithoutGrant('create table if not exists public.foo (id int);'),
    ).toBe(true);
    expect(
      sqlDefinesCreateTableWithoutGrant('CrEaTe TaBlE If NoT eXiStS myschema.bar (id int);'),
    ).toBe(true);
    const quotedItems = `CREATE TABLE IF NOT EXISTS "public"."Items" (id int);
ALTER TABLE "public"."Items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON "public"."Items" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."Items" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."Items" TO service_role;`;
    expect(sqlDefinesCreateTableWithoutGrant(quotedItems)).toBe(false);
  });

  it('does not treat CREATE TABLE or GRANT inside comments as SQL', () => {
    expect(
      sqlDefinesCreateTableWithoutGrant(
        '-- This migration does not CREATE TABLE; it only alters.\nALTER TABLE public.foo ADD COLUMN x int;',
      ),
    ).toBe(false);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        '/*\nCREATE TABLE public.foo (id int);\n*/\nALTER TABLE public.foo ADD COLUMN x int;',
      ),
    ).toBe(false);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        'CREATE TABLE public.foo (id int);\n-- GRANT SELECT ON public.foo TO authenticated;',
      ),
    ).toBe(true);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        '/* GRANT SELECT ON public.foo TO authenticated; */\nCREATE TABLE public.foo (id int);',
      ),
    ).toBe(true);
  });

  it('does not treat keywords inside strings or dollar-quoted bodies as SQL', () => {
    expect(
      sqlDefinesCreateTableWithoutGrant(
        "INSERT INTO docs (body) VALUES ('please CREATE TABLE later');",
      ),
    ).toBe(false);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        "CREATE TABLE public.foo (id int, note text default 'grant later');",
      ),
    ).toBe(true);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        `CREATE TABLE public.foo (note text default 'a -- still a string');
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.foo FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role;`,
      ),
    ).toBe(false);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        'CREATE FUNCTION bar() RETURNS void AS $$\nBEGIN\n  -- CREATE TABLE public.hidden (id int);\nEND $$;',
      ),
    ).toBe(false);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        'DO $$\nBEGIN\n  CREATE TABLE public.foo (id int);\nEND $$;',
      ),
    ).toBe(true);
    expect(
      sqlDefinesCreateTableWithoutGrant(
        'DO $$\nBEGIN\n  -- CREATE TABLE public.foo (id int);\nEND $$;',
      ),
    ).toBe(false);
  });

  it('does not treat CREATE TABLESPACE as CREATE TABLE', () => {
    expect(sqlDefinesCreateTableWithoutGrant("CREATE TABLESPACE foo LOCATION '/tmp';")).toBe(false);
  });

  it('accepts split GRANT statements that cover each role', () => {
    const sql = `CREATE TABLE public.foo (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.foo FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT ON public.foo TO authenticated;
GRANT UPDATE, DELETE ON public.foo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
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
  it('skips ignored paths and does not scan files absent from the diff', () => {
    expect(
      findGrantViolations(['sql/_TEMPLATE_new_table.sql', 'sql/schema/0000_baseline.sql']),
    ).toEqual([]);
    expect(findGrantViolations(['AGENTS.md', 'src/app/page.tsx'])).toEqual([]);
  });

  it('flags incomplete setup only when that path is in the changed list', () => {
    const fixtureRel = 'sql/.vitest-create-table-without-grant.sql';
    const fixtureAbs = path.join(process.cwd(), fixtureRel);
    const inlineSql = 'CREATE TABLE public.vitest_grant_fixture (id int);\n';
    fs.writeFileSync(fixtureAbs, inlineSql);
    try {
      expect(findGrantViolations([fixtureRel])).toEqual(
        expect.arrayContaining([
          {
            file: fixtureRel,
            reason:
              'public.vitest_grant_fixture: missing ENABLE ROW LEVEL SECURITY in the same file',
          },
        ]),
      );
    } finally {
      fs.unlinkSync(fixtureAbs);
    }
  });
});

describe('resolveBaseRef', () => {
  it('uses the pull request base sha', () => {
    expect(
      resolveBaseRef(
        { GITHUB_EVENT_NAME: 'pull_request' },
        { pull_request: { base: { sha: 'a'.repeat(40) } } },
      ),
    ).toBe('a'.repeat(40));
  });

  it('uses the previous tip on push, including push to master', () => {
    const before = 'b'.repeat(40);
    const head = 'c'.repeat(40);
    expect(
      resolveBaseRef(
        { GITHUB_EVENT_NAME: 'push', GITHUB_SHA: head },
        { before, after: head, ref: 'refs/heads/master' },
      ),
    ).toBe(before);
  });

  it('returns null when a push has no previous commit', () => {
    expect(resolveBaseRef({ GITHUB_EVENT_NAME: 'push' }, { before: '0'.repeat(40) })).toBe(null);
  });

  it('lets SQL_GRANTS_CHECK_BASE override the event', () => {
    expect(
      resolveBaseRef(
        { GITHUB_EVENT_NAME: 'push', SQL_GRANTS_CHECK_BASE: 'origin/master' },
        { before: 'd'.repeat(40) },
      ),
    ).toBe('origin/master');
  });

  it('falls back to merge-base with origin/master outside GitHub events', () => {
    const expected = execFileSync('git', ['merge-base', 'HEAD', 'origin/master'], {
      encoding: 'utf8',
    }).trim();
    expect(resolveBaseRef({})).toBe(expected);
  });
});

describe('changed file diff', () => {
  it('three-dot diff lists only the branch files, not sql that changed only on the base', () => {
    const cwd = initRepo();
    writeSql(cwd, 'legacy.sql', 'CREATE TABLE public.legacy (id int);\n');
    git(cwd, ['add', '.']);
    git(cwd, ['commit', '-m', 'legacy']);
    const branchPoint = git(cwd, ['rev-parse', 'HEAD']);

    git(cwd, ['checkout', '-b', 'feature']);
    writeSql(cwd, 'new.sql', 'CREATE TABLE public.new_item (id int);\n');
    git(cwd, ['add', '.']);
    git(cwd, ['commit', '-m', 'new table']);

    git(cwd, ['checkout', 'master']);
    fs.writeFileSync(path.join(cwd, 'README.md'), 'base moved\n');
    git(cwd, ['add', '.']);
    git(cwd, ['commit', '-m', 'base moves']);
    const base = git(cwd, ['rev-parse', 'HEAD']);

    git(cwd, ['checkout', 'feature']);
    expect(
      resolveBaseRef(
        { GITHUB_EVENT_NAME: 'pull_request' },
        { pull_request: { base: { sha: base } } },
      ),
    ).toBe(base);

    const names = git(cwd, changedFilesDiffArgs(base)).split('\n').filter(Boolean);
    expect(names).toEqual(['sql/new.sql']);
    expect(names).not.toContain('sql/legacy.sql');
    expect(branchPoint).not.toBe(base);
  });

  it('push to master diffs against the previous tip, not HEAD', () => {
    const cwd = initRepo();
    writeSql(cwd, 'legacy.sql', 'CREATE TABLE public.legacy (id int);\n');
    git(cwd, ['add', '.']);
    git(cwd, ['commit', '-m', 'legacy']);
    const before = git(cwd, ['rev-parse', 'HEAD']);

    writeSql(cwd, 'new.sql', 'CREATE TABLE public.new_item (id int);\n');
    git(cwd, ['add', '.']);
    git(cwd, ['commit', '-m', 'pushed']);
    const head = git(cwd, ['rev-parse', 'HEAD']);
    git(cwd, ['update-ref', 'refs/remotes/origin/master', head]);

    const mergeBase = git(cwd, ['merge-base', 'HEAD', 'origin/master']);
    expect(mergeBase).toBe(head);
    expect(git(cwd, ['diff', '--name-only', `${mergeBase}...HEAD`])).toBe('');

    const base = resolveBaseRef(
      { GITHUB_EVENT_NAME: 'push', GITHUB_SHA: head },
      { before, after: head, ref: 'refs/heads/master' },
    );
    expect(base).toBe(before);
    expect(git(cwd, changedFilesDiffArgs(base)).split('\n').filter(Boolean)).toEqual([
      'sql/new.sql',
    ]);
  });
});

describe('check-sql-table-grants entrypoint', () => {
  it('fails closed on a push event with no previous sha', () => {
    const eventPath = writeEvent({ before: '0'.repeat(40), ref: 'refs/heads/master' });
    const result = runScript({
      GITHUB_EVENT_NAME: 'push',
      GITHUB_EVENT_PATH: eventPath,
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/no base ref for GitHub push/);
  });

  it('on a pull request, diffs the event base sha', () => {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const eventPath = writeEvent({ pull_request: { base: { sha: head } } });
    const result = runScript({
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_EVENT_PATH: eventPath,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`OK (0 changed file(s) vs ${head}).`);
  });
});

function initRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'sql-grants-'));
  git(cwd, ['init', '-b', 'master']);
  git(cwd, ['config', 'user.email', 'sql-grants-test@example.com']);
  git(cwd, ['config', 'user.name', 'sql-grants-test']);
  git(cwd, ['config', 'commit.gpgsign', 'false']);
  return cwd;
}

function writeSql(cwd, name, contents) {
  const dir = path.join(cwd, 'sql');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), contents);
}

function git(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function writeEvent(payload) {
  const eventPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'sql-grants-event-')),
    'event.json',
  );
  fs.writeFileSync(eventPath, JSON.stringify(payload));
  return eventPath;
}

function runScript(env) {
  return spawnSync(process.execPath, [scriptPath], {
    encoding: 'utf8',
    env: { ...process.env, SQL_GRANTS_CHECK_BASE: '', ...env },
  });
}
