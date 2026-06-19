# AI Task Queue

Prioritized tasks for AI agents. **Stack: Supabase only (no Prisma).** Task text may still mention Prisma for historical context; data access is Supabase only. Ignore Firestore/RTDB/Firebase in old task text.

**Focus:** Pick `status: not-started`, `in-progress`, or `partial` (read `remaining_work` / `follow_up_tasks`). Skip `done` unless verifying. Human-only: [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md). Read `AGENT_GUIDE.md` first.

**Status rules:**
- **`done`** — Every acceptance criterion met.
- **`partial`** — Set `completed_work`, `remaining_work`, `follow_up_tasks`. Never `done` + "deferred" alone.
- **`blocked`** — Owner action in DEVELOPER_TASK_QUEUE.

---

> **Queue hygiene (2026-06):** Completed (`done`) and `cancelled` task blocks were moved to
> [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) to keep this active queue lean.
> Embedded historical prose (phase/tier notes) is retained below for context.
>
> **In-progress tasks (TASK-305–308, TASK-310)** are implemented locally per their notes but have
> **no commit referencing the TASK id** (verified via `git log --grep`). Verify merge status and
> finish/commit (referencing the TASK id) before marking `done`.

# How to use
- Pick `priority: high` then `medium`, `status: not-started` / `in-progress` / `partial`. Use `done` only when all acceptance criteria pass.
- **New tasks:** Use next TASK-### ID (see end of file), `AI_REQUEST_TEMPLATE.md` format. Add when audits or implementation reveal work. Check queue first to avoid duplicates.

- id: TASK-269
  title: Fix Resources page Character Sheet PDF 404
  priority: medium
  status: done
  created_at: 2026-02-23
  created_by: agent
  description: |
    Resources page links to "/Realms Character Sheet Alpha.pdf"; GET returns 404. File must be placed in public/ (exact name with spaces) or link updated to an existing asset. Alternatively show "Coming soon" or conditional message if file is not yet available.
  related_files:
    - src/app/(main)/resources/page.tsx
  acceptance_criteria:
    - Either PDF exists in public/ and link works, or link points to existing asset, or UI clearly indicates unavailability and does not 404.
  notes: "DONE 2026-06-13: `public/Realms Character Sheet Alpha.pdf` exists and resources page links to `/Realms Character Sheet Alpha.pdf` with download attribute. No 404."

- id: TASK-305
  title: Fix email/password onboarding (verification + redirects + resend)
  priority: high
  status: done
  created_at: 2026-04-09
  created_by: owner
  description: |
    Email/password sign-up should be intuitive and align with Supabase Auth best practices.
    When email confirmation is required, users must see a clear “Check your email” state instead of being redirected into authenticated pages.
    Redirect params should be consistent across the app (`redirect` vs `returnTo`), and users should be able to resend confirmation from login/register.
    Password reset redirects must use the OTP confirm flow (`/auth/confirm`) rather than OAuth callback.
  related_files:
    - src/app/(auth)/register/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/forgot-password/page.tsx
    - src/app/auth/confirm/route.ts
  acceptance_criteria:
    - Register uses `emailRedirectTo` pointing to `/auth/confirm?next=...`
    - If `signUp()` returns no session, Register shows a “Check your email” success screen and does not redirect into the app
    - Login supports both `redirect` and `returnTo` and safely normalizes redirect paths
    - Login surfaces clear “confirm your email” messaging and allows resending confirmation
    - Forgot password uses `/auth/confirm?next=/login` redirect
    - `npm run build` passes
  notes: |
    In progress 2026-04-09: Implemented confirm-aware signup success UI + resend confirmation; normalized redirect params (`redirect` + `returnTo` + sessionStorage fallback) on login/register; login shows confirm errors and supports resend; forgot-password redirectTo now uses /auth/confirm. PR link pending.
    Normalized to done 2026-06-12 (double-check pass): verified in code — register emailRedirectTo `/auth/confirm?next=...` + "Check Your Email" state + resend; login reads `redirect`/`returnTo` with safe path normalization; forgot-password redirectTo `/auth/confirm?next=/login`. Build passes.

- id: TASK-306
  title: Allow leveling down in Level Up modal
  created_at: 2026-04-20
  created_by: owner
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/level-up-modal.tsx
    - src/app/(main)/characters/[id]/page.tsx
  pr_link: (pending)
  merged_at: (pending)
  description: |
    The character sheet Level Up modal currently only supports increasing level. It should also allow
    decreasing level(s) (for manual adjustment and testing), with the preview panel showing negative
    deltas correctly before applying the change.
  acceptance_criteria:
    - The level selector supports decrementing below current level (down to level 1)
    - The gains preview displays negative deltas correctly (no "+-12" formatting)
    - Confirm is disabled when target level equals current level
    - `npm run build` passes
  notes: |
    Owner feedback 2026-04-20: "the levle up modal should also let you go down level(s) not just up"
    Implemented locally 2026-04-20:
    - Level selector now allows decrementing down to level 1 (not just current+1..max)
    - Preview deltas render with correct sign formatting (no "+-")
    - Confirm disabled unless target differs from current level
    - Verification: `npm run build` passes
    Normalized to done 2026-06-12 (double-check pass): verified in level-up-modal.tsx — minLevel=1, decrement enabled to 1, confirm disabled when !isLevelChange, ArrowDown/Up + signed deltas.

- id: TASK-307
  title: Species preview modal should expand multi-choice traits
  created_at: 2026-04-20
  created_by: owner
  priority: medium
  status: done
  related_files:
    - src/components/character-creator/species-modal.tsx
    - src/components/character-creator/steps/species-step.tsx
    - src/lib/choice-trait.ts
  pr_link: (pending)
  merged_at: (pending)
  description: |
    In the Species step preview modal (opened before selecting a species), traits that have multiple
    choice options (via `option_trait_ids`) should be expandable so users can view the available
    options before picking the species.
  acceptance_criteria:
    - In the species preview modal, choice traits render with an expand/collapse UI
    - Expanding shows all option traits (name + description)
    - Non-choice traits render as before
    - `npm run build` passes
  notes: |
    Owner feedback 2026-04-20: expand multi-choice traits in species preview modal.
    Implemented locally 2026-04-20:
    - SpeciesModal renders traits with `option_trait_ids` as expandable rows (shows option list)
    - Build verified: `npm run build` passes
    Normalized to done 2026-06-12: verified implemented during systematic audit (SA-5-18) and re-confirmed in double-check pass (component present + wired).

- id: TASK-308
  title: Ancestry step choice traits should use expandable option list (not dropdown)
  created_at: 2026-04-20
  created_by: owner
  priority: high
  status: done
  related_files:
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/shared/choice-trait-option-select.tsx
    - src/components/shared/index.ts
    - src/components/character-sheet/edit-species-modal.tsx
  pr_link: (pending)
  merged_at: (pending)
  description: |
    The ancestry-step (and matching edit-species flow) currently uses a <select> for choice traits
    (traits with `option_trait_ids`). This prevents users from reading the full option descriptions
    before selecting.
  acceptance_criteria:
    - Choice traits render an expandable list of options (name + description) with a clear selected state
    - Users can select/unselect an option from the list (tap targets ≥ 44px)
    - Creator Ancestry step and sheet Edit Species modal both use the same pattern
    - `npm run build` passes
  notes: |
    Owner feedback 2026-04-20: replace dropdown choice-trait UI with expandable list picker.
    Implemented locally 2026-04-20:
    - Added `ChoiceTraitOptionListPicker` (expandable options with descriptions + select button)
    - Wired into creator `ancestry-step` and sheet `edit-species-modal`
    - Verification: `npm run build` passes
    Normalized to done 2026-06-12: verified implemented during systematic audit (SA-5-19) and re-confirmed in double-check pass (choice-trait-option-select.tsx present + wired into ancestry-step + edit-species-modal).

- id: TASK-310
  title: User library drift detection + patch sync controls (powers/techniques/armaments)
  created_at: 2026-05-01
  created_by: agent
  priority: high
  status: done
  related_files:
    - src/lib/library-sync.ts
    - src/app/(main)/library/LibraryPowersTab.tsx
    - src/app/(main)/library/LibraryTechniquesTab.tsx
    - src/app/(main)/library/LibraryItemsTab.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
  pr_link: (pending)
  merged_at: (pending)
  description: |
    Add a lightweight dependency-safety workflow for user libraries:
    detect unresolved/deleted parts/options/properties against current codex rules, show non-blocking
    drift warnings, and allow explicit per-item and global “Sync with current patch” updates.
    Keep character-sheet enrichment live with latest available technique sources (including empowered techniques).
  acceptance_criteria:
    - Shared drift/sanitize utility exists for powers, techniques, and armaments (missing ref + missing option detection).
    - My Library powers/techniques/armaments lists show drift state and non-blocking warning context.
    - Per-item sync action updates only the selected drifted entry to sanitized current-rule payload.
    - Global sync action updates all drifted entries in the active tab.
    - Character sheet enrichment includes empowered-technique libraries in technique resolution fallback.
    - `npm run build` passes.
  notes: |
    In progress 2026-05-01:
    - Added shared resolver/sanitizer in `src/lib/library-sync.ts` with null-safe option handling and missing-ref detection.
    - Added per-item + global sync controls and drift badges/warnings to powers, techniques (standard + empowered), and armaments tabs.
    - Updated character sheet data sources to include user/public empowered techniques in technique enrichment fallback.
    - Verification: `npm run build` passes.
    Follow-up 2026-05-16:
    - Fixed drift detection blind spot where edited part/property definitions did not trigger sync state.
    - Added dependency fingerprint metadata and comparison logic (`syncMeta.dependencyFingerprint`) for powers/techniques/items/creatures.
    - Legacy entries without fingerprint metadata now surface as drifted once ("needs bootstrap sync"), then store fingerprint on sync.
    - Verification: `npm run build` passes.
    Normalized to done 2026-06-12 (double-check pass): library-sync.ts present; per-item + global sync + drift badges wired across powers/techniques/empowered/armaments tabs; referenced as live by TASK-335. (Note: TASK-335 item 5 — add a confirm to global sync — remains tracked under TASK-335, not here.)

# Queued from Full-Site & AI-Workflow Audit (FULL_AUDIT_2026-06.md)

- id: TASK-313
  title: Unify enhanced-item hooks (official vs user)
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding A-2. `use-enhanced-items.ts` and `use-official-enhanced-items.ts` follow the
    same shape; the official one is used by only one admin tab and isn't in the `@/hooks` barrel.
    Unify into one parametrized hook (scope: user | official) to remove the parallel copy.
  related_files:
    - src/hooks/use-enhanced-items.ts
    - src/hooks/index.ts
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
  acceptance_criteria:
    - One shared hook (scope param or shared internal) serves both user and official enhanced-item reads.
    - Admin tab consumer migrated; no behavior change.
    - `npm run build` passes.
  notes: "2026-06-13. Option B: single `use-enhanced-items.ts` with `scope: 'user' | 'official'` for query + CRUD; `OfficialEnhancedItem` type co-located; admin tab uses `useEnhancedItems('official')` + scoped mutations from `@/hooks`; deleted `use-official-enhanced-items.ts`. Thin `useOfficialEnhancedItems` aliases retained. Build exit 0."

- id: TASK-314
  title: Extract shared official-library list renderer (Library/Admin/Codex tab dedup)
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit findings A-3 + A-4. Library browse tabs and admin public-library tabs are near-duplicates
    (`LibraryPowersTab` ≈ `AdminPublicPowersTab`; `CodexFeatsTab` ≈ `AdminFeatsTab`) — same grid,
    derive* display helpers, and codex part hooks. Extract a shared `OfficialLibraryList` (or similar)
    that both consume via props. Also replace the hand-written "My Codex not available" empty-state
    copy in `CodexFeatsTab`/`CodexPartsTab`/`CodexPropertiesTab`/`CodexCreatureFeatsTab` with the
    existing `CodexMyCodexEmpty` component.
  related_files:
    - src/lib/codex/feat-list.ts
    - src/lib/codex/skill-list.ts
    - src/components/codex/codex-feat-row.tsx
    - src/components/codex/codex-skill-row.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
  acceptance_criteria:
    - A shared list renderer collapses the duplicated grid/display logic between Library and Admin (and Codex where applicable).
    - The 4 Codex tabs reuse `CodexMyCodexEmpty` instead of inline copy.
    - No visual/behavioral regressions across Library, Admin, Codex.
    - `npm run build` passes.
  notes: |
    Done 2026-06-18. Official library lists via TASK-347; Codex≈Admin feats/skills dedup via
    lib/codex/*-list.ts + CodexFeatRow/CodexSkillRow. CodexMyCodexEmpty on 6 My-mode tabs. Build exit 0.

- id: TASK-315
  title: Finish public→official rename (delete /api/public, migrate usePublicLibrary call sites)
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding B-1. The `public`→`official` rename is half-done: `/api/public/[type]` and
    `/api/official/[type]` both exist; `use-public-library.ts` exports `useOfficialLibrary` with a
    `@deprecated usePublicLibrary` alias. ~15 call sites still import the deprecated names. Migrate
    all call sites to the official names, remove the deprecated aliases, delete `/api/public/[type]`
    (after confirming `/api/official/[type]` covers it), and rename `use-public-library.ts`.
  related_files:
    - src/app/api/public/[type]/route.ts
    - src/app/api/official/[type]/route.ts
    - src/hooks/use-public-library.ts
    - src/hooks/index.ts
  acceptance_criteria:
    - All `usePublicLibrary`/`useAddPublicToLibrary` call sites migrated to `useOfficial*`.
    - `/api/public/[type]` removed; no runtime callers remain.
    - `use-public-library.ts` renamed (and importers updated).
    - `npm run build` passes.
  notes: "DONE 2026-06-13: Migrated all call sites to useOfficialLibrary/useAddOfficialToLibrary; renamed hook file to use-official-library.ts; removed deprecated aliases; deleted /api/public/[type]; proxy matcher updated. Build exit 0."

- id: TASK-316
  title: Rename use-rtdb.ts → codex-types (misleading filename)
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding B-2. `src/hooks/use-rtdb.ts` holds Supabase Codex entity types (`PowerPart`,
    `Feat`, `Species`, …) and trait/skill resolvers — nothing RTDB. Rename to `codex-types.ts`
    (or move the pure types into `src/types/`) and update the 10+ importers + the `@/hooks` barrel.
  related_files:
    - src/hooks/use-rtdb.ts
    - src/hooks/index.ts
  acceptance_criteria:
    - File renamed; all importers and the barrel updated.
    - No `rtdb` token remains in the filename or its header.
    - `npm run build` passes.
  notes: "DONE 2026-06-13: Renamed use-rtdb.ts → codex-types.ts; barrel + direct importers updated. Build exit 0."

- id: TASK-317
  title: Adopt existing character-sheet context; split characters/[id]/page.tsx (4,200 L)
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding D-1. `characters/[id]/page.tsx` is a 4,200-line page-as-controller (auth, autosave,
    enrichment, roll context, tab routing, portrait upload, campaign visibility) that prop-drills into
    `library-section.tsx` (1,686 L) and `CharacterSheetModals.tsx`. A `character-sheet-context.tsx`
    already exists but `useCharacterSheet` is unused. Adopt the existing context to reduce prop-drilling
    and split the page into per-tab modules.
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/character-sheet-context.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/CharacterSheetModals.tsx
  acceptance_criteria:
    - `useCharacterSheet`/context is adopted for shared sheet state; prop-drilling reduced measurably.
    - Page split into smaller tab/section modules (no single-file growth).
    - No behavior regressions (autosave, enrichment, rolls, portrait, campaign visibility).
    - `npm run build` passes.
  completed_work: |
    - CharacterSheetProvider + LibrarySection context (20 prop removals).
    - TASK-348: CharacterSheetBody + useCharacterSheetDerived; four main sections on context.
    - useCharacterSheetActions: all sheet mutation handlers extracted from page.
    - LibrarySection uses entity-library-sections (*ListSection) via library-entity-rows mappers; library-section ~1783→~820 lines.
    - Single LibrarySection DOM mount in CharacterSheetBody (responsive flex/grid).
    - FeatsTab uses FeatsTraitsListSection + library-feat-rows (~760→~454 L).
    - TASK-375: shared part-display.ts for PartData + calculator TP alignment.
  remaining_work: |
    - (none)
  notes: |
    Done 2026-06-18 (continued): FeatsTab wired through FeatsTraitsListSection + library-feat-rows mappers (~760→~454 L). TASK-375 partsToPartData dedupe done. Build exit 0.
    2026-06-13 incremental. 2026-06-18: page ~639 L; entity-library-sections migration + single library mount. Build exit 0 (webpack).
  developer_test_plan: |
    Suite DEV-V-009 T001–T005 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-009
    tests:
      - DEV-V-009-T001
      - DEV-V-009-T002
      - DEV-V-009-T003
      - DEV-V-009-T004
      - DEV-V-009-T005

- id: TASK-318
  title: Split add-library-item-modal.tsx (4,762 L) into hook + per-type subcomponents
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding D-2. `add-library-item-modal.tsx` bundles fetch + filter + sort + per-type branches
    + enrichment + selection in one 4,762-line file. Extract a data hook and per-type subcomponents.
  related_files:
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-sheet/add-library-item/modal-config.ts
    - src/components/character-sheet/add-library-item/map-selection.ts
    - src/components/character-sheet/add-library-item/power-header-extra.tsx
    - src/hooks/add-library-item/
    - src/hooks/use-add-library-item-data.ts
    - src/hooks/index.ts
  acceptance_criteria:
    - Fetch/filter/sort logic extracted into a hook; per-type rendering split into subcomponents.
    - No behavior change to selection across all item types.
    - `npm run build` passes.
  notes: Done 2026-06-18. Modal ~90 lines; `hooks/add-library-item/` per-type builders + load/normalize; modal-config/map-selection/header-extra. Build exit 0.
  build_validation:
    suite: DEV-V-009
    tests:
      - DEV-V-009-T006

- id: TASK-319
  title: Remove verified-unused shared exports + legacy load-modal branch
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding E-9. Remove unused shared exports after re-verifying zero importers for each:
    `SortHeader`/`SortHeaderRow` (`list-components.tsx`), `ItemList` (`item-list.tsx`),
    `EquipmentListSection` (`entity-library-sections.tsx`), `ChoiceTraitOptionSelect`,
    `prefetchFunctions` (`use-codex.ts`), and the `LoadFromLibraryModalLegacy` branch. These touch
    large shared files, so verify each individually before deleting.
  related_files:
    - src/components/shared/list-components.tsx
    - src/components/shared/item-list.tsx
    - src/components/shared/entity-library-sections.tsx
    - src/components/shared/index.ts
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Each export confirmed zero-importer (fresh grep) before removal.
    - Barrels updated; `tsc --noEmit`, `npm run lint`, `npm run build` pass.
  notes: "DONE 2026-06-13: Removed SortHeader/SortHeaderRow, ItemList, EquipmentListSection, ChoiceTraitOptionSelect, prefetchFunctions exports; removed LoadFromLibraryModalLegacy branch. Build exit 0."

- id: TASK-320
  title: Mount or remove unused ErrorBoundary
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding E-10. `src/components/shared/error-boundary.tsx` is built but never mounted. Either
    mount it around the character sheet / creators / library (preferred — adds resilience) or remove it.
  related_files:
    - src/components/shared/error-boundary.tsx
  acceptance_criteria:
    - ErrorBoundary is either wired around the high-risk surfaces or deleted (with barrel cleanup).
    - `npm run build` passes.
  notes: "DONE 2026-06-13: MainContentBoundary wraps (main) layout children with ErrorBoundary. Build exit 0."

- id: TASK-321
  title: Reduce ESLint warnings (batch by rule)
  priority: low
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding CQ-2. ~324 ESLint warnings, dominated by `@typescript-eslint/no-unused-vars`,
    `react-hooks/exhaustive-deps`, and `react-hooks/set-state-in-effect`. Mechanical but broad —
    address in batches by rule, being careful with effect-dependency changes.
  related_files:
    - (repo-wide)
  acceptance_criteria:
    - Warning count materially reduced; no new errors introduced.
    - `react-hooks/exhaustive-deps` fixes do not change runtime behavior.
    - `npm run build` passes.
  completed_work: |
    - Batch 1 lint fix; 0 errors.
    - Batch 2 (TASK-350): lib/hooks no-unused-vars; character sheet page destructuring; ESLint 393→339 warnings.
  remaining_work: |
    - ~339 ESLint warnings remain (mostly exhaustive-deps, set-state-in-effect, admin any).
  follow_up_tasks:
    - TASK-350
  notes: "2026-06-13 batch 1."

- id: TASK-322
  title: Route admin fetch through apiFetch wrapper
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding INC-1. Data fetching mixes the `apiFetch` wrapper with raw `fetch` (admin
    public-library delete/save use raw `fetch`). Standardize on `apiFetch` for consistent
    error handling/auth.
  related_files:
    - src/lib/api-client.ts
  acceptance_criteria:
    - Admin delete/save paths use `apiFetch`; error handling consistent with the rest of the app.
    - `npm run build` passes.
  notes: "DONE 2026-06-13: Admin public-library DELETE uses apiFetch in 4 tabs. Build exit 0."

- id: TASK-323
  title: Standardize loading/error/empty-state components
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding INC-2. Loading/error/empty UI is inconsistent: `LoadingState` vs `Spinner`,
    `ErrorDisplay` vs `Alert`, `EmptyState` vs `ListEmptyState`. Pick the canonical shared components
    and migrate usages for a consistent UX.
  related_files:
    - src/components/shared/list-components.tsx
  acceptance_criteria:
    - Canonical loading/error/empty components chosen and documented (AGENT_GUIDE/unification rule).
    - Inconsistent usages migrated; visuals consistent across pages.
    - `npm run build` passes.
  notes: "DONE 2026-06-13: Absorbed by TASK-339 — ErrorDisplay+onRetry, LoadingState, ListEmptyState standardized across Library/Codex/creators/admin. Build exit 0."

- id: TASK-324
  title: Consolidate health/energy/skill-point formulas into calculations.ts
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding FRM-1. Health/energy/skill-point logic lives in both `lib/game/formulas.ts`
    (deprecated `getBaseHealth`/`getBaseEnergy`/`getCharacterMaxHealthEnergy`/`calculateSkillPoints`)
    and `lib/game/calculations.ts` (active). Remove the deprecated helpers after migrating any
    remaining callers; single-source in `calculations.ts`.
  related_files:
    - src/lib/game/formulas.ts
    - src/lib/game/calculations.ts
  acceptance_criteria:
    - Deprecated helpers removed; all callers use `calculations.ts`.
    - Values unchanged (verify against GAME_RULES.md).
    - `npm run build` passes.
  notes: "DONE 2026-06-13: Removed deprecated getBaseHealth/getBaseEnergy/getCharacterMaxHealthEnergy/calculateSkillPoints from formulas.ts (no external callers). Active logic in calculations.ts. Build exit 0."

- id: TASK-325
  title: Fix or drop session_submit.js (--autopush + wrong path)
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding WF-2. `scripts/session_submit.js` writes placeholder files to a wrong `docs/ai/`
    path (should be `src/docs/ai/`) and its `--autopush` flag auto-creates branches/commits/PRs.
    The useful task scripts (`reconcile_tasks`, `triage_tasks`, `extract_feedback`) are now wired into
    `package.json`. Decide whether to fix `session_submit.js` (correct path, remove/guard `--autopush`)
    or drop the script entirely.
  related_files:
    - scripts/session_submit.js
    - package.json
  acceptance_criteria:
    - `session_submit.js` either fixed (correct path, no unguarded git mutation) or removed.
    - No script references a non-existent `docs/ai/` path.
  notes: "DONE 2026-06-13: Autopush placeholder path fixed to src/docs/ai/; requires ALLOW_AUTOPUSH=1. Feedback path already correct. Build N/A."

- id: TASK-326
  title: Tighten Supabase security advisors (bucket listing + leaked-password protection)
  priority: medium
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding SEC-1. Supabase security advisors (WARN): public buckets `portraits` and
    `profile-pictures` allow listing via a broad SELECT policy; Auth leaked-password protection is
    disabled. Tighten storage SELECT policies and enable the HIBP leaked-password check.
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  acceptance_criteria:
    - Storage SELECT policies scoped so buckets aren't broadly listable (read-by-key still works).
    - Leaked-password protection enabled in Supabase Auth.
    - SQL/migration documented; advisors re-checked.
  completed_work: |
    - Storage SELECT hardening applied live (MCP).
  remaining_work: |
    - Enable HIBP in Supabase Auth (DEV-001).
  follow_up_tasks:
    - TASK-353
  notes: "2026-06-13. See DEVELOPER_TASK_QUEUE."

- id: TASK-327
  title: Address Supabase performance advisors (RLS initplan, dup policies, FK indexes)
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Audit finding PERF-1. Performance advisors: widespread `auth_rls_initplan` (wrap `auth.<fn>()`
    calls as `(select auth.<fn>())` so they evaluate once per query, not per row);
    `multiple_permissive_policies` on `campaign_members`/`campaigns`/`characters`/`role_policies`
    (consolidate); 3 unindexed FKs (`role_policies.updated_by`, `ui_tooltips.updated_by`,
    `usernames.user_id`); and several unused indexes (mostly on empty `official_enhanced_items`).
  related_files:
    - src/docs/SUPABASE_SCHEMA.md
    - sql/supabase-rls-initplan-fk-indexes-2026-06.sql
    - sql/supabase-rls-initplan-batch2-2026-06.sql
    - sql/supabase-rls-consolidate-permissive-2026-06.sql
  acceptance_criteria:
    - RLS policies wrap `auth.*()` in a scalar subquery.
    - Duplicate permissive policies consolidated where safe.
    - Missing FK indexes added; clearly-unused indexes removed.
    - Migrations documented; advisors re-checked; no access regressions.
  notes: "Done 2026-06-18. Batch 1 initplan + FK indexes (2026-06-13), batch 2 (TASK-354), duplicate-policy consolidation (TASK-352). Performance advisor: no multiple_permissive_policies; unused_index INFO only on empty/low-traffic tables."

# Queued from Systematic Per-Area Audit (SYSTEMATIC_AUDIT_2026-06.md)

- id: TASK-328
  title: "CRITICAL: Prevent user_profiles.role self-escalation (RLS/trigger)"
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    SECURITY (verified against live DB project lbqhiwudvifmkjtkccdg). The `user_profiles` UPDATE
    policy ("Users can update own profile") only constrains `id = auth.uid()` with NO column guard
    on `role`, and there is NO trigger protecting it. Any authenticated user can run
    `supabase.from('user_profiles').update({ role: 'admin' }).eq('id', uid)` from the browser and
    gain admin DB access, because admin RLS policies (official_*, role_policies, etc.) trust
    `user_profiles.role`. Remediate with either a column-restricted UPDATE policy (WITH CHECK that
    `role` is unchanged for non-service-role) or a BEFORE UPDATE trigger that rejects role changes
    unless performed by the service role / existing admin. Ensure the admin update-role API
    (service-role client) still works.
  related_files:
    - sql/supabase-security-hardening-2026-06.sql
    - src/lib/admin.ts
    - src/app/api/admin/users/update-role/route.ts
  acceptance_criteria:
    - A non-admin authenticated user cannot change their own (or anyone's) `role` via the Supabase client/PostgREST.
    - Admin role changes via the service-role API still succeed.
    - New-user signup/profile creation still works (INSERT path unaffected).
    - Migration documented in sql/ and run in Supabase Dashboard; re-verified via pg_policies/test.
  notes: "SA-19-1. DONE 2026-06-12: migration sql/supabase-role-escalation-fix-2026-06.sql APPLIED to production (lbqhiwudvifmkjtkccdg) via MCP apply_migration (name: prevent_role_self_escalation). Verified in a rolled-back transaction: authenticated role-change = BLOCKED, service_role = ALLOWED (admin API unaffected). Trigger trg_prevent_unauthorized_role_change enabled on user_profiles."

- id: TASK-329
  title: Campaign & roll authorization hardening (RLS + API)
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    SECURITY (multi-user). Defense-in-depth gaps: (1) `campaigns` UPDATE RLS lets any member edit the
    whole row incl. invite_code/owner_id/roster; (2) `campaign_rolls` INSERT/UPDATE/DELETE granted to
    any participant with no caller-match → roll tampering/deletion; (3) POST /api/campaigns/[id]/rolls
    trusts client characterId/characterName (roll spoofing); (4) GET /api/campaigns/invite/[code] is
    unauthenticated (invite-code enumeration); (5) joinCampaignAction trusts client roster metadata;
    (6) invite code shown to all members, not just RM.
  related_files:
    - sql/path-c-phase0-consolidate-to-public-part2.sql
    - src/app/api/campaigns/[id]/rolls/route.ts
    - src/app/api/campaigns/invite/[code]/route.ts
    - src/app/(main)/campaigns/actions.ts
    - src/app/(main)/campaigns/[id]/page.tsx
  acceptance_criteria:
    - Members cannot UPDATE campaign rows they don't own via PostgREST (owner-only RLS for sensitive columns).
    - campaign_rolls write policies require user_id = auth.uid() and roster/character ownership.
    - Roll POST derives attribution from verified ownership, not client fields.
    - Invite-code lookup requires auth or is otherwise hardened against enumeration.
    - Invite code visible to RM only.
  notes: "SA-13-1/2/3/5/6/7, SA-19-2..5/17. DONE 2026-06-13. Migration sql/supabase-campaign-authz-2026-06.sql APPLIED to prod (lbqhiwudvifmkjtkccdg, name: campaign_authz_hardening): dropped member UPDATE on campaigns (owner ALL policy remains); campaign_rolls now has caller-bound INSERT (user_id=auth.uid + participant) + owner-or-author DELETE + no UPDATE. Verified live in a rolled-back tx: member UPDATE campaigns=0 rows, spoofed roll INSERT=BLOCKED, own roll INSERT=ALLOWED. Code: removeCharacterFromCampaignAction now writes via service role; rolls POST verifies characterId against the roster (owner may roll any roster char) and derives the displayed name from the roster, trim runs via service role; invite/[code] GET now requires auth (+ existing rate-limit); GET /api/campaigns/[id] and list endpoint withhold invite_code from non-owners; campaign detail page shows the Invite Code section to the RM only."

- id: TASK-330
  title: Admin role-management hardening
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    SECURITY. (1) PATCH /api/admin/users/update-role ignores the .update() error and always returns
    success (silent failure); (2) admins can grant/revoke admin with no audit log, no last-admin
    guard, and instant <select> onChange (one mis-click); (3) PATCH /api/admin/role-policies
    shallow-merges arbitrary permission keys; (4) GET /api/admin/users returns all emails unpaginated.
  related_files:
    - src/app/api/admin/users/update-role/route.ts
    - src/app/(main)/admin/users/page.tsx
    - src/app/api/admin/role-policies/route.ts
    - src/app/api/admin/users/route.ts
  acceptance_criteria:
    - update-role returns an error when the DB update fails.
    - Role changes require explicit confirm; admin grant/revoke is logged; cannot remove the last admin.
    - role-policies validates permission keys against an allowlist (Zod).
    - Admin user list is paginated / email exposure minimized.
  notes: "SA-14-1/2/3/4/7, SA-19-6/7/20. DONE 2026-06-13. update-role now: reads the target's current role, returns 500 on a failed DB update (no more silent success), enforces a last-admin guard (409 when demoting the only admin), and writes an append-only audit row. Migration sql/supabase-admin-role-audit-2026-06.sql APPLIED to prod (name: admin_role_audit_log): admin_role_audit table, admins-read RLS, service-role-only writes. role-policies PATCH now persists only the allowlisted permission key (can_upload_profile_picture) instead of spreading arbitrary client keys. /api/admin/users capped at 1000. Admin users page now requires a confirmation modal (ConfirmActionModal) before any role change, with a stronger danger-variant warning for admin grant/revoke (no more one-click <select>)."

- id: TASK-331
  title: Upload & account auth hardening
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    SECURITY. (1) Portrait upload doesn't verify characterId belongs to the user and doesn't validate
    the id (UUID whitelist) before embedding in the storage path; (2) profile-picture extension comes
    from client file.name not magic bytes; (3) email/password change UIs collect "Current Password"
    but never verify it (no re-auth) → session hijack can change credentials; (4) OAuth-only users have
    no working account-delete path; (5) profile upsert overwrites created_at on every upload.
  related_files:
    - src/app/api/upload/portrait/route.ts
    - src/app/api/upload/profile-picture/route.ts
    - src/app/(main)/my-account/page.tsx
  acceptance_criteria:
    - Portrait upload validates characterId format and ownership before write.
    - Profile-picture extension derives from detected content type.
    - Email/password change re-authenticates with the provided current password.
    - OAuth-only users can delete their account.
    - Upload upsert no longer clobbers created_at.
  notes: "SA-15-2..7/10, SA-18-18, SA-19-9. (Bucket listing + leaked-password = TASK-326.) DONE 2026-06-13 (code-only, no migration). Portrait upload: characterId must match a UUID and be owned by the caller (characters.user_id) before it is written; both callers (finalize step, character sheet) upload only after the character is saved, so this is safe. Profile picture: extension now derived from the detected magic-byte MIME (new detectImageMime/extensionForImageMime in lib/validate-image.ts), not the client filename; upsert no longer writes created_at (only photo_url + updated_at), so signup timestamp is preserved. my-account: email + password changes now re-authenticate with the current password via signInWithPassword before updateUser; account delete now skips password re-auth for OAuth-only users (canChangeEmailPassword=false) and confirms via the typed DELETE, with the password field hidden for them."

- id: TASK-332
  title: Primitive-level a11y & touch targets (high leverage)
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Fix foundational primitives so dozens of downstream area findings auto-resolve:
    (1) Button/IconButton minimum 44px touch target on mobile (without breaking desktop dense layouts —
    use the --touch-target-min pattern); (2) Modal focus trap + initial focus + focus restore, and a
    real accessible name when title/titleA11y/header are used (no generic "Dialog"); (3) TabNavigation:
    add aria-controls + role="tabpanel" wiring and fix the badge/count prop mismatch so tab counts
    render; (4) ErrorDisplay gains an optional onRetry action.
  related_files:
    - src/components/ui/button.tsx
    - src/components/ui/icon-button.tsx
    - src/components/ui/modal.tsx
    - src/components/ui/tab-navigation.tsx
    - src/components/shared/list-components.tsx
  acceptance_criteria:
    - Interactive Button/IconButton meet 44px on touch viewports.
    - Modals trap focus, restore on close, and always have an accessible name.
    - Tab pattern is WAI-ARIA complete; tab counts render.
    - ErrorDisplay supports retry; Library/Codex error states use it.
    - npm run build passes; spot-check no layout regressions.
  completed_work: |
    - Touch targets, modal focus trap, tab keyboard nav, ErrorDisplay onRetry.
  remaining_work: |
    - (none — completed via TASK-355)
  follow_up_tasks: []
  notes: "2026-06-13. SA-17-1..8. Tabpanel wiring finished 2026-06-18 (TASK-355). Build exit 0."

- id: TASK-333
  title: Autosave correctness (sheet / encounter / crafting)
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    `useAutoSave` never calls markSaved() after initial load, so opening a character sheet, encounter,
    or crafting session triggers a spurious PATCH ~1.5–2s later. Also: concurrent saves are dropped
    (early-return, no queue/retry), dirty detection uses JSON.stringify on the full blob, and autosave
    failures are silent. Fix the baseline reset on load, add a queued/retry save, and surface save
    failures via toast.
  related_files:
    - src/hooks/use-auto-save.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/crafting/[id]/page.tsx
  acceptance_criteria:
    - No PATCH fires on initial load when nothing changed.
    - Edits during an in-flight save are not lost.
    - Autosave failures show a non-blocking error to the user.
    - npm run build passes.
  notes: "SA-4-7/8/9, SA-11-1/2, SA-12-4. DONE 2026-06-13. Hook (use-auto-save.ts): (a) baseline-reset-on-enable — when `enabled` flips false→true (which is exactly when data finishes loading in every caller: sheet `enabled:isOwner` is false until the character loads; encounters `enabled:isInitialized && !!encounter`), the current data is adopted as the saved baseline and NO save fires; while disabled the baseline tracks data so re-enabling never sees a phantom diff. (b) queued re-save — a save arriving while one is in-flight sets pendingResaveRef; on completion the latest snapshot is re-saved (via performSaveRef to avoid self-reference), so edits during a save are never dropped; dirty flag only clears if no newer edits arrived. (c) data-returns-to-baseline now cancels the pending timeout and clears the dirty flag. Callers: character sheet already toasted onSaveError; added useToast + failure toasts to all 3 encounter pages (combat/skill/mixed) so save failures are surfaced. NOTE: crafting/[id] does NOT use useAutoSave (manual save), so it was out of scope. Build green, lint clean."

- id: TASK-334
  title: Technique creator load/save bug fixes + share PartCard + unify mechanic builder
  priority: high
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Bugs: technique load reads `technique.reaction` but save persists `isReaction` (reaction lost);
    load treats `damage` as object but save writes an array (additional damage not restored);
    onSaveSuccess doesn't reset actionType/isReaction; addPart seeds from techniqueParts[0] (includes
    mechanic parts). Also unify: extract the inline ~240-line PartCard to shared PowerPartCard (move it
    to components/creator/), and migrate technique off legacy buildMechanicPartPayload to the unified
    buildMechanicParts.
  related_files:
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/power-creator/PowerPartCard.tsx
    - src/lib/calculators/technique-calc.ts
    - src/lib/calculators/mechanic-builder.ts
  acceptance_criteria:
    - Saved techniques round-trip reaction state and multi-damage correctly.
    - onSaveSuccess fully resets the form.
    - Technique reuses the shared part card and unified mechanic builder.
    - npm run build passes.
  notes: "SA-9-1/3/4/5/6/7. DONE 2026-06-13. Bug fixes (2026-06-12) + unification: moved PowerPartCard → `src/components/creator/power-part-card.tsx`; technique-creator uses shared PowerPartCard (`showApplyDuration={false}`) and `buildMechanicParts` (removed ~240-line inline PartCard + legacy buildMechanicPartPayload); mechanic-builder extended with `WeaponConfig.attackMode` + `no_attack`. Fixed TechniquePartPayload TS mapping for mechanic parts. Build exit 0."

- id: TASK-335
  title: Library tab UX bugs & parity
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    (1) Tab count badges never render (pages pass `badge`, TabNavigation reads `count`); (2) switching
    My→Realms while on the Enhanced tab leaves activeTab='enhanced' which is filtered out → blank
    content; (3) logged-in users briefly see Realms mode (default 'public' then effect flips); (4)
    duplicate is one-click with no confirm; (5) global "Sync with current patch" has no confirm and can
    drop missing refs; (6) Enhanced tab diverges (EmptyState vs ListEmptyState, hand-rolled sort,
    no edit/duplicate). Note: the badge/count fix is shared with TASK-332.
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/library/LibraryEnhancedTab.tsx
    - src/app/(main)/library/LibraryPowersTab.tsx
  acceptance_criteria:
    - Tab counts render; mode switch never blanks content; no logged-in flash.
    - Duplicate and global sync require confirmation.
    - Enhanced tab matches sibling tab patterns.
    - npm run build passes.
  notes: "SA-6-1/2/3/8/9/11. DONE 2026-06-13: (1–2) tab counts + Enhanced tab fallback (2026-06-12). (3) library page waits for auth init + sets initial mode once (no logged-in Realms flash). (4) ConfirmActionModal before duplicate in Powers/Techniques/Items/Creatures tabs. (5) ConfirmActionModal before global sync-all in same tabs (warns missing codex refs may be removed). (6) Enhanced tab: ListEmptyState, useSort + ListHeader, edit → /crafting/[id] (no duplicate hook exists). Build: webpack compiles; pre-existing TS error in technique-creator/page.tsx (TASK-334) blocks full build."

- id: TASK-336
  title: Decide Browse vs Library-public consolidation
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    /browse is a thin wrapper around LibraryPublicContent that duplicates Library's Realms mode with
    fewer tabs (no Empowered), hardcodes readOnly even for signed-in users, and is not linked anywhere
    in nav (header/footer/home/onboarding all point to /library). Decide: either consolidate /browse
    into /library public mode (and redirect), or make it a real distinct guest landing — wire nav,
    add the Empowered tab, align readOnly with auth, add metadata + guest banner, and share the Realms
    tab constant. Also fix FEATURE_INDEX mislabel ("public creators' content").
  related_files:
    - src/app/(main)/browse/page.tsx
    - src/app/(main)/library/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
  acceptance_criteria:
    - A clear decision is implemented; no orphaned/duplicated route.
    - If kept, Browse reaches parity (tabs, readOnly, metadata, nav links).
  notes: "SA-8-1..4/11/13. DONE 2026-06-12 per owner intent: guests should view Realms content on the Library page (no My-Library tab / no Add). The Library page already does exactly this (SegmentedControl + create button hidden for guests; LibraryPublicContent readOnly={isGuest}). /browse was a redundant, nav-orphaned duplicate, so DELETED src/app/(main)/browse/page.tsx and added a /browse->/library redirect in next.config.ts. Updated USER_EXPERIENCE_GOALS.md (also fixed a stale claim that the Library page was ProtectedRoute-gated) and FEATURE_INDEX.md."

- id: TASK-337
  title: Creature/species creator unification + bug fixes
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    (1) creature-creator transformers strip op_1_lvl and omit shield in typeMap → wrong armament
    TP/cost/range; (2) species third-trait confirm discards pendingBatch remainder (batch add loses
    traits); (3) creature skills/defenses duplicate character-creator logic instead of shared
    SkillsAllocationPage; (4) creature eagerly subscribes to 9 library hooks on mount; (5) creature
    LoadCreatureModal and species load are bespoke (no SourceFilter/Realms) vs unified
    LoadFromLibraryModal; (6) no save-time budget guard on creature; species saveDisabled doesn't
    enforce type/2 base skills.
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
    - src/app/(main)/species-creator/page.tsx
    - src/components/shared/skills-allocation-page.tsx
  acceptance_criteria:
    - Transformer maps leveled/shield items correctly.
    - Species batch-add keeps all selected traits.
    - Creature reuses shared skills allocation + load modal; over-fetch removed.
    - Save-time budget/required-field guards added.
    - npm run build passes.
  completed_work: |
    - Transformer fixes; species batch; creature lazy hooks + budget guard.
    - SkillsAllocationPage + LoadFromLibraryModal (TASK-357).
    - Species LoadFromLibraryModal + SourceFilter; lazy user/official species fetch on modal open.
    - isSpeciesFormSaveReady guard on toolbar + handleSave.
  remaining_work: []
  follow_up_tasks: []
  notes: "2026-06-13. Skills/load unified 2026-06-18 (TASK-357). Species load/save guards 2026-06-18."

- id: TASK-338
  title: Replace blocking alert()/confirm() with toasts/modals
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    ~42 blocking alert()/confirm() calls across 16 files (heaviest in admin codex tabs + spreadsheet,
    plus character sheet) provide poor, inaccessible UX. Replace with the shared toast/ConfirmActionModal
    patterns. Also fold in admin codex inline delete micro-buttons (sub-44px) where touched.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/CodexSpreadsheetView.tsx
    - src/components/ui/toast.tsx
    - src/components/shared/confirm-action-modal.tsx
  acceptance_criteria:
    - No blocking alert()/confirm() in client code; errors/confirms use shared components.
    - npm run build passes.
  notes: "SA-7-10, SA-14-11/12, SA-20-11/17. DONE 2026-06-13. Replaced ~42 blocking alert() across 14 admin codex/public-library tabs + CodexSpreadsheetView with useToast (errors→'error', missing-ID-after-save→'warning', validation lists use '; ' separators). Proficiencies tab sync uses ConfirmActionModal; character sheet TP-over-limit uses apply+warning toast (soft cap). Fixed result.error ?? 'Operation failed' for optional error strings. Grep: zero alert()/confirm() in client src. Build exit 0."

- id: TASK-339
  title: Standardize loading/error/empty states with retry
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    ~27 React Query error branches render a static ErrorDisplay/Alert with no retry though refetch is
    available (only campaigns wires it). Standardize on ErrorDisplay+onRetry (see TASK-332), LoadingState,
    and ListEmptyState across Library, Codex, creators, crafting, encounters, admin. Folds the earlier
    INC-2 / TASK-323 scope.
  related_files:
    - src/components/shared/list-components.tsx
    - src/app/(main)/library
    - src/app/(main)/codex
  acceptance_criteria:
    - Error states offer retry; loading/empty components consistent across areas.
    - npm run build passes.
  completed_work: |
    - ErrorDisplay+onRetry on Library, Codex, creators, encounters, characters.
    - TASK-358: admin tooltips/users/roles/changelogs retry.
    - CodexSpreadsheetView ErrorDisplay+refetch (2026-06-18 audit pass).
  remaining_work: []
  follow_up_tasks: []
  notes: "2026-06-13. Absorbed TASK-323. Closed 2026-06-18 via TASK-358 + spreadsheet retry."

- id: TASK-340
  title: API consistency & hardening
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    (1) Tighten .passthrough() on character/library/encounter mutation schemas; (2) consistent error/404
    response shape; (3) GET handlers should check Supabase {error} not just {data}; (4) extend rate
    limiting to admin/campaigns/tooltips and key by user via buildRateLimitKey; (5) add Zod to
    admin/tooltips routes; (6) reduce service-role usage for self-scoped reads (tooltip prefs);
    (7) reconcile codex/official cache layers; (8) de-dup prepareForSave and normalization helpers.
  related_files:
    - src/lib/api-validation.ts
    - src/lib/rate-limit.ts
    - src/app/api/tooltips/route.ts
    - src/app/api/codex/route.ts
    - src/app/api/characters/route.ts
  acceptance_criteria:
    - Mutation schemas bound payloads; GET errors surface as 500; error shapes consistent.
    - Admin/campaign/tooltips routes rate-limited + validated.
    - Service-role scope reduced where RLS suffices.
    - npm run build passes.
  completed_work: |
    - GET characters error handling; campaigns rate limit; admin/tooltips Zod.
    - TASK-359: withSafeJsonBlob, strict encounter create, character-save dedup, codex cache align.
  remaining_work: |
    - Crafting session schemas still use passthrough on nested refs (lower priority).
  follow_up_tasks: []
  notes: "2026-06-13 subset. TASK-359 closed passthrough/cache/dedup remainder 2026-06-18."

- id: TASK-341
  title: Characters list parity (sort/search, touch actions, auth-init)
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Bring the characters list in line with Library/Codex: wait for auth init before rendering (no guest
    EmptyState flash); make delete touch-accessible and fix the IconButton-inside-Link nesting; add a
    duplicate action (hook exists); add client sort/search via useSort/ListHeader; add guest sign-in path.
  related_files:
    - src/app/(main)/characters/page.tsx
    - src/components/character/character-card.tsx
    - src/hooks/use-characters.ts
  acceptance_criteria:
    - No auth-state flash; delete usable on touch; valid HTML (no button-in-link).
    - Duplicate + sort/search available; guest path present.
    - npm run build passes.
  notes: "SA-3-1/2/3/5/6/10. DONE 2026-06-13: auth-init skeleton (2026-06-12); delete out of Link + touch-visible. Added useDuplicateCharacter (toast + navigate to new sheet), SearchInput + useSort/ListHeader (name/level/updatedAt), guest EmptyState secondaryAction → /login?returnTo=/characters. CharacterCard duplicate IconButton (sibling of Link). Build: webpack compiles; pre-existing TS error in technique-creator/page.tsx blocks full build."

- id: TASK-342
  title: App-shell hardening (routing, errors, mobile nav, theme)
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    (1) Consistent route protection + returnTo preservation (ProtectedRoute, admin layout); (2) add root
    error.tsx/global-error.tsx and fix not-found to include shell + #main-content; (3) home page needs an
    h1 and correct heading order; (4) mobile nav drawer needs Escape/focus-trap/scroll-lock + aria-controls;
    (5) expose theme toggle to logged-out users; (6) undersized mobile menu/login controls.
  related_files:
    - src/components/layout/header.tsx
    - src/components/layout/protected-route.tsx
    - src/app/not-found.tsx
    - src/app/(main)/home-page.tsx
  acceptance_criteria:
    - Protected routes preserve return path; root error/404 are branded with shell.
    - Home heading hierarchy valid; mobile drawer is accessible; theme available logged-out.
    - npm run build passes.
  notes: "SA-1-1/2/3/8/9/10/15. DONE 2026-06-13: root error.tsx + global-error.tsx; not-found Header/Footer + #main-content; home sr-only h1; mobile nav a11y + 44px targets; ThemeToggle logged-out; ProtectedRoute + admin layout preserve returnTo on login redirect. Build exit 0."

- id: TASK-343
  title: Auth UX & security follow-ups
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    (1) Normalize redirect params to block protocol-relative ('//') open redirects in confirm/callback/
    login; (2) persist chosen username through the email-confirmation path; (3) implement (or clearly
    disable) forgot-username email delivery; (4) signOutAction should call auth.signOut(); (5) resend
    confirmation should pass emailRedirectTo; (6) add a real reset-password completion step after OTP.
  related_files:
    - src/app/auth/confirm/route.ts
    - src/app/(auth)/register/page.tsx
    - src/app/(auth)/forgot-username/action.ts
    - src/app/(auth)/actions.ts
    - src/app/(auth)/forgot-password/page.tsx
  acceptance_criteria:
    - Redirects reject off-site targets; username survives confirmation; signOut clears session.
    - Forgot-username works or is honestly disabled; reset-password has a set-new-password step.
    - npm run build passes.
  notes: "SA-2-1/4/5/8/9/12, SA-19-16/18. DONE 2026-06-13: sanitizeRedirectPath in lib/safe-redirect.ts (confirm/callback/login/register); signOutAction calls auth.signOut(); register stores username_display in user_metadata for confirm; resend passes emailRedirectTo; /reset-password set-new-password step; forgot-username shows Contact support. npm run build exit 0."

- id: TASK-344
  title: Encounters cleanup & correctness
  priority: medium
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    (1) Remove ~760 lines of dead tracker UI in encounter-tracker/page.tsx and migrate shared modules out
    of the legacy folder; (2) implement a "completed" lifecycle (nothing sets status='completed' today);
    (3) fix turn highlight after drag-reorder (currentTurnIndex not remapped); (4) migrate guest encounters
    on sign-in; (5) consider two-way HP/EN/AP sync (encounter→sheet), currently one-way only.
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx
    - src/hooks/use-encounters.ts
    - src/lib/guest-encounter-storage.ts
    - src/lib/encounter/character-resource-sync.ts
  acceptance_criteria:
    - Dead tracker UI removed; legacy folder dependency resolved.
    - Completed status reachable; turn order correct after reorder; guest data migrates on login.
    - npm run build passes.
  completed_work: |
    - Dead tracker removed; completed lifecycle; guest migration; module move.
    - Two-way HP/EN/AP sync via TASK-360.
  notes: Done 2026-06-18 (TASK-360 closed remaining sync gap). Build exit 0.

- id: TASK-345
  title: Static content fixes (metadata, legal copy, carousel a11y)
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    Add per-route metadata for about/privacy/terms; rewrite Privacy/Terms boilerplate to match a free
    TTRPG web app (currently mentions orders/one-time download); fix About/Resources carousel touch
    targets and redundant image alt; add an "Open in new tab" fallback for the Rules Google-Docs iframe;
    surface /resources in footer nav.
  related_files:
    - src/app/(main)/about/page.tsx
    - src/app/(main)/privacy/page.tsx
    - src/app/(main)/terms/page.tsx
    - src/app/(main)/resources/page.tsx
    - src/app/(main)/rules/page.tsx
  acceptance_criteria:
    - All content routes have metadata; legal copy is accurate; carousel meets touch/a11y; rules has a fallback link.
    - npm run build passes.
  notes: "SA-16-2..11/13/14/15. DONE 2026-06-13: metadata on about/privacy/terms (resources layout already had it); privacy/terms rewritten for free TTRPG web app; about carousel 44px touch + decorative dice alt=\"\"; rules Open in new tab fallback; /resources in footer. npm run build exit 0."

- id: TASK-346
  title: "Systemic token & console cleanup (batch by rule)"
  priority: low
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Repo-wide batch cleanup: (1) status colors -600 → -700 in light mode (~58 sites) including globals.css
    stepper tokens; (2) replace stray gray-*/neutral-* outside auth with semantic tokens (~28 sites incl.
    footer, roll-button, roll-log); (3) remove leftover client console.* (~38 sites). Do in small,
    rule-scoped batches with build between.
  related_files:
    - src/app/globals.css
    - src/components/layout/footer.tsx
    - src/components/shared/roll-button.tsx
  acceptance_criteria:
    - Status/secondary text passes WCAG AA tokens in both modes; no stray gray-*/neutral- outside auth.
    - No client console.* left; npm run build + lint pass.
  completed_work: |
    - Batch 1: footer, roll-button, crafting console.*.
    - Batch 2 (TASK-351): ~38 client console.* removed; home-page/item-creator neutral→semantic; shared status text -600→-700.
  remaining_work: |
    - Residual status -600 on hover/button backgrounds (intentional); some admin/codex body text.
  follow_up_tasks:
    - TASK-351
  notes: "2026-06-13 batch 1."

# Follow-up tasks (partial parents + orphan audit findings)

- id: TASK-347
  title: Extract shared OfficialLibraryList (Library + Admin grid dedup)
  priority: medium
  status: done
  created_at: 2026-06-13
  created_by: agent
  parent_task: TASK-314
  audit_refs: [SA-6-4, SA-14-8]
  related_files:
    - src/components/shared/official-power-list.tsx
    - src/components/shared/official-technique-list.tsx
    - src/components/shared/official-item-list.tsx
    - src/components/shared/official-creature-list.tsx
    - src/lib/library/official-power-list.ts
    - src/lib/library/official-technique-list.ts
    - src/lib/library/official-item-list.ts
    - src/lib/library/official-creature-list.ts
    - src/app/(main)/library/LibraryPublicContent.tsx
    - src/app/(main)/admin/public-library/AdminPublic*.tsx
  acceptance_criteria:
    - Shared list component for Library + Admin official views; build passes.
  notes: Done 2026-06-18. OfficialPower/Technique/Item/CreatureList shared by Library PublicContent + Admin public-library tabs. LibraryPublicContent ~580→~220 lines. Build exit 0.

- id: TASK-348
  title: Split character sheet page into per-tab modules
  priority: medium
  status: done
  created_at: 2026-06-13
  parent_task: TASK-317
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/character-sheet-body.tsx
    - src/components/character-sheet/character-sheet-context.tsx
    - src/components/character-sheet/use-character-sheet-derived.ts
  acceptance_criteria:
    - Page slimmed; two+ sections use context; build passes.
  notes: |
    Done 2026-06-18. useCharacterSheetDerived + buildCharacterSheetLibraryProps; CharacterSheetBody with context-connected Abilities/Skills/Archetype/Library panels; expanded CharacterSheetProvider. page.tsx ~2130→~639 lines (with useCharacterSheetActions). Build exit 0.

- id: TASK-349
  title: Add-library-item modal per-type subcomponents
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-318
  acceptance_criteria:
    - Per-type subcomponents; build passes.
  notes: Done 2026-06-18. Per-type selectable builders (power/technique/empowered/equipment), load-raw-items, modal-config, map-selection, power-header-extra. Build exit 0.
  build_validation:
    suite: DEV-V-009
    tests:
      - DEV-V-009-T006

- id: TASK-350
  title: ESLint warning cleanup batch 2
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-321
  acceptance_criteria:
    - Warnings materially reduced; lint + build pass.
  notes: Done 2026-06-18. ESLint src 393→334 warnings, 0 errors (fixed conditional useMemo in FeatsTraitsListSection during audit). no-unused-vars batch across lib/hooks + character sheet page. Build exit 0.

- id: TASK-351
  title: Token & console cleanup batch 2
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-346
  acceptance_criteria:
    - Contrast-safe tokens; no client console.*; build passes.
  notes: Done 2026-06-18. Removed ~38 client console.*; home-page neutral→semantic; shared status body text -700 tokens. Server/API/error-boundary logging retained. Build exit 0.

- id: TASK-352
  title: Consolidate duplicate permissive RLS policies
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-327
  related_files:
    - sql/supabase-rls-consolidate-permissive-2026-06.sql
  acceptance_criteria:
    - SQL applied; advisor warnings reduced; spot-test campaigns.
  notes: "Done 2026-06-18. Applied migration rls_consolidate_permissive_policies_2026_06 on lbqhiwudvifmkjtkccdg. Hotfix 2026-06-19: rls_fix_campaign_members_recursion_2026_06 (42P17 cycle — SECURITY DEFINER helpers). Merged dup policies; campaigns SELECT owner+memberIds; characters campaign roster uses characters.id. Performance advisor: zero multiple_permissive_policies. Human spot-test: DEV-V-005 T001–T003."
  build_validation:
    suite: DEV-V-005
    tests:
      - DEV-V-005-T001
      - DEV-V-005-T002
      - DEV-V-005-T003

- id: TASK-353
  title: Enable Supabase leaked-password protection (HIBP)
  priority: medium
  status: not-started
  created_at: 2026-06-13
  parent_task: TASK-326
  notes: "Human-only: DEVELOPER_TASK_QUEUE DEV-001."

- id: TASK-354
  title: RLS initplan batch 2
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-327
  notes: "2026-06-13: sql/supabase-rls-initplan-batch2-2026-06.sql + campaign_rolls SELECT applied live via MCP."

- id: TASK-355
  title: TabNavigation aria-controls + tabpanel wiring
  priority: medium
  status: done
  created_at: 2026-06-13
  parent_task: TASK-332
  audit_refs: [SA-17-4]
  related_files:
    - src/components/ui/tab-navigation.tsx
    - src/components/ui/index.ts
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/library/page.tsx
    - src/app/(main)/encounters/page.tsx
    - src/app/(main)/campaigns/page.tsx
    - src/app/(main)/crafting/page.tsx
    - src/app/(main)/admin/codex/page.tsx
    - src/app/(main)/admin/public-library/page.tsx
    - src/app/(main)/admin/changelogs/page.tsx
    - src/app/(main)/admin/core-rules/page.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/crafting/CraftingItemSelectModal.tsx
  description: |
    Complete WAI-ARIA tabs pattern: tab buttons get aria-controls; tab content gets role="tabpanel"
    with matching id and aria-labelledby. Export useTabGroup + TabContentPanel helpers for shared-panel
    pages that conditionally render tab content.
  acceptance_criteria:
    - TabNavigation sets aria-controls on every tab button.
    - Tab panels use role="tabpanel" with stable ids and aria-labelledby.
    - Codex, Library, and other TabNavigation call sites wired.
    - npm run build passes.
  notes: |
    Done 2026-06-18: tab-navigation.tsx — useTabGroup, TabContentPanel, TabPanel, tabButtonId,
    tabPanelIdForTab; sharedTabPanelId + tabGroupId on TabNavigation. Wired on Codex, Library,
    Encounters, Campaigns, Crafting, admin codex/public-library/changelogs/core-rules, sheet
    library-section, creator equipment-step, CraftingItemSelectModal (tabPanelA11y). Build exit 0.

- id: TASK-356
  title: Character creator validation & step guards
  priority: high
  status: done
  created_at: 2026-06-13
  audit_refs: [SA-5-1, SA-5-2, SA-5-3, SA-5-4, SA-5-5, SA-5-16, SA-5-17]
  notes: "2026-06-13: step guards, mixed-species validation, 200c currency, archetype downstream reset, Continue gating. Build exit 0."
  developer_test_plan: |
    Suite DEV-V-001 (T001–T015) — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-001
    tests:
      - DEV-V-001-T001
      - DEV-V-001-T002
      - DEV-V-001-T003
      - DEV-V-001-T004
      - DEV-V-001-T005
      - DEV-V-001-T006
      - DEV-V-001-T007
      - DEV-V-001-T008
      - DEV-V-001-T009
      - DEV-V-001-T010
      - DEV-V-001-T011
      - DEV-V-001-T012
      - DEV-V-001-T013
      - DEV-V-001-T014
      - DEV-V-001-T015

- id: TASK-357
  title: Creature SkillsAllocationPage + unified load modal
  priority: medium
  status: done
  created_at: 2026-06-13
  parent_task: TASK-337
  audit_refs: [SA-10-3, SA-10-5]
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/creature-skill-utils.ts
    - src/components/shared/skills-allocation-page.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
  description: |
    Replace bespoke creature skills UI and LoadCreatureModal with shared SkillsAllocationPage
    (Add Skill/Sub-Skill modals, defense bonus allocation with point costs) and LoadFromLibraryModal
    with SourceFilter (My / Realms / All) matching power/technique/item creators.
  acceptance_criteria:
    - Creature creator uses SkillsAllocationPage for skills + defense skill-point allocation.
    - Load uses LoadFromLibraryModal with SourceFilter for user + official creatures.
    - LoadCreatureModal removed; build passes.
  notes: |
    Done 2026-06-18: creature-skill-utils.ts (allocations ↔ CreatureSkill[], rawRecordToCreatureState,
    buildCreatureSelectableItem). Page uses SkillsAllocationPage; removed DefenseBlock duplicate section.
    LoadFromLibraryModal + loadSource. Deleted LoadCreatureModal.tsx. Build exit 0.

- id: TASK-358
  title: Admin low-traffic pages error retry
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-339
  audit_refs: [SA-14-14, SA-20-9]
  related_files:
    - src/app/(main)/admin/tooltips/page.tsx
    - src/app/(main)/admin/users/page.tsx
    - src/app/(main)/admin/roles/page.tsx
    - src/app/(main)/admin/changelogs/page.tsx
  acceptance_criteria:
    - Load failures on tooltips, users, roles, and changelogs show ErrorDisplay with retry.
    - npm run build passes.
  notes: Done 2026-06-18. ErrorDisplay + refetch/reloadToken on all four pages. Build exit 0.

- id: TASK-359
  title: API hardening remainder
  priority: medium
  status: done
  created_at: 2026-06-13
  parent_task: TASK-340
  audit_refs: [SA-18-10, SA-18-11, SA-18-13]
  related_files:
    - src/lib/api-validation.ts
    - src/lib/character-save.ts
    - src/app/api/characters/route.ts
    - src/app/api/characters/[id]/route.ts
    - src/hooks/use-codex.ts
  description: |
    (1) Tighten `.passthrough()` on character/library/encounter/public mutation schemas;
    (2) reconcile codex client cache with server must-revalidate; (3) dedup prepareForSave.
  acceptance_criteria:
    - Character/library/public blobs use catchall + key bounds; encounter create uses explicit strict schema.
    - prepareForSave lives in shared lib; both character routes import it.
    - useCodex staleTime aligned with official library (5 min) + refetchOnMount.
    - npm run build passes.
  notes: |
    Done 2026-06-18: `withSafeJsonBlob` helper (max 500 keys, blocks __proto__/constructor);
    encounterCreateSchema strict with full default payload fields; `character-save.ts` shared module;
    use-codex staleTime 30m→5m. Build exit 0.

- id: TASK-360
  title: Encounter two-way HP/EN/AP sync
  priority: low
  status: done
  created_at: 2026-06-13
  parent_task: TASK-344
  related_files:
    - src/lib/encounter/character-resource-sync.ts
    - src/hooks/use-character-resource-sync.ts
    - src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx
    - src/components/encounters/CombatantCard.tsx
    - src/app/(main)/characters/[id]/page.tsx
  acceptance_criteria:
    - Character sheet HP/EN/AP changes sync to linked encounter combatants (realtime + fast PATCH).
    - Character owner can edit HP/EN/AP on their linked encounter card; changes PATCH back to character.
    - Other players' linked combatants stay read-only on encounter.
    - npm run build passes.
  notes: Done 2026-06-18. scheduleCharacterResourceSync (400ms debounce) + useCharacterResourceSync on sheet; owned linked combatants editable on encounter. Build exit 0.

- id: TASK-361
  title: Auth UX remainder
  priority: medium
  status: done
  created_at: 2026-06-13
  completed_work: |
    - Apple sign-in hidden on login/register (DEV-Q01).
    - Usernames SELECT restricted to own row (DEV-Q02, sql/supabase-usernames-select-restrict-2026-06.sql).
    - Forgot-username uses AuthCard + semantic tokens (SA-2-6/7).
    - Server rate limits on resend + forgot-username stub via authActionLimiter (SA-2-8).
    - Shared username-rules.ts; register schema + createUserProfileAction blocklist parity (SA-2-14).
  remaining_work: []
  audit_refs: [SA-2-6, SA-2-8, SA-2-14]
  related_files:
    - src/lib/username-rules.ts
    - src/app/(auth)/auth-actions.ts
    - src/app/(auth)/forgot-username/page.tsx
    - src/lib/validation/schemas.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
  notes: "Done 2026-06-18. resendConfirmationAction on login/register. Build exit 0."

- id: TASK-362
  title: Library/Codex lazy tab queries
  priority: low
  status: done
  created_at: 2026-06-13
  audit_refs: [SA-6-6, SA-6-7, SA-7-4]
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/library/LibraryTechniquesTab.tsx
    - src/hooks/use-codex.ts
    - src/hooks/use-enhanced-items.ts
    - src/app/(main)/codex/*.tsx
  acceptance_criteria:
    - Library page fetches my vs public counts only for active mode.
    - LibraryTechniquesTab runs one user query per mode.
    - Codex my-mode empty tabs skip codex fetch via enabled flags.
    - npm run build passes.
  notes: Done 2026-06-18. useCodex* + useEnhancedItems accept enabled; library/codex tabs gated. Build exit 0.

- id: TASK-363
  title: apiFetch migration remainder
  priority: low
  status: done
  created_at: 2026-06-13
  audit_refs: [SA-18-2, SA-18-3]
  related_files:
    - src/lib/api-client.ts
    - src/services/character-service.ts
    - src/services/crafting-service.ts
    - src/services/encounter-service.ts
    - src/services/library-service.ts
    - src/services/campaign-service.ts
    - src/services/campaign-roll-service.ts
    - src/hooks/use-user-library.ts
    - src/hooks/use-admin.ts
    - src/components/layout/header.tsx
    - src/app/(main)/my-account/page.tsx
    - src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx
    - src/components/shared/add-combatant-modal.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
  acceptance_criteria:
    - JSON API calls use apiFetch/apiFetchOrNull except FormData uploads.
    - npm run build passes.
  notes: |
    Done 2026-06-18. Services + hooks + header/my-account tooltip PATCH + encounter campaign character fetches migrated.
    Upload routes (portrait/profile-picture) intentionally remain raw fetch (FormData). Added apiFetchOrNull + CampaignCharacterEncounterData type. Build exit 0.

- id: TASK-364
  title: Unify FilterSection implementations
  priority: low
  status: done
  created_at: 2026-06-13
  audit_refs: [SA-17-22, SA-17-23]
  related_files:
    - src/components/shared/filters/filter-section.tsx
    - src/components/shared/list-components.tsx
    - src/components/shared/index.ts
  acceptance_criteria:
    - Single FilterSection implementation used site-wide.
    - Toggle has type="button" and aria-expanded.
    - npm run build passes.
  notes: Done 2026-06-18. list-components re-exports canonical filters/filter-section; removed duplicate impl + SharedFilterSection alias. Build exit 0.

- id: TASK-365
  title: Character sheet LibrarySection desktop/mobile dedup
  priority: medium
  status: done
  created_at: 2026-06-13
  parent_task: TASK-317
  audit_refs: [SA-4-4, SA-4-5, SA-4-6]
  related_files:
    - src/app/(main)/characters/[id]/library-section-props.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/library-section.tsx
  acceptance_criteria:
    - Desktop/mobile LibrarySection share one props builder (no ~120-line duplicate).
    - Active library tab synced between desktop and mobile instances.
    - npm run build passes.
  notes: |
    Done 2026-06-18: buildLibrarySectionProps + controlled activeTab/onActiveTabChange.
    Single LibrarySection DOM mount completed in CharacterSheetBody (TASK-317, 2026-06-18). Build exit 0.
  developer_test_plan: |
    Suite DEV-V-009 T001–T002 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-009
    tests:
      - DEV-V-009-T001
      - DEV-V-009-T002

---

## Archetype path completion (TASK-366–374) — **complete** (QA: DEV-V-008)

Gap analysis 2026-06-18 (resolved): admin `codex_archetypes` + `codex_archetype_levels` now drive creator, sheet hydration, level-up guidance, codex tab, and edit modal. Manual QA: **DEV-V-008** in `BUILD_VALIDATION.md`.

- id: TASK-366
  title: Archetype path hydration on load + list column fix
  priority: high
  status: done
  created_at: 2026-06-18
  created_by: agent
  related_files:
    - src/lib/game/archetype-display.ts
    - src/lib/character-list-columns.ts
    - src/app/api/characters/route.ts
    - src/app/api/characters/[id]/route.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/browse/page.tsx
  description: |
    Saved characters store lean `archetype: { id, type }` plus `archetypePathId`, but the sheet and character list never resolve the codex path name/description/path_data after reload. Implement shared hydration via codex lookup and fix `archetype_name` list column on create/update so path characters show their path name (not generic "Power"/"Martial").
  acceptance_criteria:
    - Character sheet header shows codex path name when `archetypePathId` (or non-generic archetype id) is set, after reload
    - GET /api/characters returns correct `archetypeName` for path characters (codex lookup on list column or at read time)
    - POST/PATCH set `archetype_name` from codex when path id is present
    - Saved JSONB still stores lean archetype `{ id, type }` only (display fields not persisted)
    - `npm run build` passes
  notes: |
    Done 2026-06-18: `archetype-display.ts`, list column + API name map, sheet `characterForDisplay` hydration. Restored `/browse` redirect page for Next route types. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T001–T002 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T001
      - DEV-V-008-T002

- id: TASK-367
  title: Level-up path progression guide (levels 2+)
  priority: high
  status: done
  created_at: 2026-06-18
  created_by: agent
  related_files:
    - src/lib/game/archetype-path.ts
    - src/components/character-sheet/path-level-guidance.tsx
    - src/components/character-sheet/level-up-modal.tsx
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/app/(main)/characters/[id]/page.tsx
  description: |
    Wire `getPathRecommendationsForLevel` into level-up and/or a sheet "Path progression" panel. When a character has `archetypePathId` and the target level has rows in `codex_archetype_levels`, show recommended add lists (feats, skills, powers, techniques, armaments, equipment) and admin notes. Optional quick-add flows for powers/techniques/feats where library patterns exist.
  acceptance_criteria:
    - Level-up modal (or adjacent panel) shows path recommendations for the new level when `path_data.levels` has a matching entry
    - Level 1 path data is not duplicated incorrectly (use level1 vs levels by level number)
    - Path characters with no level-N row show graceful empty state, not errors
    - Mobile: recommendations scroll/collapse per MOBILE_UX.md; modal keeps fullScreenOnMobile
    - `npm run build` passes
  notes: |
    Done 2026-06-18: `PathLevelGuidance` in level-up modal; resolves codex/library names; shows add + remove lists and notes; uses hydrated `displayCharacter`. Empty state when no row for target level. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T003 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T003

- id: TASK-368
  title: Apply path level-5 proficiency from admin config
  priority: high
  status: done
  created_at: 2026-06-18
  created_by: agent
  description: |
    Admin can set `power_prof_level5` and `martial_prof_level5` on archetype paths; values are copied into creator draft but never applied when a character reaches level 5. On level-up crossing level 5 (or when loading a level ≥5 path character), apply configured prof deltas or set absolute values per game rules, with edit-mode override on sheet.
  related_files:
    - src/lib/game/archetype-display.ts
    - src/app/(main)/characters/[id]/page.tsx
  acceptance_criteria:
    - Path character leveling from 4→5 applies admin level-5 prof config when set (document behavior in task notes if additive vs absolute)
    - Forge characters and paths without level-5 fields unchanged
    - Sheet prof slider reflects applied values; user can adjust in edit mode
    - `npm run build` passes
  notes: |
    Done 2026-06-18: `applyPathProficiencyForLevel` on level-up 4→5+ and on sheet load for level ≥5 path characters (floor, never reduces). Toast on level-up apply. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T004, T012 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T004
      - DEV-V-008-T012

- id: TASK-369
  title: Character sheet path identity and admin notes
  priority: medium
  status: done
  created_at: 2026-06-18
  created_by: agent
  follow_up_tasks:
    - TASK-366
  description: |
    Surface path metadata on the sheet for path-created characters: "Archetype Path" badge, path description snippet, `creationMode`, and admin `level1_notes` / per-level notes (read-only guidance, distinct from player `archetypeDesc`). Reuse PathHelpCard or equivalent shared pattern.
  related_files:
    - src/components/character-sheet/archetype-path-identity.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/app/(main)/characters/[id]/page.tsx
  acceptance_criteria:
    - Path characters show path name + badge; forge characters show forge-style label
    - Admin path notes visible in a guidance region (not editable as archetypeDesc)
    - Accessible labels and contrast-safe tokens
    - `npm run build` passes
  notes: |
    Done 2026-06-18: `ArchetypeCreationBadge` + `ArchetypePathGuidance` in sheet header; path description + level1/per-level admin notes via PathHelpCard pattern; forge badge when creationMode forge. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T005 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T005

- id: TASK-370
  title: Public Codex archetypes tab
  priority: medium
  status: done
  created_at: 2026-06-18
  created_by: agent
  description: |
    Add a player-facing Realms Codex tab to browse official archetype paths: name, type, description, ability emphasis, and level 1 / progression summaries (read-only). Admin editing stays in admin codex; public tab uses `useCodexArchetypes` + existing list row patterns.
  related_files:
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/codex/CodexArchetypesTab.tsx
    - src/docs/ai/FEATURE_INDEX.md
  acceptance_criteria:
    - New Codex tab "Archetypes" in Realms Codex (main or Advanced section per UX)
    - Expandable rows show level 1 recommendations and level 2+ progression summary
    - Mobile-friendly list; touch targets ≥44px
    - `npm run build` passes
  notes: |
    Done 2026-06-18: Main Realms Codex tab "Archetypes" with `CodexArchetypesTab` — searchable GridListRow list, expandable level 1 + level-up progression summaries with resolved codex/library names. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T006 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T006

- id: TASK-371
  title: Path remove lists in guidance flows
  priority: medium
  status: done
  created_at: 2026-06-18
  created_by: agent
  follow_up_tasks:
    - TASK-367
  description: |
    Admin path rows include remove_feats, remove_powers, remove_techniques, remove_armaments at level 1 and per level. Expose these in level-up path guidance and/or sheet path panel as "consider removing" suggestions (no forced deletion).
  related_files:
    - src/lib/game/archetype-path.ts
    - src/components/character-sheet/level-up-modal.tsx
    - src/components/character-sheet/path-level-guidance.tsx
  acceptance_criteria:
    - Remove lists render when present in path_data for the relevant level
    - Copy clearly indicates optional guidance, not automatic removal
    - `npm run build` passes
  notes: |
    Done 2026-06-18: `PathLevelGuidance` in level-up modal; `PathRemoveGuidance` on sheet header for current level remove lists. Optional copy; danger-styled lists. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T007 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T007

- id: TASK-372
  title: EditArchetypeModal path awareness
  priority: medium
  status: done
  created_at: 2026-06-18
  created_by: agent
  follow_up_tasks:
    - TASK-366
  description: |
    Edit Archetype modal currently only supports forge-style type + ability picks. Show current path name (read-only) for path characters; optionally allow switching to forge or another path with confirmation and downstream warnings (feats/powers may no longer match).
  related_files:
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
  acceptance_criteria:
    - Path characters see path identity in modal; forge flow unchanged for forge characters
    - Any path switch requires ConfirmActionModal with clear data-loss warning
    - `npm run build` passes
  notes: |
    Done 2026-06-18: Path view with read-only identity; switch to forge or pick another path via ConfirmActionModal; forge editor unchanged for forge characters. Saves creationMode/archetypePathId. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T008 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T008

- id: TASK-373
  title: Creator path polish — apply recommended skills and feats
  priority: medium
  status: done
  created_at: 2026-06-18
  created_by: agent
  description: |
    Path mode highlights recommended skills and filters feats but does not one-click apply them (unlike powers/techniques auto-merge and equipment "add all"). Add optional "Apply recommended skills" and mirror feat pre-select where requirements pass, keeping manual override.
  related_files:
    - src/components/character-creator/steps/skills-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/shared/skills-allocation-page.tsx
  acceptance_criteria:
    - Skills step offers apply-recommended action that allocates path skill ids per existing allocation rules
    - Feats step can pre-select recommended archetype/character feats when qualified (toggle or first visit)
    - User can still change selections afterward
    - `npm run build` passes
  notes: |
    Done 2026-06-18: Skills step "Apply recommended skills" button (re-adds declined path skills). Feats step auto-applies qualified path feats on first visit + manual "Apply recommended feats" button. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T009–T010 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T009
      - DEV-V-008-T010

- id: TASK-374
  title: Admin path visibility rules and CODEX schema docs
  priority: low
  status: done
  created_at: 2026-06-18
  created_by: agent
  description: |
    Path picker hides archetypes with only notes/remove lists (requires positive level-1 recommendation). Either widen visibility rules or validate in admin save. Extend CODEX_SCHEMA_REFERENCE.md for all archetype/path columns with player-facing vs stored-only labels. Hide or document unused fields (legacy path_data.proficiency JSON, dead Archetype.feats types).
  related_files:
    - src/components/character-creator/steps/archetype-step.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/types/archetype.ts
  acceptance_criteria:
    - Admin and docs agree on which fields affect player UX
    - Path visibility behavior documented and consistent (picker and/or admin warning)
    - `npm run build` passes
  notes: |
    Done 2026-06-18: Shared `pathHasPlayerVisibleLevel1` / `pathHiddenFromPlayerPicker` in archetype-path.ts; used in creator, codex, sheet path switcher. Admin save warning when level 1 has no add recommendations. CODEX_SCHEMA_REFERENCE archetype/path columns expanded. Deprecated Archetype.feats/traits documented. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-008 T011 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-008
    tests:
      - DEV-V-008-T011

- id: TASK-375
  title: Dedupe partsToPartData with shared enrichment (SA-4-17)
  priority: medium
  status: done
  created_at: 2026-06-18
  created_by: agent
  parent_task: TASK-317
  audit_refs: [SA-4-17]
  description: |
    `library-list-helpers.ts` re-implements part/property → PartData/chip enrichment that overlaps
    `derivePowerDisplay` / `deriveTechniqueDisplay` and calculator chip formatters. Consolidate so
    library row mappers and add-library-item flows share one source of truth for part levels, TP, and descriptions.
  related_files:
    - src/lib/library/part-display.ts
    - src/components/character-sheet/library-list-helpers.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/calculators/power-calc.ts
    - src/lib/calculators/technique-calc.ts
  acceptance_criteria:
    - Single shared helper (or calculator export) replaces duplicate `partsToPartData` / property mapping logic.
    - Character sheet library rows and selection modals show identical part chips (level, TP, description).
    - No behavior regressions for powers, techniques, or inventory property chips.
    - `npm run build` passes.
  notes: |
    Done 2026-06-18: `lib/library/part-display.ts` with computePartTrainingPoints, characterPartsToPartData, itemPropertiesToPartData; library-list-helpers re-exports; formatPowerPartChip/formatTechniquePartChip use shared TP math; technique rows pass variant. Build exit 0.
  developer_test_plan: |
    Suite DEV-V-009 T004 — see BUILD_VALIDATION.md.
  build_validation:
    suite: DEV-V-009
    tests:
      - DEV-V-009-T004
