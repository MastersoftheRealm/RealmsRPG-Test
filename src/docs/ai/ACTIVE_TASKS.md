# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-574
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-536–548, 564–566, 573, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 13 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.


**Hot notes:** TASK-535 innate (codex ack). TASK-573 guided innate soft-warn/TP archived. TASK-500 deferred. TASK-381 sheet facade shipped. Anti-debt → `/debt`.

---

- id: TASK-535
  title: Codex content pass - reclassify clear innate powers on archetype paths
  created_at: 2026-07-17
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-530
  related_files:
    - sql/codex-archetypes-enrich-*-applied.sql
    - src/docs/GAME_RULES.md
  description: |
    TASK-530 left innate-power reclassify empty when energy tags were unclear. Audit each
    path's Level 1 powers/techniques and move only clearly innate entries into the innate
    slot / guidance when GAME_RULES energy taxonomy supports it. No new kit items unless
    owner approves.
  acceptance_criteria:
    - Audit all 12 paths for powers that are unambiguously innate per GAME_RULES.
    - Propose mapping (path, power id, reason) before live UPDATE; owner approve then apply.
    - Paths with ambiguous energy stay unchanged; document skips in notes.
    - Changelog + sql/ when applied.
  notes: |
    Deferred from TASK-530 cleanup. Do not bulk-mutate without owner ack (codex data rule).

---

- id: TASK-440
  title: Copy compliance residuals — dense HP HUD abbreviation decision
  created_at: 2026-07-15
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-439
  related_files:
    - src/app/(main)/library/LibraryCreaturesTab.tsx
    - src/components/encounters/CombatantCard.tsx
    - src/app/(main)/creature-creator/page.tsx
  description: |
    Follow-up to TASK-439 after sitewide audit. Styleguide em dashes and admin ±% modifier
    wording are already cleaned. Remaining product question only:
    - Dense HUD still shows HP (Library creatures column, encounter CombatantCard, creature
      creator quickStats). GAME_RULES allows established dense abbreviations; full "Health"
      would be more consistent if owner prefers.
    Do not rewrite code comments or empty-state `—` placeholders.
  acceptance_criteria:
    - Owner decides: keep HP in dense HUD, or rename to Health (and EN→Energy where paired).
    - Apply decision sitewide to listed surfaces (and peers if found).
    - npm run build if UI touched.
  notes: |
    Low priority. Audit 2026-07-15: no other clear prefer/avoid UI hits remaining in src/app +
    src/components + copy modules + tooltip-text.

---

- id: TASK-430
  title: React Compiler hook warnings — exhaustive-deps / set-state-in-effect / preserve-manual-memoization
  created_at: 2026-07-13
  created_by: agent
  priority: low
  status: partial
  parent_task: TASK-321

  description: |
    Follow-up from TASK-321. After clearing unused-vars / no-explicit-any / raw-color errors, remaining
    ESLint noise is React Compiler hook rules (~171): set-state-in-effect (58), exhaustive-deps (104),
    preserve-manual-memoization (9). eslint.config.mjs intentionally keeps these as warnings so lint
    stays actionable without blocking. Fix in small, behavior-preserving batches with DEV-V where UI syncs.
  related_files:
    - eslint.config.mjs
    - src/app/(main)/library/page.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/hooks/use-creator-save.ts
    - src/lib/empty.ts
    - src/components/guided-creator/guided-choice-card.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(auth)/login/page.tsx
  acceptance_criteria:
    - Material reduction in react-hooks/* warnings without cascading re-render regressions.
    - Prefer removing unnecessary effects over blanket eslint-disable.
    - exhaustive-deps changes must not alter intentional mount-only / stable-ref patterns.
    - npm run build + lint pass; no new errors.
  build_validation: DEV-V-019
  developer_test_plan: |
    Run DEV-V-019-T001–T007 + T009–T010 in BUILD_VALIDATION.md (choice-card, login, admin feat
    remount, library clamp, edit-archetype session remount, sheet library tab visibility, modal
    remounts, power-creator draft/?edit= bootstrap, remaining creators draft/?edit= bootstrap).
  completed_work: |
    Batches 1–4 (2026-07-15/16): ~168 → **104** react-hooks warnings. Patterns: derive /
    remount-on-open / stable empties (`lib/empty.ts`) / creator bootstrap+remount
    (`lib/game/creator-cache.ts` + per-creator `*-bootstrap.ts`). DEV-V-019 T001–T007 +
    T009–T010. Detail in AI_CHANGELOG / archive — do not re-expand batch logs here.
  remaining_work: |
    Status stays **partial** until residual hook warnings are materially flattened (or owner
    explicitly closes leftovers as intentional). Baseline after batch 4: **104**
    (set-state-in-effect 36, exhaustive-deps 60, preserve-manual-memoization 8).

    Still to finish: encounters + crafting `[id]` + `modal.tsx` (parity-test FSM) + sheet
    domain hooks (`use-sheet-*-actions`, not the thin facade) + smaller lint leftovers.
  follow_up_tasks:
    - TASK-381
  notes: |
    Prefer derive / remount / `lib/empty.ts`. Sheet actions are a facade (TASK-381 Phase 2);
    creators still large. Keep partial until warnings flatten or owner closes.

---

- id: TASK-326
  title: Tighten Supabase security advisors (bucket listing + leaked-password protection)
  priority: medium
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Storage SELECT policies scoped; enable HIBP leaked-password check in Supabase Auth.
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

---

- id: TASK-381
  title: BIG-01/02 phased decomposition of character-sheet and creator god files
  priority: medium
  status: partial
  created_at: 2026-06-26
  created_by: agent
  description: |
    Decompose large character-sheet/creator files via phased extractions with test-backed parity checkpoints.
    Sheet actions Phase 2 shipped; remaining work is large creator/admin routes.
  related_files:
    - src/components/character-sheet/use-character-sheet-actions.ts
    - src/components/character-sheet/use-sheet-library-actions.ts
    - src/components/character-sheet/use-sheet-resource-actions.ts
    - src/components/character-sheet/use-sheet-feat-actions.ts
    - src/components/character-sheet/use-sheet-skill-identity-actions.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - `use-character-sheet-actions` split by domain boundaries without behavior regressions.
    - Targeted large creator/sheet routes decomposed into stable shells/islands in phases.
    - Each phase ships with explicit parity validation and rollback plan.
    - `npm run build`, `npm test`, and `npm run lint` pass per phase.
  completed_work: |
    Phase 2 (sheet): `use-character-sheet-actions.ts` is a thin facade composing
    `use-sheet-{library,resource,feat,skill-identity,auto-proficiencies}-actions`.
  remaining_work: |
    Creator/admin god files still large — start with power-creator + item-creator (owner
    2026-07-01); species/creature deferred from beginner funnel; creature-creator ~1895 LOC,
    AdminArchetypesTab ~2289 LOC remain for later phases.
  follow_up_tasks:
    - TASK-430
  notes: |
    High blast radius — proceed only with expanded DEV-V validation and small-scope PRs.
    2026-07-19 /debt (/global-audit): marked partial — sheet AC satisfied; do not rediscover
    sheet split. TASK-430 may clean domain hook warnings independently.

---

- id: TASK-388
  title: "Post-activation onboarding (play together, sheet tour, level-up milestones)"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: not-started
  description: |
    Section 11 of REALMS_PRODUCT_OVERVIEW.md. After first character save, guide users
    toward playing together (Discord, campaign invite). Optional post-save sheet tour.
    Contextual level-up tutorials for milestones (first level-up, first ability point,
    etc.) — delta-only, skippable, global tutorials on/off preference.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-sheet/
    - src/components/shared/onboarding-tour.tsx
  acceptance_criteria:
    - After first character save: dismissible play-together prompt (Discord + start campaign).
    - Optional sheet tour offered once post-save (Skip + Don't show again); not on home page.
    - First level-up shows contextual guide for fields that changed only.
    - First ability-point level (e.g. level 3) shows where to allocate on sheet.
    - User can disable all tutorials (setting or preference flag).
    - Milestone flags stored (profile or character JSON); no repeat on subsequent level-ups of same type.
    - `npm run build` passes.
  notes: |
    Replaces pre-creation home OnboardingTour with post-activation guidance.
    Prefer InfoTippy/highlight chains over modal-heavy tours.

---

- id: TASK-403
  title: Guided Simple Creator — Phase 8 admin & species starter flag
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: partial
  description: |
    Admin species is_starter checkbox; admin archetype JSON fields for level1_recommended_abilities and level1_loadouts; save via saveArchetypeWithPath.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - isStarter persists on species; guided JSON fields editable and saved to DB columns.
  completed_work: |
    - isStarter checkbox wired in AdminSpeciesTab (openAdd/openEdit/save).
    - Guided recommended abilities + loadouts persisted via saveArchetypeWithPath.
    - TASK-404 (2026-07-16): structured admin abilities steppers + existing structured loadout controls
      (raw JSON textareas removed for those fields; Advanced Path JSON escape hatch retained).
  remaining_work: |
    - Species trait-option editing improvements beyond existing AdminSpeciesTab pickers (if needed for guided ancestry QA).
  follow_up_tasks:
    - TASK-404
  notes: |
    2026-06-30: JSON fields sufficient for prototype; full archetype creator UI deferred to TASK-404.
    2026-07-16: TASK-404 delivered the structured admin loadout/abilities builder (no raw JSON). Remaining residual is only optional species trait-option editing; 403 stays partial for that narrow item.

---

- id: TASK-480
  title: Automate high-value BUILD_VALIDATION behaviors (vitest/Playwright growth)
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/docs/ai/BUILD_VALIDATION.md
    - tests/
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    Audit residual: BUILD_VALIDATION.md (~132KB) is a manual human catalog, not a regression net.
    Keep it for owner smoke; add automated tests for highest-churn guided/library/sheet behaviors.
  acceptance_criteria:
    - Identify top 10 DEV-V tests that should be automated; file follow-ups or implement first 3.
    - Document which suites stay human-only vs CI-covered in DEVELOPER_TASK_QUEUE.
    - At least 3 new automated tests merge; npm test / relevant Playwright green.

---

# Realms Image Library epic (TASK-491–500)
# TASK-491–499 done. TASK-500 deferred.

---

- id: TASK-500
  title: Deferred — enhanced-item images via Realms Image Library
  created_at: 2026-07-16
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-491
  related_files:
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Owner: enhanced items get images eventually, not now. When scheduled, add category tag and/or
    picker filter + image_id on enhanced-item rows using the same bank patterns as TASK-491+.
  acceptance_criteria:
    - Not in MVP Image Library ship; reopen when owner prioritizes.
    - Reuses RealmsImagePicker + bank — no parallel media system.
  notes: |
    Placeholder so the yes eventually decision is not rediscovered. Leave not-started until asked.

---

# Admin archetype path ↔ guided creator parity (TASK-514–518) — DONE 2026-07-17 (archive).
# Owner decisions locked: feat audience field; armaments UI-only split; DROP recommended species;
# skills max 3 warn-not-block. Content pass TASK-521/530 done. TASK-391 superseded (archived).

---

# TASK-569 done 2026-07-20 — PartChip alias deleted (archive).
# TASK-570 done 2026-07-20 — guided parseItemRef → parseIdQuantityStrings (archive).

---

# TASK-571 done 2026-07-20 — AddCombatantModal documented as reusable non-USM session picker (archive).
# TASK-572 done 2026-07-20 — AdminSpecies trait picker → USM; AdminTraits choice list = editor chrome (archive).

---
