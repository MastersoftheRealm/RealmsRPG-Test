# Codex Database Audit — JSONB vs Columnar Tables

**Purpose:** Document why codex tables are currently `id` + `data` (JSONB) only, and how to move to proper columns so you can drag-and-drop CSV in Supabase and query/filter by column.

**Related:** `CODEX_SCHEMA_REFERENCE.md` (field definitions), `prisma/schema.prisma`, `codex_csv/` or `Codex csv/` (CSV sources), `scripts/seed-to-supabase.js`.

---

## 1. Current state (why only two columns?)

- **Historical:** The codex was migrated from Firestore/document-style storage. The simplest 1:1 mapping was one row per document: `id` (document ID) + `data` (entire document as JSONB). That’s what `prisma/supabase-idempotent-full.sql` and the Prisma schema still create.
- **Result:** All codex tables in the `codex` schema look like:
  - `codex_feats(id TEXT PRIMARY KEY, data JSONB NOT NULL)`
  - Same for `codex_skills`, `codex_species`, `codex_traits`, `codex_parts`, `codex_properties`, `codex_equipment`, `codex_archetypes`, `codex_creature_feats`.
- **Seeding:** `scripts/seed-to-supabase.js` reads your CSVs, builds a JSON object per row, and upserts `{ id, data }` into these tables. So the *source* of truth is CSV, but the *database* stores only JSONB.
- **Downsides:** You can’t drag-and-drop CSV into Supabase (no columns to map to), and you can’t index or filter by specific fields in SQL without using JSONB operators.

---

## 2. Do we still have the proper column data?

**Yes.** You don’t need to send it again.

- **Schema reference:** `src/docs/CODEX_SCHEMA_REFERENCE.md` — defines every codex entity (Feats, Skills, Species, Traits, Parts, Properties, Equipment, Archetypes, Creature Feats) with field names, types, and descriptions.
- **CSV headers:** Your CSVs in `codex_csv/` (or `Codex csv/`) already use the same field names. The DDL in the next section is aligned with both that doc and those CSV headers so Supabase column names match the CSV for drag-and-drop import.

---

## 3. Fix: columnar codex tables

**Goal:** One column per field (matching `CODEX_SCHEMA_REFERENCE.md` and your CSV headers) so you can:

1. In Supabase: create tables with these columns, then **drag-and-drop CSV** into each table.
2. Optionally run a migration that renames current `id`+`data` tables to `*_legacy`, creates new columnar tables, and (if you want) backfills from existing JSONB or from CSV via the seed script.

**Approach:**

- **Array-like fields** (e.g. `ability_req`, `tags`, `skills`, `species_traits`): stored as **TEXT** (comma-separated in CSV). The app already parses these (see `src/app/api/codex/route.ts` helpers `toStrArray` / `toNumArray`). This keeps CSV import 1:1 with no extra mapping.
- **Scalar fields:** TEXT, INTEGER, NUMERIC, BOOLEAN as appropriate. Empty CSV cells → NULL.

The file **`prisma/supabase-codex-tables-columnar.sql`** contains:

- DDL for all codex tables with proper columns (names match CSV headers where applicable).
- Optional steps: rename existing tables to `*_legacy`, create new tables, then either import CSV in the UI or run the existing seed script against the new structure (seed script would need to be updated to insert into columns instead of `data`).

---

## 4. Migration paths

### Option A — Fresh start (recommended if you’re okay re-importing)

1. **Back up** existing codex data if needed (export from Supabase or run a quick `SELECT * FROM codex.codex_feats` etc.).
2. In Supabase SQL editor, run the section of `supabase-codex-tables-columnar.sql` that:
   - Drops the existing codex tables (or renames them to `codex_feats_legacy`, etc.).
   - Creates the new columnar tables (same names: `codex_feats`, `codex_skills`, …).
3. In Supabase Table Editor, use **Import data from CSV** for each table and map your CSV columns to the new columns (names should align).
4. Update **Prisma schema** to the new columnar models (see below).
5. Update **API and codex-server** to read from columns instead of `data` (or add a thin layer that builds the same response shape from columns so the rest of the app stays unchanged).

### Option B — Migrate in place (keep existing data)

1. Run SQL that renames existing tables to `*_legacy`.
2. Create new columnar tables with the DDL.
3. Run a one-off migration script that:
   - Reads each row from `*_legacy` (e.g. `codex_feats_legacy`),
   - Expands `data` JSONB into columns,
   - Inserts into the new `codex_feats` (etc.).
4. Then update Prisma + API as in Option A, and later drop `*_legacy` when no longer needed.

---

## 5. After switching to columns

- **Prisma:** Replace `model CodexFeat { id String @id; data Json }` with explicit fields (e.g. `name String`, `description String?`, …). Same for all codex models.
- **API route** (`src/app/api/codex/route.ts`): Use Prisma’s column names and build the same JSON response shape so existing hooks and UI keep working.
- **Seed script:** Either:
  - Point Supabase at CSV import only (no script), or
  - Update `seed-to-supabase.js` to insert into the new columns instead of a single `data` blob.

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Why are codex tables only `id` + `data`? | Legacy from Firestore-style migration; simplest mapping was one row = one document. |
| Do we have the proper column definitions? | Yes — in `CODEX_SCHEMA_REFERENCE.md` and in the CSVs in `codex_csv/` (or `Codex csv/`). |
| Do you need to send the codex reference again? | No. |
| How to fix? | Use `prisma/supabase-codex-tables-columnar.sql` to create columnar tables, then import CSV in Supabase (or migrate from existing JSONB). Then update Prisma schema and codex API to use columns. |
