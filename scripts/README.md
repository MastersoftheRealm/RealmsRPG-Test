# Scripts

| Script | Purpose | When to run |
|--------|---------|-------------|
| **seed-to-supabase.js** | Seed codex tables from CSV (`scripts/seed-data/` or `codex_csv/`) into Supabase. Clears codex tables then upserts. | `npm run db:seed` or `npm run db:seed:reset`. Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. |
| **seed-core-rules.js** | Upsert `core_rules` table with game rules (progression, conditions, etc.). Idempotent. | `node scripts/seed-core-rules.js`. Optional: `--export-json` for backup. |
| **reconcile_tasks.js** | Reconcile AI_TASK_QUEUE.md with git history; writes `reports/task-reconcile-report.json`. `--apply` appends to AI_CHANGELOG; `--strict` fails if any done task has no matching commit. | CI (report-only) or locally. |
| **extract_feedback.js** | Parse raw entries from ALL_FEEDBACK_CLEAN.md and append task stubs to AI_TASK_QUEUE. | After adding raw feedback; review before merge. |
| **triage_tasks.js** | Infer `related_files` for tasks with empty related_files. `--apply` to update queue. | Optional; dry-run by default. |
| **session_submit.js** | Append raw feedback to ALL_FEEDBACK_CLEAN.md, then run extractor and triage. Optional `--autopush`. | When submitting owner feedback. |
| **check-feats-ids.js** | One-off: check for duplicate feat IDs in `codex_csv/Realms Codex Test - Feats.csv`. | Dev/optional; not in npm scripts. |

**Database schema:** See [src/docs/SUPABASE_SCHEMA.md](../src/docs/SUPABASE_SCHEMA.md). SQL run order: [sql/README.md](../sql/README.md).

**Removed / legacy:** `inject-env-vanilla.js` — removed; no longer in package.json.
