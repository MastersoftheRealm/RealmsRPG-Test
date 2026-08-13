# Audit 12 — SQL / Documented Schema / TypeScript Type Layer (repo side)

**Date:** 2026-08-13 · **Scope:** `sql/**` (103 `.sql` + `README.md`), `src/docs/SUPABASE_SCHEMA.md`, `src/types/**`, `src/lib/constants/**`, `scripts/seed-to-supabase.js`, `scripts/seed-data/**`, `codex_csv/**`, `data/**`, `scripts/supabase-backup.ps1`, `scripts/supabase-storage-backup.js`
**Method:** Read-only. No SQL executed, no Supabase MCP used, no `.env*` contents read. Every finding cites `file:line`.
**Boundary:** The live database is audited separately by the lead auditor. Everything below is what the **repo** claims/can do. Tables and columns are named explicitly so the live-DB audit can be diffed against this list.

---

## 0. Executive summary

| # | Finding | Sev |
|---|---------|-----|
| F1 | **A fresh environment cannot be built from `sql/`.** 27 of ~40 live tables have no `CREATE TABLE` anywhere in the repo. There is no reproducible schema. | **P0** |
| F2 | **`npm run db:seed` unconditionally deletes all 9 codex tables before it checks whether any CSV exists**, and there is **no archetypes CSV** — so a seed run destroys `codex_archetypes` + cascades `codex_archetype_levels` with nothing to restore from. The advertised `--reset` flag is never read. | **P0** |
| F3 | **Backups are manual, one snapshot exists (2026-04-21, ~4 months stale), stored only in the gitignored local `backups/` folder, and no restore procedure is documented anywhere.** `codex-art` bucket is not backed up by default. | **P0** |
| F4 | `path-c-phase0-consolidate-to-public-part2.sql:133-136` holds four `DROP SCHEMA … CASCADE` statements whose safety depends entirely on a human having run Parts 1a/1b/1c first. Nothing in the file enforces that. | **P0** |
| F5 | **Replaying the repo in README order does not work.** At least 4 files reference `campaigns."memberIds"`, dropped by `be02` part B; `codex-archetypes-creator-layer1-extensions.sql:14` re-adds a column that `codex-archetypes-drop-recommended-species.sql:77` dropped; `feat-tags-unification-phase{1,2,4}.sql` re-create functions **without** `SET search_path`, reverting the `task-649` hardening. | **P1** |
| F6 | **Only 2 live CHECK constraints exist in the entire repo schema** (`codex_archetype_levels.level >= 2`, `codex_change_logs.operation`). Every game-rule invariant (character level 1–20, visibility, status, encounter type, rarity, item type, action_type, non-negative costs) is enforced **only in Zod at the API layer**, which authenticated users bypass by writing their own rows directly via PostgREST. | **P1** |
| F7 | `campaigns.invite_code` has **no UNIQUE constraint** and its only index (`campaigns_invite_code_idx`) exists solely in an archived file. Invite-code collision silently breaks join-by-invite. | **P1** |
| F8 | `codex_change_logs.changed_by_user_id … ON DELETE RESTRICT` (`supabase-codex-change-logs.sql:10`) **blocks deletion of any admin/auth user who has ever edited codex content**. | **P1** |
| F9 | **No generated Supabase `Database` types.** 100% hand-written, and DB row shapes are re-declared ad-hoc in ~15 API route files. Doc↔SQL↔TS all disagree on `crafting_sessions.user_id` / `user_enhanced_items.user_id` (UUID vs TEXT). | **P1** |
| F10 | `owner_id`, `encounters.user_id`, `campaign_members.user_id`, `campaign_rolls.user_id` are all **FK-less text columns** — orphan rows survive user deletion. | **P1** |
| F11 | 30 destructive statements sit in the repo (§3). Most are `IF EXISTS`-guarded and re-runnable, but 9 destroy data if run out of context. | **P1** |
| F12 | Seed CSVs have drifted from the schema and from each other: missing `base_feat_id`, `is_starter`, `image_id`/`image_url`, `option_trait_ids`, `mechanic`; `scripts/seed-data/species.csv` carries a `part_cont` column that does not exist in `codex_species`. | **P1** |
| F13 | No drift detection of any kind: no schema snapshot in git, no `supabase db diff` in CI, no migrations table mirrored in-repo. `npm run db:migrate` is `echo`. | **P2** |
| F14 | `official_*` / `user_*` tables have **no `NOT NULL` on `name`**, **no default on `created_at`/`updated_at`**, and **no `updated_at` trigger** despite `set_updated_at_timestamp()` existing. | **P2** |
| F15 | 3 of 7 `sql/` "table-creating" DDLs for live tables exist **only inside markdown fences in `SUPABASE_SCHEMA.md`** (`crafting_sessions`, `user_enhanced_items`, `official_enhanced_items`) — and two of them are now **wrong** (post-`be01`). | **P2** |
| F16 | `sql/README.md` presents `supabase-campaign-members.sql` as a current runbook file; it targets the **dropped `campaigns` schema** and will fail on the current DB. | **P2** |
| F17 | `idx_realms_images_name_ilike` is `btree(lower(name))` but the query is `.ilike('name', '%q%')` — the index cannot serve it. | **P3** |

---

## 1. Migration discipline

### 1.1 Ordering, numbering, idempotency

| Property | State |
|---|---|
| Numbered / lexically ordered | **No.** Filenames are topic-based (`supabase-*`, `codex-*`, `task-###-*`, `path-c-*`, `zero-*`, `realms-*`). Sorting them alphabetically produces an order that will fail. |
| Canonical order recorded | Partially — `sql/README.md:11-41` lists 21 files with `schema_migrations` version numbers; `sql/README.md:44-56` lists 8 more "applied ad-hoc, not in `schema_migrations`"; `sql/README.md:177-186` gives a 6-step prose order for a fresh environment. |
| Idempotent | **Mostly.** `IF NOT EXISTS` / `DROP POLICY IF EXISTS … CREATE` / `ADD COLUMN IF NOT EXISTS` are used consistently. Exceptions listed in §1.3. |
| Transactional | Only 3 files wrap in `BEGIN…COMMIT`: `empowered-techniques-separate-tables.sql:5,166`, `supabase-library-columnar-parity-expansion.sql:14,299`, `supabase-be04-campaign-authz-private-schema-2026-06.sql:17,146`. Everything else runs statement-by-statement — a mid-file failure leaves a half-applied migration. |
| Runner | None. `package.json` `db:migrate` → `echo Run SQL in Supabase Dashboard.` |
| Drift detection | **None.** No committed `schema.sql`, no `supabase db diff`, no CI check. `sql/README.md:7` records the last manual parity audit as **2026-07-03** — 6 weeks stale. |

### 1.2 Can a fresh environment be built? — **No.** (F1, P0)

Grep for `CREATE TABLE` across all 103 files returns creates for only these `public` tables:

`official_powers`, `official_techniques`, `official_empowered_techniques`, `official_items`, `official_creatures`, `user_empowered_techniques`, `codex_archetype_levels`, `core_rules`, `role_policies`, `admin_role_audit`, `codex_change_logs`, `realms_images`, `realms_image_categories`, `ui_tooltips` (dropped table), and two `*_backup_20260717` tables.

**Tables with NO `CREATE TABLE` in `sql/` at all:**

| Missing DDL | Where it "exists" instead |
|---|---|
| `user_profiles`, `usernames`, `characters`, `user_powers`, `user_techniques`, `user_items`, `user_creatures`, `user_species` | Only as `users.*` in `sql/archive/supabase-idempotent-full.sql:46-110` (wrong schema, and the codex half of that file is the pre-columnar `id + data` shape) |
| `campaigns`, `campaign_rolls` | Only as `campaigns.*` in `archive/supabase-idempotent-full.sql:125-149` |
| `campaign_members` | `supabase-campaign-members.sql:10` and `path-c-phase0-consolidate-to-public-part1b.sql:8` — both target the **dropped `campaigns` schema** |
| `encounters` | Only `encounters.encounters` in `archive/supabase-idempotent-full.sql:161` |
| `codex_feats`, `codex_skills`, `codex_species`, `codex_traits`, `codex_parts`, `codex_properties`, `codex_equipment`, `codex_archetypes`, `codex_creature_feats` | Columnar form only as `codex.*` in `archive/supabase-codex-tables-columnar.sql:27-181` (and that file `DROP TABLE`s them first, `:15-23`) |
| `crafting_sessions`, `user_enhanced_items`, `official_enhanced_items` | **Only inside markdown fences** in `SUPABASE_SCHEMA.md:180-200`, `:215-233`, `:246-280` |
| `vtt_*` (referenced at `SUPABASE_SCHEMA.md:372`, `task-649-anon-least-privilege-applied.sql:65`, `task-649-index-hygiene-applied.sql:8,26`) | **Nowhere in the repo.** Zero `vtt` hits in `sql/`. |

The only documented "fresh install" path (`sql/README.md:179`, "Path C parts") **presupposes a database that already has `users`/`campaigns`/`codex`/`encounters` schemas populated** — i.e. it is a one-way consolidation of an environment that no longer exists. There is no way to reach that starting state from the repo either, since `archive/supabase-idempotent-full.sql` builds the pre-columnar JSONB codex shape, not the current one.

**Consequence:** the live database is the *only* copy of the schema. Combined with F3 (one stale backup, no tested restore), the recovery position is effectively "the running Supabase project."

### 1.3 Files whose safety depends on manual context (F4/F5)

| File:line | Depends on | Failure mode if run out of order |
|---|---|---|
| `path-c-phase0-consolidate-to-public-part2.sql:133-136` | Parts 1a/1b/1c having *moved* every table to `public` first | `DROP SCHEMA … CASCADE` deletes all tables still in `users`/`campaigns`/`codex`/`encounters` **with their data**. No guard, no row-count check, no `RAISE EXCEPTION` precondition. |
| `codex-archetypes-creator-layer1-extensions.sql:14` | Must **not** be run after `codex-archetypes-drop-recommended-species.sql` | Re-adds the dropped `level1_recommended_species` column and re-seeds Berserker `'4, 6, 7'` (`:47`). Header warns (`:3-5`); the SQL does not. |
| `guided-creator-schema-seed.sql:31-34` | Codex species ids `'4','6','7','8','9','10'` meaning what they meant in June | Blind-flips `is_starter = true` by hardcoded id **or** name match; re-running after curation silently re-adds species to the guided starter set. |
| `supabase-rls-consolidate-permissive-2026-06.sql:87`, `path-c-phase0-consolidate-to-public-part2.sql:21,29,34,68,78,88,96,106`, `supabase-rls-fix-campaign-recursion-2026-06.sql:45,89`, `supabase-campaign-authz-2026-06.sql:46,68` | `campaigns."memberIds"` existing | Column dropped at `supabase-be02-membership-single-source-2026-06.sql:81`. Replaying README order → `ERROR: column "memberIds" does not exist`. |
| `feat-tags-unification-phase1.sql:13`, `phase2.sql:14,68`, `phase4.sql:13,92,135,309` | Must **not** be run after `task-649-feat-tag-function-search-path-applied.sql` | These `CREATE OR REPLACE FUNCTION` **without `SET search_path`** and **without a schema qualifier**, silently reverting the TASK-649 search_path hardening on 4 functions. |
| `supabase-official-library-public-schema.sql:174-299` | `public_*` legacy tables existing | Guarded with `information_schema` checks — safe, but the tables are documented as dropped (`SUPABASE_SCHEMA.md:56`), so the whole backfill block is dead code. |
| `empowered-techniques-separate-tables.sql:128,159` | Empowered tables containing *only* rows just migrated | `DELETE FROM user_techniques WHERE EXISTS (… et.id = t.id)`. If ids ever collide between the technique and empowered tables, a re-run deletes live techniques. |
| `archive/force-drop-codex-core-rules-part-a-terminate.sql:27` | Nothing | `pg_terminate_backend()` loop over every session holding a lock on `codex.core_rules`. Kills live connections. |

### 1.4 Schema-of-record vs one-off fixes

Rough classification of the 103 files:

| Class | Count | Examples |
|---|---|---|
| Schema-of-record (DDL a fresh env needs) | ~14 | `supabase-official-library-public-schema.sql`, `create-public-core-rules.sql`, `supabase-role-policies.sql`, `realms-image-library.sql`, `supabase-codex-change-logs.sql`, `supabase-admin-role-audit-2026-06.sql`, `codex-archetypes-path-columns.sql`, `empowered-techniques-separate-tables.sql`, `supabase-*-list-columns.sql` (3) |
| Security / RLS / grants | ~18 | `supabase-security-hardening-*`, `supabase-rls-*` (4), `task-649-*` (6), `task-650-*` (2), `supabase-*-grants*.sql` |
| One-time data migration (Path C, be01/be02, columnar) | ~12 | `path-c-*` (6), `supabase-be0*` (3), `supabase-user-species-columnar.sql` |
| Codex **content** edits (not schema) | ~30 | all 12 `codex-archetypes-enrich-*-applied.sql`, `*-ability-spread-*`, `*-emdash-scrub-*`, `*-innate-reclassify-*`, `feat-tags-*` (4), `leveled-feats-*` (2), `normalize-codex-feat-ability-delimiters.sql`, `zero-add-weapon-option-levels-applied.sql`, `official-powers-strip-*` |
| Proposals / never applied | 4 | `*-proposed.sql` (`guided-berserker-loadout-fixes`, `guided-remove-loadout-kits`, `codex-archetypes-level1-innate-powers`, `feat-tags-unification-phase3`) |
| Verification-only / no-op | 3 | `task-649-verify-applied.sql`, `task-650-verify-applied.sql`, `supabase-promoted-columns-write-path-2026-06.sql` (`SELECT 1;`) |
| Deprecated / archive | ~8 | `supabase-ui-tooltips.sql` (README says do not run), `archive/*` (6) |

**The dominant category (30 files, 29%) is one-off content edits.** These are archives of applied changes, not migrations, and they inflate `sql/` to the point where the ~14 files that actually define the schema are hard to find.

### 1.5 Proposed migration workflow (1–2 person team, low effort)

Deliberately small — no CI system, no new tooling beyond the Supabase CLI the backup script already looks for (`scripts/supabase-backup.ps1:26-37`).

1. **Capture the baseline once (highest-value single action).**
   `supabase db dump --db-url $DIRECT_URL -f sql/schema/0000_baseline.sql` and **commit it**. This alone converts F1 from P0 to a solved problem and gives every future audit a diff target. Do it before anything else.
2. **Restructure `sql/` into three folders** (pure `git mv`, no SQL edits):
   - `sql/schema/` — numbered, forward-only, `NNNN_name.sql`, run in order on a fresh DB.
   - `sql/data/` — codex content edits (the 30 files). Never part of a schema rebuild.
   - `sql/archive/` — everything superseded. Add a one-line `-- SUPERSEDED BY <file>` header, which also fixes the F5 replay traps.
3. **Every new schema change gets the next number**, is written idempotent, and starts with a 5-line header: purpose, prerequisites, destructive Y/N, applied-on date, replay-safe Y/N. Most existing files already have most of this — make it a template.
4. **Drift check as a 5-line npm script** (`npm run db:diff`): dump the live schema to a temp file and `git diff --no-index` it against `sql/schema/0000_baseline.sql` + subsequent migrations. Run it before each release. When it is noisy, that *is* the finding.
5. **Guard destructive SQL by convention:** any file containing `DROP TABLE` / `DROP COLUMN` / `DROP SCHEMA` / unqualified `DELETE`/`UPDATE` gets the filename prefix `DESTRUCTIVE_` and a mandatory `\echo` / precondition `DO $$ … RAISE EXCEPTION` block asserting its prerequisite. Cheap, and it makes the `sql/` listing self-documenting.
6. **Back up before every apply** — `npm run backup:all` already exists (`package.json`). Make it step 0 of the runbook and fix the two gaps in §8.

---

## 2. Table inventory

Legend: **RLS?** = `ENABLE ROW LEVEL SECURITY` present in a repo `.sql` file. **TS type** = a dedicated interface describing the *DB row*. **Doc'd** = appears in `SUPABASE_SCHEMA.md`.
`—` = absent. `(archive)` = only defined in `sql/archive/*`, i.e. not reproducible on the current DB.

| Table | `CREATE` in repo | PK | FKs + ON DELETE | RLS? | Policies (repo) | Indexes | CHECK / UNIQUE | TS row type | Doc'd |
|---|---|---|---|---|---|---|---|---|---|
| `user_profiles` | **—** (archive `users.*`) | `id` TEXT | none | ✔ | own SELECT/INSERT/UPDATE/DELETE + `trg_prevent_unauthorized_role_change` | `user_profiles_username_key` (archive) | `username` UNIQUE (archive DDL only) | — (ad-hoc `{role?}`) | ✔ |
| `usernames` | **—** (archive) | `username` | `user_id`→`user_profiles` **CASCADE** | ✔ | own-row SELECT (`usernames-select-restrict:5`); ins/upd/del own (archive) | `idx_usernames_user_id` | — | — | ✔ |
| `characters` | **—** (archive) | `id` TEXT | `user_id`→`user_profiles` CASCADE (archive) | ✔ | `characters_select_authenticated`, `characters_select_public_anon`, own write (batch2) | `characters_user_id_idx`, `_user_id_updated_at_idx` (archive) | **none** | — (test-only) | ✔ |
| `campaigns` | **—** (archive) | `id` TEXT | **`owner_id` has no FK** | ✔ | `campaigns_select_participants`, `campaigns_owner_insert/update/delete` | `campaigns_owner_id_idx`, `campaigns_invite_code_idx` (archive, **non-unique**) | **none — `invite_code` not UNIQUE** | `Campaign` (API shape, not row) | ✔ (**still lists dropped `memberIds`**) |
| `campaign_members` | wrong schema | (`campaign_id`,`user_id`) | `campaign_id`→`campaigns` CASCADE; **`user_id` no FK** | ✔ | `campaign_members_select_participants` / `_insert_owner_or_self` / `_update_self` / `_delete_owner_or_self` | both cols (archive/part1b) | PK only | — | ✔ |
| `campaign_rolls` | **—** (archive) | `id` TEXT | `campaign_id`→`campaigns` CASCADE (archive); **`user_id` no FK** | ✔ | read (participants), `Participants insert own rolls`, `Owner or author deletes rolls`; **no UPDATE policy (intentional)** | `campaign_rolls_campaign_id_idx`, `_created_at_idx` (archive) | **none** | `RollRow` (route-local) | ✔ |
| `encounters` | **—** (archive) | `id` TEXT | **`user_id` no FK** | ✔ | own CRUD (batch2) | `encounters_user_id_idx`, `_updated_at_idx` (archive) | **none** | — | ✔ |
| `codex_feats` | **—** (archive `codex.*`) | `id` TEXT | none | ✔ | `Anyone can read …` `USING (true)` | — | **none** | `CodexFeat` (API shape) | ✔ |
| `codex_skills` | **—** | `id` | none | ✔ | read-all | — | none | `CodexSkill` | ✔ |
| `codex_species` | **—** | `id` | `image_id`→`realms_images` **SET NULL** | ✔ | read-all | `idx_codex_species_image_id` (partial) | none | `CodexSpecies` | ✔ |
| `codex_traits` | **—** | `id` | none | ✔ | read-all | — | none | ✔ | ✔ |
| `codex_parts` | **—** | `id` | none | ✔ | read-all | — | none | `CodexPart` | ✔ |
| `codex_properties` | **—** | `id` | none | ✔ | read-all | — | none | `CodexItemProperty` | ✔ |
| `codex_equipment` | **—** | `id` | `image_id`→`realms_images` SET NULL | ✔ | read-all | `idx_codex_equipment_image_id` | none | ✔ | ✔ |
| `codex_archetypes` | **—** | `id` | none | ✔ | read-all | — | none | `Archetype` | ✔ |
| `codex_archetype_levels` | `codex-archetypes-path-columns.sql:23` | `id` bigserial | `archetype_id`→`codex_archetypes` **CASCADE** | ✔ | read-all | — | **`CHECK (level >= 2)`**, **`UNIQUE (archetype_id, level)`** | — | ✔ |
| `codex_creature_feats` | **—** | `id` | none | ✔ | read-all | — | none | ✔ | ✔ |
| `core_rules` | `create-public-core-rules.sql:12` | `id` TEXT | none | ✔ | read-all | — | none | `CoreRules*` (content types) | ✔ |
| `official_powers` | `…public-schema.sql:11` | `id` TEXT | `image_id`→`realms_images` SET NULL | ✔ | read-all + 3 admin write | `official_powers_action_type_idx`, `idx_…_image_id` | **none**; `name` nullable | `OfficialPowerRow`, `LibraryPower` | ✔ |
| `official_techniques` | `:26` | `id` | `image_id` SET NULL | ✔ | read-all + 3 admin | `…action_type_idx`, image_id | none | `OfficialTechniqueRow` | ✔ |
| `official_empowered_techniques` | `empowered-…:51` | `id` | `image_id` SET NULL | ✔ | read-all + 3 admin | image_id only | none | `LibraryTechnique` | ✔ |
| `official_items` | `:54` | `id` | `image_id` SET NULL | ✔ | read-all + 3 admin | `official_items_type_rarity_idx`, image_id | none | `LibraryItem` | ✔ |
| `official_creatures` | `:70` | `id` | `image_id` SET NULL | ✔ | read-all + 3 admin | image_id | none | `OfficialCreatureRow` | ✔ |
| `official_enhanced_items` | **markdown only** (`SUPABASE_SCHEMA.md:246`) | `id` uuid | none | ✔ (hardening:209) | read-all + 3 admin | rarity, updated_at, +3 | `NOT NULL` on 8 cols | `official-enhanced-list.ts` | ✔ |
| `user_powers` | **—** (archive) | `id` | `user_id`→`user_profiles` CASCADE (archive); `image_id` SET NULL | ✔ | own CRUD | `user_powers_user_id_idx`(archive), `_user_id_action_type_idx`, image_id | none | `LibraryPower` | ✔ |
| `user_techniques` | **—** | `id` | same | ✔ | own CRUD | `_user_id_idx`(archive), `_user_id_action_type_idx`, image_id | none | `LibraryTechnique` | ✔ |
| `user_empowered_techniques` | `empowered-…:10` | `id` TEXT | `user_id`→`user_profiles` **CASCADE**; `image_id` SET NULL | ✔ | own CRUD | `_user_id_idx`, image_id | none | `LibraryTechnique` | ✔ |
| `user_items` | **—** | `id` | same as user_powers | ✔ | own CRUD | `_user_id_type_rarity_idx`, image_id | none | `LibraryItem` | ✔ |
| `user_creatures` | **—** | `id` | same | ✔ | own CRUD | `_user_id_idx`(archive), image_id | none | `LibraryCreature` | ✔ |
| `user_species` | columns only (`…columnar.sql:8`) | `id` | `user_id`→`user_profiles` CASCADE (archive); `image_id` | ✔ | own CRUD (`…grants-rls.sql:19-38`) | `_user_id_idx`(archive), image_id | none | `LibrarySpecies` | ✔ |
| `crafting_sessions` | **markdown only** (`SUPABASE_SCHEMA.md:180`) | `id` uuid | `user_id`→**`user_profiles`** CASCADE (`be01:32-34`) | ✔ | own CRUD (`be01:36-39`) | user_id, updated_at | `status` has DEFAULT, **no CHECK** | — | ✔ (**says UUID→auth.users — wrong**) |
| `user_enhanced_items` | **markdown only** (`:215`) | `id` uuid | `user_id`→**`user_profiles`** CASCADE (`be01:56-58`) | ✔ | own CRUD (`be01:60-63`) | user_id, updated_at | — | `EnhancedRow` (test) | ✔ (**same UUID error**) |
| `role_policies` | `supabase-role-policies.sql:2` | `role` enum | `updated_by`→`auth.users` **SET NULL** | ✔ | `role_policies_select_authenticated` **`USING (true)`**, admin insert/update/delete | `idx_role_policies_updated_by` | 7× `NOT NULL` | `RolePolicyRow` ×2 (duplicated) | ✔ |
| `admin_role_audit` | `…audit-2026-06.sql:12` | `id` uuid | none | ✔ | **SELECT-only (admin)**; no write policy → service-role only ✔ | `idx_admin_role_audit_target` | `NOT NULL` ×4 | — | ✔ |
| `codex_change_logs` | `…change-logs.sql:4` | `id` uuid | `changed_by_user_id`→`auth.users` **RESTRICT** ⚠ | ✔ | `codex_change_logs_admin_select`; no write policy ✔ | 3 composite | **`CHECK (operation IN …)`** | — | ✔ |
| `realms_images` | `realms-image-library.sql:39` | `id` uuid | `created_by`→`auth.users` SET NULL | ✔ | read-all; no write policy ✔ | `_name_ilike`, `_created_at`, `_created_by` | **`storage_path` UNIQUE**, `NOT NULL` ×4 | `RealmsImageRow` | ✔ |
| `realms_image_categories` | `:67` | (`image_id`,`category`) | `image_id`→`realms_images` **CASCADE** | ✔ | read-all; no write ✔ | `_category` | enum column | — | ✔ |
| `ui_tooltips` | `supabase-ui-tooltips.sql:9` | `key` | — | ✔ | — | 3 | 3 CHECKs | — | ✔ (marked removed) |
| `vtt_*` | **NOWHERE** | ? | ? | ? | ? | ? | ? | — | mentioned only |
| `public_powers/techniques/items/creatures` | archive only | `id` | none | ✔ (archive) | read-all | — | none | — | ✔ (marked dropped) |

**Aggregate:** ~40 tables. **27 have no repo `CREATE TABLE`.** **2 CHECK constraints total.** **2 UNIQUE constraints total** (`codex_archetype_levels`, `realms_images.storage_path`). **0 `updated_at` triggers wired**, despite `set_updated_at_timestamp()` existing at `supabase-security-hardening-2026-06.sql:13`.

### 2.1 JSONB used where relational structure is needed

| Column | What it hides | Cost |
|---|---|---|
| `characters.data` (JSONB) | The **entire character sheet**: feats, archetypeFeats, traitCustomizations, tempModifiers, inventory, skills, abilities, `visibility`, `status` | RLS itself parses `data->>'visibility'` (`…cross-read.sql:19`, `be04:112`) — **authorization depends on an unconstrained JSON key**. No FK from a character's feats/powers to `codex_feats`/`official_powers`, so codex deletions silently orphan sheet references. |
| `campaigns.characters` (JSONB array) | The campaign roster (`{userId, characterId, characterName, level, …}`) | The `characters` RLS policy does `CROSS JOIN LATERAL jsonb_array_elements(...)` **per row** (`be04:118-136`) and has to handle both camelCase and snake_case key spellings — a normalized `campaign_characters` table would make this an index lookup. |
| `campaign_rolls.data` | Full roll payload; 4 keys promoted to columns after the fact | — |
| `encounters.data` | Combatants, rounds, turn index, skill-encounter state | Whole encounter is one blob; concurrent edits are last-write-wins. |
| `official_*/user_*.payload` | `parts`, nested `range`/`area`/`duration` extras, `attackMode` | Deliberate and documented (`SUPABASE_SCHEMA.md:70-72`); acceptable. |
| `codex_archetypes.path_data` + `level1_guidance_groups` + `level1_recommended_abilities` + `level1_loadouts` | Level-1 build guidance; `path_data` is a legacy duplicate of the `level1_*` columns | Two representations of the same data kept in sync by hand — `codex-archetypes-drop-recommended-species.sql` has to edit **both** (`:11` and `:18`/`:44`). |
| `role_policies.permissions` | `can_upload_profile_picture` (single boolean) | Over-general for one flag. |
| `codex_*` "array" fields stored as **comma-separated TEXT** (`ability_req`, `tags`, `skills`, `sizes`, `level1_feats`, …) | Real arrays, split in TS at `api/codex/route.ts:26-31` | No referential integrity, no containment index, and `feat-tags-unification-phase*.sql` exists solely to normalize a delimiter problem this creates. |

### 2.2 Enum-as-text with no constraint

Every one of these is a free-text column in SQL with a fixed vocabulary in TS:

`characters.status`, `characters.visibility`, `encounters.type`, `encounters.status`, `campaign_rolls.type`, `official_items.type`, `official_items.rarity`, `user_items.type/rarity`, `official_creatures.type/size`, `official_*/user_*.action_type`, `official_*.duration_type`, `official_*.area_type`, `codex_species.type`, `codex_archetypes.type`, `crafting_sessions.status`, `official_enhanced_items.base_item_source/power_source/uses_type/rarity`.

Only two enums are real Postgres types: `public."UserRole"` and `public.realms_image_category`.

### 2.3 Index vs actual query patterns

| App query | Index situation |
|---|---|
| `characters` `.eq(user_id).order(updated_at desc)` (`api/characters/route.ts:33`) | `characters_user_id_updated_at_idx` exists **only in `archive/supabase-idempotent-full.sql:115`** — present live only because it survived `SET SCHEMA`. Not reproducible. Same for `encounters`, `campaigns`, `campaign_rolls`, `user_powers/techniques/items/creatures/species`. |
| `campaigns` join-by-invite `.eq(invite_code)` | `campaigns_invite_code_idx` archive-only **and non-unique** (F7). |
| `realms_images` `.ilike('name', '%q%')` (`api/images/route.ts:85`) | `idx_realms_images_name_ilike` is `btree(lower(name))` — **cannot serve a leading-wildcard ILIKE**. Needs `pg_trgm` GIN. (F17) |
| `user/library/[type]` `.ilike('name', pattern)` (`route.ts:72`) | No name index on `user_*`; saved by the preceding `user_id` equality filter. Acceptable today. |
| `user_profiles` `.ilike('username', …)` (`admin/users/update-role/route.ts:51`) | `user_profiles_username_key` is a plain btree — ILIKE will not use it. Small table; fine. |
| `campaign_rolls` `.order(created_at desc).order(id desc)` (`rolls/route.ts:105`) | `campaign_rolls_campaign_id_created_at_idx` (archive-only) covers it. |
| `codex_change_logs` `.order(changed_at desc)` | Covered by `idx_codex_change_logs_entity_type_changed_at`. ✔ |
| FK covering indexes | `campaign_members.user_id`, `usernames.user_id`, `role_policies.updated_by`, `realms_images.created_by`, all `image_id` (partial) — covered. `campaigns.owner_id`, `campaign_rolls.user_id`, `encounters.user_id` are **FK-less**, so nothing to cover, but also nothing enforcing integrity (F10). |

---

## 3. Destructive statements in the repo (F11)

Ranked by "damage if a human pastes it into the SQL Editor on the wrong day."

### 3.1 Catastrophic if misrun

| file:line | Statement | Why |
|---|---|---|
| `sql/path-c-phase0-consolidate-to-public-part2.sql:133` | `DROP SCHEMA IF EXISTS users CASCADE;` | Drops `user_profiles`, `usernames`, `characters`, all `user_*` **with data** if Part 1a did not run. |
| `sql/path-c-phase0-consolidate-to-public-part2.sql:134` | `DROP SCHEMA IF EXISTS campaigns CASCADE;` | Drops campaigns/members/rolls. |
| `sql/path-c-phase0-consolidate-to-public-part2.sql:135` | `DROP SCHEMA IF EXISTS codex CASCADE;` | Drops all codex reference content. |
| `sql/path-c-phase0-consolidate-to-public-part2.sql:136` | `DROP SCHEMA IF EXISTS encounters CASCADE;` | Drops encounters. |
| `sql/archive/supabase-codex-tables-columnar.sql:15-23` | 9× `DROP TABLE IF EXISTS codex.codex_*;` | Unconditional table drops at the top of a "create tables" script. |
| `sql/archive/force-drop-codex-core-rules-part-b-drop.sql:20` | `DROP TABLE IF EXISTS codex.core_rules CASCADE;` | — |
| `sql/archive/force-drop-codex-core-rules-part-a-terminate.sql:27` | `PERFORM pg_terminate_backend(r.pid);` | Kills every live session holding a lock. |
| `sql/archive/supabase-user-library-columnar.sql:24,42,70,101` | `ALTER TABLE users.user_* DROP COLUMN data;` | Drops the source JSONB immediately after a backfill in the same block — no verification gate. |
| `sql/supabase-user-species-columnar.sql:44` | `ALTER TABLE public.user_species DROP COLUMN data;` | Same pattern, on a **current** (non-archive) file. Backfill and drop in one `DO $$` with no row-count check. |

### 3.2 Destructive but `IF EXISTS`-guarded and re-runnable

| file:line | Statement |
|---|---|
| `sql/drop-legacy-ui-tooltips-2026-06.sql:5` | `DROP TABLE IF EXISTS public.ui_tooltips CASCADE;` |
| `sql/drop-legacy-ui-tooltips-2026-06.sql:7` | `DROP FUNCTION IF EXISTS public.set_ui_tooltips_updated_at() CASCADE;` |
| `sql/drop-legacy-ui-tooltips-2026-06.sql:9` | `ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS show_tooltips;` |
| `sql/drop-technique-weapon-name-column.sql:9,10,11,12` | 4× `DROP COLUMN IF EXISTS weapon_name` |
| `sql/supabase-be02-membership-single-source-2026-06.sql:81` | `ALTER TABLE public.campaigns DROP COLUMN IF EXISTS "memberIds";` |
| `sql/codex-archetypes-drop-recommended-species.sql:77` | `drop column if exists level1_recommended_species;` |
| `sql/task-649-drop-codex-backup-tables-applied.sql:23,24,25,26` | 4× `DROP TABLE IF EXISTS public.codex_*_backup_*` |
| `sql/supabase-security-hardening-2026-06.sql:8` | `DROP TABLE IF EXISTS public._prisma_migrations;` |
| `sql/path-c-phase0-consolidate-to-public.sql:34` | `DROP TYPE IF EXISTS users."UserRole";` |
| `sql/supabase-be04-campaign-authz-private-schema-2026-06.sql:143,144` | `DROP FUNCTION IF EXISTS public.auth_is_campaign_*(text);` |
| `sql/realms-image-entity-columns.sql:72` · `sql/realms-image-user-entity-columns.sql:66` | `DROP FUNCTION public._add_entity_image_columns(...)` (**no `IF EXISTS`** — errors on re-run) |
| `sql/supabase-library-columnar-parity-expansion.sql:239,244,249,254,259,264,269,274` | 8× `DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_*` |
| `sql/supabase-codex-change-logs.sql:47` · `sql/supabase-ui-tooltips.sql:39` · `sql/supabase-role-escalation-fix-2026-06.sql:43` | `DROP TRIGGER IF EXISTS …` |
| `sql/task-649-index-hygiene-applied.sql:59-63` | 5× `DROP INDEX` — **commented out**, awaiting owner sign-off ✔ |

### 3.3 `DELETE` / `TRUNCATE`

| file:line | Statement | Assessment |
|---|---|---|
| `sql/empowered-techniques-separate-tables.sql:128` | `DELETE FROM public.user_techniques t WHERE EXISTS (… et.id = t.id)` | Deletes live user techniques whose id appears in the empowered table. Safe on first run; a re-run after any id reuse deletes real rows. |
| `sql/empowered-techniques-separate-tables.sql:159` | `DELETE FROM public.official_techniques t WHERE EXISTS (…)` | Same. |
| `sql/supabase-codex-change-logs.sql:31` · `sql/supabase-security-hardening-2026-06.sql:32` | `DELETE FROM public.codex_change_logs c WHERE … NOT IN (… LIMIT 10)` | Inside the retention trigger; bounded and intended. ✔ |
| `sql/feat-tags-unification-phase3-proposed.sql:17` | `TRUNCATE feat_tag_phase3_proposals;` | **TEMP table** created at `:12`. Harmless. ✔ |

### 3.4 `UPDATE` without `WHERE`

| file:line | Statement | Assessment |
|---|---|---|
| `sql/supabase-library-columnar-parity-expansion.sql:282-289` | 8× `UPDATE public.<table> SET payload = COALESCE(payload, '{}'::jsonb);` — **no `WHERE`** | Full-table rewrite of all 8 library tables (`official_powers`, `user_powers`, `official_techniques`, `user_techniques`, `official_empowered_techniques`, `user_empowered_techniques`, `official_items`, `user_items`), firing `sync_library_promoted_columns` for **every row**. Functionally idempotent because the trigger COALESCEs onto existing values, but it touches every user-owned library row and bumps no `updated_at`, so a re-run is invisible while doubling table bloat. |

All other `UPDATE`s in `sql/` carry a `WHERE` (spot-verified in `codex-archetypes-emdash-scrub-20260717.sql:17-19`, `supabase-storage-bucket-limits-2026-06.sql:23`, `realms-image-catalog-legacy-entity-art.sql:187-189,197-199,208-210`, `supabase-characters-list-columns.sql:26`, `supabase-encounters-list-columns.sql:16`, `supabase-campaign-rolls-list-columns.sql:18`, `supabase-user-profiles-username-display.sql:8`).

### 3.5 Destructive **JavaScript** (worse than any of the SQL) — F2, P0

`scripts/seed-to-supabase.js`:

| line | Code | Problem |
|---|---|---|
| `:190` | `await clearCodexTables();` | **First statement in `main()`.** Runs *before* the "do any CSVs exist?" checks at `:194`, `:202-215`, `:218-221` — each of which then `return`s. So `npm run db:seed` in an environment with no/misnamed CSVs **wipes the codex and exits cleanly**. |
| `:147-166` | `clearCodexTables()` | Deletes every row in all 9 `CODEX_TABLES` (`:46-56`) via `.delete().in('id', chunk)` (`:157`) using the **service-role key** (`:26`) — RLS does not apply. Errors are caught and logged, then it continues (`:161-163`). |
| `:12` | `* This script always clears all codex tables before seeding. Use with care.` | The doc comment is accurate; the guardrail is nonexistent. No `--yes`, no prompt, no dry-run. |
| `package.json` `db:seed:reset` | `node scripts/seed-to-supabase.js --reset` | **`--reset` / `process.argv` is never read anywhere in the file.** `db:seed` and `db:seed:reset` are byte-identical in behaviour — both destroy. |

**Compounding:** `codex_archetypes` is in `CODEX_TABLES` (`:53`) but **there is no `archetypes.csv` in `scripts/seed-data/` or `codex_csv/`**. So a seed run deletes all 12 archetypes, cascades to `codex_archetype_levels` (`codex-archetypes-path-columns.sql:25`, `on delete cascade`), and restores **nothing** — destroying the entire TASK-530 path-enrichment body of work (12 `codex-archetypes-enrich-*-applied.sql` files' worth of content) plus `level1_*` guidance, with only a 2026-04-21 backup to fall back on.

---

## 4. RLS as expressed in the SQL files

### 4.1 Coverage

Every table with a repo `CREATE`/DDL also has `ENABLE ROW LEVEL SECURITY` in some file. **No table in the repo has RLS enabled with zero policies** — the only historical instances (the four `codex_*_backup_*` tables) were removed at `task-649-drop-codex-backup-tables-applied.sql:23-26`. **No table has RLS disabled.** That part is genuinely in good shape.

Unverifiable from the repo: `vtt_*` (no SQL at all). **Flag for the live-DB auditor.**

### 4.2 `USING (true)` policies

| Policy | file:line | Verdict |
|---|---|---|
| `Anyone can read codex …` ×10 + `core_rules` | `supabase-codex-rls-public.sql:48,53,58,63,68,73,78,83,88,93,98` | Intentional (public reference data). ✔ |
| `Anyone can read official …` ×5 | `supabase-official-library-public-schema.sql:89,93,97,101,105` | Intentional. ✔ |
| `Anyone can read official enhanced items` | `supabase-security-hardening-2026-06.sql:213` | Intentional. ✔ |
| `Anyone can read realms images` / `… image categories` | `realms-image-library.sql:121,128` | Intentional. ✔ |
| **`role_policies_select_authenticated` — `FOR SELECT TO authenticated USING (true)`** | `supabase-role-policies.sql:80-84` | Any signed-in user reads every role's quotas and permission flags. Low harm, but it leaks the tiering model. **P3.** |
| `Portraits are publicly readable` / `Profile pictures are publicly readable` / `Codex art is publicly readable` | `supabase-storage-policies.sql:18-21,72-75`, `realms-image-library.sql:97-100` | `TO public USING (bucket_id = …)` — bucket-wide read **including listing**. Documented as intentional (`SUPABASE_SCHEMA.md:374`), and TASK-649 removed the `codex-art` listing policy live. Repo file still creates it → **replaying `realms-image-library.sql` reverts that hardening. P2.** |

### 4.3 `WITH CHECK` on INSERT/UPDATE

Checked every `CREATE POLICY` in `sql/`.

- **Every `FOR INSERT` policy has a `WITH CHECK`.** No policy lets a user insert a row owned by someone else. ✔
- **Every `FOR UPDATE` policy either has an explicit `WITH CHECK` or relies on Postgres' rule that an omitted `WITH CHECK` defaults to the `USING` expression.** The omissions are all admin-gate policies where `USING` is the correct new-row check anyway:
  `supabase-official-library-public-schema.sql:119-120,130-131,141-142,152-153,163-164` and `supabase-security-hardening-2026-06.sql:221-223` (`Admin can update official …`). Not a hole, but writing it explicitly would remove the need for a reviewer to know that rule. **P3.**
- `campaign_rolls` has **no UPDATE policy at all** — deliberate append-only design (`supabase-campaign-authz-2026-06.sql:79`). ✔

### 4.4 `auth.uid()` not wrapped in a subselect (per-row re-evaluation)

Supabase's `auth_rls_initplan` advisor. Repo files still containing bare `auth.uid()` inside a policy predicate:

| file:line | Policy |
|---|---|
| `supabase-official-library-public-schema.sql:117,120,123,128,131,134,139,142,145,150,153,156,161,164,167` | 15 admin policies on the 5 `official_*` tables |
| `supabase-security-hardening-2026-06.sql:218,223,228` | 3 admin policies on `official_enhanced_items` |
| `empowered-techniques-separate-tables.sql:75,85,95` | 3 admin policies on `official_empowered_techniques` |
| `supabase-role-policies.sql:95,103` | `role_policies_admin_write` |
| `supabase-admin-role-audit-2026-06.sql:32` | `Admins can read role audit` |
| `supabase-codex-change-logs.sql:68` | `codex_change_logs_admin_select` |
| `supabase-campaign-authz-2026-06.sql:40,45,46,49,64,66,68,71` | `Participants insert own rolls`, `Owner or author deletes rolls` |
| `supabase-storage-policies.sql:30,40,44,54,68,83,87,96` | 8 storage object policies |

**26+ instances.** Later files (`supabase-rls-initplan-fk-indexes-2026-06.sql:185-229`, `…-batch2`, `…-consolidate-permissive`, `be02`, `be04`) rewrote many of these with `(select auth.uid())`, so live is likely mostly fixed — **but the un-wrapped versions are still the ones a fresh-environment rebuild would apply.** Each of these also does an `EXISTS (SELECT 1 FROM public.user_profiles …)` subquery per row; on a large `official_*` table that is a `user_profiles` lookup per candidate row. **P2 for maintainability, P1 for any fresh env.**

### 4.5 Admin policies based on a client-settable claim

**No.** Every admin check reads `public.user_profiles.role` from the database (`… WHERE up.id = auth.uid()::text AND up.role = 'admin'`), never a JWT claim like `auth.jwt() ->> 'role'` or `raw_user_meta_data`. Correct pattern. ✔

The obvious follow-on risk — a user setting their own `role` — is closed by a `BEFORE UPDATE OF role` trigger at `supabase-role-escalation-fix-2026-06.sql:27-47`, which raises `42501` unless `auth.role() = 'service_role'`. The header (`:3-9`) documents this as a previously-live P0. **Good remediation.**

Residual gap: the trigger is `BEFORE UPDATE OF role`, so `INSERT` is unguarded by design (`:22`). A user whose profile row does not yet exist could self-insert with `role = 'admin'` — the `Users can insert own profile` policy (`archive/supabase-idempotent-full.sql:220`) only checks `id = auth.uid()`, not the role column. Whether that is reachable depends on the live `ensure-user-profile` flow. **Flag for the live-DB auditor. Potential P0 if a user can insert their own profile row.**

### 4.6 `SECURITY DEFINER` functions and `search_path`

| Function | file:line | `search_path` pinned? | Exposure |
|---|---|---|---|
| `private.auth_is_campaign_owner(text)` | `be04:21-32` | ✔ `SET search_path TO 'public'` | `private` schema not in PostgREST exposed list; `REVOKE ALL … FROM PUBLIC` (`:56`), `GRANT EXECUTE … TO authenticated` (`:59`). ✔ |
| `private.auth_is_campaign_participant(text)` | `be04:34-52` | ✔ | Same. ✔ |
| `public.auth_is_campaign_owner(text)` | `…recursion:19-31` | ✔ | **Superseded** — dropped at `be04:143`. |
| `public.auth_is_campaign_participant(text)` | `…recursion:33-53`, `be02:35-53` | ✔ | **Superseded** — dropped at `be04:144`. |
| `public.rls_auto_enable()` | referenced `…hardening:233-234` | Not defined in repo | `REVOKE ALL … FROM PUBLIC, anon, authenticated`. Its body is live-only — **flag for the live-DB auditor.** |

**All SECURITY DEFINER functions in the repo pin `search_path`.** ✔

Non-`SECURITY DEFINER` functions missing `search_path` (Supabase linter 0011):
`map_feat_tag_phase1` (`feat-tags-unification-phase1.sql:13`), `map_feat_tag_phase2` (`phase2.sql:14`), `normalize_feat_tags` (`phase2.sql:68`), and all four again in `phase4.sql:13,92,135,309` — created **unqualified**, so they land in whatever the session `search_path` resolves to. `task-649-feat-tag-function-search-path-applied.sql:19,92,126,262` fixed all four with `public.` qualification + `SET search_path = public`. **The unfixed originals remain in `sql/` with no "superseded" header — re-running them reverts the fix (F5).**
`public._add_entity_image_columns` (`realms-image-entity-columns.sql:14`) also lacks `search_path`, but is dropped at `:72`. ✔

**No `SECURITY DEFINER` views** anywhere in `sql/`.

### 4.7 Other RLS observations

- `be04:84,89,97` create `campaign_rolls` policies `FOR SELECT/DELETE/INSERT **TO public**` (not `TO authenticated`). Harmless in effect — `private.auth_is_campaign_participant` returns false when `auth.uid()` is null, and `GRANT USAGE ON SCHEMA private` is `authenticated`-only (`:58`) — so anon gets a permission error rather than rows. Inconsistent with every neighbouring policy. **P3.**
- `characters` RLS authorizes on `data->>'visibility'` (`be04:112,114`) while the app lists on the separate `characters.visibility` **column** (`supabase-characters-list-columns.sql:12`). Nothing keeps them in sync, and `supabase-promoted-columns-write-path-2026-06.sql:24` asserts "there is no raw client write path (RLS forbids anon/other-user writes)" — which is only half true: RLS permits a user to write **their own** rows directly via PostgREST, bypassing the API route that maintains both. A desynced pair means a sheet that reads `private` in the DB blob but lists as `public`, or vice versa. **P2.**

---

## 5. Doc vs SQL drift (`SUPABASE_SCHEMA.md`)

Explicit list so the live-DB audit can diff all three sources.

### 5.1 Documented but contradicted by the SQL

| Doc location | Doc says | SQL says | Sev |
|---|---|---|---|
| `:149` | `campaigns` … `memberIds (JSONB)` | **Dropped** at `supabase-be02-…:81` | P1 |
| `:175` | `crafting_sessions` … `user_id (**UUID** → auth.users)` | **`text` → `public.user_profiles(id)`** (`be01:28,32-34`) | P1 |
| `:182` | fenced DDL: `user_id UUID NOT NULL REFERENCES auth.users(id)` | same as above — **the fenced migration is now wrong and would recreate the pre-`be01` shape** | P1 |
| `:196-199` | fenced policies `USING (auth.uid() = user_id)` | post-`be01` `user_id` is `text`; correct form is `(SELECT auth.uid())::text = user_id` (`be01:36-39`). **The doc's SQL would fail with a uuid/text operator error.** | P1 |
| `:208` | `user_enhanced_items` … `user_id (**UUID** → auth.users)` | **`text` → `user_profiles`** (`be01:52,56-58`) | P1 |
| `:217,229-232` | fenced DDL + policies with `UUID` / `auth.uid() = user_id` | same defect | P1 |
| `:150` | `campaign_members` \| Columnar \| `campaign_id (PK), user_id (PK)` | Correct, but the only DDL in `sql/` targets the **dropped `campaigns` schema** | P2 |
| `:47` | `codex_archetypes` … `path_data (JSONB, optional — pre-columnar compat)` | Still actively written by `codex-archetypes-drop-recommended-species.sql:44` and `…creator-layer1-extensions.sql:38` — "legacy" understates it | P3 |

### 5.2 In the SQL / live but absent or thin in the doc

| Object | Where in SQL | Doc |
|---|---|---|
| `official_techniques.range_steps, duration_type, duration_value, damage` | `…parity-expansion.sql:38-42` | Doc says only "promoted columns" (`:61`) — never enumerates them |
| `official_items.range_steps, is_two_handed, ability_requirement, costs, damage, properties, agility_reduction, critical_range_increase, shield_dr, shield_damage` | `…parity-expansion.sql:65-75` | Same — "promoted columns" (`:63`) |
| `official_powers.range_steps, duration_type, duration_value, area_type, area_level, damage` | `…parity-expansion.sql:19-25` | "range/duration/area/damage columns" (`:60`) — not itemized |
| identical promoted sets on `user_powers/techniques/empowered_techniques/items` | `…parity-expansion.sql:27-33,44-60,77-87` | `:82-86` say only "payload (JSONB)" |
| `codex_species.payload` (JSONB NOT NULL DEFAULT '{}') | `supabase-codex-species-payload.sql:4` | **Not documented at all** |
| `codex_species.is_starter` | `guided-creator-schema-seed.sql:15` | ✔ `:42` |
| `campaign_rolls.user_id` (added as a list column) | `supabase-campaign-rolls-list-columns.sql:8` | ✔ `:151`, but it is load-bearing for RLS (`be04:98`) and the doc treats it as a display column |
| `codex_archetype_levels.created_at/updated_at` | `codex-archetypes-path-columns.sql:38-39` | Not listed at `:48` |
| `role_policies.updated_by` FK → `auth.users` SET NULL | `supabase-role-policies.sql:13` | Named at `:296`, FK/on-delete not stated |
| `codex_change_logs.changed_by_user_id` FK **ON DELETE RESTRICT** | `supabase-codex-change-logs.sql:10` | `:308` says "FK auth.users" — **omits `RESTRICT`, the part that blocks user deletion** |
| `realms_images.storage_path` UNIQUE | `realms-image-library.sql:42` | `:95` says "(unique)" ✔ |
| **`vtt_*` tables** | **nowhere** | Referenced at `:372` as existing and out of scope | 
| `public.set_updated_at_timestamp()` | `…hardening:13-22` | Not mentioned; and **not attached to any table** |

### 5.3 Doc-internal inconsistency

- `:56` "Legacy `public_*` JSONB tables … were **dropped** … not present in production" vs `supabase-official-library-public-schema.sql:174-299`, which is entirely a `public_* → official_*` backfill still presented as runnable (`sql/README.md:108`). Dead code in a schema-of-record file.
- `sql/README.md:168` marks `supabase-ui-tooltips.sql` "**Deprecated** — do not run", but the file itself carries no header saying so. Same pattern for every superseded file (F5).

---

## 6. Types vs schema (F9)

### 6.1 There are no generated types

`src/types/**` = 20 files, **all hand-written**. No `Database` type, no `database.types.ts`, no `supabase gen types` in `package.json`. `createClient()` is used untyped, so every `.from('x').select()` returns `any`-ish data that is then cast.

**Where DB row shapes actually live:** re-declared ad-hoc, per route:

| Row type | File:line | Table |
|---|---|---|
| `CampaignRow` | `src/app/api/campaigns/route.ts:15` | `campaigns` |
| `CampaignRow` (**second, independent copy**) | `src/app/api/campaigns/[id]/route.ts:25` | `campaigns` |
| `CampaignRow` (**third copy, in a test**) | `src/app/api/campaigns/route.test.ts:29` | `campaigns` |
| `RolePolicyRow` | `src/lib/role-policy.ts:18` | `role_policies` |
| `RolePolicyRow` (**second copy**) | `src/app/api/admin/role-policies/route.ts:16` | `role_policies` |
| `RolePolicyRow` (**third copy**) | `src/app/(main)/admin/users/page.tsx:27` | `role_policies` |
| `RollRow` | `src/app/api/campaigns/[id]/rolls/route.ts:15` | `campaign_rolls` |
| `RealmsImageRow` | `src/lib/realms-images-server.ts:14` | `realms_images` |
| `CharacterRow` | `src/app/api/characters/[id]/route.test.ts:55` | `characters` — **test-only; production code has no row type** |
| `EnhancedRow` | `src/app/api/user/enhanced-items/[id]/route.test.ts:37` | `user_enhanced_items` — test-only |
| `Row = Record<string, unknown>` | `src/app/api/codex/route.ts:49` | **all 10 codex tables** |

`src/lib/library-columnar.ts` bridges the columnar tables with two hand-maintained string maps — `BODY_TO_CAMEL` (`:85-105`) and `CAMEL_TO_SNAKE` (`:107-130`) — plus a fallback regex (`:136`). Adding a column to `official_items` requires editing `SCALAR_KEYS` (`:61-81`) **and** both maps; miss one and the column silently round-trips as `undefined`.

### 6.2 Provable mismatches

| # | Table.column | SQL | TS | Consequence | Sev |
|---|---|---|---|---|---|
| 1 | `crafting_sessions.user_id` | `text` → `user_profiles` (`be01:28,32-34`) | Doc + fenced DDL say `UUID` → `auth.users` (`SUPABASE_SCHEMA.md:175,182`) | Anyone regenerating this table from the doc gets an incompatible column and RLS that throws `operator does not exist: uuid = text` | P1 |
| 2 | `user_enhanced_items.user_id` | `text` → `user_profiles` (`be01:52,56-58`) | Same doc error (`:208,217`) | Same | P1 |
| 3 | `campaigns.memberIds` | **column dropped** (`be02:81`) | `Campaign.memberIds: string[]` **required** (`src/types/campaign.ts:37`) | Not a runtime bug — the routes now derive it from `campaign_members` (`api/campaigns/route.ts:98`, `[id]/route.ts:71`) — but the type name implies a column that no longer exists, and the doc still lists it | P2 |
| 4 | `codex_skills.base_skill` | `TEXT` (`SUPABASE_SCHEMA.md:41`, `skills.csv` header) | `CodexSkill.base_skill_id?: number` (`src/types/codex.ts:110`) | Name **and** type both differ; reconciled by a `parseInt` at `api/codex/route.ts:149-152`. A non-numeric `base_skill` silently becomes `undefined` | P2 |
| 5 | `codex_feats.ability_req / abil_req_val / skill_req / skill_req_val / tags` | comma-separated `TEXT` (`SUPABASE_SCHEMA.md:40`) | `string[]` / `number[]` (`src/types/codex.ts:84-88`) | Intentional API normalization (`api/codex/route.ts:26-39`), but no type describes the **row**, so any code reading these tables outside `/api/codex` sees raw CSV strings with no compiler help | P2 |
| 6 | `official_*.name`, `description`, `action_type`, `created_at`, `updated_at` | **all nullable** (`…public-schema.sql:13-19`) | `LibraryPower.name: string` **non-optional** (`src/types/library.ts:47`); same on `LibraryTechnique:74`, `LibraryItem:108`, `LibraryCreature:160` | A row with `name = NULL` yields `name: undefined` typed as `string`. Masked today because `rowToItem` coalesces, but the type is a lie about the table | P1 |
| 7 | `official_creatures.level`, `user_creatures.level` | `INTEGER` **nullable** (`…public-schema.sql:74`) | `LibraryCreature.level: number` **required** (`src/types/library.ts:162`) | Same class of defect | P1 |
| 8 | `official_items.type` | `TEXT`, **no CHECK** | `LibraryItem.type: 'weapon'\|'armor'\|'equipment'\|'shield'` (`src/types/library.ts:110`) | TS narrows to 4 values the DB does not enforce; a fifth value from any other writer breaks exhaustive switches at runtime | P1 |
| 9 | `official_*/user_*.weapon_name` | **dropped** (`drop-technique-weapon-name-column.sql:9-12`) | `LibraryTechnique.weaponName?: string` (`src/types/library.ts:81`) | Correctly re-labelled "derived … not persisted" in the JSDoc ✔ — but `CAMEL_TO_SNAKE` has no entry, so the generic regex at `library-columnar.ts:136` would map `weaponName → weapon_name` and attempt to write a dropped column if it ever reached `toDbRow` | P2 |
| 10 | `role_policies.permissions` | `JSONB NOT NULL DEFAULT '{}'` (`supabase-role-policies.sql:11`) | `permissions: Record<string, unknown> \| null` (`src/lib/role-policy.ts:27`) | Nullable in TS, `NOT NULL` in SQL — harmless over-defensiveness, but it is drift in the safe direction and shows the types are guesses | P3 |
| 11 | `characters.level` | `INTEGER`, **no CHECK** (`…list-columns.sql:8`) | `z.number().int().min(1).max(20)` (`api-validation.ts:105,112`) | Range enforced only at the API; a direct PostgREST write stores any integer | P1 (see §7) |
| 12 | `characters.visibility` | `TEXT`, no CHECK (`…list-columns.sql:12`) | `z.enum(['private','campaign','public'])` (`api-validation.ts:113`) | Same — and this column's sibling (`data->>'visibility'`) is what RLS reads | P1 |
| 13 | `public."UserRole"` | enum: `new_player, playtester, developer, admin` | `USER_ROLES` (`api-validation.ts:357`), `ROLE_VALUES` (`role-policy.ts:31`), `ROLE_LIMITS` keys (`role-limits.ts:22`), `ROLE_LABELS` (`role-quota-messages.ts:9`) | **4 independent copies, all currently correct.** Adding a 5th role means 5 edits with no compiler linkage to the DB | P2 |
| 14 | `public.realms_image_category` | enum ×8: `species, creature, weapon, armor, shield, equipment, power, technique` | Vocabulary in `src/lib/realms-images.ts` | Verified consistent ✔ | — |
| 15 | `vtt_*` | unknown (no SQL) | none | Cannot be checked | P2 |

### 6.3 Recommendation: adopt generated types

**Yes — this is the single highest-leverage type fix.** Add `"db:types": "supabase gen types typescript --project-id <id> > src/types/supabase.ts"` and type the client as `createClient<Database>()`.

It resolves mismatches 1, 2, 6, 7, 8, 10 immediately at compile time, deletes the three duplicate `CampaignRow`s and three duplicate `RolePolicyRow`s, replaces `Row = Record<string, unknown>` in the codex route with real shapes, and — because `Database` is regenerated from the live DB — it doubles as **drift detection**: a `git diff` on `src/types/supabase.ts` after regeneration is exactly the schema drift report this repo currently has no way to produce. Keep the hand-written `Library*` / `Codex*` types; they legitimately describe **API response** shapes, not rows. The correct layering is `Database['public']['Tables']['official_powers']['Row'] → rowToItem() → LibraryPower`.

---

## 7. Constants vs constraints (F6)

`src/lib/constants/**` is 19 files, of which **16 are UI copy** (`constants/copy/*.ts`, `site-copy.ts`, `ability-effect-blurbs.ts`) with no DB coupling. The DB-adjacent vocabularies live in `src/lib/*` and `src/lib/game/*`.

The comparison is degenerate because **the database has only 2 CHECK constraints**. So rather than "mismatches", the finding is **absence of enforcement**:

| TS vocabulary | Defined at | DB column | DB constraint |
|---|---|---|---|
| `z.enum(['private','campaign','public'])` | `api-validation.ts:113` | `characters.visibility` + `data->>'visibility'` | **none** |
| `z.enum(['combat','skill','mixed'])` | `api-validation.ts:137,151` | `encounters.type` | **none** |
| `z.enum(['preparing','active','paused','completed'])` | `api-validation.ts:139,156` | `encounters.status` | **none** |
| `z.enum(['planned','in_progress','completed'])` | `api-validation.ts:185,234` | `crafting_sessions.status` (DEFAULT `'planned'`) | **none** |
| `z.number().int().min(1).max(20)` | `api-validation.ts:105,112` | `characters.level` | **none** |
| `z.enum(['library','codex'])`, `z.enum(['library','official'])` | `api-validation.ts:169,192,241,289` | `official_enhanced_items.base_item_source` / `power_source` (doc comments name `'codex'\|'public'\|'custom'` and `'official'\|'public'\|'library'` — **the doc and the Zod schema disagree**) | **none** |
| `'weapon'\|'armor'\|'equipment'\|'shield'` | `src/types/library.ts:110` | `official_items.type`, `user_items.type` | **none** |
| `Common…Ascended` (7 rarities) | `src/lib/chip/rarity-chip-variant.ts:6-14` + `data/core-rules/RARITIES.json` | `official_items.rarity`, `user_items.rarity`, `codex_equipment.rarity`, `official_enhanced_items.rarity` | **none** |
| `USER_ROLES` ×4 copies | §6.2 #13 | `user_profiles.role` | ✔ **enum** `public."UserRole"` |
| image categories ×8 | `src/lib/realms-images.ts` | `realms_image_categories.category` | ✔ **enum** `realms_image_category` |
| `LAYER1_GOVERNANCE` (`maxGroupsPerStep: 3`, `maxItemsPerGroup: 7`, `maxWhyCopyLength: 120`, `maxPathRecommendedBaseSkills: 3`) | `src/lib/constants/creator-layer-governance.ts:6-12` | `codex_archetypes.level1_guidance_groups` (JSONB) | **none** — caps are UI-only |
| `'create'\|'update'\|'delete'` | app changelog writers | `codex_change_logs.operation` | ✔ **CHECK** (`…change-logs.sql:8`) |
| archetype level ≥ 2 | app | `codex_archetype_levels.level` | ✔ **CHECK** (`…path-columns.sql:26`) |

**Why this matters more than "the DB is permissive."** RLS grants `authenticated` full INSERT/UPDATE on their **own** `characters`, `encounters`, `crafting_sessions`, and every `user_*` row, and the `authenticated` role holds table-level `INSERT/UPDATE/DELETE` grants. So a signed-in user can hit `/rest/v1/characters` directly with the anon key and write `level: 99999`, `visibility: 'anything'`, `status: null` — Zod never runs. `supabase-promoted-columns-write-path-2026-06.sql:24` explicitly claims "There is no raw client write path"; that claim is wrong.

**Fix (small, high value):** add `CHECK` constraints for the ~8 vocabularies above plus `characters.level BETWEEN 1 AND 20` and non-negative guards on `official_enhanced_items.currency_cost`, `uses_count`, `official_items.armor_value`, `damage_reduction`, `official_creatures.hit_points`, `energy_points`. One migration file, no app changes, and it converts a class of silent bad data into a loud insert failure.

---

## 8. Seed / CSV parity and Backup / DR

### 8.1 Can codex content be reproduced from the repo? — **Partially, and running the reproducer destroys data.**

| Table | CSV in `scripts/seed-data/` | CSV in `codex_csv/` | Reproducible? |
|---|---|---|---|
| `codex_feats` | `feats.csv` (212 KB) | `Realms Codex Test - Feats.csv` | Partial — **no `base_feat_id`** (added by `leveled-feats-add-base-feat-id.sql:?`), so 202 leveled-feat links are lost |
| `codex_parts` | `parts.csv` | ✔ | ✔ |
| `codex_properties` | `properties.csv` — **no `mechanic` column** | ✔ has `mechanic` | Two sources disagree |
| `codex_species` | `species.csv` — has **`part_cont`** (no such column in `codex_species`); **missing `is_starter`, `image_id`, `image_url`, `payload`** | no `part_cont`; also missing the three | `part_cont` will fail the upsert; art + starter curation lost |
| `codex_traits` | `traits.csv` — **no `option_trait_ids`** | ✔ has it | Two sources disagree |
| `codex_skills` | ✔ | ✔ | ✔ |
| `codex_creature_feats` | ✔ | ✔ | ✔ |
| `codex_equipment` | `equipment.csv` — **missing `image_id`, `image_url`** | same | Art links lost |
| **`codex_archetypes`** | **NONE** | **NONE** | ❌ **Cleared by the seed, never restored** |
| **`codex_archetype_levels`** | **NONE** | **NONE** | ❌ **Cascade-deleted with archetypes** |
| `core_rules` | — | — | ✔ via `data/core-rules/*.json` (13 files) + `scripts/seed-core-rules.js` (referenced at `create-public-core-rules.sql:8-9`) |
| `official_*` (all 5) | — | — | ❌ **Live DB is the only source** |
| `realms_images` + Storage objects | — | — | ❌ **Live DB + `codex-art` bucket only** |

**Net:** 7 of 9 codex tables are roughly reproducible with schema-drift losses; `codex_archetypes` / `codex_archetype_levels` are not reproducible at all; and the entire official library and image bank exist only live. For a startup with real user data, **the live database is the source of truth for most content.**

### 8.2 Seed script safety — **unsafe** (F2, P0). Detail in §3.5.

Summary: unconditional destructive clear before any validation; service-role key so RLS cannot stop it; the `--reset` flag advertised in `package.json` is never parsed; no confirmation, dry-run, or row-count guard; and the one table it can never restore (`codex_archetypes`) is the one carrying the most hand-authored content.

### 8.3 Backup / DR — the real position (F3, P0)

| Question | Answer |
|---|---|
| What does `scripts/supabase-backup.ps1` capture? | Three files into `backups/supabase-<ts>/`: `roles.sql` (globals, `:102`/`:143`), `schema.sql` (`:105`/`:146`), `data.sql` (`:108`/`:149`). Tries Supabase CLI first, falls back to `pg_dump`/`pg_dumpall`. **Explicitly excludes Storage** (`:3`). |
| What does `scripts/supabase-storage-backup.js` capture? | Every object in `portraits` and `profile-pictures` **only** (`:27`), plus a `manifest.json`. **`codex-art` — the entire Realms Image Library master bucket — is not backed up** unless someone sets `STORAGE_BACKUP_BUCKETS` (`:28-30`). |
| Scheduled? | **No.** Both are manual npm scripts (`db:backup`, `storage:backup`, `backup:all`). No cron, no GitHub Action, no Vercel cron. |
| Where do backups go? | `backups/` in the working tree — which is **`.gitignore`d** (`/backups/`). Local disk under `C:\Users\kadin\OneDrive\Desktop\Code\RealmsRPG-Test`. Not off-site by policy; OneDrive sync is incidental, not a backup strategy. |
| How many backups exist? | **One: `backups/supabase-20260421-101209/` (3 files, 2026-04-21).** ~4 months old as of this audit. It predates `be01`, `be02`, `be04`, TASK-530 archetype enrichment, the Realms Image Library, TASK-649, and TASK-650. |
| Is restore documented? | **No.** Zero hits for `restore` / `pg_restore` / `PITR` in `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md` or anywhere in `src/docs/` in a DR sense. |
| Tested? | No evidence of any restore drill in the repo. |
| Supabase-side PITR? | Not visible from the repo. **Flag for the live-DB auditor** — if PITR is enabled on the project's plan, that materially improves this picture and should be documented. |

**Plain statement of the recovery position:** if the RealmsRPG-Test database were lost or corrupted today, recovery would mean restoring a 4-month-old dump from a single local machine, then hand-replaying ~4 months of schema and content migrations from `sql/` in an order that is documented only in prose and that (per F5) **does not currently replay cleanly**. Storage art in `codex-art` has no backup at all. There is no tested restore path.

**Three cheapest fixes, in order:** (1) run `npm run backup:all` today and confirm Supabase-side PITR/daily backups are on for the plan; (2) add `codex-art` to `DEFAULT_BUCKETS` at `supabase-storage-backup.js:27`; (3) commit `supabase db dump --schema-only` output to `sql/schema/0000_baseline.sql` (also fixes F1) and write a 10-line RESTORE.md.

---

## 9. Prioritized findings

### P0
1. **No reproducible schema** — 27 tables have no `CREATE TABLE` in the repo; `vtt_*` has no SQL at all; 3 tables' DDL exists only inside markdown fences (2 of which are now wrong). §1.2
2. **`npm run db:seed` destroys the codex before validating input**, `--reset` is never parsed, and `codex_archetypes` (+ cascade `codex_archetype_levels`) has no CSV to restore from. `scripts/seed-to-supabase.js:190,147-166,157`; `package.json` `db:seed:reset`. §3.5
3. **No working backup position** — one 2026-04-21 snapshot, local + gitignored, manual only, `codex-art` unbacked, restore undocumented and untested. §8.3
4. **Four `DROP SCHEMA … CASCADE` statements** whose safety is purely procedural: `path-c-phase0-consolidate-to-public-part2.sql:133-136`. §3.1
5. *(For the live-DB auditor)* **Confirm a user cannot self-INSERT `user_profiles` with `role='admin'`** — the escalation trigger is `BEFORE UPDATE OF role` only (`supabase-role-escalation-fix-2026-06.sql:45`). §4.5

### P1
6. Replaying `sql/` in README order fails and silently reverts hardening — `memberIds` references in 4 files; `creator-layer1-extensions.sql:14` un-drops a dropped column; `feat-tags-unification-phase{1,2,4}` revert `search_path` pinning. §1.3
7. Only 2 CHECK constraints exist; ~12 game-rule vocabularies + `characters.level` are Zod-only and bypassable via direct PostgREST writes. §7
8. `campaigns.invite_code` not UNIQUE; its only index is archive-only. §2, §2.3
9. `codex_change_logs.changed_by_user_id ON DELETE RESTRICT` blocks deletion of any admin who edited codex. `supabase-codex-change-logs.sql:10`
10. No generated `Database` types; 6 duplicated row types; provable nullability/enum mismatches #1, #2, #6, #7, #8, #11, #12. §6
11. FK-less user references: `campaigns.owner_id`, `encounters.user_id`, `campaign_members.user_id`, `campaign_rolls.user_id`. §2
12. 26+ bare `auth.uid()` in policies that a fresh-env rebuild would apply. §4.4
13. Seed CSVs drifted from schema and from each other (`part_cont`, missing `base_feat_id` / `is_starter` / `image_id` / `option_trait_ids` / `mechanic`). §8.1
14. 9 destructive statements that destroy data if run out of context. §3.1

### P2
15. No drift detection of any kind; `db:migrate` is `echo`. §1.1
16. 3 files' DDL lives only in `SUPABASE_SCHEMA.md` markdown; 2 are wrong post-`be01`. §5.1
17. `sql/README.md:134` presents `supabase-campaign-members.sql` as current; it targets the dropped `campaigns` schema.
18. No `updated_at` triggers anywhere despite `set_updated_at_timestamp()` existing; `official_*`/`user_*` `created_at`/`updated_at` have no DEFAULT; `name` is nullable on all library tables.
19. `realms-image-library.sql:97-100` recreates the bucket-wide `codex-art` listing policy that TASK-649 removed live.
20. `characters.visibility` column vs `data->>'visibility'` can desync; the "single write path" claim at `supabase-promoted-columns-write-path-2026-06.sql:24` is inaccurate.
21. 30 of 103 `sql/` files are one-off codex content edits mixed in with schema-of-record; no superseded markers. §1.4
22. Only 3 of 103 files are transactional. §1.1
23. Codex "arrays" as comma-separated TEXT — no integrity, and the direct cause of the 4-file `feat-tags-unification-*` normalization effort. §2.1

### P3
24. `idx_realms_images_name_ilike` is `btree(lower(name))` and cannot serve `.ilike('%q%')` (`api/images/route.ts:85`).
25. `role_policies_select_authenticated USING (true)` exposes all role quotas to every signed-in user.
26. `be04` `campaign_rolls` policies use `TO public` where neighbours use `TO authenticated`.
27. Admin UPDATE policies omit explicit `WITH CHECK` (correct by Postgres default, but implicit).
28. `realms-image-entity-columns.sql:72` / `realms-image-user-entity-columns.sql:66` `DROP FUNCTION` without `IF EXISTS` — errors on re-run.
29. `role_policies.permissions` typed nullable in TS, `NOT NULL` in SQL.
30. `role_policies` and several tables lack `created_at`.

---

## 10. Cross-reference notes for the live-DB auditor

Items this repo-side audit **cannot** resolve; please confirm against the live database:

1. **`vtt_*` tables** — names, columns, RLS, policies, grants. Zero repo coverage.
2. **`public.rls_auto_enable()`** — body and whether it is still attached as an event trigger (repo only revokes access to it).
3. **`user_profiles` INSERT path** — can an authenticated user insert their own row with `role = 'admin'`? (§4.5)
4. Whether the archive-only indexes actually exist live: `characters_user_id_updated_at_idx`, `campaigns_owner_id_idx`, `campaigns_invite_code_idx`, `encounters_user_id_updated_at_idx`, `campaign_rolls_campaign_id_created_at_idx`, `user_*_user_id_idx`, `user_profiles_username_key`.
5. Whether `campaigns.invite_code` has a UNIQUE constraint live that the repo does not create.
6. Whether the bare-`auth.uid()` policies of §4.4 were all superseded live by the `(select auth.uid())` rewrites.
7. Whether `set_updated_at_timestamp()` is attached to any table live.
8. Whether Supabase-plan PITR / automated daily backups are enabled (materially changes §8.3).
9. Actual column lists for `crafting_sessions`, `user_enhanced_items`, `official_enhanced_items` (repo has only markdown, and it is stale).
10. Whether `public_powers` / `public_techniques` / `public_items` / `public_creatures` are truly gone (doc says yes; `supabase-official-library-public-schema.sql:174-299` still expects them).
