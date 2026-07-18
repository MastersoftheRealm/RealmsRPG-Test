# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-538
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`.

**Counts:** 10 agent-eligible (TASK-391 superseded/skip; TASK-514–518/520/521/522/523/524/525/526/527/528/529/530/536/537 archived) · waiting/blocked in WAITING_TASKS · done in archive.

**Sheet mobile side-scroll gutters (2026-07-18):** **TASK-537 done** — panel `basis-full` + `gap-4` + PageContainer-matched scroll-padding; pending-qa **DEV-V-009-T020**.

**GLR mobile name width (2026-07-18):** **TASK-536 done** (merged #34/#35) — collapse empty desktop data tracks below `lg` via `--glr-*` CSS vars; pending-qa **DEV-V-016-T012**.

**Archetype path enrichment (2026-07-17):** **TASK-530 + TASK-521 done** — all 12 paths enriched (backup `codex_archetypes_backup_20260717`); pending-qa **DEV-V-013-T064**. Residual innate reclassify → **TASK-535**.

**Realms Image Library epic (2026-07-16):** **TASK-491–499 done**. TASK-500 deferred.

**Character sheet feedback (2026-07-17):** **TASK-508–513 / TASK-522 / TASK-523 / TASK-525 / TASK-526 / TASK-527 done** (archived; owner QA in DEVELOPER_TASK_QUEUE). TASK-504 remains expandable chips (not toast).

**Admin archetype path parity (2026-07-17):** **TASK-514–518 done** (pending-qa). Content pass **TASK-521/530 done**. **Skip TASK-391** (superseded). Guided creator is SoT.

**Debt from AI workflow audit (2026-07-15):** TASK-480 — address alongside product work; repo-wide cadence → `/debt`. TASK-476/477/478/482/484/486/487/488/489/490 done; TASK-481 superseded by `/debt`. TASK-475 done (Enhanced shell basic mode). TASK-479 done (client error handling).

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

- id: TASK-461
  title: Sitewide compact fact rollout — cards and GridListRow parity
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: partial
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-454
  follow_up_tasks:
    - TASK-463
  completed_work: |
    - Library/Codex/selectable builders + combat-builder use namedPropertyDescriptorChips /
      TRAINING_POINTS_COST_LABEL.
    - LoadoutBudgetBar shared across guided equipment L1/L2 and powers/techniques.
    - GuidedFactChipRow (ex GuidedEquipmentFactChips) — no expand path.
    - GridListChip descriptor path uses DescriptorChipWithTip (InfoTippy) for property tips.
    - Sheet partDataToChips: descriptor kind when no options; Training Points costLabel.
    - Advanced powers/techniques add-modal columns spell Training Points.
    - normalizeId used by powers L1 candidates; formatDamageReductionFact added.
  remaining_work: |
    - Powers/techniques L2 still card browse — GridListRow bridge tracked as TASK-463.
    - Soft residuals: styleguide demos / dense admin TP headers (allowed by GAME_RULES).
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T048
  developer_test_plan: |
    Suite DEV-V-013 T048 — see BUILD_VALIDATION.md
  related_files:
    - src/lib/detail-option/compact-facts.ts
    - src/components/shared/grid-list-chip.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/character-sheet/library-list-helpers.ts
    - src/components/character-creator/steps/powers-step.tsx
  description: |
    Roll TASK-454’s compact-fact grammar beyond the guided equipment pilot so weapons, armor,
    powers, and techniques use the same fact language across cards, GridListRow expansions, add
    modals, Library, Codex, and character surfaces.
  acceptance_criteria:
    - Audit compact card/row facts for weapons, armor, powers, and techniques; migrate one-off
      formatter strings to shared builders without removing useful dense comparison columns.
    - Equivalent facts use equivalent language across card and row presentations; structured
      Action Type, Range, Spaces, Ability Requirement, damage, Currency, and Training Points follow
      GAME_RULES capitalization.
    - Named non-mechanic properties use the shared descriptor-chip + accessible InfoTippy pattern
      wherever descriptions are helpful but expansion would add noise.
    - No description is simultaneously repeated as a collapsed chip/column and expanded body.
    - Split implementation into independent domain batches after TASK-454 (weapons/armor and
      powers/techniques may proceed in parallel); each batch has focused tests.
    - Update FEATURE_INDEX/AGENT_GUIDE if shared exports or usage guidance changes; npm run build.
  notes: |
    2026-07-15 audit: marked partial — core builders + LoadoutBudgetBar + GLR InfoTippy shipped;
    powers/techniques §3.1 GridListRow L2 remains TASK-463.
  evidence: |
    npm run build; DEV-V-013-T048 updated for descriptor+InfoTippy.

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
    Batch 1 (2026-07-15): 168 → 158 hook warnings (−10).
    - guided-choice-card: derive inactive overflow; sync expand via render when selected changes.
    - species-creator: module TRAIT_LIMITS; drop unnecessary form/traitLimits deps.
    - AdminArchetypesTab: hoist toLeveledFeatLike.
    - AdminFeatsTab: remount edit modal with key={sessionKey}; seed drafts in useState; remove reset effects.
    - login: derive auth query error (no setState-in-effect); dismiss URL message on new attempt (parity with old setError(null)).
    - empowered getPayload: add missing isReaction dep.
    - Audit follow-up: DEV-V-019 T001–T003; drop unused skillIdToName on AdminFeatEditModal.
    Batch 2 (2026-07-15): 158 → 138 hook warnings (−20).
    - library page: one-time scope lock after auth (render adjust); clamp Enhanced tab state.
    - guided/advanced ancestry+equipment + guided skills: stable empty fallbacks for hook deps.
    - library-section: memoize tabs; edit-mode sync without effects; display fallback for active tab.
    - EditArchetypeModal: remount-on-open via editArchetypeSessionKey; remove reset effect.
    - useCreatorSave: add queryClient + setShowPublishConfirm deps.
    - DEV-V-019 T004–T005.
    Batch 2 audit (2026-07-15):
    - Restored one-time library mode lock (not continuous auth/?view= follow).
    - Controlled sheet tab: page clamps via resolveLibraryActiveTab (parent state parity).
    - Edit archetype uses sessionKey (not ability-field key mid-edit).
    - DEV-V-019 T004–T006 tightened / T006 added.
    Full TASK-430 functional audit (2026-07-15):
    - Batch 1 patterns OK (choice-card, login dismiss, admin feat remount, isReaction dep).
    - Hardened: guest→always Realms scope; Enhanced displayTab belt-and-suspenders;
      guided skills abilities via stable useMemo copy (no shared DEFAULT_ABILITIES mutate).
    - No infinite-loop / RoH breaks found; build clean.
    Batch 3 (2026-07-15): 138 → 108 hook warnings (−30). Careful pass; no eslint-disable.
    - Stable empties / useMemo: advanced skills+powers steps, guided feat steps, abilities-step.
    - Remount-on-open (drop reset effects): level-up, settings, add-feat, add-proficiency,
      add-sub-skill, AddCreatureFeatModal (+ parent conditionals/keys).
    - unified-selection-modal: drop redundant sortState dep (sortItems closes over it).
    - Deferred: use-character-sheet-actions (45), creator cache/?edit hydrates, encounters, Modal.tsx.
    - DEV-V-019 T007.
    Batch 3 audit (2026-07-15):
    - AddSkillModal remount parity (skills-allocation + guided-skills-panel).
    - Shared `src/lib/empty.ts` (dedupe EMPTY_* across skills/feats/ancestry).
    - skills Continue copies defenseVals (never persist DEFAULT_DEFENSE_SKILLS ref).
    - Settings modal uses isOpen while conditionally mounted.
    Batch 4 start (2026-07-16): power-creator hydrate → remount bootstrap.
    - New `lib/game/creator-cache.ts` (pure read + write/clear draft-cache helpers).
    - `power-creator-bootstrap.ts`: pure cache-restore + library-record→form-state builders.
    - page.tsx: PowerCreatorWorkspace remounts via key (editId|draft); initial state seeded in
      useState from one-time render-adjust bootstrap — both hydrate effects deleted (−2 warnings).
    - /audit + /cleanup same session: error state with retry (no infinite spinner on parts
      failure), ?edit= waits on load.isLoading not rawItems.length (empty library / bad id →
      blank creator, no hang), render-pure bootstrap (edit-mode cache clear moved to mount
      effect), DEV-V-019-T009.
    Batch 4 complete (2026-07-16): all remaining creator hydrates → bootstrap + remount.
    - technique-creator: `technique-creator-bootstrap.ts` (cache restore + record→form-state,
      weapon/No-Attack/TP inference preserved); TechniqueCreatorWorkspace remounts via
      key={editId|draft}; hydrate + ?edit= effects deleted; autosave skips ?edit=.
    - item-creator: `item-creator-bootstrap.ts` (unified record→form-state for edit + Load modal;
      fixes old edit path dropping shield block/damage config, and Load modal now restores
      imageUrl like the edit path); armament-type filter effect → changeArmamentType event
      handler; dead isEditMode state removed.
    - empowered-technique-creator: `empowered-technique-bootstrap.ts` (cache + record mapping via
      shared row mappers, addWeapon/TP inference preserved); workspace remount; 3 effects deleted.
    - creature-creator: `creature-creator-bootstrap.ts`; single-object state seeded via one-time
      render adjust gated on the same flags as the shell loading prop (+ ?edit= now included in
      that gate — no blank-form flash); edit-load toast dropped (parity with other creators).
    - All four: edit-mode clears draft cache in mount effect; autosave skips ?edit= (loaded row no
      longer leaks into draft cache); writeCreatorCache/clearCreatorCache from `creator-cache.ts`.
    - Measured after batch 4: **104** react-hooks warnings (set-state-in-effect 36,
      exhaustive-deps 60, preserve-manual-memoization 8). Build + 163 unit tests pass.
    - DEV-V-019-T010.
  remaining_work: |
    Status stays **partial** until residual hook warnings are materially flattened (or owner
    explicitly closes leftovers as intentional). Baseline after batch 4: **104**
    (set-state-in-effect 36, exhaustive-deps 60, preserve-manual-memoization 8).

    Still to finish (safe batches — continue TASK-430):
    - Encounter views + encounter route pages (Skill/Combat/Mixed) — careful; sync UI has DEV-V.
    - Crafting `[id]` page effects/deps.
    - Shared `components/ui/modal.tsx` (2) — high reuse; parity-test every fullScreenOnMobile modal.
    - Smaller leftovers as they appear in lint dumps (admin pages, use-profile, etc.).

    Do **not** drive remaining work through `use-character-sheet-actions.ts` (~45 warnings) while
    it remains a god-file — see sequencing below / **TASK-381**.
  follow_up_tasks:
    - TASK-381
  notes: |
    Do not mass-disable. Prefer derive / remount / stable empties (`lib/empty.ts`).
    **Sequencing (owner-friendly):** Batches 1–3 cleared the safer surfaces (~168→108).
    The largest remaining pile (~45) sits in `use-character-sheet-actions.ts`. Cleaning that
    file with surgical hook edits while it is still huge is high-risk. Prefer **TASK-381**
    (split sheet/creator god files into smaller modules) *before* or *as* that pile is
    reduced — same domain boundaries make exhaustive-deps / set-state-in-effect fixes
    safer and reviewable. Creator hydrates / encounters / Modal can still proceed as
    separate careful TASK-430 batches in parallel with TASK-381.
    Keep status partial until warning count is materially flattened or owner closes residual.

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
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Decompose large character-sheet/creator files via phased extractions with test-backed parity checkpoints.
    Splitting first makes follow-on React Compiler hook cleanup (TASK-430) safer — especially the
    ~45 react-hooks warnings concentrated in `use-character-sheet-actions.ts`.
  related_files:
    - src/components/character-sheet/use-character-sheet-actions.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/*-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - `use-character-sheet-actions` split by domain boundaries without behavior regressions.
    - Targeted large creator/sheet routes decomposed into stable shells/islands in phases.
    - Each phase ships with explicit parity validation and rollback plan.
    - `npm run build`, `npm test`, and `npm run lint` pass per phase.
  follow_up_tasks:
    - TASK-430
  notes: |
    High blast radius — proceed only with expanded DEV-V validation and small-scope PRs.
    2026-07-01: Owner — start with power-creator and item-creator pages first; species/creature deferred from beginner funnel.
    2026-07-15: Cross-link TASK-430 — recommend sheet actions split (this task) before / alongside
    mass hook cleanup in `use-character-sheet-actions.ts`. God-file → smaller domain modules
    (powers, techniques, inventory, feats, resources, etc.) with clear ownership + DEV-V per phase.

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

- id: TASK-391
  title: "SUPERSEDED — Admin path builder guidance_groups UI (use TASK-514–518)"
  created_at: 2026-06-29
  created_by: agent
  priority: low
  status: not-started
  follow_up_tasks:
    - TASK-514
    - TASK-515
    - TASK-516
    - TASK-517
    - TASK-518
  description: |
    SUPERSEDED 2026-07-17 by owner archetype-path admin parity feedback. Do **not** implement
    this task. Use **TASK-514** (feat groups + character/archetype split), **TASK-515** (skills),
    **TASK-516** (armaments), **TASK-517** (remove recommended species), **TASK-518** (audit).
    Original scope: structured admin UI for `level1_guidance_groups` + optional path seeding.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - sql/codex-archetypes-creator-layer1-extensions.sql
    - src/lib/constants/creator-layer-governance.ts
  acceptance_criteria:
    - Agents skip this task; implement TASK-514–518 instead.
    - When the replacement epic is done, archive this block as superseded (`verification_status: n/a`).
  notes: |
    Kept in ACTIVE only so reconcile/history keep the id; not agent-eligible work.

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

# Admin archetype path ↔ guided creator parity (TASK-514–518) — DONE 2026-07-17
# Owner decisions locked (do not re-ask): feat audience field; armaments UI-only split; DROP
# recommended species; skills max 3 warn-not-block. Content pass TASK-521/530 done.
# Cross-ref: TASK-391 superseded; DEV-V-008 / DEV-V-013 pending-qa.

---
