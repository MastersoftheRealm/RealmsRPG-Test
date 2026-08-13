# Audit Remediation Program — 2026-08

Living tracker for the sitewide audit in `reports/audit-2026-08-13/`. Branch:
`audit/remediation-2026-08`.

**Status values:** `done` (implemented + verified), `partial` (landed mid-AC; remaining work listed),
`in-progress`, `queued`, `owner-decision` (product call, not engineering), `deferred` (with reason).

**How to use this file:** it is the index from finding → fix → commit (or working-tree note). When a
row moves to `done`, record the commit subject. When a row is `partial`, record **what landed** and
**what remains** so the next agent does not re-discover progress from diffs.

**Snapshot date:** 2026-08-13 (evening, America/New_York).

---

## Program snapshot (read this first)

| Wave | Verdict | Notes |
|---|---|---|
| **0 — foundation** | `done` | Backups, branch, schema baseline, codex data-loss determination. |
| **1 — stop the bleeding** | `done` (code + DB) / `owner-decision` (settings) | DB/UI/API/Admin/Ops all implemented. GitHub branch protection, E2E secrets / `E2E_OPTIONAL`, Sentry DSN, Auth leaked-password toggle, orphan profile delete, Node engines still need the owner. |
| **2 — correctness** | `partial` | Rules + guided funnel P0/P1-1–P1-5 landing this merge. TASK-738 (P1-6–P1-10) and TASK-739 (Advanced currency clamp) filed for later. Advanced migrate + dirty-key PATCH still queued. |
| **3 — structure** | `queued` | Not started. |

### Commits on `audit/remediation-2026-08` (oldest → newest)

| Commit | Scope |
|---|---|
| `89984202` | Snapshot in-flight filter/list WIP + stale parity test fix |
| `cd26b5ad` | Wave 1 DB: privilege escalation, visibility column SoT, `codex_retired_ids`; audit reports + baseline dump |
| `fd2028e2` | Wave 1 UI: modal a11y, invisible focus targets, dead design-system CSS |
| `d2ae0692` | Tracker + two audit retractions |
| `7217837a` | Wave 1 Ops: seed guard, backups, `db:diff`, Sentry wiring, CI/pre-push hygiene |
| `a0b7f9c6` | Wave 1 API security + Admin/codex integrity (+ migration `0002` SQL in repo) |
| `0a0f5496` | Refresh baseline after `0002`; tracker corrections (archetype spreadsheet bug, delete-account ordering) |
| `3a31aef4` | Wave 1 follow-up: relocate admin codex helpers to `src/lib/codex/` |
| `ebe2c3ce` | Wave 2: sheet formula unification + guided funnel integrity (P0/P1-1–P1-4) |

### Live DB migrations applied

| File | Applied | Contents |
|---|---|---|
| `sql/schema/0001_audit_remediation_security_2026-08-13.sql` | yes | Role trigger INSERT+UPDATE; per-column grants excluding `role`; drop self-delete; visibility column authority; `codex_retired_ids`; `role_policies` scoped; vtt index/bucket |
| `sql/schema/0002_codex_locking_and_atomic_levels_2026-08-13.sql` | yes | `updated_at` + touch triggers on 9 `codex_*` tables; `replace_archetype_levels` RPC (service_role) |
| `sql/schema/0000_baseline_2026-08-13.sql` | refreshed | Matches live after `0002` (`npm run db:diff` clean at last check) |

### Uncommitted work (must land or continue before merge)

Landing on this merge as three commits: `3a31aef4` relocate, `ebe2c3ce` Wave 2 rules + guided funnel, and this commit (TASK-714 / TASK-734–737 leftovers + tracker). Follow-ups TASK-738 / TASK-739 stay open.

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
5. **Claims get corrected in place.** Audit findings already retracted after deeper evidence live
   under Corrections. An audit that defends its first draft is worth less than one that updates.
6. **Do not recover intentional codex clears.** Report 13 + `db:check-codex-drift` (0 collateral
   nulls). Feat 248 was id reuse, not a null — and a post-fix scan found **0** characters still
   holding id `248`.

---

## Wave 0 — foundation (done)

| Item | Status | Commit |
|---|---|---|
| Fresh DB + storage backup | `done` | — (artifacts in `backups/`) |
| Branch created; pre-existing WIP snapshotted so remediation is separable | `done` | `89984202` |
| 2 stale parity assertions fixed (guided L2 column builders) | `done` | `89984202` |
| **Schema baseline committed** — `sql/schema/0000_baseline_2026-08-13.sql` | `done` | `cd26b5ad` (refreshed `0a0f5496`) |
| Codex data-loss determination (owner's question) | `done` | report `13-codex-data-loss-determination.md` |

---

## Wave 1 — stop the bleeding

### Database (report 00) — done

| Finding | Status | Note |
|---|---|---|
| **P0 privilege escalation**: any user → `admin` | `done` | Trigger `BEFORE INSERT OR UPDATE`, forces `new_player` on client inserts. Per-column grants excluding `role` (table-level grant made column `REVOKE` a no-op — fixed). Verified `has_column_privilege(role)` false. |
| **P0** client-callable account cascade delete | `done` | Self-delete policy dropped; deletion is service-role. |
| **P1** `visibility` dual source of truth | `done` | Column `NOT NULL` + CHECK + indexed; SELECT policies read column only. |
| **P1** codex id reuse | `done` | `codex_retired_ids` + allocator in `src/lib/codex/id-allocation.ts`. Feat 248 character scan: **0** live refs (correction 14). |
| **P2** `role_policies` world-readable | `done` | Own role **or admin** (admin roles page needs all rows). |
| **P2** unindexed FK, unbounded `vtt-maps` bucket | `done` | Index + 25 MB mime-capped bucket. |
| `auth.users` FK | `deferred` | `user_profiles.id` is `text`, `auth.users.id` is `uuid`. Needs type migration across dependents with branch-DB rehearsal. |
| Orphan profile `f4f4961c…` | `owner-decision` | Deleting cascades that user's content. Likely failed session-client delete + successful `auth.admin.deleteUser`. |
| Leaked-password protection | `owner-decision` | Dashboard Auth → Providers → Password only. |

### UI safety (report 04) — done

| Finding | Status | Note / commit |
|---|---|---|
| **P0** invisible focused/touch delete button | `done` | `fd2028e2` — `focus-visible` / `group-focus-within` / coarse pointer. |
| **P1** four `ui/modal.tsx` bugs | `done` | `useId`, ref-counted scroll lock, top-most Escape stack; removed redundant `leaveConfirmOpen`. |
| **P1** rows had no `aria-expanded`/`aria-controls` | `done` | Companion patch in `grid-list-row.tsx`. |
| **P1** shared radio name, touch floor, undefined token, React 19 ref merge | `done` | — |
| **P2** `text-muted` / `text-secondary` convention | `done` (token) / `queued` (codemod) | See Decisions. Codemod is Wave 3. |
| **P2** 13 dead CSS classes, 8 dead cva variants, docs corrected | `done` | — |

### API security (report 01) — done (`a0b7f9c6`)

| Finding | Status | Note |
|---|---|---|
| **P0** public character leaks owner's private library | `done` | `collectCharacterLibraryRefIds` + scoped `getOwnerLibraryForView(owner, refIds)`. |
| **P0** library GET routes swallow errors | `done` | Failures → 500; empty reserved for true empty. |
| **P1** rate limiting bypassable / fails open | `done` | `buildRateLimitKey` prefers uid; `resolveClientIp` last-hop; fail-closed on auth/invite/upload **and** `strictLimiter`. |
| **P1** username rename silent success | `done` | Claim `usernames` PK first; check write results; RLS-blind pre-checks removed. |
| **P1** no Origin/CSRF; body cap skippable | `done` | `verifyMutationRequest` + streamed 2 MB `readBodyWithLimit`. |
| **P2** `deleteAccountAction` ignores deletes | `done` | Checked multi-step delete; service-role for `user_profiles` (0 DELETE policies). |
| Align GET with visibility **column** | `done` | GET `[id]` + list now use `resolveCharacterVisibility` (column first). |
| Routed follow-ups from API agent | `done` | Smoke script already deleted by Ops; `fetchRealmsImageById` throws on query error; `update-role` uses `.eq` not `.ilike`; `strictLimiter` fail-closed. |

### Admin & codex integrity (report 08) — done (`a0b7f9c6` + uncommitted relocate)

| Finding | Status | Note |
|---|---|---|
| **P1** `mart_prof_req` round-trip + parity suite | `done` | Projection + `codex-read-write-parity.test.ts`. Also found archetype digit-split bug (correction 11). |
| **P0** unvalidated `collection` on service-role | `done` | Allowlist `src/lib/codex/collections.ts` (relocated from admin). |
| **P0** spreadsheet `id` editable / find-replace | `done` | Read-only id; saves on `originalId`. |
| **P0** non-transactional archetype levels | `done` | App rollback + live `replace_archetype_levels` RPC. |
| **P1** changelog throw inverts save | `done` | `recordCodexChange` no longer throws; callers absorb. |
| **P1** id reuse consumption | `done` | `src/lib/codex/id-allocation.ts`; official species uses it. |
| **P1** dirty-set / optimistic lock / core-rules discard | `done` | Dirty-by-key; `updated_at` live after `0002`; dirty tab guard. |
| Referential delete + property/enhanced-item fixes | `done` | `src/lib/codex/references.ts`; General property type; enhanced-item PATCH recomputes cost/rarity. |
| Helper layering (admin → lib) | `partial` → near-done | Relocate is in the working tree, not yet committed. |

### Ops, CI & recoverability (reports 11, 12) — done (`7217837a`)

| Finding | Status | Note |
|---|---|---|
| **P0** `db:seed` wiped codex before input check | `done` | `scripts/seed-plan.mjs`; upsert default; guarded `--reset`. |
| **P0** backup script lied on failure | `done` | Size + SQL markers; all four storage buckets. |
| **P0** nothing blocked a bad deploy | `done` (in-repo) / `owner-decision` (GitHub) | pre-push typecheck+tests; e2e no longer false-green. **Branch protection still off.** |
| **P0** no error monitoring | `done` (wiring) / `owner-decision` (DSN) | Sentry wired, no-op without DSN. |
| **P1** schema drift detection | `done` | `npm run db:diff` / `db:baseline:update`. |
| **P1** codex drift scan | `done` | `npm run db:check-codex-drift` — 708 rows, 0 collateral nulls. |
| **P2** dead scripts / lint / deps / unsound staged typecheck | `done` | — |
| `noUncheckedIndexedAccess` | `queued` | **163** errors (not ~1523). Tooling: `tsconfig.strictest.json` + `npm run typecheck:strictest`. Wave 3-ish. |
| Prettier | `partial` | `.prettierrc.json` added; **not** in lint-staged (1,277 files unformatted). Enable after a dedicated format commit. |

---

## Wave 2 — correctness (`partial`)

Agents for Rules and Guided **hit usage limits mid-flight** (2026-08-13). A stabilize pass restored
`tsc --noEmit`. **None of this Wave 2 work is committed yet.** Resume from the checklists below —
do not restart from the audit reports blindly.

### Rules engine + sheet formula unification (reports 05, 09) — `partial`

**Goal:** one engine of truth; sheet/UI call it; doc/code mismatches either fixed or escalated as
`owner-decision`.

#### Landed in working tree

| Audit ID | Severity | What landed |
|---|---|---|
| **M1 / M2 / D2** | P0 | Sheet unarmed attack/damage now call `unproficientBonus()` (`archetype-section.tsx`) instead of hand-rolled `Math.floor` / `max(1, floor)`. |
| **M3 / D3** (engine half) | P0 | New `resolveEnergyArchetypeAbility` (higher of pow/mart). Wired into `calculateAllStats` + `computeMaxHealthEnergy`. Sheet resource actions take `rules`. |
| **M3 / D3** (call-site half) | P0 | Creator Energy sites call `calculateMaxEnergyForArchetype` (resolves higher of pow/mart inside): Advanced store/finalize HE, Guided HE + `build-character`. Engine `calculateAllStats` / `computeMaxHealthEnergy` same helper. T1 pins Powered-Martial INT 1 / STR 3 at L10. |
| **M4 / D1** | P0 | Sheet skill-point total uses `calculateSkillPointsForEntity` (removed the undocumented `2 + level*3 − speciesCount` dance). |
| **M5** | P1 | `canIncreaseDefense` caps **skill-point** defense only; ability bonus is unrestricted. |
| **N1** | P1 | Shared `parseLevel` — no more `parseFloat \|\| 1` swallowing level `0` / sub-levels across progression helpers. |
| **N3** | P1 | `characterToFeatRequirementCharacter` passes numeric skill allocations through (no longer drops `prof`). |
| **D4** (partial) | P1 | `calculateCreatureSpeed` + creature-creator derived stats use it. |
| **M6 prep** | P1 / owner | `computePartTrainingPointsRaw` extracted; per-part **floor** kept as shipped behaviour with an explicit comment pointing at the doc conflict. **Did not flip math.** |
| Misc | — | `calculateXpToLevelUp`; dead `buildPowerMechanicPartPayload` removed from power-calc; formulas/constants/mechanic-builder/technique-calc touch-ups. |
| **T1 / T2 / T3** | — | `calculations.test.ts` Powered-Martial Energy via `calculateMaxEnergyForArchetype`; `formulas.test.ts` unproficient table {−3…5} (sheet unarmed must keep calling `unproficientBonus`) + skill-point **3×level** (not the `getTotalSkillPoints` alias). |

#### Still open (rules)

| Audit ID | Severity | Remaining work |
|---|---|---|
| **M6** | P1 | **Owner decision** — keep per-part floor vs doc ceil-at-end. Do not flip without ack. Align comment/doc/test once decided. |
| **M7** | P1 | Absolute ability min still `MIN: -2` in `constants.ts`. Doc wants −5 absolute / −2 at creation only. |
| **M8–M14** | P2–P3 | Path-switch proficiency split, powered-martial feat count dual answer, feat level ≤ ½ rule, rarity↔currency, creature speed **doc** catch-up, crafting doc gap, etc. |
| **N2 / D8** | P1 | Empowered-technique percentage multiplier still does not `dedupeSavedParts` the way technique calc does. |
| **D4 leftover** | P1 | `creature-stat-block.tsx` still hardcodes `6 + ceil(agi/2) + sizeMod` and `10 + agility` instead of shared helpers. |
| **D5–D7** | P1 | Evasion creature copies; damage-option-level formula still multi-copied. |
| **Tests T4–T10** | — | Highest-value pins from report 05 §6 still open (defense cap, level-0 boundaries, TP rounding comment, feat prof, empowered EN, golden characters, rarity). T1–T3 landed. |
| Commit + changelog | — | Split into one concern-per-commit once AC for chosen slice is met. |

### Guided creator funnel (report 03) — `partial`

**Goal:** no rail-jump save of a gutted character; no skill-id brick; Currency cannot go negative into the save.

#### Landed in working tree

| Audit ID | Severity | What landed |
|---|---|---|
| **P0-1** | P0 | Replaced recorded `completedSubSteps` with **derived** satisfaction (`src/lib/guided-creator/substep-satisfaction.ts`). Store schema **v12** migrates old progress away. Shell chapter rail uses `isSubStepSatisfied` / `canNavigateToSubStep`. Reveal `canSave` requires `isGuidedDraftSaveable(...)` (all prior steps still hold picks) **and** HP/EN remaining 0. |
| **P0-2** | P0 | `pruneUnresolvedSkillAllocations` (`skill-reconcile.ts`) wired in `skills-step.tsx` (mirrors loadout prune; gated on non-empty codex index). |
| **P1-1** | P1 | L2/L3 `applyGuidedEquipmentL2Refs` enforces `currencyBudget` for **weapon, armor, and gear**. L1 add + quantity use `wouldExceedCurrency` on all three phases. Loadout Continue blocked when overspent; overspend notice in UI; loadout satisfaction requires `currency >= 0`. |
| **P1-2** | P1 | `ancestry-pick-gate.ts` — mixed-species skills screen no longer short-circuits to `true`. |
| Cleanup | — | Deleted `ancestry-forward-landing.ts` (+ test); path/species draft clear patches still wipe dependent fields (now meaningful because progress is derived). |
| **P1-1 leftover** | P1 | LoadoutStep syncs the **signed** remainder into `draft.currency` as picks change (rail/Reveal see overspend). `clampSavedCurrency` floors the saved character at 0 (`build-character.ts` only). |
| **P1-3** | P1 | `buildCreatorSkillSaveRows` already resolved highest linked ability; Guided `build-character` and Advanced finalize now pass `abilities` (Advanced also `draft.skillAbilities`). |
| **P1-4** | P1 | Shared `resolveArchetypeProficiencyStart` in `formulas.ts`. Guided save + Advanced `setArchetypePath` / `getCharacter` fallback. Guided archetype payload includes `*_prof_start`. |
| **P1-5** | P1 | `GuidedChoiceCard`: See more/See less stop card-select keys; select only when key target is the card root; selection announced in aria-label (dropped invalid `aria-selected`). |
| Tests | — | Store + `substep-satisfaction.test.ts`: change path → Reveal blocked; species change; negative currency. Currency clamp, highest-ability persist, path prof start. |

#### Still open (guided)

| Audit ID | Severity | Remaining work |
|---|---|---|
| **P1-5 leftover** | P1 | Parent grids `role="listbox"` around choice cards — skip while ancestry/skills/loadout step files are Wave 2 WIP. |
| **P1-6–P1-10** | P1 | Auth gate UX, server-trusted save, duplicate-create on flaky network, abilities recommended write-back, auto character-feat — **not started** in this pass. |
| **P2+** | P2 | Catalog double-build, virtualization, store subscription breadth, error surfaces on failed fetches, etc. |
| Commit | — | Prefer one funnel-integrity commit for P0-1/P0-2/P1-1/P1-2/P1-3/P1-4 (or split P0 vs currency vs prof/skill). |

### Advanced creator store migrate (report 06 P0) — `queued` (was mis-labeled in-progress)

| Finding | Status | Note |
|---|---|---|
| `character-creator-store` destructive `migrate` wipes draft on any schema bump | `queued` | Still `if (version < CREATOR_STORE_SCHEMA_VERSION) return fresh draft`. **No edits in this session.** Do not mark in-progress until work starts. |

### Character write-path / cache (reports 06, 01 leftovers) — `queued`

| Finding | Status | Note |
|---|---|---|
| Dirty-key PATCH + `updatedAt` precondition; autosave refs/retry/timeout; per-user rate key | `partial` | Autosave callback-refs + retry + pagehide flush landed (`useAutoSave`). PATCH already uses per-user `buildRateLimitKey`. Dirty-key PATCH + `updatedAt` 409 still queued (Architect / ADR). |
| Two disconnected character write paths (`useState`+effect vs unused TanStack Query) | `queued` | — |
| Query cache not cleared on sign-in; keys not user-scoped | `partial` | `queryClient.clear()` on SIGNED_IN / SIGNED_OUT / USER_UPDATED; `useCampaignsFull` gated on user. Character query-key user-scoping still open. |
| Align GET with visibility **column** | `done` | `resolveCharacterVisibility` on GET `[id]` + list. |

---

## Wave 3 — structure, growth, process (`queued`)

Not started. Carry-overs from Wave 1 that belong here:

| Area | Source | Notes |
|---|---|---|
| Legacy creator retirement: close 2 parity gaps, extract ~940 shared LOC, delete ~10,514 | report 02 | After guided P0s are solid |
| Duplication collapse: codex/library ~2,785, admin ~1,210, shared UI ~1,131, sheet ~340 LOC | reports 10, 08, 04 | |
| Split `shared/` into `ui / patterns / feature` | report 04 | Architect |
| Generated Supabase types; delete hand duplicates / 6 mismatches | report 12 | |
| SEO: sitemap, robots, metadataBase, OG, `generateMetadata`; server-render `/rules` + codex detail | report 07 | |
| `text-muted` codemod (335 sites, zero render change) | report 04 | Token already fixed |
| `font-nunito` inert — register `--font-nunito` in `@theme` | report 04 | |
| `noUncheckedIndexedAccess` burn-down (163 errors) | report 11 / 12 | Tooling ready |
| Prettier enablement after format commit | report 11 | |
| Process trim: ~10k docs lines, CI gate count | report 11 | |

---

## Decisions taken

**Muted vs secondary text (2026-08-13).** The accessibility rule mandated
`text-text-muted dark:text-text-secondary`. The two tokens **cannot** meaningfully differ in dark
mode (muted must clear AA on `--color-surface-alt`). `--color-text-muted` now aliases
`--color-text-secondary` in dark mode; the rule was corrected; codemod is queued (Wave 3). Owner
accepted.

**Modal `size="3xl"` removed** on zero-usage evidence; `full` is the wide option. `FEATURE_INDEX.md`
corrected.

**Codex "data loss" — do not recover.** Intentional editorial clears (report 13). Recovery SQL is
DO-NOT-RUN.

**Training-Point rounding — do not flip without owner ack.** Working tree documents per-part floor
as shipped behaviour; doc still says ceil-at-end.

---

## Owner decisions outstanding

1. **Training-Point rounding.** Code floors per part; `GAME_RULES.md:227` says sum first, round up
   at end. Exposure: 1 fractional `base_tp` part, 13 fractional option TP among 420 parts. Flip
   *increases* costs (could push 119 powers / 47 techniques over budget).
2. **Rarity vs currency.** IP-derived rarity vs doc currency bands; uncapped
   `low*(1+0.125c)`.
3. **Absolute ability minimum.** Code −2 absolute; doc −5 absolute / −2 at creation.
4. **Orphan profile row** `f4f4961c…` and **leaked-password protection** (Dashboard).
5. **GitHub branch protection** — require PR + checks `Lint, contrast & static gates`,
   `Visual regression & accessibility`, `verify`.
6. **URGENT — next PR CI:** set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` **or**
   `E2E_OPTIONAL=1`. Authenticated e2e no longer false-greens.
7. **Sentry DSN** in Vercel (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, optional
   `NEXT_PUBLIC_SENTRY_ENVIRONMENT`).
8. **Local Node v22 vs `engines` 24.x** — upgrade local or relax engines.

---

## Suggested next agent sessions (ordered)

1. **TASK-738** — Guided P1-6–P1-10 (auth-gate UX, server-trusted save, idempotent create, recommended abilities write-back, character-feat auto-pick). Owner ack to do later.
2. **TASK-739** — Clamp Advanced `getCharacter` currency at 0 (cycle-safe; do not import `clampSavedCurrency` into the store). Owner ack to do later.
3. **Write-path integrity remainder** — dirty-key PATCH + `updatedAt` 409 (needs ADR / Architect),
   sheet `useCharacter` unification. Autosave hook hardening is done (TASK-736).
4. **Advanced creator migrate** — non-destructive schema migrate (report 06 P0).
5. **Owner decisions** — TP rounding / ability min / rarity before flipping those numbers.
6. **Wave 3** only after Wave 2 P0s are green.

---

## Corrections to the audit

Recorded because the value of an audit is in being right, not in having been right first.

1. **Codex data loss — retracted.** 22 parts and 1 feat appeared to lose values. Every null is in
   `changed_fields` inside deliberate saves. Recovery SQL is DO-NOT-RUN. See report 13.
2. **Feat 248 was not a nulled column.** Delete + id reuse (`Flawless Fighter` → `Elemental
   Adaptation` 26 minutes later). Real defect: id recycling silently repointing characters.
3. **`user_profiles.username` does have a unique index** (`user_profiles_username_key`). Real defect:
   RLS-blind collision check + discarded `23505` while reporting success.
4. **CI exists and is substantial.** Real defect: workflows on `push: [master]` race the deploy.
5. **`ability-score-grid`'s undefined token was dead code**, not a dark-mode visual bug.
6. **Codex-layer dead-export count was overstated** (PowerShell `[type]` globbing).
7. **`noUncheckedIndexedAccess` is ~163 errors**, not ~1,523.
8. **Raw-color waiver covers 3 files**, not all 124 under `components/ui/**`.
9. **Seed CSV parity is worse than reported** — every CSV behind live; `--reset` lossy even for
   "reproducible" tables.
10. **Report 13 independently confirmed** by `db:check-codex-drift` (0 collateral nulls / 708 rows).
11. **Audit miss: every archetype spreadsheet save was failing.** `toDbPayload` digit-split →
    nonexistent columns (`level_1_feats` vs `level1_feats`). Found by the new parity test.
12. **Wave 1 briefly broke account deletion** until `deleteAccountAction` moved to service-role
    (session client deleted 0 rows after policy drop). Likely origin of the orphaned profile.
13. **Smoke Origin follow-up resolved itself** — `scripts/smoke-realms-images-api.js` was already
    deleted as dead code by Ops.
14. **Feat 248 character scan (post-retirement).** 0 characters hold id `248`; current name
    `Elemental Adaptation`; `codex_retired_ids` has 1 row. No remapping needed.
15. **Wave 2 agents stalled on usage limits** with a broken mid-edit tree. Stabilize pass restored
    typecheck; progress inventories above are the source of truth for resume — not a fresh audit.
