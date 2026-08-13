# Audit Remediation Program — 2026-08

Living tracker for the sitewide audit in `reports/audit-2026-08-13/`. Branch:
`audit/remediation-2026-08`. Status values: `done` (implemented + verified), `in-progress`,
`queued`, `owner-decision` (needs a product call, not an engineering one), `deferred` (with reason).

**How to use this file:** it is the index from finding → fix → commit. Each row cites the audit
report that raised it. When a row moves to `done`, the commit subject is recorded so the change is
traceable without reading the diff.

---

## Ground rules for this program

1. **Backup before any database change.** Taken 2026-08-13 (`backups/supabase-20260813-164320/`:
   schema + data + roles, 3.2 MB data; storage in `backups/storage-20260813-204402/`).
2. **Safety before cleanliness.** Waves are ordered by irreversibility of the risk they remove, not
   by how satisfying the fix is.
3. **One concern per commit**, with the reasoning in the commit body. The audit reports carry the
   analysis; commits carry the decision.
4. **Balance decisions are the owner's.** Where `GAME_RULES.md` and the code disagree in a way that
   changes players' existing numbers, the fix is *not* obvious — it is escalated as
   `owner-decision` with worked numbers, never guessed.
5. **Claims get corrected in place.** Two audit findings were already retracted after deeper
   evidence (see Corrections). An audit that defends its first draft is worth less than one that
   updates.

---

## Wave 0 — foundation (done)

| Item | Status | Commit |
|---|---|---|
| Fresh DB + storage backup | `done` | — (artifacts in `backups/`) |
| Branch created; pre-existing 123-file WIP snapshotted so remediation is separable | `done` | `chore: Snapshot in-flight filter/list unification work…` |
| 2 stale parity assertions fixed (guided L2 now reuses official-list column builders, which pass numbers through) | `done` | same |
| **Schema baseline committed** — `sql/schema/0000_baseline_2026-08-13.sql`, 85 `CREATE TABLE`s. Closes "no reproducible schema" | `done` | `audit: Close P0 privilege escalation…` |
| Codex data-loss determination (the owner's question) | `done` | see `13-codex-data-loss-determination.md` |

---

## Wave 1 — stop the bleeding

### Database (report 00) — done

| Finding | Status | Note |
|---|---|---|
| **P0 privilege escalation**: any user → `admin` | `done` | Trigger now `BEFORE INSERT OR UPDATE`, forces `new_player` on client inserts. Table-level INSERT/UPDATE revoked and re-granted per column excluding `role` — a **column-level `REVOKE` is a no-op while a table grant exists**, which the first draft of the fix got wrong. Verified: `has_column_privilege(role)` false, `email`/`username`/`photo_url` true. |
| **P0** client-callable account cascade delete | `done` | Self-delete policy dropped; deletion goes through the service-role path. |
| **P1** `visibility` dual source of truth | `done` | Column is now `NOT NULL` + CHECK + indexed; both SELECT policies read it. 0 policies still read the JSONB. |
| **P1** codex id reuse | `done` | `codex_retired_ids` tombstones, seeded with feat 248. Allocation-side change tracked under Admin below. |
| **P2** `role_policies` world-readable | `done` | Scoped to own role **or admin** — an own-row-only policy would have broken the admin roles page, which reads all rows through the user-scoped client. |
| **P2** unindexed FK, unbounded `vtt-maps` bucket | `done` | Index added; bucket capped at 25 MB with a mime allowlist. |
| `auth.users` FK | `deferred` | `user_profiles.id` is `text`, `auth.users.id` is `uuid`. Needs a type migration across every dependent table (characters, user_items, user_powers, usernames, crafting_sessions…) with a branch-DB rehearsal. |
| Orphan profile `f4f4961c…` | `owner-decision` | Deleting it cascades that user's content. Evidence that `deleteAccountAction` partially failed once. |
| Leaked-password protection | `owner-decision` | Dashboard-only toggle: Auth → Providers → Password. Not settable from code or MCP. |

### UI safety (report 04) — done

| Finding | Status | Note |
|---|---|---|
| **P0** invisible focused/touch delete button | `done` | Revealed on `focus-visible`, `group-focus-within`, and coarse pointers. |
| **P1** four `ui/modal.tsx` bugs | `done` | `useId` dialog ids, ref-counted scroll lock, top-most-only Escape via a module-level stack. The `leaveConfirmOpen` workaround in `unified-selection-modal` is now redundant and was removed. |
| **P1** rows had no `aria-expanded`/`aria-controls` | `done` | Required a companion patch in `grid-list-row.tsx` — the receiving props were inert without it. |
| **P1** shared radio name, touch floor, undefined token, React 19 ref merge | `done` | — |
| **P2** `text-muted` / `text-secondary` convention | `done` (token) / `queued` (codemod) | See Decisions. |
| **P2** 13 dead CSS classes, 8 dead cva variants, docs corrected | `done` | — |

### API security (report 01) — in progress

| Finding | Status |
|---|---|
| **P0** public character leaks the owner's whole private library (service-role `select('*')`, unauthenticated path) | `in-progress` |
| **P0** library GET routes swallow errors and render "no content yet" | `in-progress` |
| **P1** rate limiting bypassable (raw `x-forwarded-for` in 14 handlers) and fails open | `in-progress` |
| **P1** username rename reports success after destroying the old mapping | `in-progress` |
| **P1** no Origin/CSRF check; body cap skippable | `in-progress` |
| **P2** `deleteAccountAction` ignores 14 delete results | `in-progress` |
| Align `characters/[id]` GET with the now-authoritative `visibility` **column** (currently reads `data.visibility`) | `queued` | Routed after the security pass lands; no security gap in the interim because the API's `?? 'private'` default is stricter than RLS. |

### Admin & codex integrity (report 08) — in progress

| Finding | Status |
|---|---|
| **P1** `mart_prof_req` cannot round-trip (projection omits a write-allowlisted column) + table-driven round-trip test for **all** entity types | `in-progress` |
| **P0** `collection` unvalidated on a service-role client (`deleteCodexDoc('user_profiles')` reachable) | `in-progress` |
| **P0** spreadsheet `id` editable and inside find/replace | `in-progress` |
| **P0** archetype level replace is non-transactional | `in-progress` |
| **P1** changelog throw inverts a successful save → duplicate entities | `in-progress` |
| **P1** id reuse (consume `codex_retired_ids`) | `in-progress` |
| **P1** `copyRow` corrupts the dirty set; no optimistic locking; unsaved core-rules edits discarded | `in-progress` |

### Ops, CI & recoverability (reports 11, 12) — done

| Finding | Status | Note |
|---|---|---|
| **P0** `db:seed` destroyed the codex before checking for input | `done` | Decision logic extracted to a pure, tested `scripts/seed-plan.mjs` (20 tests). Upsert-only by default; `--reset` is actually read; clears only CSV-backed tables; refuses while any codex table cannot be fully repopulated; needs `--allow-partial-reset` plus a typed confirmation. `--dry-run` prints CSV vs live counts per table. Also fixed env loading — it read only `.env`, so it could never have run on this machine. |
| **P0** backup script's failure looked like its success | `done` | CLI-probe noise captured to a log; every output file checked for minimum size **and** a required SQL marker; explicit SUCCESS/FAILURE with sizes; failed runs renamed `…-FAILED`; hard failure when `pg_dump` is absent. Storage backup now covers all four buckets — `codex-art` (15 objects) and `vtt-maps` (2) were previously unbacked. |
| **P0** nothing blocked a bad deploy | `done` (in-repo) / `owner-decision` (settings) | `.husky/pre-push` runs typecheck + tests; `npm audit --audit-level=high` added; `next build` per PR cut from 3 to 1; the authenticated e2e step no longer `exit 0`s into a false green. **Branch protection still has to be enabled in GitHub for any of this to block a merge.** |
| **P0** no error monitoring | `done` (wiring) / `owner-decision` (DSN) | `@sentry/nextjs` wired via `instrumentation.ts`, `instrumentation-client.ts`, `global-error.tsx`, and a `src/lib/observability/report-error.ts` seam. No DSN invented — every path returns early and the SDK is dynamically imported, so an unset DSN is a true no-op. `withSentryConfig` deliberately not added so the build path is byte-identical until a real project exists. |
| **P1** no schema drift detection | `done` | `npm run db:diff` / `db:baseline:update` (`scripts/db-schema-diff.mjs`), dollar-quote-aware normaliser, refuses on a `pg_dump` major mismatch. **Proven in use:** it immediately caught this program's own wave-1 migration as drift; baseline refreshed and it now reports clean. |
| **P1** codex drift scan | `done` | `npm run db:check-codex-drift` compares against `changed_fields` so it does not page on legitimate edits. Ran live: 708 rows, 0 collateral nulls. |
| **P2** dead scripts, lint rule, deps, unsound staged typecheck | `done` | 9 scripts + the empty `raw-color-backlog` rule deleted; 5 kept with cited reasons (the task-649/650 replay path is referenced by `SUPABASE_SCHEMA.md` and `BUILD_VALIDATION.md`; `sync-feat-tags-csv.js` is the only tool that can close the CSV↔DB drift just quantified). `typecheck-staged.mjs` deleted as unsound. `@tailwindcss/forms`/`typography` removed (no `@plugin` directives) with the lockfile re-resolved so `npm ci` still works. |
| `noUncheckedIndexedAccess` | `queued` | Measured at **163 errors**, not the ~1,523 sites implied. `tsconfig.strictest.json` + `npm run typecheck:strictest` exist for the burn-down. |
| Prettier | `partial` | `.prettierrc.json` added (plugin + `tailwindStylesheet` for v4) but deliberately **not** wired into `lint-staged`: 1,277 files are unformatted, so `--write` would bury every future commit in unrelated churn, and class reordering would likely break `validate-glr-chrome-spacing.ts`, which string-matches class literals. One line to enable, after a standalone repo-wide format commit. |

---

## Wave 2 — correctness (in progress)

| Area | Status |
|---|---|
| Rules engine + sheet formula unification (report 05, 09) — 4 P0s, 18 re-implemented formulas, 13 duplicate rule pairs | `in-progress` |
| Guided creator funnel P0s (report 03) — rail-jump save of a gutted character, skill-id brick, currency bypass | `in-progress` |
| `character-creator-store` destructive `migrate` (report 06 P0) | `in-progress` |
| Write-path integrity: dirty-key PATCH + `updatedAt` precondition, autosave refs/retry/timeout, per-user rate key | `queued` | Spans `api/characters/[id]/route.ts`, held until the API security pass lands to avoid two agents in one file. |
| Two disconnected character write paths (`useState`+effect vs unused TanStack Query pair) | `queued` |
| Query cache not cleared on sign-in; keys not user-scoped | `queued` |

---

## Wave 3 — structure, growth, process (queued)

| Area | Source |
|---|---|
| Legacy creator retirement: close 2 parity gaps, extract ~940 shared LOC, then delete 10,514 | report 02 |
| Duplication collapse: codex/library ~2,785, admin ~1,210, shared UI ~1,131, sheet ~340 LOC | reports 10, 08, 04 |
| Split `shared/` into `ui / patterns / feature` (moves 4,724 LOC of feature code out) | report 04 |
| Generated Supabase types; delete hand-written duplicates and 6 proven mismatches | report 12 |
| SEO: `sitemap.ts`, `robots.ts`, `metadataBase`, OG images, `generateMetadata` (0 of 43 routes have it); server-render `/rules` (currently a Google Docs iframe) and codex detail pages | report 07 |
| `text-muted` codemod (335 sites, zero render change) | report 04 |
| `font-nunito` is inert — `--font-nunito` is set by `next/font` but never registered in `@theme` | report 04 follow-up |
| Process trim: ~10,000 lines of docs, 4 of 5 non-code CI gates | report 11 |

---

## Decisions taken

**Muted vs secondary text (2026-08-13).** The `.cursor/rules` accessibility rule mandated
`text-text-muted dark:text-text-secondary`. Investigation showed the two tokens **cannot**
meaningfully differ in dark mode: muted must clear AA on `--color-surface-alt` and `#8b949e`
measures 4.95:1 there, leaving roughly four 8-bit steps before failure, so any legal "dimmer muted"
would be perceptually identical to secondary. The convention was therefore *wrong*, not
unimplemented. `--color-text-muted` now explicitly aliases `--color-text-secondary` in dark mode,
the rule has been corrected so new files stop compounding the 335 dead overrides, and the codemod is
queued as a separate zero-render-change commit. Owner reviewed and accepted.

**Modal `size="3xl"` removed** on zero-usage evidence; `full` is the wide option. `FEATURE_INDEX.md`
corrected.

---

## Owner decisions outstanding

These are product calls with real consequences. Each has the numbers gathered.

1. **Training-Point rounding.** Code floors per part; `GAME_RULES.md:227` says sum first, round up at
   the end. Exposure measured: of 420 codex parts, **1** has a fractional `base_tp` (0.5) and **13**
   have a fractional option TP. Flipping to the documented rule *increases* TP costs and could push
   existing user content (119 powers, 47 techniques) over budget. A test currently asserts the floor
   behaviour, and `power-calc.ts:149` carries a comment contradicting its own code.
2. **Rarity vs currency.** `item-calc.ts` derives rarity from IP then prices it; the doc defines
   rarity *by* currency. The bands genuinely differ (Common 25 vs 0, Epic 2500 vs 1500), and
   `low*(1+0.125c)` is unbounded, so an "Uncommon" item can price into the Rare band.
3. **Absolute ability minimum.** Code treats −2 as an absolute floor; the doc says −5 absolute with
   −2 applying at creation only.
4. **Orphan profile row** and **leaked-password protection** (see Wave 1 table).
5. **Branch protection** must be enabled in GitHub settings for the CI gates to actually block a
   merge — not settable from the repo. Require a PR plus the checks
   `Lint, contrast & static gates`, `Visual regression & accessibility`, and `verify`.
6. **URGENT — the next PR will go red until one of these exists.** The authenticated visual/a11y CI
   step used to `exit 0` when E2E secrets were missing, reading green while testing nothing. It now
   fails loudly instead. Either set repo secrets `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (there is a
   provisioning script: `npm run e2e:provision`) or set repo variable `E2E_OPTIONAL=1` to
   acknowledge the gap explicitly.
7. **Sentry project + DSN.** Monitoring is wired but inert until `SENTRY_DSN` /
   `NEXT_PUBLIC_SENTRY_DSN` exist in Vercel env. Optional third var:
   `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (falls back to `VERCEL_ENV` → `NODE_ENV`).
8. **Local Node is v22.14.0 but `engines` requires 24.x**, so every install prints `EBADENGINE`.
   Either upgrade local Node to match production or relax `engines` — a version skew between local
   and Vercel is exactly the kind of thing that produces "works on my machine" build failures.

---

## Corrections to the audit

Recorded because the value of an audit is in being right, not in having been right first.

1. **Codex data loss — retracted.** 22 parts and 1 feat appeared to lose values. The
   `changed_fields` column records what the app believed it was changing; every null is logged there
   inside a save that also renamed/rewrote/repriced the part. Two cleared options literally read
   "If you're seeing this option, it needs to be deleted", four held `#ERROR!`, and the dominant
   pattern is a deliberate duration-system refactor. **Intentional editorial work.** The proposed
   recovery SQL is marked DO-NOT-RUN. Full reasoning: report 13.
2. **Feat 248 was not a nulled column.** It was a delete followed by id reuse — `Flawless Fighter`
   became `Elemental Adaptation` 26 minutes later. So the claim that the feat "had no requirement for
   four months" was wrong; the real (worse) defect is id recycling silently repointing characters.
3. **`user_profiles.username` does have a unique index** (`user_profiles_username_key`). The first
   draft checked `pg_constraint`, which does not list standalone unique indexes. The real defect is
   the inverse and worse: RLS hides other users' rows, so the app's collision check can never fire,
   and the resulting `23505` is discarded while success is returned.
4. **CI exists and is substantial** — the initial hypothesis of "no CI" was wrong. Typecheck, build,
   tests, lint, contrast, axe and visual regression all run. The real defect is that both workflows
   trigger on `push: [master]`, racing the deploy they would gate.
5. **`ability-score-grid`'s undefined token was not a dark-mode visual bug.**
   `--color-primary-subtle-border` already has a dark value, so the inert class changed nothing
   visually. It was dead code, not a defect.
6. **Codex-layer dead-export count was overstated** in a first pass because PowerShell globbing
   treats `[type]` in App Router paths as a character class, skipping every API route. Re-measured
   with ripgrep.
7. **`noUncheckedIndexedAccess` is far cheaper than implied.** The audit cited ~1,523 unchecked index
   reads, which reads as the size of the job. Actually enabling the flag produces **163 errors**
   (TS2532 63, TS2345 49, TS18048 30, TS2322 16), concentrated in `src/app/**` (27),
   `lib/glr/validate-glr-chrome-spacing.ts` (13) and `character-sheet/library-entity-rows.test.ts`
   (10). That is one or two sessions, not a wave — measured via `tsconfig.strictest.json` /
   `npm run typecheck:strictest`.
8. **The raw-color lint exemption was narrower than reported.** Report 04 said the
   `components/ui/**` override disabled `realms/no-raw-color` for all 124 files. In fact the empty
   `RAW_COLOR_BACKLOG` array and the `components/ui/**` waiver are separate blocks, and only **3**
   files actually violate the rule (`chip.tsx:146`, `modal.tsx:225`, `spinner.tsx:29` — all
   black/white alpha scrims). The waiver is now scoped to those three and the rule is live for the
   other 121.
9. **Seed CSV parity is worse than reported, and now quantified.** Report 12 called 7 of 9 codex
   tables "roughly reproducible with losses". Measured against live: **every** CSV is behind the
   database — feats 784/809, parts 414/420, properties 48/53, traits 200/210 — and `codex_feats` has
   4 id-less rows. So a `--reset` would have been lossy *even for the tables the audit considered
   reproducible*, not just for `codex_archetypes` (which has no CSV at all). This strengthens the
   P0 rather than changing it, and is why the new seed guard refuses `--reset` unless every codex
   table can be fully repopulated.
10. **Report 13's verdict independently confirmed by tooling.** The new
    `npm run db:check-codex-drift` scanned all 708 changelog rows and found **0** collateral nulls —
    i.e. every null was recorded in `changed_fields` as a deliberate edit. That is the same
    conclusion reached by hand, reproduced by a check that now runs on demand.
