# RealmsRPG — Full Codebase & Database Audit

**Date:** 2026-08-13 · **Method:** independent review, read-only · **Verdict:** strong foundations,
unprotected production, one live security hole and one case of confirmed data loss.

This is an independent engineering audit, not a task-queue exercise. It deliberately does not follow
the repo's agent workflow: nothing was added to `ACTIVE_TASKS.md`, no code was changed, and no
database write was applied. Every recommendation below is a proposal.

## Scope covered

| Surface | Volume |
|---|---|
| TypeScript / TSX | 1,085 files, ~387,000 lines |
| SQL files | 103 |
| Live database | Supabase `lbqhiwudvifmkjtkccdg`, Postgres 17.6, 40 public tables |
| Platform | Vercel `realms-rpg-test`, live on `realmsrpg.com` |
| Docs reviewed as process cost | 84 markdown files, 38,330 lines |

Twelve parallel domain audits, each reading its assigned files in full, plus a direct pass by the
lead auditor over the live database, RLS, storage, Vercel configuration, and the running site.

## Findings

**32 P0 · 96 P1.** P0 means data loss, a security hole, or wrong numbers shown to players today.

Findings marked **verified** below were confirmed against the live database catalog, the running
production site, or by reading the cited code — not inferred from documentation. Documentation in
this repo lags reality in several places (noted per report), so nothing here rests on it.

### The three to fix first

**1. Any registered user can become `admin`** — `00-database-and-infrastructure.md` §P0-1 · *verified*

The role-change guard trigger is `BEFORE UPDATE OF role`, so it never fires on INSERT, while
`authenticated` holds INSERT privilege on the `role` column and the INSERT policy only checks
`id = auth.uid()`. A fresh account can insert its own profile row with `role: 'admin'`; an existing
one can delete and re-insert (all FKs cascade). `isAdmin()` reads nothing but this column, so
escalation grants the codex editors, every user's email via `GET /api/admin/users`, and RLS-blessed
writes to all six `official_*` tables. Exploitable from a browser console with the public anon key.

**2. `npm run db:seed` destroys the codex before checking it has a replacement** —
`12-sql-schema-types.md` §P0-2 · *verified*

`clearCodexTables()` runs at `scripts/seed-to-supabase.js:190`, ahead of all three CSV-existence
guards (`:194`, `:211`, `:218`), each of which `return`s. It deletes every row from all nine
`codex_*` tables using the service role. No `archetypes.csv` exists in any seed folder, so
`codex_archetypes` and its cascaded `codex_archetype_levels` cannot be restored from the repo.
`db:seed:reset` passes `--reset`, which the script never reads — both commands are identically
destructive.

**3. Recovery position is weak** — `11-tooling-ci-tests-process.md`, `12-sql-schema-types.md` · *verified*

One backup exists: `backups/supabase-20260421-101209/` (schema, data, roles), 114 days old, taken
manually, with no schedule and no tested restore. The `codex-art` storage bucket is not backed up at
all. Meanwhile 27 of ~40 live tables have no `CREATE TABLE` anywhere in `sql/`, and replaying `sql/`
in documented order actively reverts security hardening. Recovery today means a stale dump plus
hand-replaying four months of migrations from prose.

### Codex "data loss" — investigated and resolved as intentional

`13-codex-data-loss-determination.md` · *supersedes the retracted §P0-3*

The 22 parts and 1 feat that appeared to lose values were **deliberately edited**, not corrupted. The
`codex_change_logs.changed_fields` column records what the application believed it was changing, and
every null is logged there with an explicit before/after, inside saves that also renamed, rewrote and
repriced the part. Two cleared options read "If you're seeing this option, it needs to be deleted";
four held `#ERROR!` spreadsheet artifacts; the dominant pattern is an intentional duration-system
refactor that made "per additional round/minute" options redundant. **No recovery is needed, and the
proposed recovery SQL must not be run.**

Two real defects came out of the investigation and are tracked instead:

- **P1 — `mart_prof_req` cannot round-trip.** `src/app/api/codex/route.ts:118-145` maps
  `pow_prof_req`, `pow_abil_req` and `mart_abil_req` but omits `mart_prof_req`, while the write path
  includes it. The admin form therefore always reads blank and writes `null`. 30 feats hold a value
  today; editing any of them through the form or spreadsheet clears it. One-line fix plus a
  table-driven column round-trip test.
- **P1 — codex ids are recycled after delete.** Feat id 248 was `Flawless Fighter`, was deleted, and
  26 minutes later became `Elemental Adaptation`. Any character that took the old feat now silently
  resolves to a different one. Ids must be allocated monotonically and deletes tombstoned.

### The two mechanisms behind almost everything else

**One rule, several implementations, then drift.** The rules engine core is correct — Power and
Martial progression across all 20 levels, armament proficiency, ability costs, skill bonuses,
defenses, health/energy pools and training points all match `GAME_RULES.md`. The wrong numbers come
from components re-implementing it: unarmed attack and damage floor where the rule rounds up
(`archetype-section.tsx:222,230`), Max Energy uses `powAbil || martAbil` instead of the higher
archetype ability at seven sites, and the sheet's skill budget disagrees with the creator's. The two
creators use different equipment Training Point formulas entirely, and 11 call sites silently drop
the `core_rules` overrides stored in Supabase. `05-rules-engine.md` lists 13 duplicated rule
implementations, 5 already diverged.

**Full-object last-write-wins writes with no version guard, no error checking, no transaction.**
`PATCH /api/characters/[id]` sends all 50 allow-listed fields, so its "merge" overwrites everything,
while realtime merges only HP/EN/AP — so another tab's inventory change is silently reverted. Failed
saves are never retried; the autosave debounce resets every render and can be starved indefinitely;
library GET routes discard Supabase errors and render "no content yet"; creator saves resolve their
target row by *display name*, so a name collision destroys the wrong item with a success toast; and
username renames report success after deleting the old mapping.

## Ordered remediation plan

### Week 1 — stop the bleeding

1. Role trigger → `BEFORE INSERT OR UPDATE`, force `new_player` on client inserts; then
   `REVOKE INSERT (role), UPDATE (role) ON public.user_profiles FROM authenticated, anon`.
   Drop the self-DELETE policy.
2. Scope `getOwnerLibraryForView` to the entity IDs the character actually references
   (`.in('id', ids)`, explicit columns) — today a public character leaks the owner's entire private
   library to anonymous callers.
3. Move `clearCodexTables()` after the CSV guards, or remove the script until fixed.
4. Take a backup; schedule `npm run backup:all`; add the `codex-art` bucket to the storage script.
5. Add `mart_prof_req` to the codex read projection, then run the generated recovery SQL.
6. Add a runtime allowlist for the `collection` parameter in `admin/codex/actions.ts:182-188`
   (currently `deleteCodexDoc('user_profiles', uuid)` is reachable on a service-role client).
7. Install error monitoring. Turn on branch protection and add a `.husky/pre-push` hook so CI
   actually gates rather than racing the Vercel build.
8. Fix the four `ui/modal.tsx` bugs (hardcoded ids, unbalanced scroll lock, document-wide Escape)
   and the invisible focused delete button in `shared/hub-list-row.tsx:128`.

### Month 1 — make writes trustworthy

9. Dirty-key `PATCH` with an `updatedAt` precondition and 409 → refetch/reapply.
10. Autosave: callbacks in refs, retry with backoff, request timeout, per-user rate-limit key.
11. Rewrite `character-creator-store.ts` `migrate` so it can never return a fresh draft.
12. Derive guided step completion from an `isSatisfied(draft)` predicate; prune unresolvable skill ids.
13. `PATCH` library rows by editing id, not display name; stop swallowing read errors (return 500).
14. Commit `supabase db dump --schema-only` as `sql/schema/0000_baseline.sql`; add a `db:diff` check.
15. Fix the four rules-engine P0s and delete the duplicate formulas behind them.
16. Add the codex drift scan (below) to CI or a weekly cron.

### Quarter — pay down structure

17. Close the two parity gaps (defense-bonus allocation, per-skill governing ability), then retire the
    legacy creator: −10,514 LOC after ~940 LOC of shared-symbol extraction.
18. Adopt generated Supabase types; delete the hand-written duplicates and 6 proven mismatches.
19. Collapse the six duplication clusters: ~5,600 LOC.
20. Split `shared/` into `ui / patterns / feature`, moving 4,724 LOC of feature code out.
21. Promote `visibility` and other invariants into real columns with CHECK constraints (the schema has
    exactly 2 CHECK constraints today).
22. Server-render `/rules` (currently a Google Docs iframe) and codex detail pages; add `sitemap.ts`,
    `robots.ts`, `metadataBase` and OG images — none exist, and `robots.txt` 404s in production.
23. Write the first functional e2e: sign up, create a character, save it. All 19 Playwright tests are
    visual/a11y only.
24. Cut ~10,000 lines of process docs and 4 of the 5 non-code CI gates.

### The cheapest high-value gate

```sql
-- Any codex field that went from a real value to NULL. Alert on any row.
select l.entity_type, l.entity_id, b.key as field_lost,
       b.value #>> '{}' as lost_value, l.changed_at
from public.codex_change_logs l
cross join lateral jsonb_each(l.before_data) b
where l.operation = 'update'
  and jsonb_typeof(b.value) <> 'null'
  and (l.after_data ? b.key)
  and jsonb_typeof(l.after_data -> b.key) = 'null'
order by l.changed_at desc;
```

Runs against data you already keep. It would have caught the codex damage in April.

## Report index

| # | Report | Focus |
|---|---|---|
| 00 | `00-database-and-infrastructure.md` | Live schema, RLS, storage, secrets, platform, data-loss forensics |
| 01 | `01-api-auth-security.md` | 31 route handlers, auth, validation, rate limiting |
| 02 | `02-legacy-creator-phaseout.md` | Migration inventory, parity gaps, ordered deletion plan |
| 03 | `03-guided-creator.md` | The flagship funnel: flow, state machine, save path, a11y |
| 04 | `04-shared-ui-design-system.md` | `ui/` + `shared/`, tokens, 13 duplication clusters, dead exports |
| 05 | `05-rules-engine.md` | Formula-by-formula check against `GAME_RULES.md` |
| 06 | `06-state-data-architecture.md` | Zustand stores, TanStack Query, fetching census |
| 07 | `07-routes-rendering-perf.md` | RSC boundaries, caching, SEO, performance |
| 08 | `08-admin-surface.md` | Privilege enforcement, destructive operations, data integrity |
| 09 | `09-character-sheet-play.md` | Persistence contract, level-up, live play, 18 local formulas |
| 10 | `10-codex-library-layer.md` | Content backbone, name-as-key joins, ~2,785 LOC of duplication |
| 11 | `11-tooling-ci-tests-process.md` | Quality gates, test strategy, deps, process overhead |
| 12 | `12-sql-schema-types.md` | `sql/` reproducibility, destructive statements, types vs schema |

An interactive consolidated view with a filterable findings table lives outside the repo at
`~/.cursor/projects/<workspace>/canvases/realmsrpg-audit.canvas.tsx`.

## Verified healthy — do not re-litigate

Stated explicitly because it shapes strategy: most fixes above are small and local *because* the
foundations are sound.

- **RLS is doing the real security work.** All 40 public tables enabled with at least one policy,
  every INSERT policy has a `WITH CHECK`, admin checks read the database rather than a spoofable JWT
  claim, all four `SECURITY DEFINER` helpers pin `search_path` and live in a non-exposed `private`
  schema, and policies use the `(SELECT auth.uid())` subselect form that avoids per-row
  re-evaluation. The earlier campaign-policy recursion was fixed correctly.
- **Type hygiene is close to perfect.** Zero `any`, zero `as any`, zero `@ts-ignore`/`@ts-expect-error`,
  zero TODO/FIXME, 22 `eslint-disable` across 1,065 files, clean `tsc --noEmit`, `strict: true`.
- **Admin privilege enforcement is solid.** Server-side redirect in the layout, `requireAdmin()` as
  the first statement in all four server actions, independent re-checks on every mutation. No
  non-admin write path exists — the admin risk is authorized users destroying content by accident.
- **Repo hygiene is clean.** No secrets tracked (`.env*` ignored, only `.env.example` committed), no
  build artifacts tracked, no secrets in the client bundle, 0 `npm audit` vulnerabilities.
- **Deployment protection is correct.** SSO on all deployments except custom domains, so previews are
  private while `realmsrpg.com` is public. Zero production runtime errors in the trailing 7 days.
- **Design-system layering holds.** `ui/` imports nothing upward, the shared-UI allowlist gate is
  120/120 in sync, and the custom `realms/no-raw-color` lint rule is holding.
- **The guided creator is well factored** — 31 pure modules with 193 unit tests, one shared
  validated-apply path for equipment, real reuse of the sheet's calculators at save time, and a solid
  `Modal` a11y baseline.

## Corrections made during this audit

Recorded for traceability, since two of these would otherwise have propagated as false findings.

1. **`user_profiles.username` unique constraint.** An earlier draft claimed none existed, based on
   `pg_constraint`. `user_profiles_username_key` is a standalone `CREATE UNIQUE INDEX`, which only
   appears in `pg_indexes`. Duplicates are impossible; the real defect is that RLS hides other users'
   rows so the app's collision check can never fire, and the resulting `23505` is discarded while
   success is returned. Corrected in report 00 §P1-3.
2. **`src/components/creator/**` is not legacy.** It is the shared standalone-creator toolkit imported
   by the item, power, technique, empowered, species and creature creators, crafting, the character
   sheet, *and* the guided creator. None of its 1,808 lines is deletable. Corrected in report 02.
3. **CI exists and is substantial.** An initial hypothesis that there was no CI was wrong: two
   workflows cover typecheck, build, tests, lint, contrast, axe and visual regression. The real defect
   is that both trigger on `push: [master]`, in parallel with the Vercel build they would gate.
4. **Dead-export counts in the codex layer** were initially overstated because PowerShell globbing
   treats `[type]` in App Router paths as a character class, skipping every API route. Re-run with
   ripgrep; corrected in report 10.
