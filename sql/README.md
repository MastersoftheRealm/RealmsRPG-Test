# SQL — Migrations & One-Off Scripts

**Schema reference:** [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). All app tables live in **`public`**. **Owner checklist:** [src/docs/DATABASE_CONSISTENCY_CHECKLIST.md](../src/docs/DATABASE_CONSISTENCY_CHECKLIST.md).

**Codex / reference data edits:** Audit → draft SQL here → **owner reviews** → then apply. See [.cursor/rules/realms-codex-data.mdc](../.cursor/rules/realms-codex-data.mdc).

**Last parity audit:** 2026-07-03 against **RealmsRPG-Test** (`lbqhiwudvifmkjtkccdg`). Local files updated to match live DB state; no DB writes during audit.

---

## Drift detection (`schema/`)

`sql/schema/0000_baseline_<date>.sql` is a committed `pg_dump --schema-only --no-owner --no-acl`
of the live database. It is the diff target that makes "did someone change the DB without a
migration?" answerable.

| Command | What it does |
|---------|--------------|
| `npm run db:diff` | Dumps the live schema with the same tool + flags, normalises both sides (strips the random `\restrict` token, tool-version headers, comments and object ordering), then `git diff --no-index`. **Exits non-zero on drift.** |
| `npm run db:baseline:update` | Writes a fresh `0000_baseline_<today>.sql`. Use this only after the corresponding migration file has been added to `sql/`, and delete the superseded baseline in the same commit so exactly one stays committed. |
| `npm run db:check-codex-drift` | Scans `codex_change_logs` for fields that went value → null **without** the null appearing in `changed_fields` — i.e. collateral loss rather than a deliberate edit. |

Requires `DIRECT_URL` (preferred) or `DATABASE_URL` in `.env.local` / `.env`, plus `pg_dump`.
The dump must come from the same **major** pg_dump version as the baseline (recorded in its
header) or every object reports as drift; `db:diff` refuses to run on a mismatch unless
`--allow-tool-mismatch` is passed. Working files land in `.db-diff/` (gitignored).

**Workflow.** Run `npm run db:diff` before a release and after any Dashboard/MCP apply. Drift
output is a list of live objects that no committed SQL creates: for each one, add the migration
to `sql/`, apply nothing new, then refresh the baseline. Neither command is a PR gate — both
need database credentials — so they are manual or scheduled checks.

---

## Applied Supabase migrations (schema_migrations)

These are recorded in `supabase_migrations.schema_migrations` on RealmsRPG-Test. Local file = source to re-run on a **new** environment (idempotent where noted).

| Migration (name) | Version | Local file |
|------------------|---------|------------|
| `security_hardening_2026_06` | 20260608131526 | [supabase-security-hardening-2026-06.sql](supabase-security-hardening-2026-06.sql) |
| `prevent_role_self_escalation` | 20260613031807 | [supabase-role-escalation-fix-2026-06.sql](supabase-role-escalation-fix-2026-06.sql) |
| `campaign_authz_hardening` | 20260613123003 | [supabase-campaign-authz-2026-06.sql](supabase-campaign-authz-2026-06.sql) |
| `admin_role_audit_log` | 20260613123320 | [supabase-admin-role-audit-2026-06.sql](supabase-admin-role-audit-2026-06.sql) |
| `storage_select_hardening_2026_06` | 20260613164156 | [supabase-storage-select-hardening-2026-06.sql](supabase-storage-select-hardening-2026-06.sql) |
| `rls_initplan_fk_indexes_2026_06` | 20260613164211 | [supabase-rls-initplan-fk-indexes-2026-06.sql](supabase-rls-initplan-fk-indexes-2026-06.sql) |
| `rls_initplan_batch2_2026_06` | 20260613165609 | [supabase-rls-initplan-batch2-2026-06.sql](supabase-rls-initplan-batch2-2026-06.sql) |
| `campaign_rolls_select_initplan_2026_06` | 20260613165648 | *(no standalone file — SELECT initplan wraps bundled in initplan-fk-indexes campaign_rolls section)* |
| `usernames_select_restrict_2026_06` | 20260613170126 | [supabase-usernames-select-restrict-2026-06.sql](supabase-usernames-select-restrict-2026-06.sql) |
| `rls_consolidate_permissive_policies_2026_06` | 20260619002057 | [supabase-rls-consolidate-permissive-2026-06.sql](supabase-rls-consolidate-permissive-2026-06.sql) |
| `rls_fix_campaign_members_recursion_2026_06` | 20260619030857 | [supabase-rls-fix-campaign-recursion-2026-06.sql](supabase-rls-fix-campaign-recursion-2026-06.sql) |
| `storage_bucket_limits_2026_06` | 20260626210908 | [supabase-storage-bucket-limits-2026-06.sql](supabase-storage-bucket-limits-2026-06.sql) |
| `campaign_rpc_revoke_anon_2026_06` | 20260626210951 | [supabase-campaign-rpc-revoke-anon-2026-06.sql](supabase-campaign-rpc-revoke-anon-2026-06.sql) |
| `be01_unify_user_identity_text_fk` | 20260626215855 | [supabase-be01-unify-user-identity-2026-06.sql](supabase-be01-unify-user-identity-2026-06.sql) |
| `be02_membership_single_source_part_a` | 20260626220504 | [supabase-be02-membership-single-source-2026-06.sql](supabase-be02-membership-single-source-2026-06.sql) |
| `be02_membership_single_source_part_b` | 20260626221733 | *(same file — part B)* |
| `be04_campaign_authz_private_schema` | 20260626222925 | [supabase-be04-campaign-authz-private-schema-2026-06.sql](supabase-be04-campaign-authz-private-schema-2026-06.sql) |
| `codex_archetypes_creator_layer1_extensions` | 20260629050305 | [codex-archetypes-creator-layer1-extensions.sql](codex-archetypes-creator-layer1-extensions.sql) |
| `drop_legacy_ui_tooltips` | 20260630184618 | [drop-legacy-ui-tooltips-2026-06.sql](drop-legacy-ui-tooltips-2026-06.sql) |
| `guided_creator_schema_seed` | 20260630202719 | [guided-creator-schema-seed.sql](guided-creator-schema-seed.sql) |
| `codex_art_species_image_url` | 20260702031831 | [codex-art-species-image-url.sql](codex-art-species-image-url.sql) |
| `official_items_image_url` | 20260702143123 | [official-items-image-url.sql](official-items-image-url.sql) |
| `normalize_codex_feat_ability_delimiters` | 20260703144039 | [normalize-codex-feat-ability-delimiters.sql](normalize-codex-feat-ability-delimiters.sql) |
| `realms_image_library` | 20260716 (MCP) | [realms-image-library.sql](realms-image-library.sql) |

---

## Applied ad-hoc (live DB, not in schema_migrations)

| What | Local file(s) | Notes |
|------|---------------|-------|
| Feat tag unification (functions + `codex_feats.tags` data) | [feat-tags-unification-phase1.sql](feat-tags-unification-phase1.sql) → [phase2.sql](feat-tags-unification-phase2.sql) | Run **phase 1 then phase 2**. `normalize_feat_tags` is defined in phase 2 only. Data UPDATE commented out — owner approval required to re-run. |
| Leveled feats (`base_feat_id` column + backfill) | [leveled-feats-add-base-feat-id.sql](leveled-feats-add-base-feat-id.sql), [leveled-feats-migrate-roman-to-base-id.sql](leveled-feats-migrate-roman-to-base-id.sql) | 202/203 `feat_lvl >= 2` rows have `base_feat_id` on Test. |
| Archetype path columnar fields | [codex-archetypes-path-columns.sql](codex-archetypes-path-columns.sql) | `level1_*` columns + `codex_archetype_levels` present on Test. |
| Unarmed prowess recommendation flag | [codex-archetypes-recommend-unarmed-prowess.sql](codex-archetypes-recommend-unarmed-prowess.sql) | `level1_recommend_unarmed_prowess` column present. |
| TASK-530 path enrichment (all 12 + ability + backup) | [codex-archetypes-backup-20260717.sql](codex-archetypes-backup-20260717.sql), [codex-archetypes-ability-spread-20260717.sql](codex-archetypes-ability-spread-20260717.sql), [codex-archetypes-enrich-*-applied.sql](codex-archetypes-enrich-berserker-applied.sql), [codex-archetypes-emdash-scrub-20260717.sql](codex-archetypes-emdash-scrub-20260717.sql) | Applied RealmsRPG-Test 2026-07-17. Per-path `*-applied.sql` is the replay source; em-dash scrub is idempotent. |
| Empowered technique tables | [empowered-techniques-separate-tables.sql](empowered-techniques-separate-tables.sql) | `user_empowered_techniques`, `official_empowered_techniques` exist. |
| TASK-627 official powers payload dedupe | [official-powers-strip-redundant-auto-mechanic-parts-applied.sql](official-powers-strip-redundant-auto-mechanic-parts-applied.sql) | Applied 2026-08-01. Strips auto-mechanic parts from `payload.parts` when promoted columns exist; helper `_official_power_rebuilt_mechanic_part_names`. 41/44 rows cleaned; post-apply overlap audit 0; idempotent. |
| TASK-649 Supabase least-privilege Phase 2 | [task-649-*-applied.sql](task-649-anon-least-privilege-applied.sql) (6 files) + [task-649-verify-applied.sql](task-649-verify-applied.sql) | Applied 2026-08-03. `node scripts/run-task-649-phase2.mjs` · `node scripts/verify-task-649.mjs`. VTT tables skipped. |
| TASK-650 campaigns RLS SELECT consolidation | [task-650-campaigns-rls-select-consolidation-applied.sql](task-650-campaigns-rls-select-consolidation-applied.sql) + [task-650-verify-applied.sql](task-650-verify-applied.sql) | Applied 2026-08-03. Dropped redundant `campaigns_owner_select` (stacked with `campaigns_select_participants`). `node scripts/run-task-650.mjs` · `node scripts/verify-task-650.mjs`. |
| TASK-802 campaigns SELECT owner short-circuit | [task-802-campaigns-select-owner-short-circuit.sql](task-802-campaigns-select-owner-short-circuit.sql) | Applied 2026-08-15. Single SELECT policy keeps `owner_id = auth.uid()` **or** the participant helper so `INSERT … RETURNING` works. Verify: `node scripts/verify-task-650.mjs` (includes INSERT RETURNING smoke). |
| TASK-738 character create idempotency key | [task-738-characters-client-request-id.sql](task-738-characters-client-request-id.sql) | Applied 2026-08-13 (Supabase MCP `apply_migration`). Adds nullable `characters.client_request_id uuid` + partial unique index `characters_user_client_request_id_key (user_id, client_request_id) WHERE client_request_id IS NOT NULL`. Additive and idempotent; the index is what makes a concurrent retry replay instead of duplicating. |

---

## When to use

- **New project / fresh DB:** Historical Path C consolidation: [ai/archive/SUPABASE_PATH_C_OPERATOR_GUIDE.md](../src/docs/ai/archive/SUPABASE_PATH_C_OPERATOR_GUIDE.md). Current schema is already in `public`.
- **Existing RealmsRPG-Test:** Everything in the migration tables above is already applied. Run only scripts marked **optional** or for **new environments**.

---

## File overview (by category)

### Path C consolidation (one-time — only if DB still has `users` / `codex` schemas)

| File | Purpose |
|------|---------|
| path-c-phase0-consolidate-to-public.sql | Part 1a: Realtime, UserRole, move `users` → public |
| path-c-phase0-consolidate-to-public-part1b.sql | Part 1b: campaigns + encounters → public |
| path-c-phase0-consolidate-to-public-part1c.sql | Part 1c: codex_* → public |
| path-c-phase0-consolidate-to-public-part1c2.sql | Part 1c2a: public_powers, public_techniques → public |
| path-c-phase0-consolidate-to-public-part1c2b.sql | Part 1c2b: public_items, public_creatures → public |
| path-c-phase0-consolidate-to-public-part2.sql | Part 2: RLS, Realtime, drop empty schemas |
| create-public-core-rules.sql | Create `public.core_rules` if missing after Part 2 |

### Codex & guided creator

| File | Status on Test |
|------|----------------|
| realms-image-library.sql | Applied — migration `realms_image_library` (TASK-492) |
| codex-archetypes-path-columns.sql | Applied ad-hoc |
| codex-archetypes-recommend-unarmed-prowess.sql | Applied ad-hoc |
| codex-archetypes-enrich-*-applied.sql | Applied ad-hoc (TASK-530) — 12 paths + abilities backfill |
| codex-archetypes-backup-20260717.sql | Applied ad-hoc — backup tables before TASK-530 |
| codex-archetypes-ability-spread-20260717.sql | Applied ad-hoc — ability point spread pass |
| codex-archetypes-emdash-scrub-20260717.sql | Applied ad-hoc — user-facing em/en dash scrub |
| codex-archetypes-creator-layer1-extensions.sql | Migration `codex_archetypes_creator_layer1_extensions` |
| guided-creator-schema-seed.sql | Migration `guided_creator_schema_seed` |
| codex-art-species-image-url.sql | Migration `codex_art_species_image_url` |
| supabase-codex-rls-public.sql | Run if GET /api/codex returns permission denied |
| supabase-codex-change-logs.sql | `codex_change_logs` table — present on Test |
| supabase-codex-species-payload.sql | Species payload column work — verify before re-run |
| feat-tags-unification-phase1.sql | Applied ad-hoc (functions + data) |
| feat-tags-unification-phase2.sql | Applied ad-hoc — **canonical** `normalize_feat_tags` |
| normalize-codex-feat-ability-delimiters.sql | Migration `normalize_codex_feat_ability_delimiters` |
| leveled-feats-add-base-feat-id.sql | Applied ad-hoc |
| leveled-feats-migrate-roman-to-base-id.sql | Applied ad-hoc |

### Official / user library

| File | Status on Test |
|------|----------------|
| supabase-official-library-public-schema.sql | Baseline `official_*` tables — present |
| supabase-official-library-columnar-expansion.sql | Optional column promotion for `official_powers` |
| official-items-image-url.sql | Migration `official_items_image_url` |
| empowered-techniques-separate-tables.sql | Applied ad-hoc |
| supabase-library-columnar-parity-expansion.sql | Promoted columns + sync trigger — verify before re-run |
| supabase-promoted-columns-write-path-2026-06.sql | Write-path trigger — verify before re-run |
| supabase-user-species-columnar.sql | `user_species` columnar — run on fresh env |
| supabase-user-species-grants-rls.sql | GRANT + RLS if permission denied on `user_species` |

### Auth, roles, security (2026-06 remediation)

| File | Migration / status |
|------|-------------------|
| supabase-security-hardening-2026-06.sql | `security_hardening_2026_06` |
| supabase-role-escalation-fix-2026-06.sql | `prevent_role_self_escalation` |
| supabase-role-policies.sql | `role_policies` table — present on Test |
| supabase-admin-role-audit-2026-06.sql | `admin_role_audit_log` |
| supabase-be01-unify-user-identity-2026-06.sql | `be01_unify_user_identity_text_fk` |
| supabase-be02-membership-single-source-2026-06.sql | `be02_*` (parts a+b); `campaigns.memberIds` **dropped** |
| supabase-be04-campaign-authz-private-schema-2026-06.sql | `be04_campaign_authz_private_schema` |
| supabase-usernames-select-restrict-2026-06.sql | `usernames_select_restrict_2026_06` |

### Campaigns & characters

| File | Purpose |
|------|---------|
| supabase-campaign-members.sql | `campaign_members` table |
| supabase-campaign-members-grants.sql | GRANT if permission denied on `campaign_members` |
| supabase-campaign-authz-2026-06.sql | Campaign/roll RLS hardening |
| supabase-campaign-rpc-revoke-anon-2026-06.sql | Revoke anon on campaign RPCs |
| supabase-characters-rls-cross-read.sql | Public + campaign visibility SELECT on `characters` |
| supabase-characters-list-columns.sql | Optional list columns on `characters` |
| supabase-campaign-rolls-list-columns.sql | Optional list columns on `campaign_rolls` |
| supabase-campaign-rolls-id-default.sql | Optional DB default for `campaign_rolls.id` |
| supabase-campaign-rolls-created-at-backfill.sql | Backfill `created_at` from JSON |

### RLS performance & consolidation

| File | Migration / notes |
|------|-------------------|
| supabase-rls-initplan-fk-indexes-2026-06.sql | `rls_initplan_fk_indexes_2026_06`; **ui_tooltips index removed** (table dropped DEV-376) |
| supabase-rls-initplan-batch2-2026-06.sql | `rls_initplan_batch2_2026_06` |
| supabase-rls-consolidate-permissive-2026-06.sql | `rls_consolidate_permissive_policies_2026_06` |
| supabase-rls-fix-campaign-recursion-2026-06.sql | `rls_fix_campaign_members_recursion_2026_06` — run after consolidate |

### Storage

| File | Purpose |
|------|---------|
| supabase-storage-policies.sql | RLS for `portraits`, `profile-pictures` |
| supabase-storage-select-hardening-2026-06.sql | Scoped SELECT on portrait buckets |
| supabase-storage-bucket-limits-2026-06.sql | Bucket size limits |

### Profiles & misc

| File | Purpose |
|------|---------|
| supabase-user-profiles-timestamps-default.sql | DEFAULT `now()` on `created_at` / `updated_at` |
| supabase-user-profiles-username-display.sql | `username_display` column |
| supabase-encounters-list-columns.sql | Optional list columns on `encounters` |
| supabase-ui-tooltips.sql | **Deprecated** — do not run; use `drop-legacy-ui-tooltips-2026-06.sql` |
| drop-legacy-ui-tooltips-2026-06.sql | Migration `drop_legacy_ui_tooltips` |

### Archive — do not run on current public-only DB

[sql/archive/](archive/) — legacy codex-schema, multi-schema RLS, idempotent-full, force-drop-codex scripts.

---

## Data migration order (fresh environment)

1. Path C parts (only if consolidating legacy schemas)
2. [supabase-official-library-public-schema.sql](supabase-official-library-public-schema.sql)
3. Optional columnar / list-column scripts (official expansion, user_species, encounters, characters, campaign_rolls)
4. Security & RLS scripts in migration table order
5. Codex / guided creator migrations in version order
6. Ad-hoc scripts as needed (empowered tables, leveled feats, feat tags — **owner approval for codex data**)

**Back up** before running. See [SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md) §4.

---

## Best practices

1. **Back up** before any migration.
2. **Match local files to live DB** after MCP applies — add status header + row in this README.
3. **Do not** re-run path-c-phase0-* if DB already has only `public`.
4. **Codex data** (`codex_*` content): draft SQL here; owner reviews before `UPDATE`/`apply_migration` (see `realms-codex-data.mdc`).
5. **GRANT + RLS:** Tables created via raw SQL need both grants and policies (`supabase-codex-rls-public.sql` pattern).
6. **Drop legacy:** `DROP TABLE IF EXISTS public._prisma_migrations;` — safe if Prisma removed.
