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
import { isAllowlistedWritePolicyPredicate } from './lib/sql-grant-check-engine.mjs';

const scriptPath = path.join(process.cwd(), 'scripts/check-sql-table-grants.mjs');

function compliantPublicTableSql(table = 'public.foo') {
  return `CREATE TABLE ${table} (id int);
ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own" ON ${table} FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ${table} TO service_role;`;
}

function compliantQuotedHyphenTable(quotedName) {
  return `CREATE TABLE ${quotedName} (id int);
ALTER TABLE ${quotedName} ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON ${quotedName} FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON ${quotedName} TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ${quotedName} TO service_role;`;
}

describe('word-only GRANT gap', () => {
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

  it('does not count a CREATE POLICY on a different table', () => {
    const sql = `CREATE TABLE public.foo (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.other FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining(['public.foo: missing CREATE POLICY in the same file']),
    );
  });

  it('requires each new public table to have its own CREATE POLICY', () => {
    const sql = `CREATE TABLE public.foo (id int);
CREATE TABLE public.bar (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar ENABLE ROW LEVEL SECURITY;
CREATE POLICY shared ON public.foo FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bar TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bar TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining(['public.bar: missing CREATE POLICY in the same file']),
    );
  });

  it('ignores spoofed RLS, policy, and GRANT text inside a quoted column default', () => {
    const spoofed = [
      'ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY',
      'CREATE POLICY p ON public.foo FOR SELECT TO authenticated USING (true)',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated',
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role',
    ].join(' ');
    const sql = `CREATE TABLE public.foo (
  id int,
  trap text default "${spoofed.replace(/"/g, '""')}"
);`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.foo: missing ENABLE ROW LEVEL SECURITY in the same file',
        'public.foo: missing CREATE POLICY in the same file',
        expect.stringMatching(/GRANT missing SELECT, INSERT, UPDATE, DELETE TO authenticated/),
        expect.stringMatching(/GRANT missing SELECT, INSERT, UPDATE, DELETE TO service_role/),
      ]),
    );
  });

  it('does not treat SELECT (all) as granting every privilege', () => {
    const sql = `CREATE TABLE public.foo (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.foo FOR SELECT TO authenticated USING (true);
GRANT SELECT (all) ON public.foo TO authenticated;
GRANT SELECT (all) ON public.foo TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/GRANT missing INSERT, UPDATE, DELETE TO authenticated/),
        expect.stringMatching(/GRANT missing INSERT, UPDATE, DELETE TO service_role/),
      ]),
    );
  });

  it('accepts ALL PRIVILEGES for service_role and explicit writes for authenticated', () => {
    const sqlAll = `CREATE TABLE public.foo (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.foo FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
GRANT ALL PRIVILEGES ON public.foo TO service_role;`;
    expect(findCreateTableSetupViolations(sqlAll)).toEqual([]);
  });

  it('checks CREATE UNLOGGED TABLE like other new tables', () => {
    expect(sqlDefinesCreateTableWithoutGrant('CREATE UNLOGGED TABLE public.foo (id int);')).toBe(
      true,
    );
    expect(
      sqlDefinesCreateTableWithoutGrant(
        compliantPublicTableSql('public.foo').replace('CREATE TABLE', 'CREATE UNLOGGED TABLE'),
      ),
    ).toBe(false);
  });

  it('flags each distinct quoted hyphenated table even when another is fully set up', () => {
    const sql = `${compliantQuotedHyphenTable('"foo-bar"')}\nCREATE TABLE "baz-qux" (id int);`;
    expect(sqlDefinesCreateTableWithoutGrant(sql)).toBe(true);
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.baz-qux: missing ENABLE ROW LEVEL SECURITY in the same file',
        'public.baz-qux: missing CREATE POLICY in the same file',
        expect.stringMatching(/public\.baz-qux: GRANT missing .+ TO authenticated/),
      ]),
    );
  });

  it('does not match a CREATE POLICY on a differently quoted spaced table name', () => {
    const sql = `CREATE TABLE "Foo Bar" (id int);
ALTER TABLE "Foo Bar" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON "Other Table" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Foo Bar" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Foo Bar" TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining(['public.Foo Bar: missing CREATE POLICY in the same file']),
    );
  });

  it('does not treat a quoted SQL keyword as a real statement', () => {
    const sql = `CREATE TABLE public.foo (id int);
"alter" TABLE public.foo ENABLE ROW LEVEL SECURITY;
"create" POLICY p ON public.foo FOR SELECT TO authenticated USING (true);
"grant" SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
"grant" SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role;`;
    expect(sqlDefinesCreateTableWithoutGrant(sql)).toBe(true);
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.foo: missing ENABLE ROW LEVEL SECURITY in the same file',
        'public.foo: missing CREATE POLICY in the same file',
        expect.stringMatching(/GRANT missing SELECT, INSERT, UPDATE, DELETE TO authenticated/),
        expect.stringMatching(/GRANT missing SELECT, INSERT, UPDATE, DELETE TO service_role/),
      ]),
    );
  });
});

describe('loop-generated RLS and grants', () => {
  it('counts EXECUTE format policies inside FOREACH loops', () => {
    const sql = `CREATE TABLE public.child_rows (id int);
DO $policy$
DECLARE child text;
BEGIN
  FOREACH child IN ARRAY ARRAY['child_rows'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
    EXECUTE format(
      'CREATE POLICY child_select ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.parent p WHERE p.id = parent_id))',
      child
    );
  END LOOP;
END;
$policy$;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.child_rows TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it('allows RLS with SELECT-only policy (deny-by-default writes)', () => {
    const sql = `CREATE TABLE public.locked_child (id int);
ALTER TABLE public.locked_child ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_via_parent ON public.locked_child
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.parent p WHERE p.id = parent_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locked_child TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locked_child TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it('accepts comma-separated table lists in one GRANT', () => {
    const sql = `CREATE TABLE public.alpha (id int);
CREATE TABLE public.beta (id int);
ALTER TABLE public.alpha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta ENABLE ROW LEVEL SECURITY;
CREATE POLICY pa ON public.alpha FOR SELECT TO authenticated USING (true);
CREATE POLICY pb ON public.beta FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.alpha, public.beta TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it('flags overly broad authenticated INSERT policies', () => {
    const sql = `CREATE TABLE public.foo (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.foo FOR SELECT TO authenticated USING (true);
CREATE POLICY write ON public.foo FOR INSERT TO authenticated WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.foo: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });
});

describe('expandForeachExecuteFormatSql', () => {
  it('substitutes each name from the FOREACH array into format SQL', () => {
    const sql = `DO $p$
BEGIN
  FOREACH child IN ARRAY ARRAY['foo','bar'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
  END LOOP;
END;
$p$;`;
    const violations = findCreateTableSetupViolations(sql);
    expect(violations).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
    expect(
      findCreateTableSetupViolations(
        `${sql}
CREATE TABLE public.foo (id int);
ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.foo FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foo TO authenticated, service_role;`,
      ),
    ).toEqual([]);
  });
});

describe('review hardening regressions', () => {
  it('does not expand a commented-out loop in raw text', () => {
    const sql = `CREATE TABLE public.trap (id int);
-- DO $p$
-- BEGIN
--   FOREACH child IN ARRAY ARRAY['trap'] LOOP
--     EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
--   END LOOP;
-- END;
-- $p$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trap TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining(['public.trap: missing ENABLE ROW LEVEL SECURITY in the same file']),
    );
  });

  it('fails unexpandable EXECUTE literal dynamic SQL', () => {
    const sql = `CREATE TABLE public.trap (id int);
DO $p$
BEGIN
  EXECUTE 'ALTER TABLE public.trap ENABLE ROW LEVEL SECURITY';
END;
$p$;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
  });

  it('flags broad write policy generated in a loop', () => {
    const sql = `CREATE TABLE public.child_rows (id int);
DO $p$
BEGIN
  FOREACH child IN ARRAY ARRAY['child_rows'] LOOP
    EXECUTE format(
      'CREATE POLICY bad ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      child
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
  END LOOP;
END;
$p$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_rows TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.child_rows: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });

  it('flags CREATE TABLE without leading space before quoted name', () => {
    const bare = `CREATE TABLE"secret"(id int);
GRANT SELECT, INSERT, UPDATE, DELETE ON "secret" TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(bare)).toEqual(
      expect.arrayContaining(['public.secret: missing ENABLE ROW LEVEL SECURITY in the same file']),
    );
  });

  it('parses U& unicode quoted table names', () => {
    const sql = `CREATE TABLE U&"secret" (id int);
ALTER TABLE U&"secret" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON U&"secret" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON U&"secret" TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it('treats missing FOR as ALL and missing TO as client-exposed', () => {
    const sql = `CREATE TABLE public.wide (id int);
ALTER TABLE public.wide ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.wide USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wide TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.wide: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });

  it('flags anon INSERT grants without CREATE TABLE in the file', () => {
    const sql = `GRANT INSERT ON public.leak TO anon;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([expect.stringMatching(/GRANT INSERT TO anon is not allowed/)]),
    );
  });

  it('detects distinct quoted identifiers with embedded quotes', () => {
    const ok = `CREATE TABLE "foo-bar" (id int);
ALTER TABLE "foo-bar" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON "foo-bar" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON "foo-bar" TO authenticated, service_role;
CREATE TABLE "baz-qux" (id int);`;
    expect(sqlDefinesCreateTableWithoutGrant(ok)).toBe(true);
    expect(findCreateTableSetupViolations(ok)).toEqual(
      expect.arrayContaining([
        'public.baz-qux: missing ENABLE ROW LEVEL SECURITY in the same file',
      ]),
    );
  });

  it('rejects the four trivial authenticated write policy predicates (R2-B1)', () => {
    const base = `CREATE TABLE public.t (id int);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.t FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    const cases = [
      `CREATE POLICY bad ON public.t FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)`,
      `CREATE POLICY bad ON public.t FOR INSERT TO authenticated WITH CHECK (true OR auth.uid() IS NULL)`,
      `CREATE POLICY bad ON public.t FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1))`,
      `CREATE POLICY bad ON public.t FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated')`,
    ];
    for (const policy of cases) {
      expect(findCreateTableSetupViolations(`${base}\n${policy};`)).toEqual(
        expect.arrayContaining([
          'public.t: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
        ]),
      );
    }
  });

  it('accepts owner_id = auth.uid() and allowlisted private.auth_is_vtt_* write scopes', () => {
    const sql = `CREATE TABLE public.t (id int, owner_id uuid, campaign_id text);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.t FOR SELECT TO authenticated USING (true);
CREATE POLICY ins ON public.t FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY upd ON public.t FOR UPDATE TO authenticated USING (private.auth_is_vtt_campaign_owner(campaign_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it('flags quoted role names in policy TO clauses', () => {
    const sql = `CREATE TABLE public.t (id int);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.t FOR SELECT TO "authenticated" USING (true);
CREATE POLICY bad ON public.t FOR INSERT TO "authenticated" WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.t: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });

  it('flags schema-wide write grants to anon and TRUNCATE to authenticated', () => {
    const schema = `GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO anon;`;
    expect(findCreateTableSetupViolations(schema)).toEqual(
      expect.arrayContaining([expect.stringMatching(/ALL TABLES IN SCHEMA.*anon/)]),
    );
    const trunc = `GRANT SELECT, TRUNCATE ON public.leak TO authenticated;`;
    expect(findCreateTableSetupViolations(trunc)).toEqual(
      expect.arrayContaining([expect.stringMatching(/GRANT TRUNCATE TO authenticated/i)]),
    );
  });

  it('handles ALTER TABLE ONLY / IF EXISTS for RLS disable and alter policy', () => {
    const disabled = `CREATE TABLE public.t (id int);
ALTER TABLE IF EXISTS public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.t FOR SELECT TO authenticated USING (true);
ALTER TABLE ONLY public.t DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(disabled)).toEqual(
      expect.arrayContaining(['public.t: DISABLE ROW LEVEL SECURITY in the same file']),
    );
    const toggled = disabled.replace(
      'ALTER TABLE ONLY public.t DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE ONLY public.t DISABLE ROW LEVEL SECURITY;\nALTER TABLE ONLY public.t ENABLE ROW LEVEL SECURITY;',
    );
    expect(findCreateTableSetupViolations(toggled)).toEqual([]);
    const alterBroad = `CREATE TABLE public.t (id int);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.t FOR SELECT TO authenticated USING (true);
ALTER POLICY read ON public.t USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(alterBroad)).toEqual(
      expect.arrayContaining([
        'public.t: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });

  it('keeps case-distinct quoted table names (Secret vs secret)', () => {
    const sql = `CREATE TABLE "Secret" (id int);
ALTER TABLE "Secret" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON "Secret" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON "Secret" TO authenticated, service_role;
CREATE TABLE "secret" (id int);`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining(['public.secret: missing ENABLE ROW LEVEL SECURITY in the same file']),
    );
    expect(findCreateTableSetupViolations(sql)).not.toEqual(
      expect.arrayContaining(['public.Secret: missing ENABLE ROW LEVEL SECURITY in the same file']),
    );
  });

  it('recognizes empty quoted identifiers and ignores ELSE-prefixed string literals', () => {
    const empty = `CREATE TABLE "" (id int);
ALTER TABLE "" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON "" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON "" TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(empty)).toEqual([]);
    const elseDefault = `CREATE TABLE public.t (
  id int,
  note text default ELSE'not an e-string'
);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.t FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(elseDefault)).toEqual([]);
  });

  it('allows migration DO loops without EXECUTE and fails risky dynamic SQL', () => {
    const backfill = `CREATE TABLE public.t (id int);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.t FOR SELECT TO authenticated USING (true);
DO $b$
BEGIN
  FOR r IN SELECT id FROM public.t LOOP
    PERFORM 1;
  END LOOP;
END;
$b$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(backfill)).toEqual([]);
    const risky = `CREATE TABLE public.t (id int);
DO $p$
BEGIN
  FOR r IN SELECT id FROM public.t LOOP
    EXECUTE format('ALTER TABLE public.t ENABLE ROW LEVEL SECURITY');
  END LOOP;
END;
$p$;`;
    expect(findCreateTableSetupViolations(risky)).toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
    const noArgs = `DO $p$
BEGIN
  EXECUTE format('SELECT 1');
END;
$p$;`;
    expect(findCreateTableSetupViolations(noArgs)).toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
  });

  it('still expands FOREACH when IF NOT EXISTS and gift appear in the DO body', () => {
    const sql = `CREATE TABLE public.child_rows (id int);
DO $p$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class) THEN
    RAISE NOTICE 'gift shop';
  END IF;
  FOREACH child IN ARRAY ARRAY['child_rows'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
    EXECUTE format(
      'CREATE POLICY c ON public.%I FOR SELECT TO authenticated USING (owner_id = auth.uid())',
      child
    );
  END LOOP;
END;
$p$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_rows TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });
});

describe('allowlist write policy predicates (fail closed)', () => {
  const tableBase = `CREATE TABLE public.g (id int, owner_id uuid, campaign_id text);
ALTER TABLE public.g ENABLE ROW LEVEL SECURITY;
CREATE POLICY r ON public.g FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.g TO authenticated, service_role;`;

  const bypassFailCases = [
    ['owner_id = auth.uid() OR 1 = 1', 'FOR UPDATE TO authenticated USING'],
    ['owner_id = auth.uid() OR 2 > 1', 'FOR UPDATE TO authenticated USING'],
    ['owner_id = auth.uid() OR id IS NOT NULL', 'FOR UPDATE TO authenticated USING'],
    ['EXISTS (SELECT 1 FROM public.g)', 'FOR UPDATE TO authenticated USING'],
    ["'x'::text = auth.uid()::text", 'FOR INSERT TO authenticated WITH CHECK'],
    ['auth.uid()::text = auth.uid()::text', 'FOR UPDATE TO authenticated USING'],
    ['private.auth_is_campaign_owner(campaign_id)', 'FOR UPDATE TO authenticated USING'],
  ];

  it.each(bypassFailCases)('rejects bypass %s', (predicate, action) => {
    expect(isAllowlistedWritePolicyPredicate(predicate)).toBe(false);
    expect(
      findCreateTableSetupViolations(
        `${tableBase}\nCREATE POLICY bad ON public.g ${action} (${predicate});`,
      ),
    ).toEqual(
      expect.arrayContaining([
        'public.g: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });

  it('accepts owner_id = (select auth.uid())::text', () => {
    expect(isAllowlistedWritePolicyPredicate('owner_id = ((SELECT auth.uid())::text)')).toBe(true);
  });
});

describe('allowlist dynamic SQL', () => {
  const okTable = `CREATE TABLE public.ok (id int);
ALTER TABLE public.ok ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.ok FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ok TO authenticated, service_role;`;

  it('passes the canonical FOREACH format DO', () => {
    const sql = `${okTable}
DO $p$
BEGIN
  FOREACH child IN ARRAY ARRAY['ok'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
  END LOOP;
END;
$p$;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it.each([
    `DO $p$ BEGIN EXECUTE format(E'select 1'); END; $p$;`,
    `DO $p$ BEGIN EXECUTE format($q$select 1$q$); END; $p$;`,
    `DO $p$ BEGIN EXECUTE format(v); END; $p$;`,
    `DO $p$ BEGIN EXECUTE quote_ident('x'); END; $p$;`,
    `DO LANGUAGE plpgsql $p$ BEGIN NULL; END; $p$;`,
  ])('rejects dynamic SQL variant %s', (doBlock) => {
    expect(findCreateTableSetupViolations(`${okTable}\n${doBlock}`)).toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
  });

  it('rejects EXECUTE inside a function even without CREATE TABLE in the file', () => {
    const sql = `CREATE FUNCTION public.bad() RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE 'select 1';
END;
$fn$;
SELECT public.bad();`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([expect.stringMatching(/EXECUTE in function body/i)]),
    );
  });
});

describe('PR 564 bypass audit holes', () => {
  it('rejects auth.uid()::text in column equality (not exact auth.uid() form)', () => {
    const sql = `CREATE TABLE public.h (id int, owner_id text);
ALTER TABLE public.h ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.h FOR SELECT TO authenticated USING (true);
CREATE POLICY bad ON public.h FOR UPDATE TO authenticated USING (owner_id = auth.uid()::text);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.h TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([
        'public.h: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
      ]),
    );
  });

  it('allows owner_id = auth.uid() AND true (top-level AND does not widen)', () => {
    const sql = `CREATE TABLE public.h (id int, owner_id uuid);
ALTER TABLE public.h ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.h FOR SELECT TO authenticated USING (true);
CREATE POLICY ok ON public.h FOR UPDATE TO authenticated USING (owner_id = auth.uid() AND true);
CREATE POLICY ok2 ON public.h FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND 1 = 1);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.h TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(sql)).toEqual([]);
  });

  it('flags EXECUTE in a function without CREATE TABLE in the same file', () => {
    const sql = `CREATE FUNCTION public.bad_fn() RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE 'SELECT 1';
END;
$fn$;
SELECT public.bad_fn();`;
    expect(findCreateTableSetupViolations(sql)).toEqual(
      expect.arrayContaining([expect.stringMatching(/EXECUTE in function body/i)]),
    );
  });

  it('flags client-role write grants including ALL and single-privilege authenticated', () => {
    const base = `CREATE TABLE public.h (id int);
ALTER TABLE public.h ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.h FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.h TO service_role;`;
    expect(
      findCreateTableSetupViolations(`${base}\nGRANT INSERT ON public.h TO authenticated;`),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/GRANT INSERT TO authenticated/i)]));
    expect(
      findCreateTableSetupViolations(`${base}\nGRANT ALL ON public.h TO authenticated;`),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/GRANT ALL TO authenticated/i)]));
    expect(
      findCreateTableSetupViolations(`${base}\nGRANT UPDATE ON myschema.foo TO authenticated;`),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/myschema\.foo.*GRANT UPDATE TO authenticated/i),
      ]),
    );
    expect(
      findCreateTableSetupViolations(
        `${base}\nGRANT SELECT, INSERT, UPDATE, DELETE ON public.h TO "authenticated";`,
      ),
    ).toEqual([]);
    expect(
      findCreateTableSetupViolations(
        `${base}\nGRANT UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;`,
      ),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/ALL TABLES IN SCHEMA/i)]));
  });
});

describe('allowlist client grants', () => {
  const base = `CREATE TABLE public.g (id int);
ALTER TABLE public.g ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.g FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.g TO service_role;`;

  it('rejects GRANT ALL to anon on a new table', () => {
    expect(findCreateTableSetupViolations(`${base}\nGRANT ALL ON public.g TO anon;`)).toEqual(
      expect.arrayContaining([expect.stringMatching(/GRANT .+ TO anon is not allowed/i)]),
    );
  });

  it('rejects ALL TABLES IN SCHEMA writes to public', () => {
    expect(
      findCreateTableSetupViolations('GRANT INSERT ON ALL TABLES IN SCHEMA public TO anon;'),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/ALL TABLES IN SCHEMA/i)]));
  });

  it('allows explicit SELECT+writes (not ALL) for authenticated with RLS', () => {
    expect(
      findCreateTableSetupViolations(
        `${base}\nGRANT SELECT, INSERT, UPDATE, DELETE ON public.g TO authenticated;`,
      ),
    ).toEqual([]);
  });

  it('parses quoted roles in GRANT and rejects ALL', () => {
    expect(
      findCreateTableSetupViolations(
        `${base}\nGRANT SELECT, INSERT, UPDATE, DELETE ON public.g TO "authenticated";`,
      ),
    ).toEqual([]);
    expect(
      findCreateTableSetupViolations(`${base}\nGRANT ALL ON public.g TO authenticated;`),
    ).toEqual(expect.arrayContaining([expect.stringMatching(/GRANT ALL TO authenticated/i)]));
    expect(findCreateTableSetupViolations(`${base}\nGRANT INSERT ON public.g TO anon;`)).toEqual(
      expect.arrayContaining([expect.stringMatching(/GRANT INSERT TO anon/i)]),
    );
  });
});

describe('PR 564 round 3 reviewer holes', () => {
  it('rejects USING/WITH CHECK disjunctions that include constant true', () => {
    const base = `CREATE TABLE public.t (id int, owner_id uuid);
ALTER TABLE public.t ENABLE ROW LEVEL SECURITY;
CREATE POLICY read ON public.t FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t TO authenticated, service_role;`;
    const variants = [
      `CREATE POLICY bad ON public.t FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR true)`,
      `CREATE POLICY bad ON public.t FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() OR (true))`,
      `CREATE POLICY bad ON public.t FOR UPDATE TO authenticated USING (true OR owner_id = auth.uid())`,
    ];
    for (const policy of variants) {
      expect(findCreateTableSetupViolations(`${base}\n${policy};`)).toEqual(
        expect.arrayContaining([
          'public.t: overly broad write policy for anon/authenticated (PostgREST direct-write risk)',
        ]),
      );
    }
  });

  it('fails closed on EXECUTE format literals that cannot be expanded', () => {
    const createViaFormat = `DO $p$
BEGIN
  EXECUTE format('CREATE TABLE public.trap (id int)');
END;
$p$;`;
    expect(findCreateTableSetupViolations(createViaFormat)).toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
    const policyViaFormat = `CREATE TABLE public.trap (id int);
DO $p$
BEGIN
  EXECUTE format(
    'CREATE POLICY bad ON public.trap FOR INSERT TO authenticated WITH CHECK (true)'
  );
END;
$p$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trap TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(policyViaFormat)).toEqual(
      expect.arrayContaining([expect.stringMatching(/unexpandable dynamic sql/i)]),
    );
  });

  it('parses CREATE TABLE IF NOT EXISTS glued to a quoted name as that table, not public.if', () => {
    const glued = `CREATE TABLE IF NOT EXISTS"secret" (id int);
ALTER TABLE "secret" ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON "secret" FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON "secret" TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(glued)).toEqual([]);
    const hidden = `CREATE TABLE IF NOT EXISTS"secret" (id int);
GRANT SELECT, INSERT, UPDATE, DELETE ON "secret" TO authenticated, service_role;`;
    expect(findCreateTableSetupViolations(hidden)).toEqual(
      expect.arrayContaining(['public.secret: missing ENABLE ROW LEVEL SECURITY in the same file']),
    );
    expect(findCreateTableSetupViolations(hidden)).not.toEqual(
      expect.arrayContaining(['public.if: missing ENABLE ROW LEVEL SECURITY in the same file']),
    );
  });
});

describe('sql tree gate', () => {
  it('passes SQL_GRANTS_CHECK_TREE against the repository', () => {
    const result = runScript({ SQL_GRANTS_CHECK_TREE: '1', SQL_GRANTS_CHECK_BASE: '' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('tree OK');
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
