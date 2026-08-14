# Audit Remediation Program — 2026-08

Living tracker for the sitewide audit in `reports/audit-2026-08-13/`. **Landed on `master`**
(the working branch is no longer a separate `audit/remediation-2026-08` fork). Working tree was
clean as of the 2026-08-13 evening plan refresh.

**Status values:** `done` (implemented + verified), `partial` (landed mid-AC; remaining work listed),
`in-progress`, `queued`, `owner-decision` (product call, not engineering), `deferred` (with reason).

**How to use this file:** it is the index from finding → fix → commit (or working-tree note). When a
row moves to `done`, record the commit subject. When a row is `partial`, record **what landed** and
**what remains** so the next agent does not re-discover progress from diffs.

**Snapshot date:** 2026-08-13 (late evening, America/New_York) — tracker refreshed to match `master`
+ owner acks. Wave 2 coding pass started (TASK-740 first).

---

## Program snapshot (read this first)

| Wave | Verdict | Notes |
|---|---|---|
| **0 — foundation** | `done` | Backups, schema baseline, codex data-loss determination. |
| **1 — stop the bleeding** | `done` (code + DB + ops) | GitHub required checks + Actions public Supabase secrets + `E2E_OPTIONAL=1` + orphan profile delete. **2026-08-13 Vercel:** Upstash Redis + Sentry DSN live on production/preview; `NEXT_PUBLIC_SITE_URL` on production; production rebuilt. Still owner: HIBP, E2E test user, optional “require PR”. |
| **2 — correctness** | `done` (code; pending-qa) | P0/P1-1–P1-5 **committed** on `master`. TASK-740 Advanced persist migrate **done**; TASK-738 guided P1-6–P1-10 + server legality + idempotent create **done**; TASK-744 styleguide Linux baselines **done**; TASK-741 dirty-key PATCH **done**; TASK-742 acked rules leftovers **done**; TASK-739 Advanced currency clamp **done**; TASK-746 library add lock **done**; TASK-747 realtime non-resource merge **done**; TASK-749 PATCH currency floor **done**; TASK-750 sheet Query SoT **done**. Remaining Wave 2 coding: none. |
| **3 — structure** | `queued` | Wave 2 P0 TASK-741 (dirty-key PATCH) is green in code. Cheap Prettier/`text-muted` mega-diffs still wait for owner to start Wave 3. |

### Commits on `master` (audit program, oldest → newest)

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
| `a0fe048d` | TASK-714 / TASK-734–737 leftovers (ChoiceCard keyboard, GET visibility, autosave, query cache) |

Later `master` commits (`6adf344f`, `21ffcd18`, …) are unrelated product work on top of this program.

### Live DB migrations applied

| File | Applied | Contents |
|---|---|---|
| `sql/schema/0001_audit_remediation_security_2026-08-13.sql` | yes | Role trigger INSERT+UPDATE; per-column grants excluding `role`; drop self-delete; visibility column authority; `codex_retired_ids`; `role_policies` scoped; vtt index/bucket |
| `sql/schema/0002_codex_locking_and_atomic_levels_2026-08-13.sql` | yes | `updated_at` + touch triggers on 9 `codex_*` tables; `replace_archetype_levels` RPC (service_role) |
| `sql/schema/0000_baseline_2026-08-13.sql` | refreshed | Matches live after `0002` (`npm run db:diff` clean at last check) |
| `sql/core-rules-sizes-rulebook-2026-08-13.sql` | yes (data) | Replaced stale `SIZES` blob with rulebook `categories[]` (8 sizes, cm heights, carrying + movement prose) |

### Uncommitted / follow-up coding

Plan refresh + GAME_RULES / SIZES seed / admin editor prose may still be uncommitted.
Wave 2 coding: TASK-740, TASK-738, TASK-744, TASK-741, TASK-742, TASK-739, TASK-746, TASK-747, TASK-749, and TASK-750 done. Next agent work is product leftovers (TASK-733) / owner-priority creator tasks, not a new Wave 2 P0.

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
| Orphan profile `f4f4961c…` | `done` | 2026-08-13: no `auth.users` row, 0 characters/campaigns/library. Deleted `usernames` + `user_profiles` (`player958773`). |
| Leaked-password protection | `owner-decision` | Dashboard Auth → Password. **Pro plan.** MCP cannot toggle. TASK-353 / DEV-001. |

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
| Helper layering (admin → lib) | `done` | Relocate committed as `3a31aef4`. |

### Ops, CI & recoverability (reports 11, 12) — done (`7217837a`)

| Finding | Status | Note |
|---|---|---|
| **P0** `db:seed` wiped codex before input check | `done` | `scripts/seed-plan.mjs`; upsert default; guarded `--reset`. |
| **P0** backup script lied on failure | `done` | Size + SQL markers; all four storage buckets. |
| **P0** nothing blocked a bad deploy | `done` (in-repo + GitHub checks) / `owner-decision` (require PR) | pre-push typecheck+tests; e2e no longer false-green. **2026-08-13:** required status checks on `master` (`Lint, contrast & static gates`, `Visual regression & accessibility`, `verify`); `enforce_admins` off so the owner can still push. Did **not** require PRs (current ship flow). `E2E_OPTIONAL=1` + Actions `NEXT_PUBLIC_SUPABASE_*` secrets set. Full auth e2e still DEV-003. |
| **P0** no error monitoring | `done` | Sentry wired. Marketplace resource `sentry-copper-canvas` connected; `NEXT_PUBLIC_SENTRY_DSN` on Vercel production + preview. Production rebuilt 2026-08-13. Confirm an event in Sentry (TASK-745 pending-qa). |
| **P1** schema drift detection | `done` | `npm run db:diff` / `db:baseline:update`. |
| **P1** codex drift scan | `done` | `npm run db:check-codex-drift` — 708 rows, 0 collateral nulls. |
| **P2** dead scripts / lint / deps / unsound staged typecheck | `done` | — |
| `noUncheckedIndexedAccess` | `queued` | **163** errors (not ~1523). Tooling: `tsconfig.strictest.json` + `npm run typecheck:strictest`. Wave 3-ish. |
| Prettier | `partial` | `.prettierrc.json` added; **not** in lint-staged (1,277 files unformatted). Enable after a dedicated format commit. |

---

## Wave 2 — correctness (`done` — code; pending-qa)

P0 formula unification and guided funnel P0 / P1-1–P1-5 are **committed** (`ebe2c3ce`, `a0fe048d`). Resume from the checklists and ACTIVE_TASKS — do not restart from the audit reports blindly. Wave 2 coding pass is complete (through TASK-750).

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
| Misc | — | `calculateXpToLevelUp`; dead `buildPowerMechanicPartPayload` removed from power-calc; formulas/constants/mechanic-builder/technique-calc touch-ups. |
| **T1 / T2 / T3** | — | `calculations.test.ts` Powered-Martial Energy via `calculateMaxEnergyForArchetype`; `formulas.test.ts` unproficient table {−3…5} (sheet unarmed must keep calling `unproficientBonus`) + skill-point **3×level** (not the `getTotalSkillPoints` alias). |
| **M6 / T6** | P1 | Per-part TP floor comments + test cite GAME_RULES (three 2.5-TP parts → 6, not ceil 8). |
| **M10** | P2 | `checkFeatRequirements`: hard `lvl_req`; else character level ≥ 2 × feat level (feat rank 1 with no `lvl_req` stays legal at L1). |
| **M11 / T10** | P2 | IP picks rarity; `calculateCurrencyCostAndRarity` clamps to band `currencyMax`. |
| **M12 / D4 / D5** | P1–P2 | `calculateCreatureSpeed` = player Speed (no size add). Stat-block + creature creator call shared helpers + `useGameRules`. Deleted `CREATURE_SIZES[].modifier`. |
| **N2 / D8 / T8** | P1 | `getTechniquePercentageMultiplier` runs `dedupeSavedParts`. |
| **D7** | P1 | Damage option level already one helper (`calculateDamageOptionLevel`); tests pin 1d4/1d6/1d8. |
| **M8** | P2 | `redistributeProficiency` documented as path-switch default (odd remainder to Martial); every-5th-level +1 remains a level-up pick. |
| **M9** | P2 | `calculateMaxArchetypeFeats` delegates to `calculateArchetypeProgression` (milestone feat picks count). |
| **M13 / M14** | P3 | GAME_RULES: unproficient-sub-skill-when-base-unproficient row; Crafting section (`core_rules.CRAFTING` + `crafting-utils.ts`). |
| **T4 / T5 / T7 / T9** | — | `canIncreaseDefense`; parseLevel 0 / 0.25; numeric skill_req; three `calculateAllStats` golden characters. |

#### Still open (rules)

| Audit ID | Severity | Remaining work | Task |
|---|---|---|---|
| **M7** | P1 | **Closed** — −2 ability score floor (docs + `MIN: -2`). | n/a |

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
| **P1-1 leftover** | P1 | LoadoutStep syncs the **signed** remainder into `draft.currency` as picks change (rail/Reveal see overspend). `clampSavedCurrency` floors the saved character at 0 (Guided `build-character` and Advanced `getCharacter`, TASK-739). |
| **P1-3** | P1 | `buildCreatorSkillSaveRows` already resolved highest linked ability; Guided `build-character` and Advanced finalize now pass `abilities` (Advanced also `draft.skillAbilities`). |
| **P1-4** | P1 | Shared `resolveArchetypeProficiencyStart` in `formulas.ts`. Guided save + Advanced `setArchetypePath` / `getCharacter` fallback. Guided archetype payload includes `*_prof_start`. |
| **P1-5** | P1 | `GuidedChoiceCard`: See more/See less stop card-select keys; select only when key target is the card root; selection announced in aria-label (dropped invalid `aria-selected`). |
| Tests | — | Store + `substep-satisfaction.test.ts`: change path → Reveal blocked; species change; negative currency. Currency clamp, highest-ability persist, path prof start. |
| **P1-6** | P1 | Guided page renders the shell on `useIsClient()` instead of blocking the whole funnel on `useAuth().loading`. The client-only guard stays (zustand-persist hydration); Reveal still gates save on login via `LoginPromptModal`. |
| **P1-7** | P1 | `POST /api/characters` runs `findLevel1LegalityViolations` (`lib/game/character-legality.ts`) on level-1 creates → `400 { error, details }`. Owner ack 2026-08-13: **bounds only** for spend/counts (spend ≤ budget, counts ≤ max, `currency >= 0`, HP+EN ≤ pool), each budget at the more permissive of `core_rules` override and code default, so it cannot 400 a build a creator allowed. **Feat requirements are not a budget**: official catalog feats that fail `checkFeatRequirements` are refused. Server rules read via `lib/core-rules-server.ts` (also the codex route's single reader). |
| **P1-8** | P1 | Idempotent create: `characters.client_request_id` + partial unique index on `(user_id, client_request_id)` (`sql/task-738-characters-client-request-id.sql`, applied 2026-08-13). Route replays the first row for a repeated key **ahead of the quota check**, and recovers from a concurrent `23505` by re-reading the winner (create and duplicate share one insert helper). Both creators persist one uuid on the draft, reused by retries and reload; `resetCreator` clears it. |
| **P1-9** | P1 | `resolveGuidedRecommendedAbilitiesPatch` (`creator-entry-mode.ts`): no write while the archetype codex is in flight (no fallback lock-in), and re-sync whenever the recommendation changes under `abilitiesMode: 'recommended'` — the array on screen is the array that saves. |
| **P1-10** | P1 | Character-feat auto-pick effect deleted; L1 card select routes through the same toggle as the catalog. `selectableCuratedFeatIds` (`feat-selection.ts`) filters curated L1 ids through `checkFeatRequirements` in **both** feat steps, keeping an already-selected unmet pick visible so it stays deselectable. |
| Tests (738) | — | `character-legality.test.ts` (spend/count bounds + feat-requirement cases), route replay / race / legality 400 / unmet-feat 400 / key-not-in-blob, persist `clientRequestId`, `resolveGuidedRecommendedAbilitiesPatch`, `selectableCuratedFeatIds`. |

#### Still open (guided)

| Audit ID | Severity | Remaining work |
|---|---|---|
| **P1-5 leftover** | P1 | **Closed.** Grep 2026-08-13: no parent `role="listbox"` around Guided choice cards. |
| **P1-6–P1-10** | P1 | **Closed** by TASK-738 (see rows above). Manual QA pending: `DEV-V-051`. |
| **P2+** | P2 | Catalog double-build, virtualization — Wave 3 / later. |
| Advanced currency clamp | P1 | **Closed** by TASK-739 — `getCharacter` uses `clampSavedCurrency` (`lib/character-save.ts`); draft may stay signed. PATCH floor when the key is present: TASK-749. |

### Advanced creator store migrate (report 06 P0) — `done` → TASK-740

| Finding | Status | Note |
|---|---|---|
| `character-creator-store` destructive `migrate` wipes draft on any schema bump | `done` | Schema v3: `migrateCharacterCreatorPersistedState` + persist `merge` keep known fields and default missing ones (same pattern as Guided). Vitest: v1 in-progress draft survives migrate to current version. |

### Character write-path / cache (reports 06, 01 leftovers) — `done`

| Finding | Status | Note |
|---|---|---|
| Dirty-key PATCH + `updatedAt` precondition; autosave refs/retry/timeout; per-user rate key | `done` | Autosave callback-refs + retry + pagehide (`useAutoSave`). PATCH per-user `buildRateLimitKey`. Dirty-key PATCH + `updatedAt` 409 + user-scoped character query keys: TASK-741 / ADR-0013. Library add-to-character lock + 409 re-apply: TASK-746. Sheet realtime non-resource merge: TASK-747. |
| Two disconnected character write paths (`useState`+effect vs unused TanStack Query) | `done` | **TASK-750.** Sheet reads `useCharacter`; `setCharacter` is `setQueryData` on `characterKeys.detail`. Autosave still uses `saveCharacterWithConflictRetry` + cache stamp. `useSaveCharacter` merges into the detail cache and invalidates lists only. |
| Query cache not cleared on sign-in; keys not user-scoped | `done` | `queryClient.clear()` on SIGNED_IN / SIGNED_OUT / USER_UPDATED; `useCampaignsFull` gated on user. Character query keys include viewer uid (TASK-741). |
| Align GET with visibility **column** | `done` | `resolveCharacterVisibility` on GET `[id]` + list. |

---

## Wave 3 — structure, growth, process (`queued`)

Not started. **Do not start** until Wave 2 P0 TASK-741 (dirty-key PATCH) is green. Cheap codemods (Prettier, `text-muted`) create huge diffs that conflict with Wave 2. Carry-overs from Wave 1:

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

**Training-Point rounding (2026-08-13 owner).** Per-part **floor** is the rule (only exception to
round-up). GAME_RULES updated. Comments/tests pin three 2.5-TP parts → 6 (TASK-742).

**Ability minimum (2026-08-13, 2A).** Ability **scores** floor at −2 for characters and creatures.
Temp modifiers are how play goes past that. Creatures may break other hard rules; not this floor.

**Rarity vs currency (2026-08-13, 3B).** IP determines rarity; `c` determines cost (rarity
multiplier). Clamp currency to that rarity’s `currencyMax` so it cannot spill into the next
bracket. TASK-742.

**Feat level (2026-08-13, 4A+4B).** Hard `lvl_req` always wins. Otherwise character level must be
≥ 2 × feat level (feat rank 1 with no `lvl_req` stays legal at L1). TASK-742.

**Size (2026-08-13).** Rulebook table + space/shape / carrying / enemy-space prose. Live
`core_rules.SIZES` replaced (was a stale feet/`space` blob). Speed is **not** size-modified;
TASK-742 removed the undocumented `CREATURE_SIZES.modifier` add. Gargantuan carry recorded as
`1600 + 800×STR` (rulebook draft typo `x` → `+`).

**Architecture (2026-08-13, owner: agent judgment).** Do not waive server-trusted L1 create
(TASK-738 includes legality + idempotency). Advanced migrate (TASK-740) landed before dirty-key
PATCH (TASK-741) — wiping drafts is worse than lost-update races. Wave 3 after 741, not in
parallel.

---

## Owner decisions outstanding

1. **HIBP leaked-password protection** — Dashboard only, Pro plan. TASK-353 / DEV-001.
2. **E2E test user** — `E2E_OPTIONAL=1` acknowledges the skip; DEV-003 still needed for real auth coverage.
3. **Optional: require PRs** before merging to `master` (checks are already required; admins can still push).
4. **`auth.users` FK type migration** — still deferred (needs branch-DB rehearsal).

---

## Suggested next agent sessions (ordered)

Wave 2 coding pass is complete (through TASK-750):

1. **TASK-756** (sequential innate → powers → techniques), then TASK-757–760. TASK-733 can run in parallel. TASK-761 is a 750 leftover — low.
2. **TASK-751–753** — Archetype Path Filtering (filed 2026-08-14). Low priority; start after TASK-733 **and** TASK-756/758/759 so path-filter wiring lands on the new screens/columns. Does **not** wait for Wave 3 — the shared filter should exist before the Codex/Library duplication collapse so that pass does not fork it.
3. **Wave 3** — start only when the owner opens that pass (avoid Prettier/`text-muted` mega-diffs colliding with remaining product leftovers).

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
    typecheck; **later the same day** P0/P1-1–P1-5 committed as `ebe2c3ce` / `a0fe048d`.
16. **Live `core_rules.SIZES` was a stale 5e-shaped blob** (`tiny.space: 2.5` feet, no Miniscule/
    Humongous). Seed JSON and the admin editor already expected `categories[]`. Replaced 2026-08-13.
17. **Local Node 22 vs engines 24.x was stale.** Owner machine and Vercel are already Node 24.x.
18. **Orphan profile `f4f4961c…` had no auth user and no content.** Deleted profile + username.
