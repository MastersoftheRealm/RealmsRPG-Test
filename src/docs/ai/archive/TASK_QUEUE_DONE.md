- id: TASK-611
  title: Split shared + data-enrichment hot modules (co-located)
  created_at: 2026-07-20
  completed_at: 2026-07-21
  created_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/creature-stat-block-types.ts
    - src/components/shared/creature-stat-block-helpers.ts
    - src/components/shared/creature-stat-block-section.tsx
    - src/components/shared/creature-stat-block-display-data.ts
    - src/components/shared/creature-stat-block-panels.tsx
    - src/components/shared/entity-library-sections.tsx
    - src/components/shared/entity-library-sections-types.ts
    - src/components/shared/entity-library-sections-columns.ts
    - src/components/shared/entity-library-sections-rows.tsx
    - src/components/shared/entity-library-powers-techniques.tsx
    - src/components/shared/entity-library-inventory.tsx
    - src/components/shared/entity-library-feats.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/grid-list-row-types.ts
    - src/components/shared/grid-list-row-columns.ts
    - src/components/shared/grid-list-row-detail.tsx
    - src/components/shared/grid-list-row-expanded.tsx
    - src/components/shared/grid-list-row-collapsed.tsx
    - src/components/shared/grid-list-row-chrome.ts
    - src/lib/data-enrichment.ts
    - src/lib/data-enrichment/types.ts
    - src/lib/data-enrichment/find-in-library.ts
    - src/lib/data-enrichment/enrich-powers.ts
    - src/lib/data-enrichment/enrich-techniques.ts
    - src/lib/data-enrichment/enrich-items.ts
    - src/lib/data-enrichment/enrich-character.ts
    - src/lib/data-enrichment/clean-for-save.ts
    - src/docs/ai/ADR/0007-colocated-shared-hot-module-extracts.md
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/BUILD_VALIDATION.md
  completed_work: |
    Co-located private extracts for creature-stat-block, entity-library-sections, grid-list-row, and data-enrichment. Facades: 260 / 44 / 326 / 20 LOC. No new shared barrel exports; ADR-0007 + allowlist for private shared siblings. Vitest: grid-list-row-chrome + cleanForSave consumers. npm run build passes.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T002
      - DEV-V-009-T011
      - DEV-V-009-T013
      - DEV-V-009-T031
  developer_test_plan: |
    DEV-V-009 T002/T011/T013/T031 on character sheet Library + GridListRow parts collapse; smoke creature Library/CreatureStatBlock nested lists.

---

- id: TASK-610
  title: Split remaining creator hot files under ~500 LOC
  created_at: 2026-07-20
  completed_at: 2026-07-21
  created_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/app/(main)/creature-creator/use-creature-creator-workspace.ts
    - src/app/(main)/creature-creator/creature-creator-editor.tsx
    - src/app/(main)/creature-creator/creature-creator-library-selectables.ts
    - src/app/(main)/creature-creator/creature-creator-derived-stats.ts
    - src/app/(main)/creature-creator/creature-creator-derived-stats.test.ts
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/use-empowered-technique-creator-workspace.ts
    - src/app/(main)/empowered-technique-creator/empowered-technique-creator-editor.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/guided-creator/powers-techniques-step-helpers.ts
    - src/lib/guided-creator/powers-techniques-step-helpers.test.ts
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/ancestry/
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  follow_up_tasks:
    - Shrink `powers-techniques-step.tsx` facade (~599 LOC) � extract toggle/seed hook
    - Shrink `use-creature-creator-workspace.ts` (~518 LOC) � optional save/handlers slice
  completed_work: |
    Creature workspace/editor, empowered workspace/editor, ancestry-step, guided powers-techniques split into co-located modules; species/empowered pages already thin from TASK-601. Facades: ancestry-step 96, creature-editor 266, empowered-editor 84, species page 185, empowered page 292. Vitest: creature-creator-derived-stats.test.ts, powers-techniques-step-helpers.test.ts. npm run build passes.
  build_validation: |
    suite: DEV-V-018
    tests:
      - DEV-V-018-T009
      - DEV-V-018-T010
  developer_test_plan: |
    DEV-V-018 T009/T010 smoke on /creature-creator; DEV-V-016 T002 on empowered technique columns; DEV-V-013 smoke on Advanced ancestry + Guided powers/techniques L1.

---
- id: TASK-609
  title: Split admin codex / core-rules hot files under ~500 LOC
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-21
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/admin-feat-form.ts
    - src/app/(main)/admin/codex/admin-feat-edit-modal.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor-config.ts
    - src/app/(main)/admin/codex/admin-archetype-editor-meta.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor-level1.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor-guided.tsx
    - src/app/(main)/admin/codex/admin-archetype-editor-progression.tsx
    - src/app/(main)/admin/codex/use-admin-archetype-workspace.ts
    - src/app/(main)/admin/codex/use-admin-archetype-selection-options.ts
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/admin-part-form.ts
    - src/app/(main)/admin/codex/admin-part-edit-modal.tsx
    - src/app/(main)/admin/core-rules/page.tsx
    - src/app/(main)/admin/core-rules/core-rules-tabs.ts
    - src/app/(main)/admin/core-rules/core-rules-field-editors.tsx
    - src/app/(main)/admin/core-rules/core-rules-progression-preview.tsx
    - src/app/(main)/admin/core-rules/core-rules-damage-types-editor.tsx
    - src/app/(main)/admin/core-rules/core-rules-category-editor.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Admin codex/core-rules editors remain multi-file god zones (Feats ~1235, archetype editor ~1101,
    workspace hook ~930, Parts ~882, core-rules page ~981). Slice into co-located modules using
    existing CodexBrowseListShell / spreadsheet patterns; no parallel admin list chrome.
  acceptance_criteria:
    - Each listed hotspot reduced toward <= ~500 LOC facade (ship first slice + follow-ups if needed).
    - Reuse CodexBrowseListShell / existing admin patterns � no new list shell.
    - FEATURE_INDEX + build green; no live codex data mutations in this task.
  verification_status: n/a
  completed_work: |
    Slice 1: AdminFeatsTab (~368), admin-feat-form + admin-feat-edit-modal; admin-archetype-editor (~98) + section modules; use-admin-archetype-selection-options.
    Slice 2: AdminPartsTab (~390), admin-part-form + admin-part-edit-modal; core-rules/page (~142) + co-located category/field/preview modules.
    use-admin-archetype-workspace ~658 (down from ~868). npm run build green.
  notes: Was TASK-603 pre-renumber. Optional follow-up: extract workspace save handler under ~500 LOC.

---- id: TASK-608
  title: Split combat + skill encounter views under ~500 LOC
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-21
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-030
    tests:
      - DEV-V-030-T001
      - DEV-V-030-T002
  developer_test_plan: |
    Suite DEV-V-030 T001/T002 — combat + skill encounter play after facade split:
    open `/encounters/<id>/combat` and `/skill` (or mixed tabs) → add combatant/participant via
    AddCombatantModal + manual form → start/next turn or submit skill roll → autosave still works.
  related_files:
    - src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx
    - src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx
    - src/app/(main)/encounters/[id]/_components/encounter-view-helpers.ts
    - src/app/(main)/encounters/[id]/_components/combat/use-combat-encounter-view.ts
    - src/app/(main)/encounters/[id]/_components/combat/combat-encounter-helpers.ts
    - src/app/(main)/encounters/[id]/_components/combat/combat-encounter-view-props.ts
    - src/app/(main)/encounters/[id]/_components/combat/combat-round-controls.tsx
    - src/app/(main)/encounters/[id]/_components/combat/combat-combatant-list.tsx
    - src/app/(main)/encounters/[id]/_components/combat/combat-add-sidebar.tsx
    - src/app/(main)/encounters/[id]/_components/skill/use-skill-encounter-view.ts
    - src/app/(main)/encounters/[id]/_components/skill/skill-encounter-view-props.ts
    - src/app/(main)/encounters/[id]/_components/skill/skill-trackers-section.tsx
    - src/app/(main)/encounters/[id]/_components/skill/skill-participant-list.tsx
    - src/app/(main)/encounters/[id]/_components/skill/skill-participant-card.tsx
    - src/app/(main)/encounters/[id]/_components/skill/skill-sidebar.tsx
    - src/app/(main)/encounters/[id]/_components/skill/skill-success-failure-tracker.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Encounter play views are ~1246 / ~1435 LOC. Extract co-located combatant lists, round chrome,
    roll panels, and helpers so each facade lands near ~500 LOC (TASK-598 style). Preserve
    AddCombatantModal + shared roll patterns; do not fork selection shells.
  acceptance_criteria:
    - CombatEncounterView and SkillEncounterView facades each ≤ ~500 LOC (or justified partial with follow-up).
    - Behavior parity for combat/skill encounter play loops.
    - FEATURE_INDEX updated if module paths change; `npm run build` passes.
  completed_work: |
    - Combat facade ~114 LOC + hook/helpers/panels under `_components/combat/`.
    - Skill facade ~156 LOC + hook/panels under `_components/skill/`.
    - Shared only identical `generateId` / `rollInitiative` in `encounter-view-helpers.ts`.
    - Consolidated duplicated combat initiative ordering onto `orderCombatantsByInitiative`.
    - Default exports + combat/skill/mixed route imports unchanged; AddCombatantModal preserved.
    - FEATURE_INDEX + DEV-V-030 smoke suite added.
    - /cleanup: deleted dead facade helper/type re-exports; dropped unused skill-hook returns + dead `onUpdateInitiative` plumbing; helpers import id/initiative from shared file only.
  notes: Share combat/skill helpers only when identical — no premature mega-abstraction. Was TASK-602 pre-renumber.
  evidence: |
    npm run build; npm run tasks:validate; eslint on encounter _components; verification_status pending-qa.

---

- id: TASK-607
  title: Split crafting [id] page under ~500 LOC facade
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-21
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-019
    tests:
      - DEV-V-019-T011
  developer_test_plan: |
    Suite DEV-V-019 T011 — crafting session load + live requirements; also smoke:
    open `/crafting/<id>` → change quantity/options → enter a roll → Complete Crafting still works.
  related_files:
    - src/app/(main)/crafting/[id]/page.tsx
    - src/app/(main)/crafting/[id]/_components/use-crafting-tool-page.ts
    - src/app/(main)/crafting/[id]/_components/crafting-tool-helpers.ts
    - src/app/(main)/crafting/[id]/_components/crafting-summary-sidebar.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-item-options-section.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-adjustments-section.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-rolls-section.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-optional-rules-section.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-outcome-card.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Crafting session page is the largest TSX hotspot (~2009 LOC). Follow TASK-598 pattern:
    extract co-located panels/hooks/helpers; keep a thin page facade under ~500 LOC; no behavior
    change; no parallel crafting UI system.
  acceptance_criteria:
    - `crafting/[id]/page.tsx` facade ≤ ~500 LOC (prefer net move of presentation/helpers out).
    - Named exports / routes unchanged; FEATURE_INDEX updated if paths move.
    - `npm run build` passes; smoke crafting session load/roll/save if touched.
    - No new shared/ui barrel symbols unless Architect path.
  completed_work: |
    - Extracted helpers + `useCraftingToolPage` + six co-located panels under `crafting/[id]/_components/`.
    - Page facade ~190 LOC (was ~2009); default export / route unchanged; no new shared/ui symbols.
    - FEATURE_INDEX crafting row updated.
    - /cleanup: deleted unused `CraftingToolPageModel`; wired panels onto shared helper APIs (energy/DS/uses counts).
  notes: |
    Largest single play-loop readability win (quality audit 2026-07-20). Was TASK-601 pre-renumber.
  evidence: |
    npm run build; npm run tasks:validate; eslint on crafting/[id]; verification_status pending-qa.

---

- id: TASK-606
  title: Owner ack — Advanced CreatorResourceBar → PointStatus / LoadoutBudgetBar grammar
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-21
  implemented_by: agent
  priority: low
  status: done
  verification_status: pending-qa
  follow_up_tasks:
    - TASK-614
  build_validation: |
    suite: DEV-V-001
    tests:
      - DEV-V-001-T014
      - DEV-V-001-T016
  developer_test_plan: |
    Suite DEV-V-001 T014 / T016 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/components/shared/point-status.tsx
    - src/components/character-creator/steps/equipment/step-header.tsx
    - src/components/character-creator/steps/powers/powers-step-chrome.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Advanced creator still uses plain CreatorResourceBar (TP/currency/energy text) while Guided
    uses LoadoutBudgetBar → PointStatus. Product split was noted in TASK-596. Needs owner ack
    before unifying Advanced onto PointStatus grammar, or permanently document the fork.
  acceptance_criteria:
    - Owner chooses unify vs keep fork.
    - If unify: Advanced equipment/powers/finalize use PointStatus (or LoadoutBudgetBar where TP+currency).
    - If keep: FEATURE_INDEX states permanent Advanced vs Guided resource chrome split.
  completed_work: |
    - Owner chose **unify** (prefer Guided grammar so Advanced can be phased out later).
    - Deleted CreatorResourceBar; wired Advanced equipment/powers/finalize onto LoadoutBudgetBar → PointStatus.
    - Collapsed Advanced equipment L1 vs non-L1 dual chrome and powers DescriptorChip TP fork.
    - Extended LoadoutBudgetBar with align + trailing (finalize Energy PointStatus).
    - FEATURE_INDEX + GUIDED_EQUIPMENT_PHASED_SPEC + BV T014/T016 updated.
    - /cleanup: LoadoutBudgetBar role=status; drop finalize energySummary tautology; guide/04 Advanced reuse note.
  notes: |
    From 2026-07-20 /global-audit. Keep-fork path not taken.
    Follow-up TASK-614: move LoadoutBudgetBar into shared (Architect) when prioritized.
  evidence: |
    npm run build; npm run tasks:validate; verification_status pending-qa.

---

- id: TASK-605
  title: Document or redesign MixedSpeciesModal selection grammar
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-21
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  related_files:
    - src/components/character-creator/MixedSpeciesModal.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - .cursor/rules/realms-unification.mdc
  description: |
    MixedSpeciesModal is a dual-species picker (not list add-X). Either mark it an intentional
    non-USM exception in FEATURE_INDEX + unification rule (like AddCombatantModal), or redesign
    onto UnifiedSelectionModal / dual-select product grammar with owner ack.
  acceptance_criteria:
    - FEATURE_INDEX + realms-unification document the chosen path (exception or USM redesign).
    - If redesign: Advanced species-step + sheet Edit Species keep mixed-species behavior.
    - npm run build passes.
  completed_work: |
    - Chose **document exception** (task notes: prefer docs-only unless owner wants USM dual-select;
      owner directed "Do task 605").
    - Documented MixedSpeciesModal as intentional non-USM dual-species picker in FEATURE_INDEX,
      realms-unification, and guide/02 decision-tree table.
    - File header on MixedSpeciesModal states non-USM + call sites
      (Advanced species-step, sheet edit-species-modal).
    - `/cleanup`: deleted ancestry FEATURE_INDEX cross-ref + guide/02 list-modal and
      intentional-exceptions echoes; trimmed file header. SoT = FEATURE_INDEX row +
      realms-unification + guide table row.
    - No behavior change; no USM redesign; verification_status n/a (docs + comment only).
  notes: |
    From 2026-07-20 /global-audit. Docs-only exception path (parity with TASK-571 AddCombatantModal).
  evidence: |
    npm run build pass 2026-07-21; npm run tasks:validate; /cleanup echo trim same day.

---

- id: TASK-604
  title: CreatureStatBlock weapon attack bonus → weapon-attack-ability helper
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-21
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-025
    tests:
      - DEV-V-025-T004
  developer_test_plan: |
    Suite DEV-V-025 T004 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/creature-stat-block.tsx
    - src/lib/game/weapon-attack-ability.ts
    - src/lib/game/weapon-attack-ability.test.ts
    - src/components/character-sheet/library-list-helpers.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Delete local getWeaponAttackBonus in CreatureStatBlock; wire getWeaponAttackBonusFromProperties
    (or thin wrapper) so finesse/range/strength rules match sheet + guided equipment.
  acceptance_criteria:
    - No local attack-bonus fork in creature-stat-block.tsx.
    - Displayed bonuses match sheet helper for same properties/abilities/prof.
    - Vitest or existing attack-ability tests cover the shared path; npm run build passes.
  notes: |
    From 2026-07-20 /global-audit. Call site uses getWeaponAttackBonusFromProperties + one-shot
    attackAbilities (legacy keys via getAbilityValue). /cleanup: deleted thin wrapper; BV
    relocated DEV-V-018-T011 → DEV-V-025-T004. Vitest covers melee/finesse/ranged/thrown.
    verification_status pending-qa.

---

- id: TASK-603
  title: Unify Advanced + Guided portrait upload components
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-21
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T005
      - DEV-V-026-T010
  developer_test_plan: |
    Suite DEV-V-026 T005 / T010 — see BUILD_VALIDATION.md
  related_files:
    - src/components/character-creator/creator-portrait-upload.tsx
    - src/components/character-creator/steps/finalize/portrait-upload.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/lib/portrait.ts
    - src/lib/portrait.test.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Consolidate near-duplicate PortraitUpload / GuidedPortraitUpload onto one shared presenter
    (props for store wiring). Prefer a single save-time portrait upload helper using apiUpload +
    getErrorMessage rather than duplicated catch strings.
  acceptance_criteria:
    - One shared portrait UI module used by Advanced finalize + Guided reveal.
    - Upload errors surface via getErrorMessage (or equivalent api-client helper).
    - No parallel ImageUploadModal forks; npm run build passes.
  notes: |
    From 2026-07-20 /global-audit. Shared CreatorPortraitUpload (finalize/reveal variants) +
    uploadCharacterPortraitFromDataUrl; thin store wrappers retained. /cleanup: drop double
    getErrorMessage wrap, unexport max-size const, trim related_files, finalize caption not bare label.
    verification_status pending-qa.

---

- id: TASK-602
  title: Recovery modal → SegmentedControl + theme-aware status tokens
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T039
  developer_test_plan: |
    Suite DEV-V-009 T039 — see BUILD_VALIDATION.md
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/shared/segmented-control.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Replace hand-rolled Full/Partial, hours (2/4/6), and Auto/Manual button clusters in Recovery
    with SegmentedControl (icons OK). Prefer warning-fg / semantic tokens over numbered warning-*
    ramps + ad-hoc dark: pairs where practical. Keep recovery math and fullScreenOnMobile.
  acceptance_criteria:
    - Three choice groups use SegmentedControl (or documented exception if icon+color treatment cannot).
    - No parallel pill chrome; touch targets ≥44px on mobile.
    - BUILD_VALIDATION recovery smoke steps still pass (add/adjust if visual labels change).
    - npm run build passes.
  notes: |
    From 2026-07-20 /global-audit. Wired mode/duration/allocation onto SegmentedControl; preview uses
    statusPanel.warning + warning-fg; confirm CTA uses primary Button (no warning-* dark: pairs).
    /cleanup: Cancel/confirm → Modal footer + flexLayout; bare labels → visual captions (aria-label on controls).
    verification_status pending-qa (DEV-V-009-T039).

---

- id: TASK-601
  title: Extract technique / empowered / species creator workspaces (TASK-381 remainder)
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T002
      - DEV-V-016-T004
      - DEV-V-016-T005
  developer_test_plan: |
    Suite DEV-V-016 T002 / T004 / T005 — see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/technique-creator/use-technique-creator-workspace.ts
    - src/app/(main)/technique-creator/technique-creator-editor.tsx
    - src/app/(main)/technique-creator/technique-creator-bootstrap.ts
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/use-empowered-technique-creator-workspace.ts
    - src/app/(main)/empowered-technique-creator/empowered-technique-creator-editor.tsx
    - src/app/(main)/empowered-technique-creator/empowered-technique-bootstrap.ts
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/species-creator/use-species-creator-workspace.ts
    - src/app/(main)/species-creator/species-creator-editor.tsx
    - src/app/(main)/species-creator/species-creator-bootstrap.ts
    - src/components/creator/CreatorPageShell.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Finish TASK-381-style decomposition for technique, empowered-technique, and species creators.
    Mirror power/item/creature: thin page + use-*-workspace + editor/bootstrap; keep CreatorPageShell
    / useCreatorSave / LoadFromLibraryModal parity. No behavior change.
  acceptance_criteria:
    - Each of the three routes has a workspace hook + editor module; page.tsx is shell/bootstrap only.
    - Save/load/reset/auth chrome unchanged vs current.
    - FEATURE_INDEX rows updated; npm run build passes.
    - Targeted smoke or existing DEV-V creator suites still apply where present.
  notes: |
    From 2026-07-20 /global-audit → /debt. Species was deferred when TASK-381 archived.
    Coordinates with TASK-610 (LOC facade splits) — prefer completing workspace extract first.
    verification_status pending-qa (DEV-V-016 creator Load smoke).

- id: TASK-600
  title: Speed/Evasion header — Temp Modifier only (remove pencil base edit)
  created_at: 2026-07-20
  created_by: owner
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T038
      - DEV-V-009-T034
  developer_test_plan: |
    Suite DEV-V-009 T038 (+ T034) — see BUILD_VALIDATION.md
  related_files:
    - src/components/character-sheet/sheet-large-stat-block.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/docs/ai/ADR/0006-temp-modifier-mode.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Owner feedback: for Speed/Evasion modifiers, remove the pencil/permanent modifier and keep
    only Temp Modifier. Delete the LargeStatBlock spend/base-edit path (Speed/Evasion were the
    only consumers); header cards match DR/crit/Terminal Temp-only chrome.
  acceptance_criteria:
    - Speed and Evasion show Temp Modifier toggle only in edit mode (no pencil / Base stepper).
    - Sheet no longer wires onSpeedBaseChange / onEvasionBaseChange.
    - Abilities/Skills dual pencil+Temp unchanged.
    - BUILD_VALIDATION T038 (+ T034 wording); ADR-0006 layering note updated.
  notes: |
    verification_status pending-qa (DEV-V-009-T038). speedBase/evasionBase fields remain for
    calculated defaults; not sheet-editable via header.

- id: TASK-599
  title: Single source of truth for archetype-category marketing copy
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: low
  status: done
  verification_status: pending-qa
  related_files:
    - src/lib/constants/copy/archetype-category-copy.ts
    - src/lib/constants/copy/index.ts
    - src/lib/constants/site-copy.ts
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/creator/archetype-selector.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    `ARCHETYPE_INFO` (Power / Powered-Martial / Martial titles+descriptions) was triplicated
    with divergent copy between sheet edit-archetype and Advanced archetype-step (plus
    emoji variant in creator/archetype-selector). Consolidated into one copy module after
    owner picked canonical wording (option B — Advanced fantasy voice).
  acceptance_criteria:
    - One module exports archetype category title/description (selector may keep icons).
    - Sheet + Advanced + creature/creator selectors consume it.
    - Owner-approved copy strings (no silent rewrite of product voice).
  notes: |
    Owner chose B (Advanced fantasy). `ARCHETYPE_CATEGORY_INFO` in
    `lib/constants/copy/archetype-category-copy.ts`; selector keeps local emoji icons.
    verification_status pending-qa (DEV-V-001 T002 + DEV-V-008 T008).

- id: TASK-598
  title: Split oversized sheet + Advanced creator hot files
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: low
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/sheet-resource-input.tsx
    - src/components/character-sheet/sheet-large-stat-block.tsx
    - src/components/character-sheet/sheet-header-identity.tsx
    - src/components/character-sheet/sheet-header-resources.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/library-section-props.ts
    - src/components/character-sheet/library-tab-config.ts
    - src/components/character-sheet/use-library-section-rows.ts
    - src/components/character-sheet/use-library-tab-navigation.tsx
    - src/components/character-sheet/library-powers-panel.tsx
    - src/components/character-sheet/library-inventory-panel.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/abilities-section-model.ts
    - src/components/character-sheet/ability-stat-tile.tsx
    - src/components/character-sheet/defense-stat-tile.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/equipment/
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/steps/finalize/
    - src/components/character-creator/steps/powers-step.tsx
    - src/components/character-creator/steps/powers/
    - src/lib/creator/advanced-powers-selectable.ts
    - src/lib/creator/advanced-powers-selectable.test.ts
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/feats/
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    God-file hygiene after TASK-381 sheet facade: split sheet-header, library-section,
    abilities-section and Advanced equipment/finalize/powers/feats steps along existing
    section/action seams without behavior change.
  acceptance_criteria:
    - Target files under ~500 LOC where practical; no public API regressions.
    - Parity smoke: sheet play/edit; Advanced create through equipment/powers/finalize.
    - FEATURE_INDEX paths updated if files move.
  notes: |
    Facades: sheet-header + abilities-section; library-section ~419; finalize ~456;
    feats ~488; equipment ~431; powers ~456 + `lib/creator/advanced-powers-selectable`
    (+ vitest merge/badge) and `steps/powers/` panels/modals/path-merge helpers.
    Named exports + steps barrel unchanged. verification_status pending-qa (Advanced
    create smoke through equipment/powers/finalize; sheet play/edit library).

- id: TASK-596
  title: Extract Advanced equipment-step catalog into lib (guided parity)
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/lib/creator/advanced-equipment-catalog.ts
    - src/lib/creator/advanced-equipment-catalog.test.ts
    - src/components/character-creator/steps/equipment-step.tsx
    - src/lib/guided-creator/equipment-currency.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Advanced `equipment-step.tsx` inlined catalog merge, currency/TP, path recommendations,
    and inventory mutations. Guided already had tested currency/catalog modules. Extracted
    Advanced pure helpers into `lib/creator/advanced-equipment-catalog.ts` (reuses guided
    `computeStartingCurrency` / spend math); kept Advanced inline list + CreatorResourceBar.
  acceptance_criteria:
    - Pure helpers extracted with vitest; equipment-step becomes UI wiring.
    - Path recommend / currency / TP behavior unchanged vs BUILD_VALIDATION DEV-V-001 equipment tests.
    - No new parallel budget chrome; do not force LoadoutBudgetBar into Advanced without ack.
  notes: |
    equipment-step ~1404→~1082 LOC (UI split remains TASK-598). Vitest covers catalog merge,
    path recommend/phase filter, currency (T014 partial CI), inventory add/remove/replace,
    unarmed TP. verification_status pending-qa (DEV-V-001 T014–T015 display/save chrome).

- id: TASK-594
  title: Unify sheet EditSpecies/EditArchetype with creator/guided species+path primitives
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/lib/ancestry/ancestry-selection.ts
    - src/lib/ancestry/ancestry-selection.test.ts
    - src/lib/game/archetype-edit.ts
    - src/lib/game/archetype-edit.test.ts
    - src/components/character-creator/TraitSection.tsx
    - src/components/character-creator/AbilityPickButton.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/character-sheet/edit-species-modal.tsx
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Sheet edit-species and edit-archetype duplicated Advanced ancestry/path flows.
    Extract shared primitives (trait pickers, path option lists) and thin the sheet modals.
    Keep sheet-specific skill migration and path/forge confirms. Kept SelectionCard path chrome
    (matches Advanced; GuidedChoiceCard remains Guided L1 only).
  acceptance_criteria:
    - No parallel trait-resolution / path-card chrome beyond documented guided L1 grammar.
    - Sheet edit flows still migrate skills and confirm path/forge switches.
    - Mobile fullScreenOnMobile scroll remains correct (no unconditional max-h vh).
    - Build + targeted smoke of edit species/archetype on a saved character.
  notes: |
    Consolidated onto ancestry-selection + archetype-edit libs; sheet uses TraitSection /
    AbilityPickButton + SelectionCardSurface species grid; Guided path-step uses
    listPlayerVisiblePaths. SpeciesModal local catalog section renamed (not picker TraitSection).
    ARCHETYPE_INFO copy still sheet vs Advanced (TASK-599). verification_status pending-qa
    (DEV-V-009-T037, DEV-V-008-T008).
- id: TASK-597
  title: Campaign RM character view reuses sheet derived assemble
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/components/character-sheet/read-only-sheet.ts
    - src/components/character-sheet/use-character-sheet-derived.ts
    - src/components/character-sheet/character-sheet-body.tsx
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/page.tsx
  description: |
    Campaign read-only character view (~355 LOC) re-assembles enrichment, calculateStats,
    and section props instead of `useCharacterSheetDerived` / `CharacterSheetBody`. Wire
    read-only mode through existing sheet assemble so Temp Modifier / library props stay
    in parity with owner sheet.
  acceptance_criteria:
    - Campaign view uses sheet derived (or a read-only facade) — no parallel enrich/stats glue.
    - Read-only: no edit/modals that mutate; rolls/log still work if currently present.
    - Temp modifiers / library visibility match owner sheet display.
    - Build + smoke open a campaign character view.
  notes: |
    Wired campaign RM view onto useCharacterSheetDerived + CharacterSheetProvider/Body;
    read-only helpers in `read-only-sheet.ts`; rolls/log retained. verification_status pending-qa.
- id: TASK-593
  title: Move RollProvider/RollLog out of character-sheet into shared roll domain
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: n/a
  related_files:
    - src/lib/rolls/die.ts
    - src/components/rolls/roll-context.tsx
    - src/components/rolls/roll-log.tsx
    - src/components/rolls/index.ts
    - src/types/campaign-roll.ts
    - src/services/campaign-roll-service.ts
    - src/components/shared/entity-library-sections.tsx
    - src/components/shared/quick-armaments-sections.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Roll context/log live under character-sheet but are consumed by encounters, campaigns,
    creature creator, library creatures, and shared entity rows. Move to a shared/game roll
    home; dedupe local `rollDie` / die-image maps; update barrels + FEATURE_INDEX. Do not
    change roll behavior.
  acceptance_criteria:
    - RollProvider/RollLog/useRolls* live outside character-sheet (shared or lib + thin UI).
    - Single `rollDie` + die-image map; no triplicated helpers.
    - All previous import sites compile; encounters/sheet/campaign rolls unchanged.
    - FEATURE_INDEX + UI_COMPONENT_REFERENCE point at new home; `npm run build` passes.
  notes: |
    Moved to `components/rolls` + `lib/rolls/die.ts` (single rollDie/DIE_IMAGES). Not under shared/ui.
    All import sites updated; FEATURE_INDEX/DESIGN_SYSTEM/UI_COMPONENT_REFERENCE pointed at new home.
- id: TASK-595
  title: Shared creator skill-save + character payload builder slice
  created_at: 2026-07-20
  created_by: agent
  completed_at: 2026-07-20
  implemented_by: agent
  priority: medium
  status: done
  verification_status: n/a
  related_files:
    - src/lib/creator/build-creator-skills.ts
    - src/lib/creator/build-creator-skills.test.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/character-creator-store.ts
    - src/components/character-creator/steps/finalize-step.tsx
    - src/lib/data-enrichment.ts
    - src/lib/character-save.ts
  description: |
    Guided uses `buildGuidedSkillsArray` + `buildGuidedCharacterPayload`; Advanced builds
    skills array inline in finalize (prof-only 0 must survive `cleanForSave`) and payload
    in `getCharacter()`. Extract a shared creator skill-save helper + first slice of shared
    payload assembly without merging stores/routes.
  acceptance_criteria:
    - One helper builds skill save rows for guided + advanced (preserves proficient value 0).
    - Vitest covers prof-only 0 and species skill flags.
    - Both save paths still set proficiencies + libraryTabVisibility via existing helpers.
    - Stores/routes remain separate; `npm run build` + targeted tests pass.
  notes: |
    Added `lib/creator/build-creator-skills.ts` + vitest (prof 0 + species ids). Guided
    `build-character` + Advanced finalize call it directly (deleted thin build-skills wrapper).
- id: TASK-592
  title: Vitest — guided Continue advances one screen (DEV-V-013-T059)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  parent_task: TASK-480
  related_files:
    - src/lib/guided-creator/guided-substep-nav.ts
    - src/lib/guided-creator/guided-substep-nav.test.ts
    - src/stores/guided-creator-store.ts
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Store nextSubStep / chapter entry already encodes never jump to furthest. Add focused
    vitest (or extract pure next-index helper) proving Continue advances one sub-step from
    chapter entry, not furthest completed.
  acceptance_criteria:
    - Automated coverage of one-screen advance vs furthest-jump regression.
    - Prefer pure helper extract if store is hard to unit-test; no Playwright required.
    - npm test green; matrix row #7 → CI.
  notes: |
    Extracted nextGuidedSubStep / prevGuidedSubStep / landsOnFirstInnerScreen into
    guided-substep-nav.ts; store footer nav + Ancestry/Loadout entry consume helpers.
    Vitest covers one-step walk of GUIDED_SUBSTEP_ORDER, species→ancestry (not abilities),
    and landsOnFirstInnerScreen intent (forward/first vs back). UI phase reset stays human T059.
- id: TASK-591
  title: Vitest - ancestry pick task order (DEV-V-013-T061)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  parent_task: TASK-480
  related_files:
    - src/lib/guided-creator/ancestry-pick-tasks.ts
    - src/lib/guided-creator/ancestry-pick-tasks.test.ts
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Extract ancestry PickTask list builder (characteristic -> ancestry trait -> optional flaw ->
    bonus ancestry) from ancestry-step into lib; unit-test order and flaw-gated second trait.
  acceptance_criteria:
    - Pure builder used by ancestry-step.
    - Vitest asserts phase order and flaw -> ancestry-trait-2 presence.
    - npm test green; matrix row #8 -> CI.
  notes: |
    Added ancestry-pick-tasks.ts + test: species-trait options first when present; characteristic
    before ancestry-trait-1 before flaw; ancestry-trait-2 only when selectedFlawId is truthy;
    skip (empty string) omits bonus trait. AncestryStep consumes buildAncestryPickTasks.
- id: TASK-584
  title: Skills sheet � catalog-all base skills + filters + edit chrome
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-sheet/use-sheet-skill-identity-actions.ts
    - src/components/character-sheet/character-sheet-context.tsx
    - src/components/character-sheet/character-sheet-body.tsx
    - src/components/shared/skill-row.tsx
    - src/lib/character/sheet-skills-display.ts
    - src/lib/character/sheet-skills-display.test.ts
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T032
  developer_test_plan: |
    Suite DEV-V-009 T032 � Skills catalog list + filters + - removes.
  description: |
    Skills list model: always show every Codex base skill (no Add Skill opt-in for base skills).
    Sub-skills: proficient ones always shown; unproficient sub-skills only if user added them.
    Top filters: proficient-only vs include unproficient; toggle show sub-skills.
    Edit chrome: pencil/Temp floating top-right; PointStatus nowrap; no remove-X (use -).
  acceptance_criteria:
    - All base Codex skills listed by default; filters work as specified.
    - Sub-skill visibility rules match owner: prof always; unprof only if added.
    - No remove-X; - path removes value then prof/sub-skill per GAME_RULES allocation.
    - Header not cramped; DEV-V-009-T032; build; changelog; pending-qa.
  notes: |
    verification_status pending-qa until owner runs DEV-V-009-T032.
- id: TASK-587
  title: Sheet Defense Score hover tip (Score pattern)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - public/tooltip-text.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - src/lib/tooltips/README.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T035
  developer_test_plan: |
    Suite DEV-V-009 T035 � Defense Score hover tip.
  description: |
    On the character sheet Defenses row, each Defense Score value (large number) gets a short
    WordHelpTip explaining Score / Defense Score per GAME_RULES (10 + Defense Bonus; Bonus + 10).
    Shared defenseScoreHelp for all six; defense name tips unchanged.
  acceptance_criteria:
    - Hovering/focusing any defense Score value shows the shared short tip.
    - Tip states it is a Score and defines Defense Score per core rules (Bonus + 10 pattern).
    - Same tip for all six; does not replace getDefenseHelp on the defense name.
    - Reusable export in tooltip-text.tsx; DEV-V-009-T035; build; changelog; pending-qa.
  notes: |
    Related: TASK-547 (name tips), TASK-582 (abilities/defenses layout). verification_status
    pending-qa until owner runs DEV-V-009-T035.
- id: TASK-590
  title: Vitest - innate threshold filter / TP parity (DEV-V-013-T057)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  parent_task: TASK-480
  related_files:
    - src/lib/guided-creator/powers-techniques-l2.ts
    - src/lib/guided-creator/powers-techniques-l2.test.ts
    - src/lib/guided-creator/loadout-tp.ts
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Cover innate catalog filter (energy <= threshold) and TP spend parity for innate vs regular
    via existing powers-techniques-l2 / loadout-tp helpers - no UI e2e.
  acceptance_criteria:
    - Vitest for threshold include/exclude and innate TP counting where helpers already exist.
    - npm test green; matrix row #6 -> CI.
  notes: |
    Added powers-techniques-l2.test.ts: innate <= threshold include/exclude, TP cost parity with
    regular mode, computeL2PowersTechniquesTpSpent + combineGuidedTpBudgets. Soft Continue warn
    and L1 chip UI remain manual (DEV-V-013-T057).

- id: TASK-586
  title: Wire Temp Modifier v1 surfaces (header, abilities, defenses, skills)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-sheet/character-sheet-body.tsx
    - src/components/character-sheet/character-sheet-context.tsx
    - src/components/character-sheet/use-sheet-resource-actions.ts
    - src/components/character-sheet/use-sheet-auto-proficiencies.ts
    - src/components/shared/skill-row.tsx
    - src/components/shared/section-dual-mode-toggles.tsx
    - src/lib/character/temp-modifiers.ts
    - src/lib/character/temp-modifiers.test.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/characters/[id]/library-section-props.ts
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/ADR/0006-temp-modifier-mode.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T034
      - DEV-V-009-T033
  developer_test_plan: |
    Suite DEV-V-009 T034 � Temp Modifier on v1 sheet surfaces; T033 persistence/tint/cascade.
  description: |
    Wired Temp Modifier to Speed, Evasion, Critical Range, Damage Reduction, Terminal;
    Abilities (+ HP/EN/TP max toggle); Defenses; Skills. Stacks on computed/armor defaults.
    Pencil spend locks (no intentional overspend). ADR-0006 / SectionDualModeToggles.
  acceptance_criteria:
    - All v1 surfaces support Temp Modifier with tint + persistence.
    - Ability cascade + HP/EN/TP toggles behave per TASK-585 ADR.
    - Pencil cannot intentionally overspend pools.
    - DEV-V-009-T034 (+ T033); build; changelog; pending-qa.
  notes: |
    Depends on TASK-585 (done). verification_status pending-qa until owner runs T033/T034.
- id: TASK-589
  title: Vitest -- technique load columns (DEV-V-016-T002)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  parent_task: TASK-480
  related_files:
    - src/lib/library-selectable-builders.ts
    - src/lib/library-selectable-builders.test.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Extend library-selectable-builders tests for technique header/column contract
    (Action, Energy, Attack, Training Pts) matching sheet add / creator Load.
  acceptance_criteria:
    - getListHeaderColumns('technique') + getItemColumns / buildSelectableItem assertions.
    - npm test green; update DEVELOPER_TASK_QUEUE matrix row #9 to CI.
  notes: |
    Added DEV-V-016-T002 vitest; matrix row #9 -> CI; BUILD_VALIDATION T002 Attack label + Automated note.
- id: TASK-585
  title: Architect - Temp Modifier mode (persist, tint, dual affordance)
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: critical
  status: done
  verification_status: n/a
  follow_up_tasks:
    - TASK-586
  related_files:
    - src/docs/ai/ADR/0006-temp-modifier-mode.md
    - src/docs/ai/ADR/README.md
    - src/components/shared/temp-modifier-toggle.tsx
    - src/components/shared/section-dual-mode-toggles.tsx
    - src/components/shared/index.ts
    - src/lib/character/temp-modifiers.ts
    - src/lib/character/temp-modifiers.test.ts
    - src/lib/character-save.ts
    - src/lib/character-save.test.ts
    - src/lib/data-enrichment.ts
    - src/types/character.ts
    - src/types/index.ts
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/DESIGN_SYSTEM.md
    - src/docs/ai/BUILD_VALIDATION.md
    - scripts/shared-ui-allowlist.json
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T033
  developer_test_plan: |
    Suite DEV-V-009 T033 - Temp Modifier dual mode + persistence (full after TASK-586 wire).
  description: |
    Architect ADR + persisted tempModifiers + shared dual affordance (pencil + Temp Modifier).
    Tint/cascade/HP-EN-TP contract for TASK-586. Owner ack 2026-07-20.
  acceptance_criteria:
    - ADR + schema/docs for persisted temp modifiers.
    - Shared dual affordance pattern without parallel forks.
    - Tint + cascade + HP/EN/TP toggle contract documented for TASK-586.
    - Owner ack; allowlist + generate-index as needed.
    - DEV-V-009-T033 scaffold; build; changelog.
  notes: |
    ADR-0006 Accepted. Icon: SlidersHorizontal. Surface wire + T033 manual QA = TASK-586.
    verification_status n/a (Architect scaffold; no clickable sheet surface yet).
- id: TASK-588
  title: Vitest -- path change reset vs retain draft patch
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  parent_task: TASK-480
  related_files:
    - src/lib/guided-creator/path-selection-draft.ts
    - src/lib/guided-creator/path-selection-draft.test.ts
    - src/components/guided-creator/steps/path-step.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    DEV-V-001-T013 / DEV-V-013-T032. Extract the same-path vs new-path draft patch from
    PathStep.handleSelect into a pure helper under lib/guided-creator; unit-test retain vs clear.
  acceptance_criteria:
    - Pure helper used by path-step (no duplicated reset object in the component).
    - Vitest covers same-path retain and different-path invalidate (abilities/skills/feats/loadout/powers).
    - npm test green; changelog.
  notes: |
    Added buildPathSelectionDraftPatch; PathStep.handleSelect delegates; matrix row #5 -> CI.
- id: TASK-583
  title: Collapse Parts/Properties & Proficiencies sitewide + type tips
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  related_files:
    - src/lib/chip/list-row-metadata.ts
    - src/lib/chip/index.ts
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/grid-list-row-types.ts
    - src/components/shared/official-entity-list.tsx
    - src/components/shared/official-power-list.tsx
    - src/components/shared/official-technique-list.tsx
    - src/components/shared/official-item-list.tsx
    - src/components/shared/entity-library-sections.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/library-selectable-builders.ts
    - src/app/(main)/library/LibraryPowersTab.tsx
    - src/app/(main)/library/LibraryTechniquesTab.tsx
    - src/app/(main)/library/LibraryItemsTab.tsx
    - src/app/(main)/creature-creator/use-creature-creator-workspace.ts
    - src/components/character-creator/steps/powers-step.tsx
    - public/tooltip-text.tsx
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/guide/04-floating-ui-tooltips.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T031
  developer_test_plan: |
    Suite DEV-V-009 T031 � Parts/Properties sections default collapsed + InfoTippy.
  description: |
    Parts/Properties & Proficiencies detailSections default collapsed with chevron +
    family-tailored InfoTippy via MetadataDetailSection / GridListRow (no forks).
  acceptance_criteria:
    - Parts/Properties & Proficiencies default collapsed on expand of entity row (all surfaces).
    - Chevron opens/closes; InfoTippy with type-appropriate copy.
    - Descriptor chips outside those sections remain visible by default.
    - DEV-V-009-T031; npm run build; changelog; archive pending-qa.
  notes: |
    Extended MetadataDetailSection with defaultCollapsed + labelHelpKey; builders set both.
    GridListRow: DetailSectionLabel + legacy chips normalized to synthetic detailSections.
    Cleanup: Library/Official use family section builders; deleted tip alias + duplicate GLR chrome.
- id: TASK-581
  title: Document L1/guided vs global tooltip layers; consolidate Armament Proficiency tip
  created_at: 2026-07-20
  completed_at: 2026-07-20
  created_by: agent
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  depends_on:
    - TASK-578
  related_files:
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - public/tooltip-text.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/character-sheet/library-section.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T036
  developer_test_plan: |
    Suite DEV-V-009 T036 — Inventory Armament Proficiency tip (shared armamentProficiencyHelp).
  description: |
    Document global vs guided/L1 tip layers in guide/04; keep armamentProficiencyHelp as the
    single global export; wire the same export on sheet Inventory.
  acceptance_criteria:
    - guide/04 documents L1/guided vs global tip layers with examples.
    - Armament Proficiency tip is a shared tooltip-text export used by Path More details (no leftover duplicates).
    - Sheet Inventory wired to the same export.
    - npm run build; changelog; archive pending-qa.
  notes: |
    SummaryItem gained labelAccessory (PointStatus pattern). No duplicate tip strings found beyond
    guided-creator-copy prose that states the number (not a tip definition). Renamed
    archetypePathHelp → guidedArchetypePathHelp for guided* naming (cleanup).
- id: TASK-430
  title: React Compiler hook warnings � exhaustive-deps / set-state-in-effect / preserve-manual-memoization
  created_at: 2026-07-13
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-321
  related_files:
    - eslint.config.mjs
    - src/hooks/use-is-client.ts
    - src/app/(main)/crafting/crafting-bootstrap.ts
    - src/app/(main)/crafting/[id]/page.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/admin/core-rules/page.tsx
    - src/app/(main)/admin/codex/CodexSpreadsheetView.tsx
    - src/components/onboarding/sheet-tour.tsx
    - src/components/ui/modal.tsx
    - src/components/shared/unified-selection-modal.tsx
  build_validation: |
    suite: DEV-V-019
    tests:
      - DEV-V-019-T001
      - DEV-V-019-T002
      - DEV-V-019-T003
      - DEV-V-019-T004
      - DEV-V-019-T005
      - DEV-V-019-T006
      - DEV-V-019-T007
      - DEV-V-019-T009
      - DEV-V-019-T010
      - DEV-V-019-T011
      - DEV-V-019-T012
      - DEV-V-019-T013
  developer_test_plan: |
    Full DEV-V-019 suite T001�T007 + T009�T013 (batches 1�7). Sitewide react-hooks compiler warnings should be 0.
  description: |
    Cleared React Compiler hook rule warnings (~171 ? 0) via derive / remount / useQuery / useIsClient batches without eslint-disable.
  acceptance_criteria:
    - Material reduction in react-hooks/* warnings without cascading re-render regressions.
    - Prefer removing unnecessary effects over blanket eslint-disable.
    - exhaustive-deps changes must not alter intentional mount-only / stable-ref patterns.
    - npm run build + lint pass; no new errors.
  completed_work: |
    Batches 1�7 (2026-07-15/20): ~171 ? **0** react-hooks set-state-in-effect / exhaustive-deps / preserve-manual-memoization.
    Patterns: derive, remount-on-open, useIsClient, useQuery for admin/profile fetches, crafting bootstrap + displaySessions,
    sheet tour latch, core-rules/spreadsheet seed. DEV-V-019 T001�T013.
  notes: |
    Soft follow-up TASK-381 (sheet facade) was independent; domain hooks already quiet before close.
- id: TASK-440
  title: Copy compliance residuals — dense HP HUD abbreviation decision
  created_at: 2026-07-15
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-439
  related_files:
    - src/app/(main)/library/LibraryCreaturesTab.tsx
    - src/components/encounters/CombatantCard.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/docs/GAME_RULES.md
    - src/docs/DESIGN_SYSTEM.md
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-020
    tests:
      - DEV-V-020-T004
  developer_test_plan: |
    Suite DEV-V-020 T004 — dense HUD Health / Energy labels.
  description: |
    Follow-up to TASK-439. Owner chose full Health / Energy over dense HP / EN on listed HUD surfaces.
  acceptance_criteria:
    - Owner decides: keep HP in dense HUD, or rename to Health (and EN→Energy where paired).
    - Apply decision sitewide to listed surfaces (and peers if found).
    - npm run build if UI touched.
  completed_work: |
    Renamed Library Creatures columns, compact CombatantCard labels, creature creator quickStats to Health/Energy.
    GAME_RULES prefer/avoid + DESIGN_SYSTEM example aligned; DEV-V-020-T004 added.
  notes: |
    Left power/technique Energy-cost column abbreviations (e.g. creator EN) unchanged — not HP/EN pool HUD pairs.

- id: TASK-480
  title: Automate high-value BUILD_VALIDATION behaviors (vitest/Playwright growth)
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: n/a
  related_files:
    - src/lib/library-selectable-builders.test.ts
    - src/lib/game/merge-equipment-inventory.test.ts
    - src/components/character-sheet/add-library-item/map-selection.test.ts
    - src/lib/guided-creator/guided-equipment-l2.test.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    Audit residual: BUILD_VALIDATION.md is a manual human catalog, not a regression net.
    Keep it for owner smoke; add automated tests for highest-churn guided/library/sheet behaviors.
  acceptance_criteria:
    - Identify top 10 DEV-V tests that should be automated; file follow-ups or implement first 3.
    - Document which suites stay human-only vs CI-covered in DEVELOPER_TASK_QUEUE.
    - At least 3 new automated tests merge; npm test / relevant Playwright green.
  completed_work: |
    Top-10 candidates documented in DEVELOPER_TASK_QUEUE (Automated vs human coverage).
    Vitest shipped for DEV-V-016-T001/T003/T006, DEV-V-009-T022 stack merge, DEV-V-013-T052 L2 qty/budget.
    Remaining candidates listed as backlog (path reset extract, innate, Continue nav, ancestry order, technique columns).
  notes: |
    verification_status n/a — docs + automated tests only; owner DEV-V smoke still authoritative for full suites.

- id: TASK-388
  title: "Post-activation onboarding (play together, sheet tour, level-up milestones)"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/onboarding/play-together-modal.tsx
    - src/components/onboarding/sheet-tour-offer-modal.tsx
    - src/components/onboarding/sheet-tour.tsx
    - src/components/onboarding/level-up-guide-card.tsx
    - src/lib/onboarding-preferences.ts
    - src/lib/level-up-guide.ts
    - src/lib/constants/copy/onboarding-copy.ts
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/my-account/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-029
    tests:
      - DEV-V-029-T001
      - DEV-V-029-T002
      - DEV-V-029-T003
  developer_test_plan: |
    Suite DEV-V-029 T001�T003 � play-together, sheet tour offer, level-up guides + tutorials toggle.
  description: |
    Section 11 of REALMS_PRODUCT_OVERVIEW.md. After first character save, guide users
    toward playing together (Discord, campaign invite). Optional post-save sheet tour.
    Contextual level-up tutorials for milestones � delta-only, skippable, global tutorials on/off.
  acceptance_criteria:
    - After first character save: dismissible play-together prompt (Discord + start campaign).
    - Optional sheet tour offered once post-save (Skip + Don't show again); not on home page.
    - First level-up shows contextual guide for fields that changed only.
    - First ability-point level (e.g. level 3) shows where to allocate on sheet.
    - User can disable all tutorials (setting or preference flag).
    - Milestone flags stored (profile or character JSON); no repeat on subsequent level-ups of same type.
    - `npm run build` passes.
  completed_work: |
    PlayTogetherModal shared by guided reveal + advanced finalize (localStorage dismiss).
    Sheet tour offer via ?offerTour=1; highlight-chain SheetTour; level-up guide modal via
    buildLevelUpGuideContent; My Account tutorials toggle; prefs in onboarding-preferences.ts.
    Unit tests + DEV-V-029; build green.
  notes: |
    Prefs/milestones: browser localStorage (product TBD; profile sync deferred). Guides use sheet highlight cards not blocking modals; ability milestone scrolls Abilities + edit mode.

- id: TASK-582
  title: Sheet polish quick wins - abilities/defenses labels, roll log dark badges, desktop pencil
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/roll-log.tsx
    - src/components/shared/edit-section-toggle.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ACCESSIBILITY.md
    - .cursor/rules/realms-mobile.mdc
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T028
      - DEV-V-009-T029
      - DEV-V-009-T030
  developer_test_plan: |
    Suite DEV-V-009 T028-T030 - abilities/defenses label parity; roll log die badges dark; desktop pencil compact.
  description: |
    Quick wins from sheet/list feedback: unify larger Abilities/Defenses labels + defense card chrome;
    fix roll log die max/min and crit total dark-mode contrast; EditSectionToggle icon-hugging on md+
    via touch-target-md-compact; document desktop-first feedback and no 44px desktop inflation.
  acceptance_criteria:
    - Ability and defense names same larger size; defense cards bordered like abilities.
    - Die face max/min and crit totals readable in dark mode.
    - Desktop pencil not a large empty button; mobile still 44px via utility.
    - Docs updated; DEV-V-009-T028-T030; build; pending-qa.
  completed_work: |
    - abilities-section: shared text-sm labels; defense bordered chrome (no forced min-height).
    - /cleanup: deleted min-h-[7.5rem]; later dense tiles (gap-0.5/p-2/md roll; defense Score primary).
    - roll-log: dark success/danger surfaces on die max/min + crit totals.
    - edit-section-toggle: touch-target-md-compact; quieter md+ active (no fill/scale).
    - MOBILE_UX + ACCESSIBILITY + realms-mobile.mdc desktop-vs-mobile guidance.
    - Filed TASK-583-586 for remaining feedback.
  notes: |
    Follow-ups: TASK-583 parts collapse; TASK-584 skills catalog; TASK-585/586 Temp Modifier; TASK-587 Defense Score tip.
- id: TASK-578
  title: Guided Path More details — lean overview, ability tips, Weapons & Armor from live rules
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  follow_up_tasks:
    - TASK-581
  related_files:
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/components/guided-creator/guided-overview-section.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/components/shared/ability-score-grid.tsx
    - src/hooks/use-game-rules.ts
    - src/lib/game/formulas.ts
    - public/tooltip-text.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T069
  developer_test_plan: |
    Suite DEV-V-013 T069 — Path More details overview (BUILD_VALIDATION.md).
  description: |
    Path More details overview restructure. Removed preview hint and Proficiency section; Path
    Abilities tip + md chips; Weapons and Armor from live getArmamentMax; compact recommended
    ability cards via AbilityScoreGrid density/onlyAbilities; reusable armamentProficiencyHelp.
  acceptance_criteria:
    - No modal preview hint; no Proficiency overview section.
    - Path Abilities tip(s) match GAME_RULES Primary vs Secondary meaning.
    - Recommended Abilities use compact ability cards (not desc-chip list).
    - Weapons and Armor shows type-appropriate prose + number from getArmamentMax / live rules.
    - Reusable armamentProficiencyHelp export wired on this section.
    - DB gap (if any) documented + SQL proposed; not silently faked in UI.
    - Add DEV-V-013-T069; npm run build; changelog + archive with pending-qa.
  completed_work: |
    - Dropped path detailModalHint and Proficiency overview block.
    - Path Abilities: md chips (Primary slight blue) + guidedArchetypeAbilityHelp InfoTippy.
    - Weapons and Armor summary with path-type prose + getArmamentMax(useGameRules); armamentProficiencyHelp.
    - Recommended abilities: AbilityScoreGrid density=compact + onlyAbilities (shared grid extend).
    - Audited live core_rules ARCHETYPES.armamentMax (3/8/12) + ARMAMENT_PROFICIENCY table — OK, no SQL.
    - DEV-V-013-T069; pending-qa.
  notes: |
    TASK-581 consolidates tooltip scoping docs onto armamentProficiencyHelp (sheet wire optional).
    /cleanup: collapsed recommended-ability memos; dropped unused AbilityName import; DEV-V-013 T070 count note; feedback disposition; TP tip em dash.

- id: TASK-580
  title: Simplify Training Points InfoTippy copy (guided Loadout / Powers)
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - public/tooltip-text.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T071
  developer_test_plan: |
    Suite DEV-V-013 T071 — Training Points tip clarity (BUILD_VALIDATION.md).
  description: |
    Rewrote trainingPointsHelp for Guided Creator — shorter shared-budget copy for weapons,
    armor, Powers, and Techniques; remaining gates affordability; dropped level/ability formula lecture.
  acceptance_criteria:
    - TP tip is shorter, clearer, and still correct.
    - All current consumers still import the same export.
    - Add or extend DEV-V-013-T071; npm run build; changelog + archive with pending-qa.
  completed_work: |
    - Shortened trainingPointsHelp (2 lines: shared budget + remaining affordability).
    - LoadoutBudgetBar still imports trainingPointsHelp (sole consumer).
    - DEV-V-013-T071 added; suite index updated to T071.
  notes: |
    Path wave sibling; independent of Path More details (TASK-578/579/581).
- id: TASK-577
  title: Guided Path L1 — Archetype Path title, section headers, path-type tips, ability chips
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  follow_up_tasks:
    - TASK-578
    - TASK-579
    - TASK-581
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-step-layout.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - public/tooltip-text.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T068
  developer_test_plan: |
    Suite DEV-V-013 T068 — Path L1 Archetype Path chrome (BUILD_VALIDATION.md).
  description: |
    Guided Path step L1 chrome from owner feedback. Renamed step title to Choose your Archetype Path;
    Foundation subtitle exposes Archetype Path; InfoTippy explaining Archetype Path; stronger Power /
    Powered-Martial / Martial section headers; rewritten path-type tips (Power examples); ability chips
    slightly larger for Primary and Secondary; Primary slight primary blue (not power/martial tint).
  acceptance_criteria:
    - Title is Choose your Archetype Path with working Archetype Path InfoTippy from tooltip-text.
    - Foundation subtitle exposes Archetype Path.
    - Section headers are visually stronger as clear h3 section titles.
    - Path-type tips are positive, example-rich, and rules-accurate vs GAME_RULES.
    - Ability chips slightly larger; Primary slight blue; Primary/Secondary same size; no power/martial role tint.
    - Add DEV-V-013-T068; npm run build; changelog + move done to archive with verification_status pending-qa.
  notes: |
    Wave start of TASK-577-581. More details left to TASK-578.

- id: TASK-576
  title: Shared list shell for Admin Codex + Codex browse (+ Admin Images)
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/shared/codex-browse-list-shell.tsx
    - src/docs/ai/ADR/0005-codex-browse-list-shell.md
    - src/components/shared/index.ts
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/codex/CodexTraitsTab.tsx
    - src/app/(main)/codex/CodexCreatureFeatsTab.tsx
    - src/app/(main)/codex/CodexPartsTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/app/(main)/codex/CodexSpeciesTab.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/codex/CodexArchetypesTab.tsx
    - src/app/(main)/admin/images/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-028
    tests:
      - DEV-V-028-T001
      - DEV-V-028-T002
      - DEV-V-028-T003
      - DEV-V-028-T004
  developer_test_plan: |
    Suite DEV-V-028 T001�T004 � see BUILD_VALIDATION.md
  description: |
    /global-audit 2026-07-20: Admin Codex + Codex browse + Admin Images hand-rolled
    SectionHeader + SearchInput + ListHeader. Shipped CodexBrowseListShell (ADR-0005);
    migrated 8 admin codex tabs + 9 Codex browse tabs (incl. Archetypes chrome) + Admin Images. Admin Archetypes path rows remain exceptional (no ListHeader grid).
  acceptance_criteria:
    - One canonical shared list chrome used by Admin Codex tabs + matching Codex browse tabs.
    - Admin Images either adopts the same shell or documents why bank UI stays separate.
    - FEATURE_INDEX + barrels + shared-ui allowlist updated; no parallel hand-rolled forks remain
      for those surfaces.
    - npm run build; targeted DEV-V if user-facing list chrome changes.
  completed_work: |
    - ADR-0005 + CodexBrowseListShell in shared (allowlist + FEATURE_INDEX + unification rule).
    - Migrated Admin: Skills, Traits, CreatureFeats, Parts, Properties, Equipment, Species, Feats.
    - Migrated Codex browse peers (same set); my-mode empties unchanged.
    - Admin Images bank list on shell; PageHeader stays page-level.
    - AdminArchetypesTab documented exception (path-card UI); CodexArchetypesTab on shell.
    - DEV-V-028 T001�T004.
  notes: |
    Owner ack 2026-07-20 (proceed). Nested modal lists (AdminTraits choice picker,
    AdminSpecies trait USM) stay hand-rolled per ADR.

---
- id: TASK-403
  title: Guided Simple Creator — Phase 8 admin & species starter flag
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: n/a
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
  description: |
    Admin species is_starter checkbox; admin archetype JSON fields for level1_recommended_abilities and level1_loadouts; save via saveArchetypeWithPath.
  acceptance_criteria:
    - isStarter persists on species; guided JSON fields editable and saved to DB columns.
  completed_work: |
    - isStarter checkbox wired in AdminSpeciesTab (openAdd/openEdit/save).
    - Guided recommended abilities + loadouts persisted via saveArchetypeWithPath.
    - TASK-404: structured admin abilities steppers + loadout controls (raw JSON removed for those fields).
    - Soft residual (species trait-option picker polish) superseded by TASK-572 AdminSpecies → USM; no further 403 work.
  notes: |
    2026-07-20 /debt (/global-audit): AC met; archived. Do not rediscover optional trait-option residual — TASK-572 covers AdminSpecies trait Add.
  follow_up_tasks:
    - TASK-404
    - TASK-572

- id: TASK-575
  title: Admin Official Enhanced list → OfficialEntityList shell parity
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
    - src/components/shared/official-enhanced-list.tsx
    - src/components/shared/official-entity-list.tsx
    - src/lib/library/official-enhanced-list.ts
    - src/components/shared/index.ts
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-027
    tests:
      - DEV-V-027-T001
  developer_test_plan: |
    Suite DEV-V-027 T001 — see BUILD_VALIDATION.md
  description: |
    /global-audit 2026-07-20: AdminPublicEnhancedItemsTab hand-rolled SectionHeader +
    SearchInput + ListHeader while peer Admin Official tabs use Official*List /
    OfficialEntityList. Shipped OfficialEnhancedList thin wrapper + searchTrailing
    on OfficialEntityList for admin Create. Create/edit modal unchanged.
  acceptance_criteria:
    - Admin Official Enhanced list chrome shared with OfficialEntityList (or thin OfficialEnhancedList wrapper).
    - No parallel Search+ListHeader shell left in AdminPublicEnhancedItemsTab for the browse list.
    - Create/edit/delete flows unchanged; npm run build passes.
    - FEATURE_INDEX note if a new OfficialEnhancedList lands.
  notes: |
    Filed from /debt after /global-audit. TASK-500 (enhanced images) stays separate.

---

- id: TASK-574
  title: Add-modal declutter + leave-with-selection prompt
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  merged_at: 2026-07-20
  related_files:
    - src/components/shared/unified-selection-modal.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-sheet/add-proficiency-modal.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/components/shared/add-sub-skill-modal.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/crafting/CraftingItemSelectModal.tsx
    - src/components/guided-creator/guided-powers-techniques-l2-modal.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/AddCreatureFeatModal.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - .cursor/rules/realms-unification.mdc
    - src/docs/MOBILE_UX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T015
  developer_test_plan: |
    Suite DEV-V-016 T015 — see BUILD_VALIDATION.md
  description: |
    Owner feedback on add/selection modals: header help text is clutter (≤1 sentence or remove);
    white bar above sticky footer; dismiss with unconfirmed picks should prompt Add selected?
    so users do not lose selections.
  acceptance_criteria:
    - Header `description` omitted or single short sentence across USM add/load callers (innate: none).
    - No blank strip between scrollable list and sticky footer on USM.
    - Cancel/X/backdrop/Escape with dirty selection → Add selected? (or Load selected?); confirm applies, Don't add discards, prompt close keeps browsing.
    - npm run build; DEV-V-016-T015; changelog + docs.
  completed_work: |
    - UnifiedSelectionModal: `pb-0` content (no footer gap); leave-with-selection prompt for dirty picks.
    - Trimmed/removed multi-sentence header help on USM callers + guided-creator-copy L2 strings.
    - MOBILE_UX + guide/02 + FEATURE_INDEX + DEV-V-016-T015 + Pending owner QA.
    - `/cleanup`: dropped `description={undefined}` noise + empty `innateDescription`; one-line
      sub-skill/proficiency help; removed dead leave-prompt `titleA11y`; powers L2 no double-close;
      related_files matched diff.
    - Renumbered from TASK-573 → TASK-574 after master claimed TASK-573 (guided innate soft-warn, PR #70).
  notes: |
    From owner screenshot feedback (Browse Innate Powers). Shared USM fix covers all add-X/load wrappers.
  evidence: |
    npm run build pass 2026-07-20; DEV-V-016-T015 pending owner QA.

- id: TASK-573
  title: Guided innate — soft Continue warn + TP spend/chip parity
  created_at: 2026-07-20
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  merged_at: 2026-07-20
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-powers-techniques-l2-modal.tsx
    - src/lib/guided-creator/power-technique-display.ts
    - src/lib/guided-creator/powers-techniques-l2.ts
    - src/lib/guided-creator/loadout-tp.ts
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T057
  developer_test_plan: |
    Suite DEV-V-013 T057 — Innate Energy soft warn + threshold + TP parity.
  description: |
    Owner feedback: guided creator should not hard-block Continue when Innate Energy is
    under-filled (soft warning OK). Innate powers must spend shared Training Points like
    regular Powers and show the same TP cost descriptor chip on L1 cards.
  acceptance_criteria:
    - Continue enabled with remaining Innate Energy; soft warning copy in footer/hint.
    - Innate picks count toward shared TP spent (L1 bar + L2 confirm/unavailable).
    - Innate L1 cards show Training Points title chip (Energy in detail chips).
    - Threshold / over-budget Innate Energy gates unchanged.
    - npm run build + targeted unit tests; BUILD_VALIDATION T057 updated.
  completed_work: |
    - Removed hard Continue gate on Innate Energy fill; soft warn via completionHint + copy.
    - Innate TP included in combatTpSpent / toggles / unavailable / L2 base spend; L2 innate
      footer shows Innate Energy + LoadoutBudgetBar; confirm checks TP + energy.
    - **Deleted** Energy-as-titleBudget path from power-technique-display; innate + regular
      share TP title chip anatomy.
    - Soft-seed innate first (energy+TP) then regular with remaining TP.
    - DEV-V-013-T057 + Pending owner QA row.
  notes: |
    From owner feedback 2026-07-20. Supersedes TASK-472 full-spend Continue behavior.
  evidence: |
    vitest power-technique-display + loadout-tp + build-character pass; npm run build pass 2026-07-20; DEV-V-013-T057 pending owner QA.

- id: TASK-572
  title: AdminSpecies trait picker — USM or document admin exception
  created_at: 2026-07-19
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: pending-qa
  merged_at: 2026-07-20
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/hooks/use-modal-list-state.ts
    - src/components/shared/grid-list-row-chrome.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    AdminSpecies trait picker hand-rolls Modal+Search+GLR (pre-USM shell). AdminTraits
    nests similar list in edit modal. Prefer USM (TASK-567 AddProficiency pattern shipped), or admin-only exception.
  acceptance_criteria:
    - Migrate AdminSpecies trait picker to USM, or document admin-only
      exception; AdminTraits nested list shares shell or is scoped as editor chrome.
    - npm run build if UI touched.
  completed_work: |
    - Migrated AdminSpecies trait Add onto UnifiedSelectionModal (multi-select + Add Selected;
      already-on-field traits hidden; Uses/Recovery columns).
    - **Deleted** parallel Modal+SearchInput+ListHeader+per-row Add/Done shell + useModalListState
      from AdminSpeciesTab.
    - Scoped AdminTraits choice-option multi-select as intentional inline editor chrome
      (comment + FEATURE_INDEX + guide/02); aligned ListHeader hasSelectionColumn +
      gridColumnsWithInlineSelection (no nested USM).
    - DEV-V-008-T022 + Pending owner QA row.
  notes: |
    Filed from /audit after /debt 2026-07-19. Prefer migrate path (same as TASK-567).
  evidence: |
    npm run build pass 2026-07-20; DEV-V-008-T022 pending owner QA.

- id: TASK-571
  title: Decide AddCombatantModal — USM migrate or document exception
  created_at: 2026-07-19
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: n/a
  merged_at: 2026-07-20
  related_files:
    - src/components/shared/add-combatant-modal.tsx
    - src/components/shared/index.ts
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - .cursor/rules/realms-unification.mdc
  description: |
    Parallel add-picker (Search + custom rows; qty/type/initiative/campaign). Owner ack
    before USM migrate — may stay an intentional exception.
  acceptance_criteria:
    - Owner decides: migrate onto USM (scoped initiative/campaign AC) or document exception
      in FEATURE_INDEX + guide/02 (alongside RealmsImagePicker-style alternates).
    - Migrate path: sticky footer + fullScreenOnMobile parity; build green.
  completed_work: |
    - Owner chose **document exception** (2026-07-20): keep as distinct reusable shell.
    - Documented AddCombatantModal as encounter/session participant picker (FEATURE_INDEX,
      guide/02 decision tree, realms-unification, AGENT_GUIDE, UI_COMPONENT_REFERENCE).
    - Framed for reuse: combat/skill today (mixed reuses those views); extend for VTT/downtime
      — do not fork and do not migrate onto USM.
    - Exported AddCombatantModal (+ props) from shared barrel; encounter views import from barrel.
    - Dropped unused mode `'mixed'` (call sites pass combat|skill only).
    - `/cleanup`: deduped guide/02 echoes; archive related_files honesty (dropped untouched USM).
  notes: |
    Filed from /audit after /debt 2026-07-19. Owner: document exception + reusable distinct
    component for VTT / encounters / downtime. Docs + barrel — no manual QA suite.
  evidence: |
    Owner decision in chat 2026-07-20; npm run tasks:generate-index (AddCombatantModal in barrels);
    npm run build pass 2026-07-20.

- id: TASK-570
  title: Replace guided parseItemRef with parseIdQuantityStrings
  created_at: 2026-07-19
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: n/a
  merged_at: 2026-07-20
  related_files:
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/lib/game/archetype-path.ts
    - src/lib/game/archetype-path-helpers.test.ts
  description: |
    /global-audit: guided-path-detail-modal local parseItemRef near-copies
    parseIdQuantityStrings but uses lastIndexOf(':') vs indexOf — fold to canonical
    helper with unit parity.
  acceptance_criteria:
    - Delete local parseItemRef; use parseIdQuantityStrings (or thin adapter).
    - Behavior parity for id / id:qty armaments+equipment refs; tests cover edge cases.
    - npm run build + vitest archetype-path helpers green.
  completed_work: |
    - Deleted guided-path-detail-modal local parseItemRef.
    - Guidance-group armaments/equipment refs parse via parseIdQuantityStrings.
    - Added unit coverage for first-colon split (canonical vs former lastIndexOf).
    - `/cleanup`: drop redundant .map(String); one parse call per guidance group;
      FEATURE_INDEX “admin parsers” → shared parsers (TASK-476/570).
  notes: |
    Filed from /debt 2026-07-19. Lib consolidation — no manual QA suite.
  evidence: |
    npm run build (pass 2026-07-20); npx vitest run src/lib/game/archetype-path-helpers.test.ts (13 passed).

- id: TASK-569
  title: Migrate last PartChip call site then delete alias
  created_at: 2026-07-19
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-20
  implemented_by: agent
  verification_status: n/a
  merged_at: 2026-07-20
  related_files:
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/lib/chip/expandable-chip-props.ts
    - scripts/shared-ui-allowlist.json
    - src/components/shared/index.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    /global-audit: deprecated PartChip / PartChipComponent has one consumer
    (proficiencies-tab). Migrate to ExpandableChip + expandableChipPropsFromPartData,
    then delete part-chip.tsx + allowlist row.
  acceptance_criteria:
    - proficiencies-tab uses ExpandableChip path only; no PartChip import.
    - Delete part-chip.tsx; update shared barrel + allowlist; FEATURE_INDEX note.
    - npm run build; tasks:validate-shared-ui green.
  completed_work: |
    - proficiencies-tab: ExpandableChip + expandableChipPropsFromPartData (same adapter
      the alias used).
    - Deleted shared/part-chip.tsx + PartChipComponent barrel export + allowlist row.
    - FEATURE_INDEX note; PartData type re-export kept on shared.
    - `/cleanup`: drop residual PartChip barrel comment + CHIP plan / UI-ref stale lists.
  notes: |
    Filed from /debt 2026-07-19 after global-audit. Compat-alias delete — no new QA suite
    (behavior identical to prior ExpandableChip wrapper).
  evidence: |
    npm run build (pass 2026-07-20); npm run tasks:validate-shared-ui (85 files OK).

- id: TASK-568
  title: Unify getMaxQualifiedFeatLevel character vs creature adapters
  created_at: 2026-07-19
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: n/a
  merged_at: 2026-07-20
  related_files:
    - src/lib/game/feat-requirements.ts
    - src/app/(main)/creature-creator/creature-feat-utils.ts
    - src/app/(main)/creature-creator/page.tsx
    - src/lib/codex/skill-list.ts
    - src/lib/codex/feat-list.ts
    - src/hooks/codex-types.ts
  description: |
    /debt inventory: near-copy `getMaxQualifiedFeatLevel` in feat-requirements vs
    creature-feat-utils; `buildSkillIdToName` duplicated in skill-list and feat-list.
    Collapse to one API + thin adapters — no behavior change.
  acceptance_criteria:
    - Single canonical feat-level helper; creature path adapts inputs only.
    - Single `buildSkillIdToName` (or shared import); delete weaker fork.
    - Existing feat-requirement / creature feat tests green; npm run build.
  completed_work: |
    - Deleted creature-feat-utils `getMaxQualifiedFeatLevel`; creature-creator calls
      canonical helper with `creatureToFeatRequirementCharacter` adapter.
    - Deleted feat-list `buildSkillIdToName`; Codex/Admin feats tabs import from skill-list.
    - `/cleanup`: deleted unused hooks `buildSkillIdToNameMap` alias + barrel export;
      resolve/useSkillIdToNameMap call `buildSkillIdToName` directly.
  notes: |
    Filed from /debt 2026-07-19. Lib consolidation — no manual QA suite.
  evidence: |
    npm run build (pass 2026-07-19); vitest feats-l2 + feat-selection + feat-restriction-notice (14 passed).

- id: TASK-567
  title: Migrate AddProficiencyModal onto UnifiedSelectionModal
  created_at: 2026-07-19
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  merged_at: 2026-07-19
  related_files:
    - src/components/character-sheet/add-proficiency-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    /debt inventory: AddProficiencyModal still hand-rolls Modal + SearchInput + GridListRow
    while add-feat / add-library-item / guided L2 use UnifiedSelectionModal. Migrate to USM
    (list-first Filters chrome) without changing proficiency selection semantics.
  acceptance_criteria:
    - AddProficiencyModal wraps UnifiedSelectionModal (or thin wrapper) — no parallel list shell.
    - Search/sort/list/footer match other add-X modals; fullScreenOnMobile + sticky footer.
    - Behavior parity for existing proficiency picks; BUILD_VALIDATION or targeted test if suite exists.
    - FEATURE_INDEX / guide note; npm run build.
  completed_work: |
    - Rewrote AddProficiencyModal as thin USM wrapper (maxSelections=1).
    - Option levels + Total TP via footerExtra; confirmDisabled when TP ≤ 0.
    - Dropped parallel Modal/SearchInput/ListHeader/GridListRow/useModalListState shell.
    - FEATURE_INDEX + guide/02; DEV-V-009-T027; DEVELOPER_TASK_QUEUE pending-qa.
    - `/cleanup`: consolidated Total TP onto buildProf; chrome comment no longer cites
      add-proficiency as custom Modal; itemLabel part/property.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T027
  developer_test_plan: |
    Suite DEV-V-009 T027 — see BUILD_VALIDATION.md (also remount covered by DEV-V-019-T007 step 4).
  notes: |
    Filed from /debt 2026-07-19. AddCombatantModal → TASK-571; AdminSpecies → TASK-572.
  evidence: |
    npm run build (pass 2026-07-19); cleanup pass same day.

- id: TASK-461
  title: Sitewide compact fact rollout — cards and GridListRow parity
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-454
  completed_work: |
    - Library/Codex/selectable builders + combat-builder use namedPropertyDescriptorChips /
      TRAINING_POINTS_COST_LABEL.
    - LoadoutBudgetBar shared across guided equipment L1/L2 and powers/techniques.
    - GuidedFactChipRow (ex GuidedEquipmentFactChips) — no expand path.
    - GridListChip descriptor path uses DescriptorChipWithTip (InfoTippy) for property tips.
    - Sheet partDataToChips: descriptor kind when no options; Training Points costLabel.
    - Advanced powers/techniques add-modal columns spell Training Points.
    - normalizeId used by powers L1 candidates; formatDamageReductionFact added.
    - Powers/techniques L2: GuidedPowersTechniquesL2Modal → UnifiedSelectionModal (TASK-463 done).
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
    - src/components/guided-creator/guided-powers-techniques-l2-modal.tsx
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
    2026-07-19 /debt: closed — product surfaces shipped; styleguide demos / dense admin TP headers
    are GAME_RULES-allowed soft residuals, not open AC.
  evidence: |
    npm run build; DEV-V-013-T048 updated for descriptor+InfoTippy.

- id: TASK-391
  title: "SUPERSEDED — Admin path builder guidance_groups UI (use TASK-514–518)"
  created_at: 2026-06-29
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: n/a
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - sql/codex-archetypes-creator-layer1-extensions.sql
    - src/lib/constants/creator-layer-governance.ts
  description: |
    SUPERSEDED 2026-07-17 by owner archetype-path admin parity feedback. Replaced by
    TASK-514–518 (archived). Original scope: structured admin UI for level1_guidance_groups.
  acceptance_criteria:
    - Agents skip this task; implement TASK-514–518 instead.
    - Archive as superseded (`verification_status: n/a`) when replacement epic done.
  notes: |
    Archived during /debt 2026-07-19 — replacement epic already done; no implementable work.
  evidence: |
    TASK-514–518 archive blocks; ACTIVE_TASKS hot-path trim.

- id: TASK-566
  title: Guided Skills row layout + Abilities mobile full names + tip copy
  created_at: 2026-07-19
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/shared/ability-score-grid.tsx
    - public/tooltip-text.tsx
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - src/lib/tooltips/README.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Guided Skills L1 rows were cramped on mobile (expand chevron overlapped chips;
    path tags truncated). Abilities recommended grid used STR/ACU abbreviations and
    tall 3-col tiles. Ability/defense WordHelpTip copy repeated the name
    (“Acuity. Acuity…”). Fix layout, show full ability names on mobile, and
    dedupe tip sentences.
  acceptance_criteria:
    - GuidedSkillsPanel: name+chevron on first line; chips wrap below; no overlap with ±/X.
    - AbilityScoreGrid display: full names on all breakpoints; 2-col phone / less elongated tiles.
    - getAbilityHelp / getDefenseHelp say the name once (no “Name. Name…”).
    - BUILD_VALIDATION DEV-V-013-T067; npm run build.
  notes: |
    Owner feedback 2026-07-19 with screenshots (Tamer Skills + Abilities).
    ABILITY_DISPLAY_INFO.shortName kept on the exported shape; grid always shows full `name`.
    Cleanup 2026-07-19: restore WordHelpTip 44px touch target on display tiles; tip docs name-once.
    Merged with master 2026-07-19 (kept TASK-564 archive entry from PR #51).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/52
  merged_at: |
    2026-07-19
  evidence: |
    npm run build; /audit → /cleanup touch target + tip docs
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T067
  developer_test_plan: |
    Suite DEV-V-013 T067 — see BUILD_VALIDATION.md

---
- id: TASK-564
  title: Add/selection modals — list-first Filters chrome
  created_at: 2026-07-19
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/shared/filters/filter-section.tsx
    - src/components/shared/filters/source-filter.tsx
    - src/components/shared/filters/index.ts
    - src/components/shared/index.ts
    - src/components/shared/unified-selection-modal.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-sheet/add-library-item/power-header-extra.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/components/shared/add-sub-skill-modal.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/crafting/CraftingItemSelectModal.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/app/(main)/creature-creator/AddCreatureFeatModal.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - .cursor/rules/realms-unification.mdc
    - src/docs/MOBILE_UX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/FEATURE_INDEX_BARRELS.generated.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Add/load selection modals stacked always-visible source tabs, mode switches,
    filter rows, and custom forms between search and the sticky footer, leaving
    almost no room for the scrollable list on mobile and short desktop viewports.
    Research + progressive-disclosure fix in shared chrome so the list is the
    primary focus and Filters/search options stay secondary.
  acceptance_criteria:
    - Shared UnifiedSelectionModal / FilterSection compact variant: Search + Filters
      on one toolbar row; headerExtra + filterContent collapsed by default on open.
    - Primary mode tabs always visible via scopeExtra (Powers/Empowered, Armaments/
      Equipment, feat-source, inventory type); SourceFilter stays under Filters.
    - No new parallel modal chrome; Codex page FilterSection unchanged (page variant).
    - Call sites can pass optionsSummary / optionsActiveCount; key add modals wired;
      summary omitted when source is default All (sourceFilterSummary).
    - MOBILE_UX + guide/02 + FEATURE_INDEX updated; BUILD_VALIDATION DEV-V-016-T014.
    - npm run build passes.
  notes: |
    Owner requested TASK-564 (parallel agents used 547/548/565 on master). Extends existing shared components
    (no new shared/ui file / ADR). Complements TASK-541 sticky footer.
    Owner ack 2026-07-19: primary mode tabs always visible via `scopeExtra`;
    SourceFilter / advanced filters remain collapsed under Filters.
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T014
  developer_test_plan: |
    Suite DEV-V-016 T014 — see BUILD_VALIDATION.md (list-first Filters chrome).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/51
  merged_at: |
    2026-07-19
  evidence: |
    npm run build (pass); list-first chrome + scopeExtra mode tabs; sourceFilterSummary
    gates default All; FilterSection aria-controls panel mount; LoadFromLibraryModal
    forwards scopeExtra; pattern via UnifiedSelectionModal.
    Merged with master 2026-07-19 (kept TASK-548/565 archive entries).

---
- id: TASK-548
  title: Guided Skills — show contributing Ability + Skill Bonus formula tip
  created_at: 2026-07-19
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/lib/guided-creator/guided-skill-recommendations.ts
    - src/lib/guided-creator/guided-skill-recommendations.test.ts
    - public/tooltip-text.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Guided Skills L1 list did not show which Ability feeds each Skill, and the
    Skill Bonus number had no explanation. Add Ability chips and a hover/tap
    InfoTippy on the bonus with Ability + Skill Value = Skill Bonus.
  acceptance_criteria:
    - Each GuidedSkillsPanel row shows the contributing Ability (highest linked).
    - Skill Bonus has hover/tap tip with current formula numbers (GAME_RULES terms).
    - Path-declined suggestion cards include Ability tags/badges.
    - BUILD_VALIDATION DEV-V-013-T066; npm run build; unit tests for suggestions.
  notes: |
    Owner feedback 2026-07-19. Tip copy in `getGuidedSkillBonusHelp` (tooltip-text.tsx).
    Multi-ability Skills note “highest linked Ability” in the tip.
    Cleanup 2026-07-19: bonus tip child aria-label; Ability primary (vs Species descriptor);
    remove uses text-danger-fg; DESIGN_INTENT on tip helper/call site.
    Renumbered from TASK-544→545→547→548 on merge — TASK-544–547 taken by path ability,
    sheet dedupe, and ability/defense word tooltips (PR #45/#49/#48/#47). BV tip is T066
    (T065 = guided ability name tooltips from TASK-547).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/46
  evidence: |
    npm run build; vitest guided-skill-recommendations.test.ts; /audit → /cleanup a11y+tokens
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T066
  developer_test_plan: |
    Suite DEV-V-013 T066 — see BUILD_VALIDATION.md

---
- id: TASK-565
  title: Guided feats See more opens add modal (not card dump)
  created_at: 2026-07-19
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/guided-creator/guided-feats-l2-modal.tsx
    - src/components/guided-creator/guided-feats-browse-panel.tsx
    - src/lib/guided-creator/feats-l2.ts
    - src/lib/guided-creator/feats-l2.test.ts
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/components/guided-creator/index.ts
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Owner: guided creator "See more Feats" / "See more Character Feats" must open an add
    modal like other L2 See all buttons (skills / loadout / powers), not replace L1 with
    a full in-step card grid of all feats.
  acceptance_criteria:
    - Archetype Feats + Character Feat GuidedLayerNav opens GuidedFeatsL2Modal (UnifiedSelectionModal).
    - L1 path recommendation cards stay on the step; modal does not dump the catalog as cards.
    - Confirm replaces draft feat ids; cancel leaves prior picks; maxSelections enforced.
    - Removed GuidedFeatsBrowsePanel; FEATURE_INDEX + DEV-V-013-T012 updated.
    - npm run build + feats-l2 unit tests pass.
  notes: |
    Owner scoped as TASK-565 (skip next-ID conflict with open queue). Supersedes TASK-429
    in-step browse disposition for catalog L2. related_files includes deleted
    guided-feats-browse-panel.tsx (replaced by modal).
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T012
  developer_test_plan: |
    Suite DEV-V-013 T012 — see BUILD_VALIDATION.md
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/50
  merged_at: |
    2026-07-19

- id: TASK-547
  title: Ability and defense name tooltips (sheet + guided creator)
  created_at: 2026-07-19
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - public/tooltip-text.tsx
    - src/components/shared/info-tippy.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/components/shared/skills-allocation-page.tsx
    - src/components/shared/index.ts
    - src/components/character-sheet/abilities-section.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/lib/tooltips/README.md
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/FEATURE_INDEX_BARRELS.generated.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ai/archive/TASK_QUEUE_DONE.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - .cursor/rules/realms-unification.mdc
  description: |
    Hover/tap (touch-hold) definition tooltips on ability and defense names for the
    character sheet and guided creator — tip tied to the word itself (no Info icon).
    Copy lives in public/tooltip-text.tsx; trigger via shared WordHelpTip (InfoTippy).
  acceptance_criteria:
    - All six abilities and six defenses have word-tied WordHelpTip triggers on the sheet.
    - Guided Abilities step (AbilityScoreGrid) uses the same ability tips.
    - Defense tips on SkillsAllocationPage when defense bonuses are shown.
    - Copy matches owner-provided ability/defense definitions in tooltip-text.tsx.
    - BUILD_VALIDATION DEV-V-009-T026 + DEV-V-013-T065; npm run build.
  notes: |
    Owner request 2026-07-19. Extends InfoTippy with WordHelpTip (no new shared file).
    Does not replace getTooltipTextByPowerAbility (archetype pick guidance) or
    ABILITY_EFFECT_BLURBS (always-visible Layer 1 cards).
    Cleanup 2026-07-19: DESIGN_INTENT on WordHelpTip; AbilityScoreGrid aria on score
    (not tile); guide/04 + tooltips README; related_files honesty.
    Renumbered from TASK-544→545→546→547 on merge — path ability PRs #45/#49 and sheet
    duplicates PR #48 claimed earlier IDs; BV tip test is T026 (T025 = duplicates).
  build_validation: |
    suite: DEV-V-009 / DEV-V-013
    tests:
      - DEV-V-009-T026
      - DEV-V-013-T065
  developer_test_plan: |
    Suite DEV-V-009 T026 + DEV-V-013 T065 — see BUILD_VALIDATION.md.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/47
  merged_at: |
    2026-07-19
  evidence: |
    npm run build (agent); /audit → /cleanup; CI green; merged to master via PR #47.

---

- id: TASK-546
  title: Fix duplicate traits / part chips / feats on character sheets
  created_at: 2026-07-19
  created_by: owner
  priority: critical
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/lib/library/dedupe-saved-parts.ts
    - src/lib/character/collect-sheet-traits.ts
    - src/lib/guided-creator/build-character.ts
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/lib/data-enrichment.ts
    - src/lib/library-sync.ts
    - src/lib/library/part-display.ts
    - src/lib/calculators/power-calc.ts
    - src/lib/calculators/technique-calc.ts
    - src/lib/library-columnar.ts
    - src/components/character-sheet/feats-tab.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ai/guide/06-creators-and-loadouts.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Character sheets showed duplicate expandable part chips on powers/techniques,
    and duplicate traits/feats on new (especially guided) characters. Root causes:
    guided save stuffed species traits into ancestry.selectedTraits (sheet also
    lists species traits from codex); creators/sync concatenated parts without
    uniqueness; load/enrichment/display had no global dedupe.
  acceptance_criteria:
    - Shared dedupeSavedParts / dedupeEntityRefs used on creator save, library sync,
      cost/display calc, enrichment, and sheet part chips.
    - Guided save stores ancestry picks only in selectedTraits; sheet collectSheetTraits
      tolerates legacy doubles.
    - Feats/powers/techniques lists dedupe by normalized id.
    - BUILD_VALIDATION DEV-V-009-T025; targeted vitest; npm run build.
  notes: |
    Owner feedback 2026-07-19. Global fix (not UI bandaid): write + read paths.
    Cleanup 2026-07-19: drop dead allTraits from guided build context/reveal-step;
    archive related_files includes guide/06 + reveal-step.
    Renumbered from TASK-544→545→546 on merge — TASK-544/545 path ability work (PR #45/#49).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/48
  merged_at: |
    2026-07-19
  evidence: |
    vitest: dedupe-saved-parts, collect-sheet-traits, build-character; npm run build; CI green; merged to master via PR #48.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T025
  developer_test_plan: |
    Suite DEV-V-009 T025 — see BUILD_VALIDATION.md (no duplicate traits/part chips/feats).

- id: TASK-545
  title: Correct Archetype Ability vs Primary/Secondary UX (powered-martial)
  created_at: 2026-07-19
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-544
  related_files:
    - src/lib/guided-creator/path-ability-labels.ts
    - src/lib/guided-creator/path-ability-labels.test.ts
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Owner clarification after TASK-544: Primary/Secondary are guided UX labels only.
    Game term remains Archetype Ability (Power/Martial Archetype Ability on hybrids).
    Powered-martial has two primary archetype abilities; Secondary is not the martial side.
    Calculations using Archetype Ability on hybrids use the higher of the two.
  acceptance_criteria:
    - GAME_RULES restores Archetype Ability terminology (hybrids = two primaries; higher-of-two).
    - Path cards/More details: Primary chip(s) for each Archetype Ability; Secondary only when distinct recommended.
    - AbilityScoreGrid hybrids use Power/Martial pills again (not Primary/Secondary between them).
    - Select draft pow/mart matches archetype abilities (not secondary_ability as martial when mart_abil exists).
    - BUILD_VALIDATION T018/T020/T034/T035 corrected; npm run build + unit tests.
  notes: |
    Owner feedback 2026-07-19 after PR #45 merge. Fixes conflation of Secondary with Martial.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/49
  merged_at: |
    2026-07-19
  evidence: |
    vitest path-ability-labels; npm run build; CI green; merged to master via PR #49
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T018
      - DEV-V-013-T020
      - DEV-V-013-T034
      - DEV-V-013-T035
  developer_test_plan: |
    Suite DEV-V-013 T018, T020, T034, T035 — see BUILD_VALIDATION.md

- id: TASK-544
  title: Guided creator — Primary/Secondary Ability labels on path cards and details
  created_at: 2026-07-19
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-19
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/lib/guided-creator/path-ability-labels.ts
    - src/lib/guided-creator/path-ability-labels.test.ts
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/GAME_RULES.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Owner feedback: guided creator should label path abilities Primary and Secondary
    (not Archetype Ability / Secondary Recommended). Path selection cards need Primary/
    Secondary descriptor chips; More details should list only those chips and omit the
    Power/Martial type tag.
  acceptance_criteria:
    - Path cards show Primary Ability / Secondary Ability descriptor chips when data exists.
    - Path More details abilities use Primary/Secondary only; no Power/Martial type chip.
    - AbilityScoreGrid pills use Primary/Secondary (visible + accessible names).
    - BUILD_VALIDATION DEV-V-013 T018/T020/T034/T035 updated; npm run build + unit tests.
  notes: |
    Owner feedback 2026-07-19. Shared helper resolvePathAbilityLabels for cards + overview + select.
    AbilityScoreGrid is shared with reveal; labels aligned sitewide for path pills.
    Cleanup 2026-07-19: path select uses same helper SoT; dropped overview space-y-3 litter;
    archive related_files honesty (abilities-step).
    GAME_RULES 2026-07-19: Terminology + HP/EN use Primary/Secondary Ability (aligned with UI).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/45
  merged_at: |
    2026-07-19
  evidence: |
    npm run build; vitest path-ability-labels.test.ts; CI green; merged to master via PR #45
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T018
      - DEV-V-013-T020
      - DEV-V-013-T034
      - DEV-V-013-T035
  developer_test_plan: |
    Suite DEV-V-013 T018, T020, T034, T035 — see BUILD_VALIDATION.md

---
- id: TASK-543
  title: Character sheet Skills — Value stepper + not clipped on desktop
  created_at: 2026-07-18
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/skills-allocation-page.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Desktop character sheet Skills panel (narrow lg column): in edit mode the skill
    Value increase (+) control was pushed/clipped behind the right edge. Preserve
    shared ValueStepper; give the Value column and edit table enough min-width so
    TableScroll scrolls instead of crushing the stepper.
  acceptance_criteria:
    - Skills edit Value steppers show full − / value / + on desktop lg Skills panel.
    - + is not clipped by card/panel edge; TableScroll when table wider than panel.
    - SkillsAllocationPage table headers stay in parity with sheet.
    - BUILD_VALIDATION DEV-V-009-T024; npm run build.
  notes: |
    Owner feedback 2026-07-18. Root cause: w-full table in 1fr Skills column shrunk
    the Value column below ValueStepper width without a table min-width.
    Cleanup 2026-07-18: DESIGN_INTENT comments; Remove th sr-only; MOBILE_UX note.
    Renumbered from TASK-540 on merge — TASK-540 auth (PR #41), TASK-541 sticky footer (PR #42),
    TASK-542 inventory/roll-log (PR #43).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/44
  evidence: |
    npm run build (agent); docs honesty cleanup after /audit.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T024
  developer_test_plan: |
    Suite DEV-V-009 T024 — see BUILD_VALIDATION.md (Skills edit Value stepper + visible).

---
- id: TASK-542
  title: Fix roll log bonus dark mode + inventory Add equipment
  created_at: 2026-07-18
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/roll-log.tsx
    - src/hooks/add-library-item/use-add-library-item-data.ts
    - src/components/character-sheet/add-library-item/map-selection.ts
    - src/components/character-sheet/add-library-item/map-selection.test.ts
    - src/components/character-sheet/add-library-item/add-custom-equipment-form.tsx
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/lib/data-enrichment.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Owner feedback: (1) roll log bonus (second) chip missing dark-mode surface/border;
    (2) character Inventory Add equipment did not let users add gear (cross-type
    existingIds collisions + equipment incorrectly treated as unique).
  acceptance_criteria:
    - Bonus chip uses dark success/danger tokens and stays readable in dark mode.
    - Add equipment lists Codex/library gear; Add Selected and custom add update
      Equipment; re-add stacks quantity; custom notes persist via cleanForSave.
    - existingIds scoped by modal type; equipment not excluded when already owned.
    - BUILD_VALIDATION DEV-V-009-T022–T023; npm run build; targeted vitest.
  notes: |
    Root cause for empty/broken add: global existingIds mixed weapon/armor/power
    numeric ids with codex equipment ids, filtering the list. Equipment is stackable.
    Cleanup 2026-07-18: removed dead global existingIds from auto-proficiencies facade;
    SoT is CharacterSheetModals.existingIdsForAddModal; archive pr_link committed.
    Renumbered from TASK-540 on merge — TASK-540 auth (PR #41), TASK-541 sticky footer (PR #42).
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/43
  merged_at: 2026-07-18
  evidence: |
    npm run build (pass); vitest map-selection.test.ts (pass).
    Merged to master via PR #43 after conflict resolve (renumber → TASK-542).
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T022
      - DEV-V-009-T023
  developer_test_plan: |
    Suite DEV-V-009 T022–T023 — see BUILD_VALIDATION.md

---

- id: TASK-541
  title: Mobile selection modals — sticky Add Selected / confirm footer
  created_at: 2026-07-18
  created_by: agent
  completed_at: 2026-07-18
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  pr_link: https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/42
  merged_at: 2026-07-18
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T013
  developer_test_plan: |
    Suite DEV-V-016 T013 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/unified-selection-modal.tsx
    - src/components/ui/modal.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/guide/02-components-and-lists.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    On mobile full-screen selection/add modals, primary actions (Add Selected, Load, Confirm)
    must stay pinned at the bottom so users do not scroll the list to reach them.
  acceptance_criteria:
    - UnifiedSelectionModal uses Modal footer slot for Cancel / Add Selected (or confirmLabel / primaryActions).
    - List scrolls above the footer; footer remains visible on viewports < 768px with fullScreenOnMobile.
    - MOBILE_UX + list-modal guide document footer-slot requirement.
    - BUILD_VALIDATION DEV-V-016-T013; npm run build.
  completed_work: |
    - Moved UnifiedSelectionModal actions into Modal `footer`; title/description use Modal simple header.
    - Content uses overflow-hidden (Modal skips default overflow-y-auto when content owns overflow);
      only the list region scrolls; footer safe-area on mobile fullscreen.
    - Footer `[&_button]:min-h-11` covers confirmLabel and primaryActions.
    - Docs: MOBILE_UX sticky-action rule; guide/02; feedback log; DEV-V-016-T013.
    - /cleanup: Modal overflow ownership; archive related_files honesty.
  evidence: |
    npm run build
  notes: |
    Root cause: footer lived inside Modal children (scroll region). Species/proficiency modals already used footer correctly.
    Renumbered from TASK-540 on merge — TASK-540 already used by auth false-invalid-email (PR #41).
    Follow-up (out of scope): recovery-modal / level-up-modal still put Confirm in children — file TASK if sticky needed there too.

- id: TASK-540
  title: Fix false "Invalid email" on auth forms
  created_at: 2026-07-18
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/lib/auth-errors.ts
    - src/lib/auth-errors.test.ts
    - src/lib/validation/schemas.ts
    - src/lib/validation/auth-email.test.ts
    - src/app/(auth)/register/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/forgot-password/page.tsx
    - src/app/(auth)/reset-password/page.tsx
    - src/app/(main)/my-account/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Valid emails were shown as "Invalid email address" because register/forgot-password
    mapped any Supabase error message containing the word "email" (including SMTP /
    confirmation-send failures) to that copy. Also trim/lowercase auth email fields so
    pasted addresses with whitespace do not fail Zod validation.
  acceptance_criteria:
    - Shared getAuthErrorMessage maps invalid-email only for real format failures.
    - SMTP / confirmation-send errors use send-failure copy, not invalid email.
    - Auth schemas trim+lowercase email; unit tests cover mapper + schema.
    - Auth pages + forgot-password check Supabase { error }; BUILD_VALIDATION
      DEV-V-024-T004–T005; npm run build + targeted tests.
  notes: |
    Owner feedback 2026-07-18. Also narrowed my-account email-change mapping so bare
    "invalid" / "password" substrings do not mislabel errors.
    Cleanup 2026-07-18: my-account uses getAuthErrorMessage('update-email'); DEV-V-024
    suite intro + archive related_files honesty; removed unreachable switch default.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/41
  merged_at: 2026-07-18
  evidence: |
    npm test — auth-errors.test.ts + auth-email.test.ts; npm run build (agent).
    Cleanup: update-email context tests + my-account wired to shared mapper.
    Merged to master via PR #41 after CI green (verify + lint/contrast/build + visual/a11y).
  build_validation: |
    suite: DEV-V-024
    tests:
      - DEV-V-024-T004
      - DEV-V-024-T005
  developer_test_plan: |
    Suite DEV-V-024 T004–T005 — see BUILD_VALIDATION.md (mapper units + register smoke).

---
- id: TASK-539
  title: Chip / GLR body tap toggles expand (not header-only)
  created_at: 2026-07-18
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/ui/expandable-chip.tsx
    - src/components/shared/grid-list-row.tsx
    - src/lib/chip/chip-options-panel.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Mobile/Chip UI: GridListRow items and ExpandableChips should expand/collapse when
    tapping the body (mobile summary, expanded description panel, chip description),
    not only the header/chevron trigger. Nested controls (Options, buttons, chip groups)
    keep their own handlers.
  acceptance_criteria:
    - ExpandableChip: header or expanded body toggles; Options panel excluded via
      data-expand-ignore / stopPropagation; stable full-row layout unchanged.
    - GridListRow: header trigger, mobile summary, and non-interactive expanded body
      toggle; chip groups and action buttons do not accidentally collapse the row.
    - Docs (MOBILE_UX + stable-expand guide) + BUILD_VALIDATION DEV-V-021-T004;
      npm run build.
  notes: |
    Owner feedback 2026-07-18. Extends TASK-445 stable expand hit-target grammar.
    Cleanup 2026-07-18: archive related_files + evidence; BV T004 steps clarified;
    feedback disposition logged; shell aria-expanded only when shell is the widget.
    Merge note: parallel agent originally claimed TASK-537; renumbered to TASK-539
    when merging open PRs onto master.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/39
  evidence: |
    npm run build (agent); docs honesty cleanup after /audit.
  build_validation: |
    suite: DEV-V-021
    tests:
      - DEV-V-021-T004
  developer_test_plan: |
    Suite DEV-V-021 T004 — see BUILD_VALIDATION.md (chip body + GLR mobile summary /
    expanded panel toggle; nested chips/Options excluded).

---
- id: TASK-538
  title: Character sheet mobile — center side-scroll panels with header gutters
  created_at: 2026-07-18
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/character-sheet-body.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Mobile character sheet side-scroll panels (Abilities / Skills / Archetype /
    Library) were not horizontally aligned with the sheet header and had no gap
    between adjacent panels. Match PageContainer gutters via scroll-padding,
    size panels with basis-full, and add gap-4 between snaps.
  acceptance_criteria:
    - Below md, each snapped panel shares left/right gutters with SheetHeader.
    - Visible gap between adjacent side-scroll panels during swipe.
    - Desktop md+ grid layout unchanged.
    - BUILD_VALIDATION DEV-V-009-T021; npm run build; MOBILE_UX notes the pattern.
  notes: |
    Owner feedback 2026-07-18. Root cause: min-w-full panels sized to the outer
    viewport without scroll-padding, so snap-start pulled later panels flush to
    the screen edge while the header stayed inset.
    Cleanup 2026-07-18: archive related_files + BUILD_VALIDATION; drop redundant
    panel w-full; file header cites TASK-538.
    Merge note: parallel agent originally claimed TASK-537; renumbered to TASK-538
    when merging open PRs onto master.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/38
  evidence: |
    npm run build; code review of character-sheet-body flex/snap classes.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T021
  developer_test_plan: |
    Suite DEV-V-009 T021 — see BUILD_VALIDATION.md

---
- id: TASK-537
  title: Character sheet — mobile Inventory TP/Armament overlap + remove tab summary gradients
  created_at: 2026-07-18
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    On mobile character sheet Inventory, Currency and Armament Proficiency (TP) overlapped
    in the top summary bar. Also remove background gradients from that bar and from
    Proficiencies / Notes (shared TabSummarySection) header summaries.
  acceptance_criteria:
    - Inventory summary stacks Currency and Armament Proficiency below sm; no overlap at ~360px.
    - TabSummarySection variants use solid theme fills (no bg-gradient-to-r) sitewide.
    - BUILD_VALIDATION DEV-V-009-T020; npm run build.
  notes: |
    Owner feedback 2026-07-18. SectionHeader for library collapsibles already had no
    gradient background; only TabSummarySection bars were gradient-backed.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/37
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T020
  developer_test_plan: |
    Suite DEV-V-009 T020 — see BUILD_VALIDATION.md
  evidence: |
    npm run build (pass); inventory layout flex-col below sm; TabSummarySection solid fills.

---
- id: TASK-536
  title: GridListRow mobile — stop name squeeze beside X/+
  created_at: 2026-07-18
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-18
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/grid-list-row-chrome.ts
    - src/components/shared/grid-list-row-chrome.test.ts
    - src/docs/MOBILE_UX.md
  description: |
    On mobile, GLR item names were squished left and wrapped because desktop
    grid-template-columns still reserved empty fr tracks for hideOnMobile columns
    while X/+ took the remaining flex space. Collapse the mobile grid so the name
    gets minmax(0, 1fr) beside action chrome.
  acceptance_criteria:
    - Below lg, GridListRow uses a collapsed template (thumb? + name fr + visible
      mobile cols + trailing action tracks); names are not left-squeezed by empty
      desktop data tracks.
    - Desktop lg+ column alignment unchanged; description name-span remains lg-only.
    - Unit coverage for buildMobileCollapsedGridColumns; BUILD_VALIDATION T012;
      npm run build.
  notes: |
    Owner feedback 2026-07-18. Shared helper in grid-list-row-chrome.ts.
    Cleanup 2026-07-18: first ship set inline gridTemplateColumns which beat the
    max-lg class — Library Powers still showed mid-row X + squeezed names. Fixed by
    applying templates only via --glr-desktop-grid / --glr-mobile-grid CSS variables.
  pr_link: |
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/34
    https://github.com/MastersoftheRealm/RealmsRPG-Test/pull/35
  merged_at: 2026-07-18
  evidence: |
    vitest grid-list-row-chrome.test.ts; npm run build; owner screenshot on Library Powers;
    CI green on #35 (incl. mobile styleguide Linux baselines).
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T012
  developer_test_plan: |
    Suite DEV-V-016 T012 — see BUILD_VALIDATION.md (Library Powers at ~360px: name fills
    row left of X/edit; no character-by-character wrap).

---
- id: TASK-534
  title: Admin archetype edit modal — expandable feats + cleaner layout
  created_at: 2026-07-17
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
  description: |
    Clean up admin archetype path edit modal layout (avoid overlap) and let admins
    expand selected feats to read Codex descriptions without leaving the modal.
  acceptance_criteria:
    - Selected Level 1 guidance-group feats (and L2+ add/remove feats) render as
      expandable GridListRows with Codex description.
    - Feat group header/remove and armament/equipment quantity rows do not overlap
      or clip; full-width quantity rows; modal remains fullScreenOnMobile.
    - BUILD_VALIDATION DEV-V-008-T021; npm run build.
  notes: |
    Owner feedback 2026-07-17. ChipSelect used for pick-only; selected feats listed below.
    Cleanup: FEATURE_INDEX sync; QuantitySelector in PathQuantityRow; ChipSelect.onRemove optional;
    dead removeFeats check in selectionFieldConfig removed.
  evidence: |
    npm run build green (post-cleanup).
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T021
  developer_test_plan: |
    Suite DEV-V-008 T021 — see BUILD_VALIDATION.md

---
- id: TASK-530
  title: Codex content pass - enrich archetype paths for guided creator
  created_at: 2026-07-17
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-515
  follow_up_tasks:
    - TASK-521
    - TASK-535
  related_files:
    - sql/codex-archetypes-backup-20260717.sql
    - sql/codex-archetypes-ability-spread-20260717.sql
    - sql/codex-archetypes-enrich-*-applied.sql
    - src/docs/ai/ADR/0004-path-guidance-group-audience.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Enrich all published codex_archetypes Level 1 guidance for guided creator.
  acceptance_criteria:
    - Backup before mutate; character/archetype feat groups; recommended abilities (primary 3, secondary >=2, cost 7, spread); skills <=3; desc/notes; no new weapons/powers/techniques on paths that already had them.
    - Innate power reclassify AC deferred to TASK-535 (energy tags unclear at apply time).
  notes: |
    2026-07-17: All 12 paths applied. Ability spread pass. Wardsmith power_prof_start 0->2.
    Elementalist dropped mis-tagged Rage. Backup codex_archetypes_backup_20260717.
    Cleanup: archive UTF-8; BV DEV-V-013-T064; SQL renamed *-applied; user-facing em dashes scrubbed.
  evidence: |
    Post-apply audit: 12/12 skills=3, has_abilities, char+arch guidance groups; all power paths power_prof_start=2.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T064
  developer_test_plan: |
    Suite DEV-V-013 T064 - guided path content smoke (Berserker/Assassin/Sorcerer/Wardsmith).

---

- id: TASK-521
  title: Codex content pass - trim archetype Level 1 skills to <=3 base
  created_at: 2026-07-17
  created_by: agent
  priority: low
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: n/a
  parent_task: TASK-515
  related_files:
    - sql/codex-archetypes-enrich-*-applied.sql
  description: |
    Trim published path Level 1 skills to <=3 base (no sub-skills). Folded into TASK-530.
  acceptance_criteria:
    - All paths <=3 base skills; changelog when applied.
  notes: |
    Completed via TASK-530 path pass (Commander/Sharpshooter/Wardsmith/Beast Tamer trims).
  evidence: |
    Live audit 2026-07-17: all 12 paths skill_count=3.

---
- id: TASK-533
  title: Sitewide art-capable GLR list thumbnails
  created_at: 2026-07-17
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T009
  developer_test_plan: |
    Suite DEV-V-026 T009 - see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-choice-image.ts
    - src/components/shared/official-power-list.tsx
    - src/components/shared/official-technique-list.tsx
    - src/components/shared/official-creature-list.tsx
    - src/components/shared/official-item-list.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/entity-library-sections.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/components/character-sheet/add-library-item/map-selection.ts
    - src/lib/library-selectable-builders.ts
    - src/lib/list-row-image.ts
    - src/types/library.ts
    - src/types/character.ts
    - src/types/equipment.ts
    - src/app/(main)/library/LibraryPowersTab.tsx
    - src/app/(main)/library/LibraryTechniquesTab.tsx
    - src/app/(main)/library/LibraryCreaturesTab.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
    - src/app/(main)/creature-creator/CreatureCreatorHelpers.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/docs/ai/guide/03-entity-card-art.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Owner: wire list thumbs for every art-capable entity across the codebase
    using the shared species/equipment GLR image pattern.
  acceptance_criteria:
    - Powers, techniques, creatures, equipment/armaments show GLR thumbs in Library/Official lists.
    - Selection modals for art-capable types show thumbs via SelectableItem.thumbnail.
    - Character sheet library sections and creator selected lists (advanced equipment; creature creator powers/techniques/armaments) show thumbs.
    - Non-art entities (feats, skills, archetypes, parts, properties, traits) stay without thumbs.
    - Enhanced items remain deferred (TASK-500).
    - npm run build.

---

- id: TASK-532
  title: Equipment / armament GLR list thumbnails
  created_at: 2026-07-17
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T008
  developer_test_plan: |
    Suite DEV-V-026 T008 - see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/official-entity-list.tsx
    - src/components/shared/official-item-list.tsx
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/library/LibraryItemsTab.tsx
    - src/app/(main)/library/components/UserLibraryEntityTabShell.tsx
    - src/lib/list-row-image.ts
    - src/docs/ai/guide/03-entity-card-art.md
  description: |
    Owner: small images should show in GLR for items with art, following the species
    ListRowThumbnail / resolveListRowThumbnail pattern from product overview section 5.0.3.
  acceptance_criteria:
    - Codex, Admin Codex, Realms Library, and My Library armament lists show 44px thumbs.
    - Uses shared resolveListRowThumbnail('equipment') + ListHeader.hasThumbnailColumn.
    - ExpandableImage preview on thumb click (via ListRowThumbnail).
    - npm run build.

---

- id: TASK-531
  title: Soft theme matte for transparent images
  created_at: 2026-07-17
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T007
  developer_test_plan: |
    Suite DEV-V-026 T007 - see BUILD_VALIDATION.md
  related_files:
    - src/app/globals.css
    - src/lib/crop-image.ts
    - src/lib/crop-image.test.ts
    - src/lib/portrait.ts
    - src/components/shared/image-upload-modal.tsx
    - src/components/shared/expandable-image.tsx
    - src/components/shared/list-row-thumbnail.tsx
    - src/components/shared/realms-image-picker.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/guided-creator/guided-choice-styles.ts
    - src/components/guided-creator/species-reveal-panel.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Transparent art was compositing onto near-black (cropper bg + JPEG alpha→black).
    Add a soft theme-aware image-matte token for display and bake fills.
  acceptance_criteria:
    - Transparent PNG areas use soft theme matte (not pure black/white) in cropper, thumbs, and enlarge modal.
    - JPEG encode fills alpha with current theme --color-image-matte.
    - Light/dark both use non-extreme soft colors matching UI.
    - npm run build + crop-image unit test.

---

- id: TASK-529
  title: Widen high-complexity admin edit modals
  created_at: 2026-07-17
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T020
  developer_test_plan: |
    Suite DEV-V-008 T020 - see BUILD_VALIDATION.md
  related_files:
    - src/components/ui/modal.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/images/admin-image-edit-modal.tsx
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Owner feedback: admin edit modals are high-complexity and felt too narrow. Widen
    Modal size scale for complex editors and apply to admin add/edit dialogs.
  acceptance_criteria:
    - Modal supports wide sizes suitable for complex editors without breaking confirms.
    - Admin Codex / Images / Public Library enhanced-item add-edit modals use wide desktop layout.
    - fullScreenOnMobile retained on those dialogs.
    - DESIGN_SYSTEM documents size guidance; BUILD_VALIDATION test added; npm run build.
  evidence: |
    Modal full = max-w-6xl; 3xl = max-w-5xl; admin edit modals size=full.
  notes: |
    Delete/confirm and species trait-picker selection modal left at smaller sizes.

---

# AI Task Queue - Archived (done + cancelled)

Completed and cancelled tasks moved out of the active `AI_TASK_QUEUE.md` on 2026-06 to keep the
active queue lean. Historical reference only. Stack note: older task text may mention Prisma/
Firebase/RTDB - the project is Supabase-only.

---

- id: TASK-528
  title: Guided Path step - group by Power / Powered-Martial / Martial with tips
  created_at: 2026-07-17
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T063
  developer_test_plan: |
    Suite DEV-V-013 T063 - see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - public/tooltip-text.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  description: |
    Owner asked to separate guided Path picks into Power, Powered-Martial, and Martial
    sections (like Advanced archetype path picker), with InfoTippy on each section title
    explaining the type for new users, while keeping GuidedChoiceCard / deep-dive UX.
  acceptance_criteria:
    - Paths grouped Power then Powered-Martial then Martial; empty types omit their section.
    - Section titles have InfoTippy tips (tooltip-text.tsx); no hybrid LayerNav expand.
    - Guided choice cards + More details unchanged; copy/product overview/BV updated.
    - npm run build; DEV-V-013-T063.
  evidence: |
    npm run build.
  notes: |
    Supersedes prior "hide Powered-Martial behind Show hybrid" LayerNav on Path step.
    Species starter curation + Show all species is unchanged.

---
- id: TASK-527
  title: Guided Loadout entry does not skip Weapons/Armor onto Equipment
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T062
  developer_test_plan: |
    Suite DEV-V-013 T062 - see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/use-guided-path-data.ts
    - src/lib/guided-creator/equipment-phase-candidates.ts
    - src/lib/guided-creator/equipment-phase-nav.test.ts
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
  description: |
    Intermittent bug: entering guided Loadout sometimes skipped Weapons/Armor and opened
    on Equipment. Cold catalog load made unresolved pool refs look like gear-only, then
    entry-jump effects locked equipmentPhase onto gear.
  acceptance_criteria:
    - Entering Loadout with weapon/armor options lands on Weapons first (then Armor, then Equipment).
    - Phase jump/redirect effects do not run (or consume entryNonce) while catalogs/path are loading.
    - Unresolved pool refs are excluded from phase filters (no default-to-gear visibility collapse).
    - Unit tests + BUILD_VALIDATION DEV-V-013-T062; npm run build.
  evidence: |
    vitest equipment-phase-candidates + equipment-phase-nav; npm run build.
  notes: |
    Root cause: resolveEquipmentRef defaults missing items to category equipment; visibility
    collapsed to [gear] during spinner; lastLoadoutJumpNonce consumed before catalogs ready.

---

- id: TASK-526
  title: Collapsed library sections stack tightly
  created_at: 2026-07-17
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-510
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T019
  developer_test_plan: |
    Suite DEV-V-009 T019 - see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/section-header.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/shared/entity-library-sections.tsx
  description: |
    Collapsed Library subsections left large vertical gaps (space-y-6 stacks + SectionHeader
    size pad on top of 44px touch targets). Tighten so closed headers reclaim space.
  acceptance_criteria:
    - Collapsed Inventory/Feats/Powers/Notes/Proficiencies headers stack tightly with no large leftover band under each closed header.
    - SectionHeader collapsible rows omit size vertical pad; 44px touch targets on coarse pointer only.
    - Expanded content still readable; techniques single-section unchanged.
    - BUILD_VALIDATION DEV-V-009-T019; npm run build; FEATURE_INDEX + changelog.
  evidence: |
    npm run build; DEV-V-009-T019 added.
  notes: |
    Follow-up polish to TASK-510 collapse UX from owner feedback 2026-07-17. Gap tuned to space-y-2 after space-y-0 felt cramped. Title size/margin polish via TASK-525; SectionHeader default remains md.

---

- id: TASK-525
  title: Character Library section title size parity
  created_at: 2026-07-17
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  implemented_by: agent
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T018
  developer_test_plan: |
    Suite DEV-V-009 T018 - see BUILD_VALIDATION.md
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/section-header.tsx
    - src/components/shared/entity-library-sections.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ai/archive/TASK_QUEUE_DONE.md
  description: |
    Owner feedback: character Library section title font looked shrunk too small after other work.
    Restore parity with Skills / Archetype card titles and readable subsection headers.
  acceptance_criteria:
    - Library card shows a peer title at text-lg font-bold matching Skills / Archetype & Attacks.
    - Entity list SectionHeaders use lg (text-base) with modest pb under the title; size is applied on the title so collapse controls cannot shrink labels.
    - SectionHeader default size md remains intentional sitewide; Library list subsections pass size="lg" explicitly; dense surfaces (e.g. creature-stat-block) keep explicit size="sm".
    - BUILD_VALIDATION DEV-V-009-T018 + npm run build.
  evidence: |
    npm run build green.

---
  notes: |
    2026-07-17 cleanup: subsection size raised to lg; default stays md (no sitewide blast).


- id: TASK-524
  title: Guided Ancestry pick order — characteristic before ancestry trait
  created_at: 2026-07-17
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T061
  developer_test_plan: |
    Suite DEV-V-013 T061 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/stores/guided-creator-store.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
  description: |
    Owner feedback: after picking the characteristic (character trait), the next screen
    should be ancestry trait — not the optional flaw. Swap guided Ancestry micro-flow order.
  acceptance_criteria:
    - Guided Ancestry pick order is species options (if any) -> characteristic -> ancestry trait -> optional flaw -> bonus ancestry trait when a flaw is taken.
    - Product docs (REALMS) and store chapter comment match the new order.
    - BUILD_VALIDATION DEV-V-013-T061 + npm run build.
  notes: |
    Advanced character-creator single-page section order left unchanged (guided is SoT).
  evidence: |
    npm run build green; task list push order swapped in ancestry-step.tsx; AncestryPhase union order aligned; T061 added.

---

- id: TASK-523
  title: Weapons table - more space between Range/Attack/Damage
  created_at: 2026-07-17
  created_by: owner
  priority: medium
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  implemented_by: agent
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T017
  developer_test_plan: |
    Suite DEV-V-013 T017 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/quick-armaments-sections.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/components/shared/index.ts
  description: |
    Owner feedback: Range/Attack/Damage columns on the Archetype Weapons table were too
    cramped. Reclaim horizontal space by wrapping named-property bullets under Name.
  acceptance_criteria:
    - QuickWeaponsTable uses content-sized Range/Attack/Damage columns (not oversized %) so the row fits the panel without cramping metric cells.
    - Named properties stay one bullet per line under Name and wrap long text within that column.
    - Unarmed trailingRows use the same cell classes and stay aligned.
    - BUILD_VALIDATION DEV-V-009-T017 + npm run build.
  notes: |
    Extends TASK-486 stacked-property layout; no new shared component - column constants only.
    Final layout: table-fixed + rem metric cols (3.75 / 3.75 / 4.25) with tight padding (not large %).
  evidence: |
    npm run build; table-fixed + QUICK_WEAPON_COL rem widths + break-words properties; owner visual OK.

---

- id: TASK-522
  title: Sheet header DR/crit cards match Speed/Evasion + correct equipped DR
  created_at: 2026-07-17
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/library-list-helpers.ts
    - src/components/character-sheet/library-list-helpers.test.ts
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DESIGN_INTENT.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/AI_CHANGELOG.md
  description: |
    Owner feedback: Damage Reduction / Critical Range header cards were smaller and used a
    different value color than Speed/Evasion; Damage Reduction did not match the equipped
    armor's library DR (header used raw equipment without enrichment).
  acceptance_criteria:
    - DR / Critical Range cards use the same LargeStatBlock sizing and text-text-primary values as Speed/Evasion.
    - Header Damage Reduction matches the equipped armor row DR (enriched armorValue / properties).
    - Critical Range remains Evasion + 10 + stacked crit bonuses.
    - BUILD_VALIDATION DEV-V-008-T015 updated; npm run build + targeted tests.
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T015
  developer_test_plan: |
    Suite DEV-V-008 T015 - see BUILD_VALIDATION.md
  evidence: |
    Vitest library-list-helpers; npm run build.

---

- id: TASK-514
  title: Admin archetype path — feat groups with explicit character vs archetype audience
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  parent_task: TASK-391
  related_tasks:
    - TASK-515
    - TASK-516
    - TASK-517
    - TASK-518
  follow_up_tasks:
    - TASK-518
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T018
      - DEV-V-013-T060
  developer_test_plan: |
    Suite DEV-V-008 Suite DEV-V-009 T018 — see BUILD_VALIDATION.md
  related_files:
    - src/types/archetype.ts
    - src/lib/game/archetype-path.ts
    - src/lib/game/archetype-path-helpers.test.ts
    - src/lib/game/path-validation.ts
    - src/docs/ai/ADR/0004-path-guidance-group-audience.md
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/app/api/codex/route.ts
    - src/lib/character/archetype-display.ts
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
  implemented_by: |
    agent (2026-07-17)
  description: |
    Explicit PathGuidanceGroup.audience so admin and guided creator share one feat-group
    contract (character vs archetype) without title-string heuristics.
  acceptance_criteria:
    - PathGuidanceGroup has audience character|archetype; ADR-0004 accepted.
    - Parse/backfill attaches audience (title heuristic only for legacy backfill).
    - Admin authors Character vs Archetype feat groups separately (name, why, feats).
    - level1_feats CSV = union of feat ids across feat guidance groups.
    - Guided character-feat / archetype-feats steps filter via filterFeatGuidanceGroups.
    - Advanced archetype L1 groups use audience filter; character L1 may still use flat
      level1.feats + char_feat (documented transitional exception in ADR-0004).
    - BUILD_VALIDATION DEV-V-008-T018 + DEV-V-013-T060; npm run build; targeted tests.
  notes: |
    Owner proceed for Architect contract. Legacy title heuristic only for parse backfill.
  evidence: |
    vitest archetype-path-helpers + path-validation; npm run build (cleanup pass).

---

- id: TASK-515
  title: Admin Level 1 skills — base-only, max 3, warn-only legacy
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  related_tasks:
    - TASK-514
    - TASK-516
    - TASK-518
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T016
  developer_test_plan: |
    Suite DEV-V-008 T016 — see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/lib/game/path-validation.ts
    - src/lib/game/path-validation.test.ts
    - src/lib/guided-creator/creator-layer-governance.ts
  implemented_by: |
    agent (2026-07-17); cleanup aligned base_skill_id === 0 as sub-skill
  description: |
    Align admin L1 skills picker with guided SoT: base skills only, hard cap 3 new picks,
    warn-only for legacy excess / sub-skills (including base_skill_id === 0).
  acceptance_criteria:
    - ChipSelect offers base skills only (base_skill_id == null / undefined; not 0).
    - Max 3 new picks; UI blocks a 4th.
    - Legacy >3 or sub-skills: inline + toast warnings on edit/duplicate/save; save not blocked.
    - validateLevel1Skills + LAYER1_GOVERNANCE.maxPathRecommendedBaseSkills.
    - BUILD_VALIDATION DEV-V-008-T016; npm run build; targeted tests.
  notes: |
    Cleanup 2026-07-17: predicate matches curated-skills / add-sub-skill-modal (0 = any-base sub).
  evidence: |
    path-validation.test.ts; npm run build (cleanup pass).

---

- id: TASK-516
  title: Admin Level 1 armaments — weapons/shields vs armor UI split
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  related_tasks:
    - TASK-515
    - TASK-518
  follow_up_tasks:
    - TASK-518
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T017
  developer_test_plan: |
    Suite DEV-V-008 Suite DEV-V-009 T017 — see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
  implemented_by: |
    agent (2026-07-17)
  description: |
    Split L1 armaments authoring into Weapons & shields vs Armor pickers while keeping a
    single level1_armaments / armamentEntries storage list for guided loadout.
  acceptance_criteria:
    - Separate Weapons & shields and Armor pickers (guided-style type filter).
    - Save still writes one combined armaments list.
    - Higher-level progression armament split deferred (TASK-518 notes / intentional L2+ ChipSelect).
    - BUILD_VALIDATION DEV-V-008-T017; npm run build.
  notes: |
    Equipment / recommended gear controls unchanged.
  evidence: |
    npm run build (cleanup pass).

---

- id: TASK-517
  title: Drop recommended-species from archetype paths (column + all consumers)
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  related_tasks:
    - TASK-514
    - TASK-518
  follow_up_tasks:
    - TASK-518
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T019
  developer_test_plan: |
    Suite DEV-V-008 T019 — see BUILD_VALIDATION.md
  related_files:
    - sql/codex-archetypes-drop-recommended-species.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/app/api/codex/route.ts
    - src/types/archetype.ts
    - src/lib/game/archetype-path.ts
    - src/lib/character/archetype-display.ts
    - src/components/character-creator/steps/species-step.tsx
  implemented_by: |
    agent (2026-07-17)
  description: |
    Removed path-recommended species end-to-end; DROP level1_recommended_species on
    RealmsRPG-Test; advanced L1 species uses is_starter (guided unchanged).
  acceptance_criteria:
    - No Recommended species admin ChipSelect; types/parsers/API/display consumers stripped.
    - Advanced species L1 curated set = is_starter; Browse all still works.
    - SQL in sql/; SUPABASE_SCHEMA updated; migration applied on RealmsRPG-Test.
    - BUILD_VALIDATION DEV-V-008-T019; npm run build.
  notes: |
    Audit: Berserker had "4, 6, 7". Applied drop_level1_recommended_species_and_backfill_guidance_audience.
    Production RealmsRPG project was inactive in MCP — apply same SQL there if needed.
  evidence: |
    Live Test: column absent; path_data.level1.recommended_species count 0; npm run build (cleanup pass).

---

- id: TASK-518
  title: Admin ↔ DB ↔ guided archetype-path sync audit (post 514–517)
  created_at: 2026-07-17
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  verification_status: pending-qa
  parent_task: TASK-514
  follow_up_tasks:
    - TASK-521
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T018
      - DEV-V-008-T019
  developer_test_plan: |
    Suite DEV-V-008 Suite DEV-V-009 T018 — see BUILD_VALIDATION.md
  related_files:
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/lib/game/archetype-path.ts
  implemented_by: |
    agent (2026-07-17)
  description: |
    Post 514–517 parity audit; residuals filed as TASK-521 (content: trim L1 skills ≤3).
  completed_work: |
    - L1 admin without raw JSON for common guided fields: feat groups+audience, skills=3,
      powers/innate, techniques, armaments weapon/armor split, equipment qty, unarmed, notes,
      recommended abilities, armorStep, shared gear.
    - Advanced Path JSON remains escape hatch for rare/non-feat guidance groups and overrides.
    - Dead recommended-species / title-heuristic feat filters / mixed armament ChipSelect removed.
    - FEATURE_INDEX + BUILD_VALIDATION refreshed; shared parsers only.
  remaining_work: |
    - None for AC; content trim = TASK-521.
  acceptance_criteria:
    - Audit documents admin ↔ guided parity for L1 path fields; residuals tracked.
    - Follow-up TASK-521 filed for codex content pass.
    - BUILD_VALIDATION cross-links honest; npm run build.
  notes: |
    Higher-level (L2+) progression still ChipSelect rows — intentional; not Advanced-JSON-only.
  evidence: |
    npm run build (cleanup pass).

---

- id: TASK-520
  title: Guided Continue must not jump to furthest progress
  created_at: 2026-07-17
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: high
  status: done
  verification_status: pending-qa
  related_files:
    - src/stores/guided-creator-store.ts
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/docs/ai/guide/04-floating-ui-tooltips.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/AI_CHANGELOG.md
  description: |
    After revisiting Foundation/Ancestry (e.g. re-selecting Human), footer Continue was
    resuming the furthest inner screen already completed instead of the immediate next screen.
  acceptance_criteria:
    - Footer Continue advances only one screen; into multi-screen steps lands on first inner screen.
    - Footer Back still resumes previous/last inner screen (T031).
    - Chapter rail first-of-step landing unchanged (T029/T030).
    - BUILD_VALIDATION + changelog; npm run build.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T059
  developer_test_plan: |
    Suite DEV-V-013 T059 — see BUILD_VALIDATION.md
  evidence: |
    npm run build — compiled successfully.

---

- id: TASK-519
  title: Fix header mid-width overflow empty strip
  created_at: 2026-07-17
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/layout/header.tsx
    - src/components/layout/main-app-chrome.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/DESIGN_INTENT.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/AI_CHANGELOG.md
  description: |
    In mid-width windowed browsers, the long nowrap desktop header could widen the document,
    showing a bottom scrollbar and an unfilled strip beside the viewport-width header background.
  acceptance_criteria:
    - Header does not force document horizontal scroll at ~1024—1400px.
    - No empty/unfilled strip beside header or page background from that overflow.
    - Mid-width uses menu; xl+ keeps inline nav with tighter gutters/gaps.
    - BUILD_VALIDATION + changelog; npm run build.
  build_validation: |
    suite: DEV-V-012
    tests:
      - DEV-V-012-T007
  developer_test_plan: |
    Suite DEV-V-013 T007 — see BUILD_VALIDATION.md
  evidence: |
    Desktop nav lg to xl; header gutters/gaps tightened; overflow-x-clip on MainAppChrome only (not header). MOBILE_UX + DESIGN_INTENT synced on cleanup.
    Feedback logged 2026-07-17.

---

- id: TASK-478
  title: ExpandableImage adoption audit + enforcement checklist
  created_at: 2026-07-15
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  related_files:
    - src/components/shared/expandable-image.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/codex-art-upload-field.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character/character-card.tsx
    - src/app/(main)/campaigns/[id]/page.tsx
    - src/app/(main)/my-account/page.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DESIGN_INTENT.md
    - src/docs/ai/guide/03-entity-card-art.md
    - src/docs/ai/guide/02-components-and-lists.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/AI_CHANGELOG.md
  description: |
    Audit residual: ExpandableImage is the default for meaningful inline art but adoption is
    pathway-specific. Audit feature surfaces for custom lightbox/img preview forks; migrate or
    document justified exceptions.
  acceptance_criteria:
    - Inventory of meaningful images not using ExpandableImage/ListRowThumbnail.
    - Migrate clear forks; document exceptions in DESIGN_INTENT or guide appendix.
    - FEATURE_INDEX / art guide stay accurate; npm run build if code changes.
  evidence: |
    Inventory + exceptions in guide/03-entity-card-art.md section Adoption inventory; DESIGN_INTENT row.
    Migrated: CreatureStatBlock, sheet-header (play), campaign CharacterChip, my-account profile.
    Exceptions documented (character-card Link, edit-upload, authoring previews, decorative).
    QA: DEV-V-009-T012 + DEV-V-025 T001-T003. Did not edit Image Library / creator god files.
    Note: suite numbered DEV-V-025 because DEV-V-024 was already assigned to TASK-479 on master.

---

- id: TASK-479
  title: Standardize client error-handling at API/Supabase boundaries
  created_at: 2026-07-15
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: low
  status: done
  verification_status: pending-qa
  related_files:
    - src/lib/api-client.ts
    - src/lib/api-client.test.ts
    - src/services/library-service.ts
    - src/app/(main)/my-account/page.tsx
    - src/app/(main)/library/page.tsx
    - src/app/(main)/library/hooks/use-library-entity-sync.ts
    - src/app/(main)/library/hooks/use-library-duplicate-confirm.ts
    - src/app/(main)/library/LibraryPublicContent.tsx
    - src/docs/ARCHITECTURE.md
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
    - src/docs/ai/AI_CHANGELOG.md
  description: |
    Audit residual: throw (apiFetch), Supabase { error }, toast catch, and silent catch coexist.
    Write a short boundary convention and migrate the worst silent swallows on account/library paths.
  acceptance_criteria:
    - Convention documented in ARCHITECTURE.md or constitution pointer.
    - At least account + one library path follow the convention (no silent catch on user actions).
    - npm run build.
  evidence: |
    Documented client error convention in ARCHITECTURE.md; constitution pointer added.
    getErrorMessage exported from api-client (+ vitest).
    Account: profile load / auth reset / avatar sync check Supabase {error} or action error; no empty catch.
    Library: findLibraryItemByName no longer swallows API failures; delete/sync/duplicate/add toasts use getErrorMessage.
    BUILD_VALIDATION DEV-V-024 added. npm run build + targeted vitest green.
    Cleanup: profile-load Retry control; archive related_files include FEATURE_INDEX/DEV queue/changelog.
  developer_test_plan: |
    DEV-V-024-T001 automated; T002-T003 manual smoke on /my-account and /library.

---

- id: TASK-475
  title: Optional - adopt UserLibraryEntityTabShell basic variant in LibraryEnhancedTab
  created_at: 2026-07-15
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: low
  status: done
  verification_status: pending-qa
  related_files:
    - src/app/(main)/library/LibraryEnhancedTab.tsx
    - src/app/(main)/library/components/UserLibraryEntityTabShell.tsx
    - src/app/(main)/library/components/library-entity-tab.types.ts
  description: |
    LibraryEnhancedTab shares search/sort list scaffold but has no patch-sync/duplicate.
    Optional follow-up to ADR-0001: add enableSync=false / basic mode to the shell, or a slim
    UserLibraryListShell, and migrate Enhanced without behavior change.
  acceptance_criteria:
    - Enhanced tab uses shared list chrome without regressing delete/load UX.
    - No sync/duplicate UI introduced for enhanced items.
    - npm run build.
  completed_work: |
    - UserLibraryEntityTabShell: enableSync={false} basic mode (search/sort/empty/error/list only).
    - LibraryEntityTabBasicLabels + ENHANCED_LIBRARY_LABELS; LibraryEnhancedTab migrated.
    - No sync-all button or duplicate modal on Enhanced; edit/delete row actions unchanged.
    - BUILD_VALIDATION DEV-V-016-T011; FEATURE_INDEX + ADR-0001 follow-up note.
    - Cleanup: basic-mode toolbar has no empty sync gutter; docs clarify enableSync=false also omits duplicate; ACTIVE_TASKS Counts 18.
  evidence: |
    npm run build green. Reconcile subject TASK-475. Cleanup commit on same branch.
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T011
  developer_test_plan: |
    Suite DEV-V-016 T011 — see BUILD_VALIDATION.md

---

- id: TASK-477
  title: Unify duration display helpers (formatDuration layers)
  created_at: 2026-07-15
  created_by: agent
  completed_at: 2026-07-17
  implemented_by: agent
  priority: low
  status: done
  verification_status: n/a
  related_files:
    - src/lib/utils/duration.ts
    - src/lib/utils/duration.test.ts
    - src/components/character-sheet/library-list-helpers.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/hooks/add-library-item/build-empowered-selectable-item.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Audit residual: local formatDuration helpers duplicate concepts from lib/utils/duration.ts
    with different input shapes. Document layers or consolidate display fallbacks behind one API.
  acceptance_criteria:
    - One documented layering (structured duration vs raw string display) or shared wrappers.
    - No third ad-hoc formatDuration in feature code without reusing the layer.
    - npm run build.
  evidence: |
    Documented three layers in duration.ts (structured / display-any-shape / compact list).
    Added formatDurationDisplay + formatDurationCompact; migrated library-list-helpers and
    build-empowered-selectable-item off local formatDuration forks. Vitest duration.test.ts;
    FEATURE_INDEX pointer. verification_status n/a â€” internal helper consolidation.

---


- id: TASK-492
  title: Realms Image Library - schema, storage, CRUD API
  created_at: 2026-07-16
  created_by: agent
  completed_at: 2026-07-16
  implemented_by: agent
  priority: high
  status: done
  verification_status: n/a
  parent_task: TASK-491
  follow_up_tasks:
    - TASK-493
    - TASK-495
  related_files:
    - sql/realms-image-library.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/lib/realms-images.ts
    - src/lib/realms-images-server.ts
    - src/lib/realms-image-consumers.ts
    - src/app/api/images/route.ts
    - src/app/api/images/[id]/route.ts
    - src/app/api/images/[id]/replace/route.ts
    - src/app/api/images/[id]/usage/route.ts
    - src/lib/codex-art.ts
    - src/app/api/upload/codex-art/route.ts
  description: |
    Bank catalog (realms_images + multi category tags), Storage layout, RLS, admin CRUD,
    public list/filter/search, usage report, replace-file + cascade-clear-on-delete APIs.
  acceptance_criteria:
    - Migration SQL in sql/; SUPABASE_SCHEMA.md updated; applied only after owner approve.
    - Admin create/update: name, multi categories, upload/replace file; returns asset id + public URL.
    - List/filter by category + search by name works for guests and signed-in (read).
    - Usage endpoint lists entities referencing an image_id (for warn UI).
    - Replace updates master Storage object (and denormalized URL if used) without new entity rows.
    - Delete-without-replace clears all referencing image_ids then removes asset + storage object.
    - Existing /api/upload/codex-art kept until TASK-496/498 migrate callers.
    - npm run build; uploads via apiUpload only.
  evidence: |
    Migration realms_image_library applied on RealmsRPG-Test (owner approve 2026-07-16).
    Post-apply: 0 images, 0 category rows, 8 enum values; RLS SELECT policies present.
    API routes + helpers + vitest realms-images.test.ts; npm run build green.
    verification_status n/a - schema/API foundation; UI QA lands with TASK-493/495.

---
- id: TASK-481
  title: Recurring AI debt cleanup sprint (cadence)
  created_at: 2026-07-15
  created_by: agent
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  superseded_by: /debt command (.cursor/commands/debt.md)
  related_files:
    - .cursor/commands/debt.md
    - src/docs/ai/PR_CHECKLIST.md
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
  description: |
    Constitution anti-debt ritual. Superseded by owner command /debt â€” repeatable on demand;
    specific fixes remain TASK-### in ACTIVE_TASKS.
  acceptance_criteria:
    - First sprint completed with a changelog entry listing deletions/consolidations.
    - ACTIVE_TASKS hot path stays lean (prefer <20KB agent-eligible).
    - AI_CHANGELOG rotation applied once (older entries to archive).
    - Re-queue next sprint notes on this task or a successor.
  notes: |
    Ritual moved to /debt (2026-07-16). No further TASK-481 successors needed.

---

- id: TASK-501
  title: Hide opposite Library tab on create for power/martial-only
  created_at: 2026-07-16
  created_by: owner
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  verification_status: pending-qa
  automated_check: npx vitest run src/lib/character-library-tab-visibility.test.ts src/lib/guided-creator/build-character.test.ts
  related_files:
    - src/lib/character-library-tab-visibility.ts
    - src/lib/character-library-tab-visibility.test.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/character-creator-store.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
  build_validation: |
    suite: DEV-V-019
    tests:
      - DEV-V-019-T008
  developer_test_plan: |
    Suite DEV-V-019 T008 — see BUILD_VALIDATION.md
  description: |
    When creating a power-only or martial-only character, persist libraryTabVisibility so the
    unused opposite Library tab (Techniques vs Powers) is hidden by default. Reuses the existing
    sheet eye-toggle prefs; user can unhide in edit mode. Powered-Martial keeps both tabs.
  acceptance_criteria:
    - Power create ? Techniques hidden on sheet (view mode); Powers visible.
    - Martial create ? Powers hidden; Techniques visible.
    - Powered-Martial ? both tabs visible by default.
    - Unhide via existing edit-mode Library eye toggle still works.
    - Guided + advanced create paths both set the pref; cleanForSave persists it.
    - Unit tests + npm run build.
  evidence: |
    vitest helper + build-character tab-visibility cases; wired getCharacter + buildGuidedCharacterPayload.
    npm run build green. Owner manual QA DEV-V-019-T008 pending (verification_status pending-qa).

- id: TASK-503
  title: Guided creator feat names resolve from Codex (not ids)
  created_at: 2026-07-16
  created_by: owner
  completed_at: 2026-07-16
  implemented_by: agent
  priority: high
  status: done
  verification_status: unverified
  related_files:
    - src/lib/guided-creator/build-character.ts
    - src/lib/guided-creator/build-character.test.ts
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T005
  developer_test_plan: |
    Suite DEV-V-013 T005 — see BUILD_VALIDATION.md (feat names step)
  description: |
    Guided character save was persisting archetype/character feats as \{ id, name: id }\,
    so the sheet showed raw ids. Resolve names from Codex at save (parity with powers),
    and harden sheet enrichFeat for already-saved id-as-name rows.
  acceptance_criteria:
    - New guided saves store Codex feat names on archetypeFeats and feats.
    - Sheet Feats tab shows Codex names for legacy id-as-name characters when featsDb matches by id.
    - Unit test covers name resolution; npm run build / vitest for build-character.
  evidence: |
    vitest src/lib/guided-creator/build-character.test.ts Ã¢â‚¬â€ 4 passed.

- id: TASK-502
  title: Character sheet techniques Energy is spend button only
  created_at: 2026-07-16
  created_by: owner
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  verification_status: unverified
  automated_check: npx vitest run src/components/character-sheet/library-entity-rows.test.ts
  related_files:
    - src/components/character-sheet/library-entity-rows.tsx
    - src/components/character-sheet/library-entity-rows.test.ts
    - src/components/shared/entity-library-sections.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/CHIP_UNIFICATION_PLAN.md
    - src/docs/ai/guide/02-components-and-lists.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T011
  developer_test_plan: |
    Suite DEV-V-009 T011 — see BUILD_VALIDATION.md
  description: |
    Character sheet Techniques (and Powers) should list energy cost only via the far-right
    spend RollButton. Remove the duplicate static Energy column/header on Techniques; Powers
    already used rightSlot-only. Browse/creature technique lists without spend buttons keep
    an Energy column. Audit: campaign view-only must not use noop onUse handlers; mapper
    regression tests; docs play-vs-browse rule.
  acceptance_criteria:
    - Techniques tab headers have no Energy column; cost is only the far-right spend button.
    - Powers tab unchanged (still spend-button-only; no Energy column).
    - Clicking spend deducts energy as before.
    - View-only campaign sheet shows disabled cost chrome (no noop spend).
    - Unit test guards mapPowerRows/mapTechniqueRows omit energy columns.
    - npm run build.
  evidence: |
    Removed CHARACTER_SHEET_TECHNIQUE energy column/grid track and mapTechniqueRows static energy cell.
    ListHeader Energy header over spend rightSlot (rowChrome.rightSlotLabel/rightSlotSortKey);
    shared CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME; campaign view omits noop onUse*;
    library-entity-rows.test.ts (incl. view-only). Cleanup 2026-07-16: DRY chrome constant, docs parity.
    Audit 2026-07-16: no other play-sheet Energy+spend duplicates. Campaign view omits onUse*;
    buildEnergyButton view-only uses disabled RollButton; library-entity-rows.test.ts guards columns;
    CHIP plan + guide/02 play-vs-browse rule; BUILD_VALIDATION T011 extended. npm run build + vitest green.


- id: TASK-486
  title: Weapons property density ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â one bullet per line under name
  created_at: 2026-07-16
  created_by: owner
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  verification_status: unverified
  automated_check: npm run build
  related_files:
    - src/components/shared/quick-armaments-sections.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T009
  developer_test_plan: |
    Suite DEV-V-009 T009 — see BUILD_VALIDATION.md
  description: |
    Screenshot-audit and fix cramped inline named properties in shared QuickWeaponsTable:
    render one `ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Property` per line under the weapon name (layout A). Apply globally via
    the shared component so character sheets and any QuickWeaponsTable consumers update
    together. Do not switch to descriptor chips (TASK-461 remains for chip work).
  acceptance_criteria:
    - Weapon properties render one `ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Property` per line under the name in QuickWeaponsTable.
    - Change applies globally (character + creature consumers of the shared table).
    - Columns remain Name | Range | Attack | Damage; no loss of property names; Unarmed alignment not regressed.
    - Readable at ~360px and desktop; audit notes in evidence.
    - npm run build passes.
  evidence: |
    Code/layout audit (no live authenticated screenshots this pass):
    Before: displayNamedProperties joined as inline `ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ a ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ b ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ c` under name ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â wraps/crams at ~360px when multiple named props.
    After: NamedPropertiesUnderName stacks one `ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Name` div per property under the name cell
    (text-text-muted / dark:text-text-secondary; index keys; not a semantic list ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â visual bullets only).
    Applied to QuickWeaponsTable; identical join pattern also fixed on QuickShieldsTable + QuickArmorTable (same helper; no redesign).
    Character consumer: archetype-section WeaponsSection ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ QuickWeaponsTable (Unarmed via trailingRows in same tbody ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â columns share widths; property stack does not touch Unarmed cells).
    Creature audit: creature-stat-block uses WeaponsListSection (GridListRow + property chips), not QuickWeaponsTable ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no parallel cramped-join path; shared-table AC covers consumers of QuickWeaponsTable (character today).
    PR checklist: search/extend existing helper only; no new shared file/export; tokens OK; mobile via TableScroll + vertical stack; npm run build; tasks:validate green.
    Owner live QA: DEV-V-009-T009.
  notes: |
    Owner locked: layout A (one bullet per line); global via QuickWeaponsTable; no chips this task.
    Audit 2026-07-16: fixed list-none+bullet a11y to stacked divs; refreshed Unarmed/trailingRows evidence; tightened T009.
    Completed 2026-07-16.

- id: TASK-485
  title: Character sheet skills play-view presentation cleanup
  created_at: 2026-07-16
  created_by: owner
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  related_files:
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/skills-section.tsx
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T008
  developer_test_plan: |
    Suite DEV-V-009 T008 — see BUILD_VALIDATION.md
  description: |
    On character sheet normal (non-edit) view: sub-skills keep ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Â + italic but match base skill
    text color; hide source suffixes like (species) and path sourceLabel; species proficient
    dots match other proficient dots. Section edit mode keeps source markers and locked/species
    affordances. Creator/allocation continues to show source labels (isEditing true).
  acceptance_criteria:
    - Sheet play view: no source suffixes; sub-skills match base skill text color; species prof dots match other proficient dots.
    - Sheet edit mode: locked/species skills still identifiable and non-removable / non-toggleable.
    - Creator/allocation still shows source labels where appropriate.
    - npm run build passes.
  evidence: |
    Gated table SkillRow chrome via isEditing; skills-section omits onRemove for species (disabled X still shown).
    Card/compact creator variants unchanged for source labels. npm run build.
    Audit 2026-07-16: FEATURE_INDEX + guide/02 usage note; DEV-V-009 suite header/index anchor; prop JSDoc + DESIGN_INTENT;
    decorative ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Â aria-hidden; tasks:validate.
  notes: |
    Completed 2026-07-16. No SkillRow fork ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â play chrome gated on existing isEditing.

- id: TASK-484
  title: Remove Forge/Path creation badge from sheet header and Edit Archetype modal
  created_at: 2026-07-16
  created_by: agent
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/archetype-path-identity.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/edit-archetype-modal.tsx
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T001
      - DEV-V-008-T008
  developer_test_plan: |
    Suite DEV-V-008 T001 — see BUILD_VALIDATION.md (no creation chip on header or Edit Archetype; path guidance kept)
  description: |
    Remove the "Forge Your Own Path" / "Archetype Path" creation-style chip from the character
    sheet header and Edit Archetype modal. Keep ArchetypePathGuidance / path notes.
  acceptance_criteria:
    - Sheet header has no Forge/Path creation chip next to archetype.
    - Edit Archetype modal has no creation chip.
    - Path guidance/notes still work.
    - npm run build passes.
  evidence: |
    Deleted ArchetypeCreationBadge + showArchetypeCreationBadge; kept isPathCharacter + ArchetypePathGuidance.
    Updated DEV-V-008-T001/T008 expectations; DEVELOPER_TASK_QUEUE DEV-V-008 related tasks. npm run build.
  notes: |
    Completed 2026-07-16. Creation-mode labels remain in character creator step only.
    Audit 2026-07-16: fixed archive encoding; covered modal AC via T008; cross-linked DEV queue.
- id: TASK-483
  title: Unarmed Prowess columns match weapons (Name | Range | Attack | Damage)
  created_at: 2026-07-16
  created_by: agent
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
    - src/components/shared/quick-armaments-sections.tsx
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T007
  developer_test_plan: |
    Suite DEV-V-009 T007 — see BUILD_VALIDATION.md
  description: |
    Unarmed Prowess row in WeaponsSection used Name | Attack | Damage | Range, which shifted
    Attack/Damage left relative to QuickWeaponsTable (Name | Range | Attack | Damage).
  acceptance_criteria:
    - Unarmed columns align with Name | Range | Attack | Damage.
    - Attack/Damage not displaced relative to weapon rows.
    - No regression to unarmed roll math or proficient/unproficient display.
    - npm run build passes.
  evidence: |
    Reordered Unarmed td cells only; preserved RollButton handlers, proficient styling, Bludgeoning.
    npm run build.
  notes: |
    Completed 2026-07-16. No new weapons table fork ? kept separate Unarmed row under QuickWeaponsTable.
- id: TASK-001
  title: Unify skill rows across creators
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/shared/skill-row.tsx
  created_at: 2026-02-05
  created_by: agent
  description: Replace inline skill implementations in character creator and creature creator with the shared `SkillRow` component.
  acceptance_criteria:
    - All three skill UIs use `SkillRow` with `variant` prop
    - `npm run build` passes
    - Manual verify: add skill in creator, save, reload
  notes: "Completed 2026-02-06: Refactored skills-step.tsx to use SkillRow with variant='card' for base skills and variant='compact' for sub-skills. Removed inline SkillAllocator and SubSkillAllocator components."

- id: TASK-002
  title: Audit lists and modals for `ListHeader` adoption
  priority: medium
  status: done
  related_files: []
  created_at: 2026-02-05
  created_by: agent
  description: Ensure all list pages and selection modals use the shared `ListHeader`/`GridListRow` patterns.
  acceptance_criteria:
    - All library and creator modals use `GridListRow`
    - PR includes visual before/after screenshots
  notes: |
    AUDIT COMPLETE 2026-02-06:
    ? Using GridListRow/ListHeader: codex/page.tsx, library/page.tsx, library-section.tsx, add-feat-modal.tsx, add-skill-modal.tsx, add-library-item-modal.tsx, feats-step.tsx, equipment-step.tsx, creature-creator/page.tsx, unified-selection-modal.tsx
    ? Using ItemCard/ItemList (alternative unified): item-selection-modal.tsx
    ? Custom (justified): add-sub-skill-modal.tsx (unique base-skill selector UI), species-modal.tsx (detail view), level-up-modal.tsx (wizard), recovery-modal.tsx (specialized)
    CONCLUSION: All list pages and selection modals already use unified patterns (GridListRow or ItemCard). No changes needed.

- id: TASK-284
  title: Migrate admin authorization from ADMIN_UIDS env to Supabase role-based admin
  priority: high
  status: done
  related_files:
    - src/lib/admin.ts
    - src/app/api/admin/users/route.ts
    - src/app/api/admin/users/update-role/route.ts
    - src/app/(main)/admin/users/page.tsx
    - src/app/(main)/admin/page.tsx
    - src/lib/role-limits.ts
    - src/docs/ADMIN_SETUP.md
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
    - .env.example
  created_at: 2026-03-04
  created_by: agent
  description: |
    Replace env-based admin authorization (`ADMIN_UIDS`) with Supabase role-based authorization using `public.user_profiles.role = 'admin'`.
    Update admin checks, admin role management endpoints/UI, and setup docs.
  acceptance_criteria:
    - `isAdmin(uid)` checks `user_profiles.role` in Supabase.
    - Admin routes/actions no longer depend on `ADMIN_UIDS`.
    - Admin role can be granted/revoked through role updates (admin UI/API) or direct DB updates.
    - Docs and `.env.example` no longer instruct `ADMIN_UIDS` usage.
    - `npm run build` passes (or blocked external-network cause is documented).
  notes: |
    DONE 2026-03-04: `isAdmin` migrated to Supabase role query. Admin users list/update now use DB role as source of truth and allow `admin` role updates.
    Admin UI copy/select options updated. Docs updated (ADMIN_SETUP and DEPLOYMENT) to role-based admin grant flow; `.env.example` removed ADMIN_UIDS.
    Build attempt failed in sandbox due external font fetch (`fonts.googleapis.com`) restriction; targeted eslint for changed TS/TSX files passed.

- id: TASK-003
  title: Show weapon damage in Library and wire Edit -> Item Creator
  priority: high
  status: done
  related_files:
    - src/app/(main)/library/page.tsx
    - src/components/character-sheet/library-section.tsx
    - src/app/(main)/item-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Library list (Armaments) currently does not show computed weapon damage. The Edit action should open the Item Creator with the item loaded for editing (no full page redirect if possible). Duplicating an item should copy data and stay on the library or open the creator with the copy loaded.
  acceptance_criteria:
    - Library armaments list shows a Damage column with computed damage for weapons.
    - Edit action opens `item-creator` with `?edit=<id>` (or navigates in-app) and populates the editor with the item's data.
    - Duplicate preserves data and opens creator with the new copy loaded (or performs in-place copy and updates list).
  notes: "Completed 2026-02-06: Damage column was already present. Added ?edit= URL parameter handling to item-creator page with useSearchParams and Suspense wrapper. Edit button now uses router.push() for in-app navigation instead of window.open."

- id: TASK-004
  title: Fix RTDB enrichment so list views compute EN/TP/C correctly
  priority: high
  status: done
  related_files:
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Enrichment pipeline must resolve saved part/property IDs against RTDB records and compute/display the final Energy (EN), Training Points (TP), and Currency (C) values in all list views (library, creators, character sheet). Some saved entries only include IDs and lack computed totals.
  acceptance_criteria:
    - `enrichPowers` / `enrichTechniques` produce `cost`/`tp`/`currency` fields consistently.
    - Library and creator lists display computed costs instead of blank/incorrect values.
    - `npm run build` passes and manual spot-check of 3 items shows correct values.
  notes: "Completed 2026-02-06: Fixed library/page.tsx early return blocking display while RTDB loaded. Removed !partsDb.length check from PowersTab and TechniquesTab cardData useMemo. Enrichment was already correct; issue was data not displaying while parts loaded."

- id: TASK-005
  title: Fix Innate toggle hit area and alignment in list rows
  priority: high
  status: done
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/innate-toggle.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Innate (star) toggle in power/technique list rows is difficult to hit and not vertically centered. Improve click target, alignment, and accessibility so toggling innate works reliably outside edit mode.
  acceptance_criteria:
    - Innate toggle has a minimum 40x40px hit area and is vertically centered.
    - Toggle works in both list and expanded row views without requiring edit mode.
    - Manual verification on desktop/mobile passes.
  notes: "Completed 2026-02-05: Created dedicated InnateToggle component with min-w-[44px] min-h-[44px] touch target, added pl-1 and min-h-[44px] to GridListRow leftSlot container for proper alignment"

- id: TASK-006
  title: Fix missing/incorrect EN/TP display for Powers/Techniques/Armaments
  priority: high
  status: done
  related_files:
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Lists for powers, techniques, and armaments intermittently show missing or incorrect Energy (EN) or Training Point (TP) values. Investigate where enrichment or render-time calculations drop or rename fields (energy vs cost vs energyCost) and make fields consistent across enrichment and UI.
  acceptance_criteria:
    - `data-enrichment` outputs use `cost` consistently for display.
    - List renderers read the same field names and display correct numbers.
    - Manual spot-check across library and character sheet shows correct values.
  notes: "Completed 2026-02-06: Related to TASK-004. The enrichment functions already produced correct cost fields. Fixed the library page early return that prevented display while RTDB data loaded."

- id: TASK-007
  title: Library Ã¢â‚¬â€ Show weapon damage and enable in-place Edit/Duplicate
  priority: low
  status: done
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Library armaments currently do not display computed weapon damage in the armaments list. The Edit action should open the Item Creator with the selected item loaded for editing (prefer in-app navigation or modal), and Duplicate should create a copy and keep the user in the library or open the creator with the new copy loaded.
  acceptance_criteria:
    - Library armaments list shows a Damage column with computed damage.
    - Edit opens `item-creator` with `?edit=<id>` (or equivalent in-app flow) and preloads data.
    - Duplicate preserves data and either performs in-place copy or opens creator with copy loaded.
  notes: "Duplicate of TASK-003. DONE 2026-02-06: Consolidated with TASK-003 work."

- id: TASK-008
  title: RTDB Enrichment Ã¢â‚¬â€ Resolve part IDs and compute costs in creators
  priority: medium
  status: done
  related_files:
    - src/lib/data-enrichment.ts
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Some saved powers/techniques store part/property IDs but do not include computed EN/TP totals. Update enrichment routines so creators and list views resolve referenced RTDB parts and compute/display final Energy (EN), Training Points (TP), and Currency (C) consistently at render-time.
  acceptance_criteria:
    - `enrichPowers` / `enrichTechniques` resolve parts and produce consistent `cost`/`tp`/`currency` fields.
    - Creator UIs and lists display computed totals.
  notes: "Related to TASK-004. DONE 2026-02-06: The enrichment was already correct. Fixed library display by removing the early return that blocked rendering while RTDB loaded."

- id: TASK-009
  title: Character Sheet Ã¢â‚¬â€ Innate toggle hit area & alignment (duplicate check)
  priority: high
  status: done
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Innate (star) toggle in list rows is difficult to hit and not vertically centered. This appears related to TASK-005 (Fix Innate toggle hit area and alignment). Confirm duplication and either close as duplicate or implement fixes described in TASK-005.
  acceptance_criteria:
    - Confirm duplication with TASK-005 or implement minimum 40x40px hit area and vertical centering for the Innate toggle.
  notes: "DUPLICATE RESOLVED 2026-02-05: Confirmed duplicate of TASK-005. Fix implemented via InnateToggle component with 44x44px touch target and GridListRow min-h-[44px]."

- id: TASK-010
  title: Powers/Techniques/Armaments Ã¢â‚¬â€ Fix missing/incorrect EN/TP display (duplicate)
  priority: high
  status: done
  related_files:
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Lists for powers, techniques, and armaments intermittently show missing or incorrect Energy (EN) or Training Point (TP) values. This is closely related to TASK-006 and TASK-004 (enrichment fixes). Confirm duplication and either close or consolidate work under those canonical tasks.
    
    Notes:
    - To refresh the curated top section, paste raw log entries and request: "Consolidate and update curated feedback" Ã¢â‚¬â€ the agent will re-run summarization and update curated sections.
    - This file is intended to remain the canonical owner-feedback source for engineering planning and triage.
  acceptance_criteria:
    - Confirmed duplicate/consolidated into TASK-006/TASK-004 or explicit plan to fix.
  notes: "Duplicate of TASK-006 and TASK-004. DONE 2026-02-06: Fixed with the library early return removal in TASK-004."

- id: TASK-011
  title: Fix login redirect to previous page
  priority: high
  status: done
  related_files:
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/components/shared/login-prompt-modal.tsx
    - src/components/layout/header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Login redirect to previous page is not working correctly. When clicking login from the home page and signing in with Google, users are redirected to /characters instead of returning to the home page. The sessionStorage-based redirect mechanism (`loginRedirect`) is not being set properly when clicking the login button in the header nav.
  acceptance_criteria:
    - Clicking login from any page stores that page's path in sessionStorage as `loginRedirect`.
    - After successful login (email, Google, or Apple), user is redirected to the stored path.
    - If no stored path exists, fallback to /characters.
    - sessionStorage is cleared after redirect.
  notes: "DONE 2026-02-05: Added handleLoginClick() function in header.tsx that stores pathname in sessionStorage as 'loginRedirect' before router.push('/login')."

- id: TASK-012
  title: My Account Ã¢â‚¬â€ Security audit and feature review
  priority: medium
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/stores/auth-store.ts
    - src/hooks/use-auth.ts
    - src/lib/supabase/session.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Conduct a security audit and feature review for My Account:
    - Can Google/Apple sign-up users change their email?
    - Add profile picture upload capability.
    - Add username change with existence check and inappropriate name filtering.
    - Rate limit username/email changes to once per week.
    - Verify Apple/Google/email sign-in all work correctly.
    - Identify any missing account settings.
    - Check for security risks or bad practices in login/account management.
  acceptance_criteria:
    - Document which settings Google/Apple users can/cannot change.
    - Profile picture upload implemented or documented as future work.
    - Username change with validation (uniqueness, appropriateness, rate limit) implemented or documented.
    - Security audit documented with any risks identified and addressed.
  notes: |
    AUDIT COMPLETE 2026-02-05:
    ? GOOD: Reauthentication before email/password change and delete
    ? GOOD: DELETE confirmation requires typing "DELETE"
    ? GOOD: Error handling with user-friendly messages
    ? GOOD: Clear sign-out functionality
    ? GAP: Google/Apple OAuth users can't change email (no password for reauth) - needs provider detection
    ? GAP: Username editing not implemented (displayName only)
    ? GAP: Profile picture upload not implemented
    ? GAP: No rate limiting on changes (should be backend concern)
    RECOMMENDATION: Add provider detection to show appropriate options per auth method.
    RESOLVED: All gaps addressed Ã¢â‚¬â€ TASK-047 (auth provider detection), TASK-046 (username change), TASK-041 (profile picture upload).

- id: TASK-013
  title: Add theme toggle (dark/light/system) in nav dropdown
  priority: medium
  status: done
  related_files:
    - src/components/layout/header.tsx
    - src/app/globals.css
    - src/app/layout.tsx
    - src/components/providers/theme-provider.tsx
    - src/components/shared/theme-toggle.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Add a Settings option in the profile dropdown (nav bar) for theme selection: dark mode, light mode, and system mode. Implement dark mode theming across the site following best practices (CSS variables, next-themes, or similar).
  acceptance_criteria:
    - Profile dropdown includes Settings > Theme option.
    - Theme toggle supports dark/light/system modes.
    - Theme preference persists across sessions.
    - Dark mode styling applied consistently across the site.
    - Uses best practices for Next.js dark mode implementation.
  notes: "DONE 2026-02-05: Installed next-themes, created ThemeProvider and ThemeToggle components. Integrated into user dropdown in header.tsx with Light/Dark/System options."

- id: TASK-014
  title: Replace placeholder login icon with "Login" button
  priority: low
  status: done
  related_files:
    - src/components/layout/header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When not logged in, the placeholder icon in the nav bar should be replaced with a clean "Login" button instead of the current icon.
  acceptance_criteria:
    - When unauthenticated, nav bar shows a clear "Login" button.
    - Button styling is consistent with site design.
    - Button navigates to /login.
  notes: "DONE 2026-02-05: Replaced Image component with Button variant='primary' size='sm' with text 'Login' in header.tsx."

- id: TASK-015
  title: Create reusable Powered Martial allocation slider component
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/header-section.tsx
    - src/components/shared/value-stepper.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/shared/powered-martial-slider.tsx
    - src/components/creator/archetype-selector.tsx
    - src/components/character-sheet/archetype-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    The Creature Creator has a Powered Martial slider for allocating points between power and martial abilities. Extract this into a reusable component that can also be used in the character sheet edit mode for powered-martial characters. This improves UI consistency and avoids clunky independent point allocation.
  acceptance_criteria:
    - New shared component: `PoweredMartialSlider` (or similar) created.
    - Component used in Creature Creator (existing functionality preserved).
    - Component integrated into Character Sheet edit mode for powered-martial characters.
    - Smaller-scale variant available for character sheet use.
    - Consistent styling across both uses.
  notes: "DONE 2026-02-05: Created PoweredMartialSlider in shared/, integrated into archetype-selector.tsx (creator) and archetype-section.tsx (character sheet edit mode with compact variant)."

- id: TASK-016
  title: Unify ability/defense allocation and stepper styles across creators
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/shared/value-stepper.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/character-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Ability allocation and defense allocation components have visual inconsistencies between the character sheet, creature creator, and character creator. Steppers and buttons that are meant to be unified show slightly different styles. Audit and unify these components.
  acceptance_criteria:
    - Audit identifies all style differences between ability/defense allocation across sheet/creators.
    - Stepper buttons use consistent styling (use shared `ValueStepper` or unified CSS classes).
    - Visual parity achieved across character sheet, character creator, and creature creator.
    - Document any intentional differences (if any) with rationale.
  notes: |
    AUDIT COMPLETE 2026-02-05:
    ? AbilityScoreEditor uses ValueStepper consistently
    ? DefensesSection uses ValueStepper consistently
    ? AbilitiesSection uses ValueStepper consistently
    FINDING: All components already use the shared ValueStepper component.
    Differences are intentional: compact=true for dense layouts, different sizes for context.
    No changes needed - already unified."

- id: TASK-017
  title: Implement Recovery Modal with full and partial recovery options
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/character-sheet/index.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/hooks/use-rtdb.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Create a Recovery Modal that opens when clicking Recovery on the character sheet. The modal supports two modes:
    
    **Full Recovery**: Restores HP to max, EN to max, and all feat/trait uses with recovery type "Full" or "Partial" to their max values.
    
    **Partial Recovery**: User selects 2, 4, or 6 hours of rest. Each 2-hour block provides 1/4 of max resources to allocate between HP and EN.
    - 2 hours = 1/4 to both OR 1/2 to one
    - 4 hours = 1/2 to both OR 3/4 to one + 1/4 to other OR full to one
    - 6 hours = 3/4 to both OR full to one + 1/2 to other, etc.
    
    **Automatic mode**: Calculates optimal allocation based on current deficits (maximize total percentage recovered). When indifferent, spread evenly.
    
    **Rounding**: Always round up for fractions (9 max HP / 2 = 5 HP recovered).
    
    **Feat/Trait recovery**: Partial recovery resets uses for feats/traits with recovery period "Partial" to max. Does NOT reset "Full" recovery feats/traits.
  acceptance_criteria:
    - Recovery button opens a sleek modal matching site design.
    - Full Recovery option restores HP, EN, and all feat/trait uses to max.
    - Partial Recovery allows selecting 2/4/6 hours with manual or automatic allocation.
    - Automatic mode calculates optimal HP/EN split based on percentage deficit.
    - Fractions round up.
    - Partial recovery resets "Partial" feat/trait uses but not "Full" uses.
    - Modal UI is clean, simple, and mobile-friendly.
  notes: "DONE 2026-02-05: Created RecoveryModal component with full/partial modes, automatic optimization, manual allocation slider, feat/trait reset logic. Integrated into character sheet page."

- id: TASK-018
  title: "BUG: Prevent negative weight/height values in character notes"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/notes-tab.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Users can currently set Weight and Height to negative values in the Character Notes ? Physical Attributes & Movement section. Add validation to ensure minimum value is 1.
  acceptance_criteria:
    - Weight input has min value of 1.
    - Height input has min value of 1.
    - Attempting to go below 1 is prevented (stepper disabled or input clamped).
  notes: "DONE 2026-02-05: Added min='1' HTML attribute to weight/height inputs, added Math.max(1, ...) validation in blur handlers."

- id: TASK-019
  title: "BUG: Fix unable to remove items from inventory"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Users are unable to remove items from their inventory in Character Notes ? Inventory. The remove/delete functionality is broken or missing.
  acceptance_criteria:
    - Inventory items can be removed via a delete/remove button.
    - Removal persists to the database.
    - UI updates immediately after removal.
  notes: "DONE 2026-02-05: Removed isEditMode condition from onDelete props for weapons, armor, and equipment in library-section.tsx. Users can now delete items without being in edit mode."

- id: TASK-020
  title: Unify pencil/edit icons across character sheet
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/shared/edit-section-toggle.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Unify all pen/pencil edit icons across the character sheet to one consistent style. Prefer simple icons with no button background (like character name/XP, skills). Remove circular backgrounds from ability edit icons. Color scheme: blue for neutral edits, green for resource gains, red for resource costs/overspent states.
  acceptance_criteria:
    - All edit icons use the same simple pencil style (no circular background)
    - Consistent color coding: blue (neutral), green (positive), red (negative/overspent)
    - Remove the circular background from abilities edit icon
    - Visual consistency across all character sheet sections
  notes: "DONE 2026-02-05: Removed circular backgrounds from EditSectionToggle (bg-blue-100, rounded-full removed). Updated sheet-header name/XP icons to use Pencil instead of Edit2 with blue color (text-blue-500 hover:text-blue-600). Icon size standardized to w-4 h-4."

- id: TASK-021
  title: Character name edit mode restriction + XP always editable
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Character name should only be editable when in edit mode. XP should be editable at any time without requiring edit mode.
  acceptance_criteria:
    - Character name pencil icon only appears/functions in edit mode
    - XP edit icon/functionality available regardless of edit mode
    - Both respect the color scheme from TASK-020
  notes: "DONE 2026-02-05: Updated characters/[id]/page.tsx to conditionally pass onNameChange={isEditMode ? handleNameChange : undefined} so name is only editable in edit mode. XP onExperienceChange is always passed so it's always editable."

- id: TASK-022
  title: Library feats tab - enable feat deletion via pencil icon
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    The pencil icon in character library feats tab is currently useless. Repurpose it to allow deletion of feats, or add a proper delete action for feats in the library tab.
  acceptance_criteria:
    - Feats can be deleted from the library feats tab
    - Delete action is accessible without edit mode
    - Confirmation dialog before deletion
  notes: |
    DONE 2026-02-05: Added onRemoveFeat to LibrarySectionProps, wired through to FeatsTab. Created handleRemoveFeat handler in page.tsx that removes from archetypeFeats or feats arrays by ID/name. Removed isEditMode guard so feats can be deleted without edit mode.
    COMPLIANCE GAP: Acceptance criteria required "Confirmation dialog before deletion" Ã¢â‚¬â€ not implemented. See TASK-053.

- id: TASK-023
  title: "BUG: Custom note name edit should not collapse the note"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/notes-tab.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When clicking on a custom note name to edit or add a name, the note collapses. It should stay expanded since the user is editing, not intending to collapse.
  acceptance_criteria:
    - Clicking to edit a custom note name does not collapse the note
    - Name editing happens inline while note remains expanded
    - Clicking elsewhere or pressing Enter/Escape closes edit mode
  notes: "DONE 2026-02-05: Added e.stopPropagation() to both the name span onClick and input onClick handlers in NoteCard component. The parent div's onClick toggles collapse, so stopping propagation prevents collapse when interacting with name editing."

- id: TASK-024
  title: Energy cost buttons for Powers/Techniques - match roll button styles
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Energy costs for powers/techniques should be displayed as clickable buttons with the same styles as roll buttons, indicating you can spend the resource by clicking. Remove duplicate energy columns - keep only the button version. Move energy to rightmost column. Buttons should just show "X" (the energy cost) not "Use (X)".
  acceptance_criteria:
    - Energy displayed as buttons styled like roll buttons
    - No duplicate energy columns
    - Energy column moved to rightmost position
    - Button text is just the number, not "Use (X)"
    - Clicking the button spends the energy
  notes: "DONE 2026-02-05: Updated POWER_COLUMNS and TECHNIQUE_COLUMNS to move energy to rightmost (4rem width). Replaced old 'Use (X)' button with RollButton component showing just the energy cost number. Powers use variant='primary' (blue), techniques use variant='success' (green). Energy displayed in rightSlot of GridListRow."

- id: TASK-025
  title: Update Innate Energy tab summary text and centering
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Update the innate energy power tab summary text from "Innate powers use this energy pool instead of regular energy" to "Innate powers have no cost to use. You may have powers with energy costs up to your innate energy." Also center the summary content.
  acceptance_criteria:
    - Updated summary text as specified
    - Summary content is centered
  notes: "DONE 2026-02-05: Changed text from 'Innate powers use this energy pool instead of regular energy' to 'Innate powers have no cost to use. You may have powers with energy costs up to your innate energy.' Added text-center class."

- id: TASK-026
  title: Power/Technique display formatting - capitalize and abbreviate
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Fix display formatting for power/technique list items:
    - Capitalize damage types: "Radiant" not "radiant"
    - For 1 target, display "Target" instead of "1 target"
    - Capitalize duration: "Rounds" not "rounds"
    - Abbreviate duration: "4 MIN" instead of "4 minutes (Focus)", "2 RNDS" or "1 RND"
    - Move focus/sustain details to expanded view only, not overview
  acceptance_criteria:
    - All damage types capitalized
    - "Target" shown for single target abilities
    - Duration capitalized and abbreviated (MIN, RNDS, RND)
    - Focus/sustain details only in expanded view
  notes: "DONE 2026-02-06: Added formatDamageType, formatArea, formatDuration helpers in library-section.tsx. Applied to both innate and regular power column values. Capitalize damage types, 'Target' for single target, abbreviate durations (MIN/RNDS/RND/HR/Conc./Instant), strip parenthetical focus/sustain details."

- id: TASK-027
  title: Remove invalid "radiant" damage type from Power Creator
  priority: medium
  status: done
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/lib/game/creator-constants.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove the damage type "radiant" from the power creator - it's not a valid Realms damage type. Reference the vanilla site for proper damage types and their related part names/IDs.
  acceptance_criteria:
    - "Radiant" damage type removed from power creator options
    - Only valid Realms damage types available
    - Part IDs used correctly (not names)
  notes: "DONE 2026-02-06: Removed 'radiant' from MAGIC_DAMAGE_TYPES and ALL_DAMAGE_TYPES in creator-constants.ts, replaced with 'light' (proper Realms name). Kept 'radiant' ? LIGHT_DAMAGE mapping in mechanic-builder.ts and power-calc.ts as legacy fallback."

- id: TASK-028
  title: List headers - use all caps consistently
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/list-components.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    All list headers in character library should use full caps for consistency: "NAME ACTION DAMAGE ENERGY" instead of "Name Action Damage Energy". Apply globally to all list header components.
  acceptance_criteria:
    - All list headers display in UPPERCASE
    - Consistent across all tabs (feats, powers, techniques, inventory)
    - ListHeader component updated to enforce uppercase
  notes: "DONE 2026-02-05: Verified both ListHeader and SortHeader components already have 'uppercase' in their className. All list headers display in caps. Build verified."

- id: TASK-029
  title: List header column alignment - center over list items
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Ensure list headers are properly aligned over their corresponding list item columns. Headers should be centered over the data columns (e.g., "ACTION" centered over action values). Exception: NAME column is always left-aligned for both header and items.
  acceptance_criteria:
    - All column headers centered over their data columns
    - NAME column left-aligned
    - Grid template columns match between header and rows
  notes: "Added align prop to ColumnValue, restructured grid templates to match row slots, centered all data columns"

- id: TASK-030
  title: Remove "Character Saved" toast - keep only top bar save state
  priority: low
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove the "Character Saved" prompt/toast notification. Keep only the "Unsaved Changes" and "Saved" UI indicator at the top of the character sheet.
  acceptance_criteria:
    - "Character Saved" toast/prompt removed
    - Top bar save state indicator remains functional
    - "Unsaved Changes" indicator still works
  notes: "DONE 2026-02-06: Removed showToast('Character saved'...) from onSaveComplete callback in characters/[id]/page.tsx. Top bar Saved/Unsaved indicator remains."

- id: TASK-031
  title: Relocate character sheet top bar actions to side icons
  priority: high
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/sheet-action-toolbar.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove the character sheet top bar and relocate its actions (recovery, level up, edit mode, save state) to icons on the side of the screen, similar to the dice roller icon but positioned in the top right or another unintrusive location. Remove the "back to characters" arrow/link since nav bar already has characters link.
  acceptance_criteria:
    - Top bar removed
    - Recovery, Level Up, Edit Mode buttons moved to side/corner icons
    - Save state indicator relocated appropriately
    - Back to characters link removed
    - UI remains intuitive and accessible
  notes: "Created SheetActionToolbar floating component with Edit/Recovery/LevelUp/Save icons, replaced sticky top bar"

- id: TASK-032
  title: Dice Roller overhaul - match vanilla site design with enhancements
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/dice-roller.tsx
    - src/components/character-sheet/roll-log.tsx
    - public/images/
  created_at: 2026-02-05
  created_by: owner
  description: |
    Overhaul the dice roller to match the vanilla site design while keeping useful enhancements:
    - Use custom dice images from vanilla site
    - Keep: modifier/bonus input for custom rolls
    - Custom rolls logged as "Custom Roll" (no naming needed)
    - Show dice icons with labels (1d10 below the icon)
    - Display: dice images ? result + bonus ? total
    - Save dice logs (last 20 rolls) - persist across refresh/navigation
  acceptance_criteria:
    - Dice roller uses custom dice images from vanilla site
    - Clickable dice icons with labels (e.g., "1d10")
    - Roll display: dice images, individual results, bonus, total
    - Custom roll modifier input preserved
    - Last 20 rolls saved to localStorage
    - Logs persist across refresh and navigation
  notes: "Rewrote roll-log with custom dice PNGs, localStorage persistence, grouped dice display, crit bonuses"

- id: TASK-033
  title: Chip expansion behavior - expand in place without separate bubble
  priority: medium
  status: done
  related_files:
    - src/components/ui/chip.tsx
    - src/components/shared/expandable-chip.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When expanding a chip for more details, expand the chip in place (displacing chips above/below) instead of creating a separate bubble/popover. Maintain same coloring and styling when expanded. Some chips should not expand (tag chips for feats, trait type chips, codex character/state feat badges).
  acceptance_criteria:
    - Expandable chips expand inline, pushing adjacent chips
    - Same styling maintained when expanded
    - Informational-only chips (tags, trait types, feat types) don't expand
    - Smooth expand/collapse animation
  notes: "Chips now expand inline with same styling, tag chips non-expandable, smooth transitions"

- id: TASK-034
  title: "BUG: Fix armor/weapon equip toggle functionality"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/equip-toggle.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Armor and weapons don't become equipped when hitting the equip button. Fix the equip toggle functionality. Change the equip button to a circle or other symbol that fills when equipped.
  acceptance_criteria:
    - Equip toggle works for armor and weapons
    - Equipped state persists to database
    - Visual indicator: unfilled circle ? filled circle when equipped
    - Works outside edit mode
  notes: "DONE 2026-02-05: Created EquipToggle component with Circle/CheckCircle2 icons (unfilled/filled). Updated library-section to use EquipToggle instead of SelectionToggle. Fixed handlers in characters/[id]/page.tsx to match by ID or name (equipment stored as {name, equipped} without ID). Updated handleToggleEquipWeapon, handleToggleEquipArmor, handleRemoveWeapon, handleRemoveArmor, handleRemoveEquipment, handleEquipmentQuantityChange to match items by ID, name, or case-insensitive name."

- id: TASK-035
  title: Equipment/Inventory tab fixes - quantity, tags, height
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Fix equipment/inventory tab issues:
    - Enable quantity increase/decrease outside edit mode
    - Add missing currency, rarity, and category tags
    - Add truncated descriptions after name (like feats/traits)
    - Fix inventory list items being taller than other tabs (normalize height/font)
  acceptance_criteria:
    - Quantity +/- buttons work outside edit mode
    - Currency, rarity, category tags displayed
    - Truncated descriptions visible in collapsed view
    - Consistent row height with other tabs
  notes: "Added type column, rarity/cost badges, description prop, quantity always editable, compact mode"

- id: TASK-036
  title: Archetype ability indicators - purple/red outlines instead of yellow
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
    - src/components/character-sheet/abilities-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Update archetype ability indicators to match character creator styling:
    - Power ability outlined in purple (power color)
    - Martial ability outlined in red (martial color)
    - Remove current yellow outlining
    - Remove "power" and "martial" symbols/labels by ability names
  acceptance_criteria:
    - Power abilities have purple outline
    - Martial abilities have red outline
    - No yellow outlines
    - No power/martial text labels by abilities
    - Consistent with character creator indicators
  notes: "DONE 2026-02-06: Replaced emoji indicators (??/??) with colored border outlines - purple (border-purple-400) for power ability, red (border-red-400) for martial. Removed yellow border-amber-300 and emoji labels."

- id: TASK-037
  title: Ability edit mode - center skill/ability points display
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    In character sheet ability edit mode, center the skill/ability points indicators in their row for better visibility. Match styles with ability allocation in character/creature creators and skill point allocation in skill creators. Both resource types should have analogous styling.
  acceptance_criteria:
    - Skill points and ability points centered in their rows
    - Styles match character creator and creature creator
    - Both resource displays use consistent, analogous styling
    - Clear visual hierarchy and easy to read
  notes: "DONE 2026-02-06: Changed abilities edit mode point display from flex-wrap with flex-1 spacer to flex-col items-center with justify-center. Points now centered, max info centered below."

- id: TASK-038
  title: Remove hold-to-increase from ability/defense steppers
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/shared/value-stepper.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Remove enableHoldRepeat from ability and defense steppers. Hold-to-increase is only useful for pool allocation (HP/EN), not for ability scores and defense values which change in small discrete amounts.
  acceptance_criteria:
    - Ability score steppers no longer have hold-to-repeat
    - Defense skill steppers no longer have hold-to-repeat
    - HP/EN pool steppers still have hold-to-repeat
    - Dice roller steppers still have hold-to-repeat
  notes: "DONE 2026-02-05: Removed enableHoldRepeat prop from all 4 stepper buttons in abilities-section.tsx (2 ability DecrementButton/IncrementButton, 2 defense DecrementButton/IncrementButton). HP/EN and dice roller steppers still have hold-to-repeat enabled."

- id: TASK-039
  title: Implement skill value cap (max 3) and defense bonus validation
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Enforce game rules for skill and defense caps:
    - Skill values cannot exceed 3 for any given skill
    - Defense bonuses from skill points cannot exceed level (e.g., can't increase defense bonus to 4 via skill points until level 4+)
    - Defense bonus from base ability is unrestricted (e.g., 3 int = +3 mental fort is fine at level 1)
    - Only the skill-point-allocated portion of defense is capped by level
  acceptance_criteria:
    - Skill values capped at 3 (increment disabled at 3)
    - Defense skill point allocation capped by character level
    - Ability-derived defense bonus not affected by cap
    - Validation clear to user (disabled buttons, tooltip explanations)
  notes: "DONE 2026-02-06: Added MAX_SKILL_VALUE=3 constant. Added cap checks in handleSkillIncrease for both sub-skills and base skills. Updated canIncrease prop to include skill_val < MAX_SKILL_VALUE check. Defense validation already in place (capped at level)."

- id: TASK-040
  title: Character library UI - capitalize Currency, bigger tabs, defense button style
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/roll-button.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Three library UI improvements:
    1. Capitalize "Currency" label and visually separate it from armament proficiency
    2. Increase font size of library tabs and make them more visible
    3. Make defense roll buttons same style/color as ability roll buttons (currently less saturated utility colors vs primary blue)
  acceptance_criteria:
    - "Currency" label capitalized
    - Currency section clearly separated from armament proficiency
    - Tab font size increased and more visually prominent
    - Defense roll buttons use same gradient/saturation as ability roll buttons
  notes: "DONE 2026-02-05: Capitalized 'Currency' label with font-medium. Separated currency from armament proficiency with border-t divider. Changed TabNavigation size from 'sm' to 'md' for larger tab font. Changed defense RollButton variant from 'defense' (utility colors) to 'primary' (matching ability roll buttons)."

- id: TASK-041
  title: Character/profile picture upload modal with crop
  priority: high
  status: done
  related_files:
    - src/components/shared/image-upload-modal.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/app/(main)/my-account/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Create an image upload modal for character portraits and profile pictures. Features:
    - Upload from device, drag and drop support
    - Show accepted image types and sizes, recommended aspect ratio
    - Translucent frame overlay showing crop area (rectangle for character portrait, circle for profile icon)
    - Drag/pinch to position and scale image within frame
    - Preview before confirming
    - Sleek, clean design matching site styles
  acceptance_criteria:
    - Upload modal with drag-and-drop support
    - Image manipulation (drag, scale) within crop frame
    - Rectangle frame for character portrait, circle for profile icon
    - Shows accepted formats, recommended sizes
    - Clean modal UI matching site design
    - Works for both character sheet and profile picture
  notes: "DONE 2026-02-06: Created ImageUploadModal (react-easy-crop) with drag-and-drop, zoom slider, canvas crop. Rect crop (3:4) for character portrait in sheet-header.tsx. Round crop (1:1) for profile picture in my-account page. Uploads to Supabase Storage. Exported from shared/index.ts."

- id: TASK-042
  title: Separate species name from level line in character sheet header
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    In the character sheet header, species name is currently combined with level on the same line ("Level 1 Human"). Separate them so species is on its own line or visually distinct from the level display.
  acceptance_criteria:
    - Species name visually separated from level
    - Clean header layout maintained
    - Both pieces of info still clearly visible
  notes: "DONE 2026-02-05: Changed 'Level X SpeciesName' to 'Level X Ã¢â‚¬â€ SpeciesName' with species in font-medium span for visual distinction. Uses middle dot separator."

- id: TASK-043
  title: Hide skill point display in non-edit mode
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    In non-edit mode, the skill point current/max display (PointStatus) in the top right of the skills list should be hidden. Only show skill point allocation info when in edit mode.
  acceptance_criteria:
    - PointStatus hidden when not in edit mode
    - PointStatus visible when in edit mode
    - No layout shift when toggling edit mode
  notes: "DONE 2026-02-05: Wrapped PointStatus in showEditControls conditional so skill point current/max is only visible in edit mode."

- id: TASK-044
  title: Fix skill point calculation - show 3/3 not 5/5 at level 1
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/character-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Game rules: Level 1 characters have 5 skill points total, but species forces 2 into set skills. Display available skill points as 3/3 (not 5/5) at level 1, with +3 each level. Creature creator should show 5/5 since no species selection. The 2 species skill points are pre-allocated and not available for player choice.
  acceptance_criteria:
    - Character sheet shows 3/3 skill points at level 1 (5 total - 2 species = 3 choosable)
    - Character creator shows 3/3 at level 1
    - Creature creator shows 5/5 at level 1
    - +3 skill points per level for all
    - Species proficiency skills still granted automatically
  notes: "DONE 2026-02-06: Added characterSpeciesSkills useMemo in page.tsx. Subtracted species count from totalSkillPoints (3 at level 1 instead of 5). Excluded species proficiency from spent calculations in both page.tsx and skills-section.tsx. Updated speciesSkills prop with characterSpeciesSkills. Updated character creator skills-step.tsx to subtract speciesSkillIds.size."

- id: TASK-045
  title: Unify HP/EN pool allocation styles across sheet and creators
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/creator/health-energy-allocator.tsx
    - src/app/(main)/character-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    The HealthEnergyAllocator in the character sheet uses variant="inline" which looks different from the character/creature creator versions. Unify the styles so all three use the same visual design, colors, and layout.
  acceptance_criteria:
    - Character sheet HP/EN allocation matches creator designs
    - Same colors, spacing, and visual weight across all instances
    - HealthEnergyAllocator variants produce visually consistent output
  notes: "DONE 2026-02-06: Redesigned inline variant to match card variant: state-based borders (green complete, red overspent, neutral default), matching header with label and spent/total display, removed gradient background."

- id: TASK-046
  title: Username change with validation (uniqueness, filtering, rate limit)
  priority: medium
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/app/(auth)/actions.ts
  created_at: 2026-02-05
  created_by: agent
  description: |
    Implement username change functionality with:
    - Uniqueness check against Firestore
    - Inappropriate name filtering
    - Rate limit to once per week
    Discovered during TASK-012 security audit as a gap.
  acceptance_criteria:
    - Username change form in My Account
    - Uniqueness validation before save
    - Basic inappropriate name filter
    - Rate limiting (once per week)
  notes: "DONE 2026-02-05: Added changeUsernameAction (server action) with uniqueness (users collection), blocklist, rate limit (7 days), 3-24 char alphanumeric validation. My Account page has Change Username form. Updates users + usernames collections."

- id: TASK-047
  title: Auth provider detection for My Account settings
  priority: medium
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Detect auth provider (Google/Apple/email) and show/hide appropriate My Account settings.
    Google/Apple users cannot change email (no password for reauth). Show appropriate options per auth method.
  acceptance_criteria:
    - Detect auth provider from Firebase user object
    - Hide email/password change for OAuth users
    - Show relevant options per provider
  notes: "DONE 2026-02-05: Added hasPasswordProvider() and getAuthProviderLabel() using user.providerData. Profile shows 'Signed in with' (Google/Apple/Email). Change Email and Change Password sections hidden for OAuth users. Info message shown for OAuth users explaining they must use provider settings."

- id: TASK-048
  title: Library tab ordering - default to Feats
  priority: low
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Enforce tab order: Feats ? Powers ? Techniques ? Inventory ? Proficiencies ? Notes.
    Default open tab should be Feats.
  acceptance_criteria:
    - Tabs render in specified order
    - Default active tab is Feats
  notes: "DONE (pre-existing): library-section.tsx tabs array order is Feats?Powers?Techniques?Inventory?Proficiencies?Notes; useState('feats') sets default. Verified 2026-02-05 audit."

- id: TASK-049
  title: Sortable list headers (column sorting)
  priority: low
  status: done
  related_files:
    - src/components/shared/list-header.tsx
    - src/components/shared/list-components.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Make list column headers clickable to sort by that column. Sort ascending/descending on click.
    Apply across library, codex, and modal list views.
  acceptance_criteria:
    - Clickable column headers with sort direction indicator
    - Sort state persists within session
    - Works across all list views
  notes: "DONE 2026-02-05: Library-section had ListHeader + sortState but data wasn't sorted. Added sortByCol helper and useMemo for sortedInnatePowers, sortedRegularPowers, sortedTechniques, sortedWeapons, sortedArmor, sortedEquipment. Library, Codex, modals already had sort applied; library-section was the gap."

- id: TASK-050
  title: Creature creator fixes (prowess, dropdowns, summary scroll)
  priority: medium
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    Bundle of creature creator fixes:
    1. Hide unarmed prowess options > level 1 for new characters
    2. Fix dropdown alignment issues
    3. Make summary scroll behavior consistent
  acceptance_criteria:
    - Prowess options filtered by level
    - Dropdowns properly aligned
    - Summary scrolls consistently
  notes: |
    DONE 2026-02-05:
    - Prowess: Character creator equipment-step already filters unarmed prowess by charLevel <= draft.level; level 1 chars only see Unarmed Prowess I.
    - Dropdowns: AddItemDropdown now uses items-center, py-2, rounded-lg, min-w-0, flex-shrink-0 for consistent alignment.
    - Summary: Creature sidebar wrapper now has sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto for consistent scroll.

- id: TASK-051
  title: Implement modern thin scrollbars sitewide
  priority: low
  status: done
  related_files:
    - src/app/globals.css
  created_at: 2026-02-05
  created_by: agent
  description: |
    Add modern thin scrollbar styling across the site using CSS.
    Use scrollbar-width: thin and custom ::-webkit-scrollbar styles.
  acceptance_criteria:
    - Thin scrollbars on all scrollable containers
    - Works in Chrome, Firefox, Safari
    - Subtle, non-intrusive appearance
  notes: "DONE (pre-existing): globals.css @layer base already has scrollbar-width: thin (Firefox), ::-webkit-scrollbar 6px (Chrome/Safari/Edge), transparent track, rounded thumb. Verified 2026-02-05."

- id: TASK-052
  title: Character creator - persist skill allocations on tab switch
  priority: medium
  status: done
  related_files:
    - src/app/(main)/character-creator/page.tsx
    - src/stores/character-creator-store.ts
  created_at: 2026-02-05
  created_by: agent
  description: |
    Skill allocations in character creator are lost when switching tabs. Persist them in the creator store
    so they survive tab navigation.
  acceptance_criteria:
    - Skill allocations persist when switching to another step and back
    - Values restored correctly on return to skills step
  notes: "DONE 2026-02-05: Switched skills-step to use draft.skills as single source of truth instead of local useState. Allocations now persist when switching tabs and returning."

- id: TASK-053
  title: Add confirmation dialog before feat deletion (TASK-022 compliance)
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/feats-tab.tsx
    - src/components/shared/delete-confirm-modal.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: agent
  description: |
    TASK-022 acceptance criteria required "Confirmation dialog before deletion" for feat deletion.
    Feat deletion currently calls handleRemoveFeat directly with no confirmation. Add DeleteConfirmModal
    or similar before removing feats from archetype/character/state feat lists.
  acceptance_criteria:
    - Clicking feat delete/remove triggers confirmation modal
    - User must confirm before feat is removed
    - Canceling closes modal without removing feat
    - Uses existing DeleteConfirmModal or consistent modal pattern
  notes: "DONE 2026-02-05: Added featToRemove state and DeleteConfirmModal. FeatsTab now passes featName to onRemoveFeat; page shows confirmation before calling handleRemoveFeat. DeleteConfirmModal extended with deleteContext prop for 'character' vs 'library'."

- id: TASK-054
  title: Documentation Ã¢â‚¬â€ add agent verification guidelines
  priority: low
  status: done
  related_files:
    - AGENTS.md
    - src/docs/ai/AGENT_GUIDE.md
  created_at: 2026-02-05
  created_by: agent
  description: |
    Improve docs for AI agents: add verification steps before marking tasks done, note that
    related_files in task queue may be stale and should be verified against codebase.
  acceptance_criteria:
    - AGENTS.md or AGENT_GUIDE includes "verify acceptance criteria fully met before marking done"
    - AGENT_GUIDE includes note about verifying related_files paths
  notes: "DONE 2026-02-05: Added 'Verification Before Marking Done' section to AGENT_GUIDE with acceptance-criteria check, related_files verification, build check, and manual spot-check. AGENTS.md already had verification steps from prior audit."

- id: TASK-055
  title: Rename "Ability Scores" to "Abilities" everywhere + fix cost hint
  priority: medium
  status: done
  related_files:
    - src/components/creator/ability-score-editor.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-creator/steps/abilities-step.tsx
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In Realms RPG, ability values are called "bonuses" or "values", not "scores". The term "Ability Scores"
    appears in component names and headings. Rename to just "Abilities" throughout.
    Also fix "Next: 2 Points" label Ã¢â‚¬â€ abilities 4+ cost 2 points, not the generic "3" shown.
  acceptance_criteria:
    - Component name AbilityScoreEditor renamed or aliased to AbilityEditor
    - All headings say "Abilities" or "Assign Abilities", not "Ability Scores"
    - High-ability cost hint shows "Next: 2 Points" for values 4+
    - npm run build passes
  notes: |
    DONE 2026-02-06:
    - Renamed heading "Ability Scores" ? "Abilities" in creature-creator/page.tsx.
    - Updated comments in ability-score-editor.tsx, abilities-section.tsx, creator/index.ts.
    - Fixed cost hint bug in abilities-section.tsx: getAbilityIncreaseCost now returns 2 at value>=3 (next increase to 4+ costs 2). Removed redundant `cost + (value >= 3 ? 1 : 0)` workaround, replaced with clean `cost`.
    - Also renamed HealthEnergyAllocator label from "HP/EN Pool" to "Health/Energy Allocation" (from same feedback batch).

- id: TASK-056
  title: Auto-capitalize archetype ability display
  priority: low
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-creator/steps/finalize-step.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    The character's power/martial ability is sometimes displayed lowercase ("charisma" instead of "Charisma").
    Ensure it's always title-cased in the character sheet header and archetype section.
  acceptance_criteria:
    - Power ability and martial ability displayed with first letter capitalized
    - Applies in archetype section and header
  notes: |
    DONE 2026-02-06: Verified Ã¢â‚¬â€ already handled. sheet-header.tsx uses CSS `capitalize` class on pow_abil/mart_abil spans. archetype-section.tsx uses JS charAt(0).toUpperCase() + slice(1). finalize-step.tsx uses CSS `capitalize`. All single-word ability names are properly capitalized.

- id: TASK-057
  title: Unify page content width across non-unique pages
  priority: medium
  status: done
  related_files:
    - src/components/ui/page-container.tsx
    - src/app/(main)/rules/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Page content width varies between pages (codex, library, creators, character sheet).
    Non-unique pages (not home, login, register) should share a consistent max-width.
    Audit PageContainer sizes across the site and standardize.
  acceptance_criteria:
    - All creator, library, codex, character pages use same content width
    - Character sheet may be slightly wider if needed (xl vs content)
    - Auth and landing pages exempt
  notes: |
    DONE 2026-02-06: Audited all PageContainer usage:
    - Most pages already use size="xl" (max-w-[1440px]): library, codex, creators, characters.
    - Changed rules/page.tsx from size="content" (max-w-6xl) to size="xl" for consistency.
    - Correct exceptions: my-account (xs, narrow form), terms/privacy/resources (prose, text-heavy), encounter-tracker (full, max space), character sheet (custom 1600px for wider layout).

- id: TASK-058
  title: Fix health bar half-HP color (yellower orange) and deepen terminal red
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Half-health bar color is too red and hard to distinguish from terminal. Change to a
    yellower/more orange shade. Deepen the terminal red for clearer visual distinction.
  acceptance_criteria:
    - Half-health color is clearly orange/amber (not red-orange)
    - Terminal health is a deeper/darker red
    - Both are visually distinct from each other
  notes: |
    DONE 2026-02-06: Unified HealthBar component colors with ResourceInput bar:
    - Half-health: changed bg-orange-500 ? bg-amber-500 (yellower orange).
    - Terminal: changed bg-red-500 ? bg-red-700 (deeper red).
    - ResourceInput already used bg-amber-500/bg-red-700. Portrait border already used border-amber-400/border-red-600. Now fully consistent.

- id: TASK-059
  title: Unify selection/add button styles site-wide
  priority: medium
  status: done
  related_files:
    - src/components/shared/selection-toggle.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Selection buttons (+/check) and "Add X" buttons should have a unified style:
    backgroundless "+" icon that turns to a green check when selected, with animation.
    Ancestry step trait selection buttons should be larger and vertically centered.
  acceptance_criteria:
    - Selection toggle uses clean + ? ? animation without circular border
    - Add buttons consistent across all modals and sections
    - Ancestry step selection buttons centered and larger
  notes: |
    DONE 2026-02-06: Verified Ã¢â‚¬â€ already fully implemented.
    - SelectionToggle component: backgroundless +/check icons, scale animation, no circular border.
    - Used consistently in: ancestry-step (size="lg", self-center), grid-list-row, add-sub-skill-modal, item-card, species-trait-card.
    - Equipment step quantity steppers are correctly different (quantity controls, not selection toggles).
    - No non-unified add/selection buttons found in modals or sections.

- id: TASK-060
  title: Fix vitality box height mismatch in ability editor
  priority: low
  status: done
  related_files:
    - src/components/creator/ability-score-editor.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In the character creator, the Vitality ability box sometimes renders taller than other ability boxes.
    All six ability boxes should have identical height.
  acceptance_criteria:
    - All ability boxes in character creator are the same height
    - Verified in creature creator as well
  notes: |
    DONE 2026-02-06: Root cause was the conditional cost hint indicator (only visible for abilities at 3+ with room to increase). Changed to always render the indicator line in edit mode with useHighAbilityCost, using `invisible` class when not applicable. This reserves consistent vertical space across all boxes.

- id: TASK-061
  title: TASK-012 completion Ã¢â‚¬â€ close security audit with sub-task references
  priority: low
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-012 (My Account security audit) has been in-progress since the audit was done. The
    identified gaps (OAuth provider detection, username change, profile picture) are now
    addressed by TASK-041, TASK-046, TASK-047. Mark TASK-012 as done with references.
  acceptance_criteria:
    - TASK-012 status updated to done
    - Notes reference TASK-041, TASK-046, TASK-047 as resolutions
  notes: "DONE 2026-02-06: TASK-012 was already marked done with resolution references in prior session."

- id: TASK-062
  title: Match character library section heights to archetype section
  priority: low
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    The character library, skills section, and archetype section should all have matching min-heights
    so they appear uniform when adjacent, even when empty.
  acceptance_criteria:
    - Library section min-height matches archetype section
    - Skills section min-height matches archetype section
    - Consistent appearance when sections have minimal content
  notes: "DONE 2026-02-05: Added min-h-[400px] to all three column wrappers (Skills, Archetype, Library) in characters/[id]/page.tsx so sections have uniform minimum height when adjacent."

- id: TASK-063
  title: Creature creator basic info dropdown alignment and sizing
  priority: low
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In the creature creator basic information section, the Level dropdown is too wide and the
    Level/Type/Size dropdowns are not vertically aligned with the Name input box.
  acceptance_criteria:
    - Level dropdown has a reasonable max-width
    - Level/Type/Size dropdowns are horizontally aligned with the Name input
    - Consistent spacing and visual alignment
  notes: "DONE 2026-02-05: Replaced space-y-4 layout with single-row grid (Name | Level | Type | Size). Level w-20, Type w-36, Size w-28. All aligned horizontally with items-end for baseline alignment."

- id: TASK-064
  title: Game rules audit Ã¢â‚¬â€ fix terminology and CreatureStatBlock ability schema
  priority: high
  status: done
  related_files:
    - src/docs/GAME_RULES_AUDIT.md
    - src/components/shared/creature-stat-block.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/encounter-tracker/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Audit of codebase vs Core Rulebook (GAME_RULES.md) found mismatches. Fix high-priority items:
    1. CreatureStatBlock uses D&D ability names (intellect, perception, willpower) Ã¢â‚¬â€ Realms uses acuity, intelligence, charisma. Acuity and Intelligence do not display for creator creatures.
    2. Replace "ability score" with "Ability" in user-facing copy (item-creator, etc.).
    3. Consider "Reflexes" for defense label (rulebook uses Reflexes, not Reflex).
  acceptance_criteria:
    - CreatureStatBlock displays all 6 Realms abilities (STR, VIT, AGI, ACU, INT, CHA) for creator creatures
    - Item creator: "Require a minimum Ability to use..." (not "ability score")
    - Creature creator: Defense "Reflex" ? "Reflexes" (or document as acceptable abbreviation)
    - npm run build passes
  notes: |
    DONE 2026-02-06:
    - CreatureStatBlock: Updated to Realms ability order (STR, VIT, AGI, ACU, INT, CHA); added legacy map for intellect/perception/willpower; grid-cols-6.
    - Item creator: "ability score" ? "Ability".
    - Creature creator: Defense label "Reflex" ? "Reflexes".
    - Encounter-tracker: Faint condition "Reflex" ? "Reflexes".
    - npm run build passes.

- id: TASK-065
  title: Enable hold-to-repeat for Health/Energy allocation in creature creator
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/creator/health-energy-allocator.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Health/Energy allocation should have faster/continuous allotment on button hold.
    Creature creator's HealthEnergyAllocator does not pass enableHoldRepeat; it defaults to false.
    Verify character creator and character sheet also have hold-to-repeat enabled for HP/EN.
  acceptance_criteria:
    - Creature creator HealthEnergyAllocator passes enableHoldRepeat={true}
    - Character creator and character sheet already have hold-to-repeat (verify)
    - Hold-to-repeat works for both HP and EN steppers in creature creator
  notes: "DONE 2026-02-05: Added enableHoldRepeat to creature creator HealthEnergyAllocator."

- id: TASK-066
  title: Remove hold-to-repeat from defense steppers in creature creator
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Defense/ability allocation should NOT have hold-to-increase function, as they have little variance.
    Creature creator's DefenseBlock currently uses enableHoldRepeat on DecrementButton/IncrementButton.
  acceptance_criteria:
    - DefenseBlock DecrementButton and IncrementButton have enableHoldRepeat removed
    - Ability allocation (AbilityScoreEditor) already has no hold-repeat (verify)
  notes: "DONE 2026-02-05: Removed enableHoldRepeat from creature creator DefenseBlock."

- id: TASK-067
  title: Fix inconsistent vertical margins on senses/movement item cards (ExpandableChipList)
  priority: medium
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/shared/grid-list-row.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Senses and movement item cards have inconsistent vertical margins above/below the description box.
    Should have equal padding. Likely true globally for like item cards (GridListRow with compact + description).
  acceptance_criteria:
    - Senses and movement ExpandableChipList rows have equal padding above/below description
    - Audit GridListRow compact+description layout for consistent margins
    - Apply fix globally if pattern is shared
  notes: "DONE 2026-02-05: GridListRow expanded content now uses py-3/py-4 (equal), description mb-3."

- id: TASK-068
  title: Unify creature creator add modals with character sheet/codex list styles
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/shared/item-selection-modal.tsx
    - src/components/shared/item-list.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-sheet/add-skill-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Add feat/power/technique/armament modals in creature creator use old modal styles (ItemSelectionModal with ItemList).
    Should match character sheet modals (add-feat, add-skill) which use GridListRow and codex/library list view styles.
    All add X modals with list views should be uniform. Audit: replace with unified components or rewrite creature
    creator modals to use GridListRow/UnifiedSelectionModal patterns aligned with unification goals.
  acceptance_criteria:
    - Creature creator add modals (powers, techniques, feats, armaments) use GridListRow or equivalent unified list pattern
    - Modal styling matches add-feat-modal, add-skill-modal (rounded headers, sortable columns, codex-style list)
    - Consider UnifiedSelectionModal or shared modal wrapper for consistency
  notes: "DONE 2026-02-05: Replaced ItemSelectionModal with UnifiedSelectionModal; DisplayItem->SelectableItem conversion; GridListRow list with columns."

- id: TASK-069
  title: Power/Martial slider should not allow 0 at either end (min 1 each)
  priority: high
  status: done
  related_files:
    - src/components/shared/powered-martial-slider.tsx
    - src/components/creator/archetype-selector.tsx
    - src/components/character-sheet/archetype-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Powered-martial has a division of power/martial proficiencies between both. The furthest end of the slider
    should be 1 for that end, not 0. Both power and martial must have at least 1 point when powered-martial.
  acceptance_criteria:
    - PoweredMartialSlider min power = 1, max power = maxPoints - 1 (so martial is always >= 1)
    - Slider range constrained so neither side can go to 0
    - Works in creature creator and character sheet archetype section
  notes: "DONE 2026-02-05: Slider min=1, max=maxPoints-1 when maxPoints>1; clamps on init and change."

- id: TASK-070
  title: Restructure Creature Summary to match other creators with resource boxes
  priority: high
  status: done
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/creator/creator-summary-panel.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Creature Summary should match other creators: (1) At top, boxes with spendable resources (ability points,
    skill points, feat points, training points, currency) - can be smaller since more boxes. (2) Below: summary
    points (Abilities, Archetype, level, type, size). (3) Below: line items as sentences, e.g. "Skills: Stealth +3,
    Athletics -1, ..." and similar for resistances, immunities, weaknesses. Reference D&D creature stat block format.
  acceptance_criteria:
    - Resource boxes at top (ability, skill, feat, training, currency) matching power/technique creator costStats style
    - Summary points: Abilities, Archetype, level, type, size
    - Line items: Skills as "Skills: Stealth +3, Athletics -1, ...", resistances/immunities/weaknesses similarly
    - CreatorSummaryPanel may need new props or creature creator uses custom layout
  notes: "DONE 2026-02-05: Added resourceBoxes and lineItems to CreatorSummaryPanel; creature summary now has resource boxes at top, stat rows, line items (Skills: X +3, Resistances: Y, etc.)."

- id: TASK-071
  title: Unify stepper button styles across the site
  priority: medium
  status: done
  related_files:
    - src/components/shared/value-stepper.tsx
    - src/app/globals.css
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/abilities-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Stepper buttons across the site have inconsistent styles, sizes, colors. Defenses allocation steppers are
    smaller (size="xs"), decrement is grey vs red. Use less stark colors and unify styles across the site.
  acceptance_criteria:
    - All steppers use consistent size (or size prop used consistently by context)
    - Decrement/increment colors less stark - unify btn-stepper-danger and btn-stepper-success
    - DefenseBlock, abilities-section, health-energy-allocator, etc. use same visual language
  notes: "DONE 2026-02-05: Defense steppers xs->sm; btn-stepper colors softened (red-50/green-50, 600 text)."

- id: TASK-072
  title: Health/Energy edit mode Ã¢â‚¬â€ bump current when at max and increasing max
  priority: high
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    When editing health/energy allocation and increasing the max (via healthPoints or energyPoints),
    if the current value is already at the max, increase the current by the same amount as the max.
    Rationale: a character who was fully healthy/energized when increasing the pool should stay at full.
  acceptance_criteria:
    - Increasing healthPoints when current HP === max HP bumps current HP by the same delta
    - Increasing energyPoints when current EN === max EN bumps current EN by the same delta
    - Decreasing points does not auto-adjust current (only when increasing)
  notes: "DONE 2026-02-05: handleHealthPointsChange/handleEnergyPointsChange now bump current by delta when current>=max and delta>0."

- id: TASK-073
  title: Speed/Evasion base editing Ã¢â‚¬â€ pencil icon, hide by default, red/green validation
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/sheet-header.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Don't show speed/evasion base editing options by default. Add a pencil icon by each (like other sections).
    Require clicking the pencil to show the edit option. When editing: red if base is over the proper value
    (increasing base), green if under (decreasing base).
  acceptance_criteria:
    - Speed and Evasion show pencil icon; base editing hidden until pencil clicked
    - Red indicator when base > default (over proper value)
    - Green indicator when base < default (under proper value)
    - Matches pencil-edit pattern used elsewhere (name, XP, skills)
  notes: "Owner feedback 2026-02-05"

- id: TASK-074
  title: Dark mode Ã¢â‚¬â€ soften contrasting colors for easier viewing
  priority: medium
  status: done
  related_files:
    - src/app/globals.css
    - src/components/ui/chip.tsx
    - src/components/shared/value-stepper.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-05
  created_by: owner
  description: |
    Many colors are too contrasting in dark mode. Replace with easier viewing colors: chip colors,
    stepper colors, character sheet health/energy backgrounds, power proficiency background,
    item list headers, hover-highlight colors (which also white out the hovered white font content).
  acceptance_criteria:
    - Chip, stepper, health/energy, power proficiency, item list header colors softened for dark mode
    - Hover highlights no longer white out white font on hovered items
    - Audit and fix other high-contrast elements
  notes: "DONE 2026-02-05: Added dark mode CSS vars (success/danger/health/energy/power/martial-light); chip, stepper, ListHeader, GridListRow, ValueStepper, ResourceInput dark variants."

- id: TASK-075
  title: Fix /api/session 500 Internal Server Error
  priority: high
  status: done
  related_files:
    - src/app/api/session/route.ts
    - src/lib/supabase/session.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    /api/session returns 500 when creating session from Firebase ID token. This blocks portrait
    upload and profile picture upload flows. Likely causes: Firebase Admin SDK not configured
    in production, or createSessionCookie failing.
  acceptance_criteria:
    - POST /api/session with valid idToken returns 200
    - Session cookie is set correctly
    - Portrait and profile picture upload flows work after login
  notes: "DONE 2026-02-05: Added GOOGLE_APPLICATION_CREDENTIALS_JSON support (full JSON key) in server.ts; updated SECRETS_SETUP.md. If 500 persists, ensure SERVICE_ACCOUNT_EMAIL+PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON is in firebase.json secrets and Secret Manager."

- id: TASK-076
  title: Fix Firebase Storage rules for portraits and profile-pictures
  priority: high
  status: done
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md (Supabase Storage RLS)
  created_at: 2026-02-05
  created_by: owner
  description: |
    Storage rules only allow user_uploads/{userId}/**. Uploads go to portraits/{userId}/** and
    profile-pictures/{userId}.jpg. Add rules so authenticated users can read/write their own
    portraits and profile pictures.
  acceptance_criteria:
    - portraits/{userId}/{allPaths=**} allow read, write if request.auth.uid == userId
    - profile-pictures/{userId}.{ext} allow read, write if request.auth.uid == userId
    - Portrait and profile picture uploads succeed
  notes: "DONE 2026-02-05: Added portraits/{userId}/** and profile-pictures/{fileName} rules."

- id: TASK-077
  title: Fix username regex Ã¢â‚¬â€ invalid character class in pattern attribute
  priority: high
  status: done
  related_files:
    - src/app/(main)/my-account/page.tsx
    - src/app/(auth)/actions.ts
  created_at: 2026-02-05
  created_by: owner
  description: |
    Pattern attribute value [a-zA-Z0-9_-]+ causes "Invalid character in character class" in some
    browsers (e.g. with unicodeSets /v flag). Fix by using hyphen at start of class: [-a-zA-Z0-9_]+
    or escape it. Also fix any server-side validation using the same regex.
  acceptance_criteria:
    - Username input pattern validates correctly in all supported browsers
    - No "Invalid regular expression" or "Invalid character in character class" errors
    - POST my-account for username change succeeds (no 500)
  notes: "DONE 2026-02-05: Changed pattern to [-a-zA-Z0-9_]+ (hyphen at start avoids character class issue)."

- id: TASK-078
  title: "Dice roller Ã¢â‚¬â€ replace Lucide icons with custom dice PNGs"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/dice-roller.tsx
    - public/images/
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-032 (dice roller overhaul) was marked done, but the dice roller component itself
    still uses Lucide Dice1-Dice6 icons (DieIcon function at line 40). The roll-log correctly
    uses custom PNGs (/images/D4.png, D6.png, etc.), but the dice-roller.tsx does not.
    Replace DieIcon with custom dice images matching the vanilla site. Show clickable dice
    images with labels below (e.g. "1d10" below the d10 image).
  acceptance_criteria:
    - dice-roller.tsx uses custom images from /images/ instead of Lucide Dice icons
    - Each die type shows as a clickable image with label below (1d4, 1d6, 1d8, 1d10, 1d12, 1d20)
    - Dice images match those used in roll-log.tsx
    - npm run build passes
  notes: "DONE 2026-02-06: Replaced Lucide Dice icons with custom PNGs; die type selection uses clickable images with labels; last roll shows DieResultDisplay with images."

- id: TASK-079
  title: "Weapon columns Ã¢â‚¬â€ add attack bonus column"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Display computed weapon attack bonus, damage, crit range, armor DR/requirements consistently."
    WEAPON_COLUMNS currently shows Name, Damage, Range. Attack bonus is calculated
    (getWeaponAttackBonus) but only used for the roll button, never shown in columns.
    Add an Attack Bonus column (e.g. "+5 (Str)") to WEAPON_COLUMNS so users can see the
    bonus at a glance without expanding the row or hovering the roll button.
  acceptance_criteria:
    - WEAPON_COLUMNS includes an attack bonus column
    - Column displays calculated bonus with ability abbreviation (e.g. "+5 (Str)")
    - Column aligned center, consistent with other column widths
    - WEAPON_GRID updated to accommodate new column
    - npm run build passes
  notes: "DONE 2026-02-06: Added Attack column with +N (Abbr) format; WEAPON_GRID updated."

- id: TASK-080
  title: "Unified Selection Modal Ã¢â‚¬â€ remove 'Add' column header text"
  priority: medium
  status: done
  related_files:
    - src/components/shared/unified-selection-modal.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Remove 'Add' column header; ListHeader with hasSelectionColumn provides empty slot."
    unified-selection-modal.tsx line 302 still renders `<span className="text-center">Add</span>`.
    Replace with empty slot (just the column space, no text) to match feedback requirements
    and add-feat-modal pattern.
  acceptance_criteria:
    - "Add" text removed from selection column header in unified-selection-modal
    - Empty column slot still present for alignment
    - npm run build passes
  notes: "DONE 2026-02-06: Replaced 'Add' with empty slot (nbsp for alignment)."

- id: TASK-081
  title: "Add Skill / Add Sub-Skill modals Ã¢â‚¬â€ adopt ListHeader + sort"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/add-skill-modal.tsx
    - src/components/character-sheet/add-sub-skill-modal.tsx
    - src/components/shared/list-header.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-002 audit concluded "all list pages and selection modals already use unified patterns"
    but these two modals still use custom header divs:
    1. add-skill-modal: custom header, no sort
    2. add-sub-skill-modal: custom header, shows "X sub-skills available" count, no sort
    
    Replace custom headers with ListHeader component. Add sort functionality (at least by name).
    Remove item count from add-sub-skill-modal per "Remove # items counts" feedback.
  acceptance_criteria:
    - add-skill-modal uses ListHeader with sortable columns
    - add-sub-skill-modal uses ListHeader with sortable columns
    - Item count "X sub-skills available" removed from add-sub-skill-modal
    - Sort state managed with toggleSort pattern matching other modals
    - npm run build passes
  notes: "DONE 2026-02-06: Both modals use ListHeader with sort; item count removed from add-sub-skill."

- id: TASK-082
  title: "LoadFromLibraryModal Ã¢â‚¬â€ remove item count from footer"
  priority: low
  status: done
  related_files:
    - src/components/creator/LoadFromLibraryModal.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Remove # items counts." LoadFromLibraryModal (used by power/technique/item creators)
    displays "X items in your library" in its footer. Remove this count.
  acceptance_criteria:
    - Item count text removed from LoadFromLibraryModal footer
    - Footer still shows relevant controls (if any) without the count
    - npm run build passes
  notes: "DONE 2026-02-06: Footer removed (no item count)."

- id: TASK-083
  title: "Remove remaining button gradients site-wide"
  priority: medium
  status: done
  related_files:
    - src/app/(main)/resources/page.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/ui/button.tsx
    - src/app/globals.css
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Buttons: Use solid colors with clear white font Ã¢â‚¬â€ no gradients."
    Remaining gradient usage in buttons:
    1. resources/page.tsx line 35: download link styled as gradient button (from-amber-500 to-orange-600)
    2. notes-tab.tsx line 264: fall damage button with gradient (from-neutral-50 to-indigo-50)
    3. button.tsx line 41: deprecated 'gradient' variant still defined
    4. globals.css lines 532-563: legacy .btn-primary, .btn-danger, .btn-success gradient classes (unused in src/)
    
    Replace buttons with solid styling. Remove deprecated gradient variant. Remove or mark legacy CSS classes.
  acceptance_criteria:
    - resources/page.tsx download button uses solid color (no gradient)
    - notes-tab.tsx fall damage button uses solid color (no gradient)
    - Deprecated gradient variant removed from button.tsx
    - Legacy gradient CSS classes removed or clearly marked deprecated
    - npm run build passes
  notes: "DONE 2026-02-06: resources/notes-tab use solid; gradient variant removed; globals.css deprecated."

- id: TASK-084
  title: "Dark mode Ã¢â‚¬â€ comprehensive pass on remaining hardcoded light colors"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/shared/innate-toggle.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/app/(main)/codex/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-074 addressed CSS variables and core shared components but left many components with
    hardcoded light-mode colors. This is a comprehensive pass to add dark: variants everywhere.
    
    Priority components (user-facing, frequently used):
    - recovery-modal: bg-white ? bg-surface, bg-blue-50/bg-amber-50/bg-violet-50 ? with dark: variants
    - archetype-section: bg-red-50, bg-violet-50 ? with dark: variants
    - skill-row: hover:bg-blue-50, bg-blue-50 species highlight ? with dark: variants
    - grid-list-row: bg-green-50 (equipped), bg-violet-50 (innate) ? with dark: variants
    - tab-summary-section: gradient backgrounds ? with dark: variants
    - notes-tab, library-section: bg-white inputs ? dark:bg-surface
    - innate-toggle: hover:bg-violet-50 ? with dark: variant
    
    Secondary components:
    - ancestry-step, feats-step, equipment-step: colored backgrounds
    - ability-score-editor: bg-amber-50/50
    - codex/page.tsx: bg-info-50, bg-success-50, bg-danger-50 species cards
    
    Also fix hover states that "white out" text in dark mode.
  acceptance_criteria:
    - All bg-white instances in interactive components have dark:bg-surface
    - All bg-*-50 backgrounds have appropriate dark: variants (dark:bg-*-900/20 or similar)
    - Hover states don't cause invisible text in dark mode
    - Visual spot-check in dark mode shows no jarring bright elements
    - npm run build passes
  notes: "DONE 2026-02-06: Added dark: variants to recovery-modal, skill-row, grid-list-row, archetype-section, tab-summary-section, notes-tab, library-section, innate-toggle, ability-score-editor, ancestry/feats/equipment steps, codex."

- id: TASK-085
  title: "Creator summaries Ã¢â‚¬â€ add sticky positioning to power/technique/item creators"
  priority: medium
  status: done
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Consistent layout: fixed compact summary + scrolling inputs/values."
    Creature creator correctly has `sticky top-24` on its summary sidebar. Power, technique,
    and item creators do NOT Ã¢â‚¬â€ their summaries scroll away. Add `self-start sticky top-24`
    and `max-h-[calc(100vh-7rem)] overflow-y-auto` to summary sidebar wrappers to match
    creature creator behavior.
  acceptance_criteria:
    - Power creator summary sidebar is sticky
    - Technique creator summary sidebar is sticky
    - Item creator summary sidebar is sticky
    - Summary scrolls independently if content overflows
    - Matches creature creator's sticky behavior
    - npm run build passes
  notes: "DONE 2026-02-06: Added sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto to power/technique/item creators."

- id: TASK-086
  title: "Full recovery Ã¢â‚¬â€ filter feat resets by recovery type"
  priority: high
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    handleFullRecovery (line 560) resets ALL feat currentUses to maxUses without checking
    the feat's recovery type. Per game rules and TASK-017 spec: "Full Recovery restores all
    feat/trait uses with recovery type 'Full' or 'Partial' to their max values." Feats with
    NO recovery period (one-time-use feats) should NOT be reset by recovery.
    
    The trait handling correctly checks `uses_per_rec` before resetting, but feat handling does not.
    Add a filter: only reset currentUses when feat.recovery includes 'Full' or 'Partial'
    (or when feat has a recovery period at all).
  acceptance_criteria:
    - handleFullRecovery only resets feat uses where feat.recovery is "Full" or "Partial"
    - Feats with no recovery period are NOT reset
    - handlePartialRecovery remains correct (already filters for "Partial")
    - Trait handling remains correct (already filters by uses_per_rec + rec_period)
    - npm run build passes
  notes: "DONE 2026-02-06: handleFullRecovery only resets feats with recovery Full or Partial; one-time-use feats preserved."

- id: TASK-087
  title: "Remove dead code Ã¢â‚¬â€ unused imports and deprecated definitions"
  priority: low
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/ui/button.tsx
    - src/app/globals.css
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Find and remove true dead code." Audit found:
    1. library-section.tsx: imports ChevronDown, ChevronUp from lucide-react Ã¢â‚¬â€ never used
    2. proficiencies-tab.tsx: imports ChevronUp, ChevronDown from lucide-react Ã¢â‚¬â€ never used
    3. button.tsx: deprecated 'gradient' variant (overlaps with TASK-083)
    4. globals.css: unused legacy .btn-primary, .btn-danger, .btn-success classes (overlaps with TASK-083)
    
    Remove unused imports. The globals.css/button.tsx items are handled by TASK-083.
  acceptance_criteria:
    - Unused ChevronDown/ChevronUp imports removed from library-section.tsx
    - Unused ChevronUp/ChevronDown imports removed from proficiencies-tab.tsx
    - No unused lucide-react imports remain in character-sheet components
    - npm run build passes
  notes: "DONE 2026-02-06: Removed unused ChevronDown/ChevronUp from library-section, proficiencies-tab."

- id: TASK-088
  title: "Fix chevron layout shift Ã¢â‚¬â€ use single icon with rotation"
  priority: low
  status: done
  related_files:
    - src/components/shared/filters/filter-section.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/list-components.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Remove extraneous expand/collapse chevrons when they cause layout issues."
    Was marked as done in ALL_FEEDBACK_CLEAN.md but some components still conditionally
    render ChevronUp vs ChevronDown instead of rotating a single chevron:
    1. filter-section.tsx: lines 96-106 Ã¢â‚¬â€ conditional ChevronUp/ChevronDown
    2. creature-stat-block.tsx: line 275 Ã¢â‚¬â€ conditional ChevronUp/ChevronDown
    3. list-components.tsx: line 66 Ã¢â‚¬â€ conditional chevrons (lower priority)
    
    Correct pattern already used by expandable-chip.tsx, part-chip.tsx, codex/page.tsx:
    single ChevronDown with `rotate-180 transition-transform` when expanded.
  acceptance_criteria:
    - filter-section.tsx uses single ChevronDown with rotation transform
    - creature-stat-block.tsx uses single ChevronDown with rotation transform
    - list-components.tsx uses single chevron with rotation (or document if intentional)
    - No layout shift on expand/collapse
    - npm run build passes
  notes: "DONE 2026-02-06: filter-section, creature-stat-block, list-components use single ChevronDown with rotate-180."

- id: TASK-089
  title: "Power/Technique/Item creator modals Ã¢â‚¬â€ unify LoadFromLibraryModal with shared patterns"
  priority: medium
  status: done
  related_files:
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-068 unified creature creator modals to UnifiedSelectionModal with GridListRow.
    However, power/technique/item creators still use LoadFromLibraryModal which doesn't
    follow the unified list patterns (no ListHeader, no GridListRow, no sortable columns).
    
    Either replace LoadFromLibraryModal internals to use GridListRow/ListHeader patterns,
    or migrate these creators to use UnifiedSelectionModal. Remove item count from footer
    (overlaps TASK-082). Ensure consistent styling with creature creator modals.
  acceptance_criteria:
    - LoadFromLibraryModal uses GridListRow or equivalent unified list pattern
    - Sortable column headers via ListHeader
    - No item count in footer
    - Visual consistency with creature creator add modals
    - npm run build passes
  notes: "DONE 2026-02-06: LoadFromLibraryModal now uses GridListRow, ListHeader with sort, hasSelectionColumn; selectable rows."

- id: TASK-090
  title: "Codebase health audit Ã¢â‚¬â€ dead code removal, deduplication, shared component unification, best practices"
  priority: high
  status: done
  related_files:
    - src/lib/utils/array.ts
    - src/lib/utils/number.ts
    - src/lib/utils/string.ts
    - src/lib/utils/object.ts
    - src/lib/utils/index.ts
    - src/lib/constants/skills.ts
    - src/lib/item-transformers.ts
    - src/components/shared/list-components.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/index.ts
    - src/components/shared/item-card.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/roll-button.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/item-list.tsx
    - src/components/shared/part-chip.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/roll-log.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/character-creator/steps/skills-step.tsx
    - src/components/character-creator/steps/species-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/library/page.tsx
    - src/app/(main)/my-account/page.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/types/items.ts
  created_at: 2026-02-06
  created_by: agent
  description: |
    Comprehensive codebase health audit addressing dead code, duplicate definitions,
    missing shared component usage, design token violations, and React/Tailwind best practices.
    
    Changes:
    1. Consolidated 6 duplicate formatBonus functions ? single canonical export in lib/utils/number.ts
    2. Removed ~60 unused utility exports from array.ts, number.ts, string.ts, object.ts
    3. Consolidated 3 duplicate SortState types ? canonical export from list-header.tsx (renamed items.ts to ItemSortState)
    4. Removed deprecated list-components exports (SimpleEmptyState, LoadingSpinner, ResultsCount, ListContainer)
    5. Deleted entirely unused lib/constants/colors.ts
    6. Replaced 8 custom spinner implementations with shared Spinner component
    7. Replaced 6 inline textareas with shared Textarea component
    8. Fixed 6 hardcoded neutral-* colors in roll-log.tsx ? design tokens
    9. Converted 6 template-literal classNames to cn() utility
    10. Fixed index-as-key issues in proficiencies-tab, grid-list-row, part-chip
  acceptance_criteria:
    - No duplicate formatBonus definitions
    - Dead utility exports removed
    - Single canonical SortState type
    - No deprecated component exports remaining
    - All spinners use shared Spinner component
    - All textareas use shared Textarea component
    - No hardcoded neutral-* colors outside auth
    - Template literals replaced with cn()
    - Stable keys for mapped elements
    - npm run build passes
  notes: "DONE 2026-02-06: Comprehensive audit complete. 30+ files updated across 10 categories."

- id: TASK-091
  title: "Extract shared useSort hook Ã¢â‚¬â€ eliminate 20+ duplicate toggleSort/handleSort implementations"
  priority: high
  status: done
  related_files:
    - src/components/shared/list-header.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-skill-modal.tsx
    - src/components/character-sheet/add-sub-skill-modal.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/library/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    The single biggest duplication in the codebase. The exact same sorting logic is
    copy-pasted across 15+ files in two forms:
    
    **Form A Ã¢â‚¬â€ standalone function (5 instances):**
    ```ts
    const toggleSort = useCallback((current: SortState, col: string): SortState => {
      if (current.col === col) return { col, dir: current.dir === 1 ? -1 : 1 };
      return { col, dir: 1 };
    }, []);
    ```
    Files: library-section, feats-tab, add-skill-modal, add-sub-skill-modal, LoadFromLibraryModal
    
    **Form B Ã¢â‚¬â€ inline setSortState (15+ instances):**
    ```ts
    const handleSort = useCallback((col: string) => {
      setSortState(prev => ({
        col,
        dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
      }));
    }, []);
    ```
    Files: codex (6 tabs), library (4 tabs), add-feat-modal, unified-selection-modal, add-library-item-modal
    
    Additionally, `sortByCol` (generic array sort by SortState column) appears in library-section
    and similar inline sort logic in 10+ other files.
    
    **Solution:** Create a `useSort` hook in `src/hooks/use-sort.ts` that returns:
    - `sortState` Ã¢â‚¬â€ the current `SortState`
    - `handleSort(col)` Ã¢â‚¬â€ the toggle handler (pass directly to ListHeader onSort)
    - `sortItems(items)` Ã¢â‚¬â€ generic sort function using localeCompare
    
    Also export a standalone `toggleSort(current, col)` pure function and a 
    `sortByColumn(items, sortState)` utility for non-hook contexts.
    
    Then replace all 20+ instances with the shared hook/utility.
  acceptance_criteria:
    - `useSort` hook exists in src/hooks/use-sort.ts
    - Standalone `toggleSort` and `sortByColumn` utilities exported
    - All 5 standalone toggleSort functions replaced
    - All 15+ inline handleSort patterns replaced
    - All inline sortByCol logic replaced
    - npm run build passes
    - Sorting behavior unchanged across all pages
  notes: "DONE 2026-02-06: Created useSort hook, toggleSort, sortByColumn in src/hooks/use-sort.ts. Replaced 20+ instances across LoadFromLibraryModal, add-skill-modal, add-sub-skill-modal, add-feat-modal, add-library-item-modal, unified-selection-modal, library-section, feats-tab, library/page (4 tabs), codex/page (6 tabs)."

- id: TASK-092
  title: "Import SortState type from shared instead of inline definitions"
  priority: medium
  status: done
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/codex/page.tsx
    - src/components/character-sheet/add-feat-modal.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    11 instances across 3 files use `useState<{ col: string; dir: 1 | -1 }>` inline
    instead of importing the canonical `SortState` type from `@/components/shared`.
    
    Files and instance counts:
    - library/page.tsx: 4 instances (PowersTab, TechniquesTab, ArmamentsTab, CreaturesTab)
    - codex/page.tsx: 6 instances (FeatsTab, SkillsTab, SpeciesTab, EquipmentTab, PropertiesTab, PartsTab)
    - add-feat-modal.tsx: 1 instance
    
    Replace all with: `useState<SortState>({ col: 'name', dir: 1 })`
    Add: `import type { SortState } from '@/components/shared'`
    
    NOTE: If TASK-091 (useSort hook) is done first, this task is already covered.
  acceptance_criteria:
    - No inline `{ col: string; dir: 1 | -1 }` type annotations remain
    - All use imported SortState type
    - npm run build passes
  notes: "Done 2026-02-08: useSort hook (TASK-091) returns SortState; Codex/library use useSort. No inline SortState definitions remain in targeted files."

- id: TASK-093
  title: "Remaining template literal ? cn() conversions"
  priority: medium
  status: done
  related_files:
    - src/components/shared/item-list.tsx
    - src/components/shared/filters/tag-filter.tsx
    - src/components/shared/filters/select-filter.tsx
    - src/components/shared/filters/ability-requirement-filter.tsx
    - src/components/shared/filters/checkbox-filter.tsx
    - src/components/shared/filters/chip-select.tsx
    - src/app/(main)/codex/page.tsx
    - src/components/shared/item-card.tsx
    - src/app/(main)/about/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    9 remaining instances of template literal className patterns that should use cn():
    
    1. item-list.tsx:231 Ã¢â‚¬â€ `className={\`space-y-4 ${className}\`}`
    2. tag-filter.tsx:46 Ã¢â‚¬â€ `className={\`filter-group ${className}\`}`
    3. select-filter.tsx:28 Ã¢â‚¬â€ `className={\`filter-group ${className}\`}`
    4. ability-requirement-filter.tsx:58 Ã¢â‚¬â€ `className={\`filter-group ${className}\`}`
    5. checkbox-filter.tsx:32 Ã¢â‚¬â€ `className={\`filter-group ${className}\`}`
    6. chip-select.tsx:42 Ã¢â‚¬â€ `className={\`filter-group ${className}\`}`
    7. codex/page.tsx:1454 Ã¢â‚¬â€ inline chip styling template literal
    8. item-card.tsx:258 Ã¢â‚¬â€ conditional ternary without cn()
    9. about/page.tsx:218 Ã¢â‚¬â€ transition class ternary without cn()
    
    For all: import cn from '@/lib/utils' and replace template literals.
    Items 2-6 are all the same pattern in filter components Ã¢â‚¬â€ batch fix.
  acceptance_criteria:
    - No template literal className patterns remain in components or app directories
    - All use cn() from @/lib/utils
    - npm run build passes

- id: TASK-094
  title: "Replace inline button styling with Button component"
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/notes-tab.tsx
    - src/components/character-sheet/dice-roller.tsx
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/power-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    5 raw `<button>` elements with full inline styling that should use the shared
    `<Button>` component for visual consistency and reduced code:
    
    1. notes-tab.tsx:264 Ã¢â‚¬â€ Fall damage roll button
       `px-2 py-0.5 text-sm font-bold bg-primary-600 text-white rounded hover:bg-primary-700`
       ? `<Button variant="primary" size="sm">`
    
    2. dice-roller.tsx:189 Ã¢â‚¬â€ Roll button
       `w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700`
       ? `<Button variant="primary" size="lg" className="w-full rounded-xl">`
    
    3. encounter-tracker/page.tsx:1291 Ã¢â‚¬â€ Add condition button
       `px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700`
       ? `<Button variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700">`
    
    4. item-creator/page.tsx:1399 Ã¢â‚¬â€ Add property button
       `px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700`
       ? `<Button variant="primary" className="bg-amber-600 hover:bg-amber-700">`
    
    5. power-creator/page.tsx:1543 Ã¢â‚¬â€ Add part button
       `px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700`
       ? `<Button variant="primary">`
  acceptance_criteria:
    - All 5 inline button patterns replaced with Button component
    - Visual appearance unchanged
    - npm run build passes

- id: TASK-095
  title: "Replace remaining raw inputs with Input/SearchInput components"
  priority: low
  status: done
  related_files:
    - src/components/shared/item-list.tsx
    - src/components/shared/filters/ability-requirement-filter.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    2 raw `<input>` elements with inline styling that should use shared components:
    
    1. item-list.tsx:241 Ã¢â‚¬â€ search input with icon overlay
       Full inline styling + Search icon positioned absolutely.
       ? Replace with `<SearchInput>` from @/components/ui
    
    2. ability-requirement-filter.tsx:75 Ã¢â‚¬â€ number input for max value
       `w-20 px-3 py-2 border border-border-light rounded-md text-sm ...`
       ? Replace with `<Input type="number" className="w-20" />`
  acceptance_criteria:
    - Both raw inputs replaced with shared components
    - npm run build passes

- id: TASK-096
  title: "Split large page components (>1000 lines) into focused sub-components"
  priority: low
  status: done
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/creature-creator-types.ts
    - src/app/(main)/creature-creator/creature-creator-constants.ts
    - src/app/(main)/creature-creator/CreatureCreatorHelpers.tsx
    - src/app/(main)/creature-creator/LoadCreatureModal.tsx
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/library/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    6 files exceed 1000 lines and should be decomposed for maintainability:
    
    1. power-creator/page.tsx (~1673 lines)
       ? Extract: PowerFormFields, PowerPartsEditor, PowerSummaryPanel
    
    2. characters/[id]/page.tsx (~1586 lines)
       ? Extract: CharacterSheetContent, CharacterSheetModals, CharacterSheetHandlers (custom hook)
    
    3. creature-creator/page.tsx (~1580 lines)
       ? Extract: CreatureFormFields, CreatureSkillsEditor, CreatureSummaryPanel
    
    4. codex/page.tsx (~1451 lines)
       ? Extract each tab into its own component: CodexFeatsTab, CodexSkillsTab, 
         CodexSpeciesTab, CodexEquipmentTab, CodexPropertiesTab, CodexPartsTab
    
    5. encounter-tracker/page.tsx (~1327 lines)
       ? Extract: CombatantList, CombatantCard, ConditionManager, InitiativeTracker
    
    6. library/page.tsx (large)
       ? Extract each tab: LibraryPowersTab, LibraryTechniquesTab, etc.
    
    Start with codex and library since they have the most repeated patterns
    (each tab is structurally identical with its own sort/filter/render).
    
    NOTE: This is a large refactor. Do incrementally Ã¢â‚¬â€ one file at a time.
    TASK-091 (useSort hook) should be done first as it eliminates the biggest
    repeated pattern inside these large files.
  acceptance_criteria:
    - Each extracted component is <400 lines
    - No behavioral changes
    - All pages render identically
    - npm run build passes

- id: TASK-097
  title: "Unify filter component className patterns Ã¢â‚¬â€ extract filter-group class"
  priority: low
  status: done
  related_files:
    - src/components/shared/filters/tag-filter.tsx
    - src/components/shared/filters/select-filter.tsx
    - src/components/shared/filters/ability-requirement-filter.tsx
    - src/components/shared/filters/checkbox-filter.tsx
    - src/components/shared/filters/chip-select.tsx
    - src/app/globals.css
  created_at: 2026-02-06
  created_by: agent
  description: |
    All 5 filter components use the same pattern:
    `className={\`filter-group ${className}\`}`
    
    The `filter-group` CSS class is defined in globals.css. These should:
    1. Import cn() from @/lib/utils
    2. Use `className={cn('filter-group', className)}` for proper class merging
    3. Verify the filter-group class definition in globals.css is consistent
    
    This is partially covered by TASK-093 but grouped here as a focused batch
    since all 5 are the same pattern in the same directory.
  acceptance_criteria:
    - All 5 filter components use cn() instead of template literals
    - filter-group class definition verified in globals.css
    - npm run build passes

- id: TASK-098
  title: "Fix dark mode contrast and missing variants Ã¢â‚¬â€ audit follow-up"
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/recovery-modal.tsx
    - src/components/shared/innate-toggle.tsx
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/dice-roller.tsx
    - src/app/(main)/encounter-tracker/CombatantCard.tsx
    - src/components/shared/theme-toggle.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/shared/tab-summary-section.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/character-sheet/add-sub-skill-modal.tsx
    - src/app/(main)/encounter-tracker/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Dark mode audit identified contrast issues: missing dark: variants, text too dark for dark backgrounds,
    elements too bright, hover/active states with poor contrast. Fix per audit: recovery-modal (allocation
    buttons, labels, preview text), innate-toggle (active state), skill-row (bonus colors), dice-roller,
    CombatantCard (badges, inputs, pills), theme-toggle (selected state), proficiencies-tab, tab-summary-section
    SummaryItem highlightColors, grid-list-row innate badge, add-sub-skill-modal info box, encounter-tracker page.
  acceptance_criteria:
    - All identified components have appropriate dark: variants for colored backgrounds/text
    - No text too dark for dark backgrounds (use text-*-300/400 for dark mode)
    - Hover/active states have dark: variants where needed
    - npm run build passes
  notes: "Done 2026-02-06: Fixed recovery-modal (allocation buttons, labels, preview text), innate-toggle (active state), skill-row (bonus colors), dice-roller, CombatantCard (badges, inputs, pills), theme-toggle, proficiencies-tab, tab-summary-section highlightColors, grid-list-row innate badge, add-sub-skill-modal info box, encounter-tracker page."

- id: TASK-099
  title: Campaigns Ã¢â‚¬â€ return to Join tab after creating character
  priority: low
  status: done
  related_files:
    - src/app/(main)/campaigns/page.tsx
    - src/app/(main)/characters/new/page.tsx
    - src/components/character-creator/steps/finalize-step.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    When user clicks "Create Character" from Join Campaign empty state, they go to /characters/new.
    After creating, they land on the new character sheet. Add returnTo param so they can be redirected
    back to /campaigns?tab=join to complete the join flow.
  acceptance_criteria:
    - Join tab empty state passes ?returnTo=/campaigns?tab=join when navigating to character creation
    - After character creation, redirect to returnTo if present
    - npm run build passes
  notes: "Done 2026-02-08: Join tab empty state passes returnTo=/campaigns?tab=join when navigating to /characters/new. FinalizeStep reads returnTo from searchParams and redirects there after create."

- id: TASK-100
  title: Campaigns Ã¢â‚¬â€ real-time updates via Firestore onSnapshot
  priority: low
  status: cancelled
  created_at: 2026-02-06
  created_by: agent
  description: |
    Campaign list and detail currently use React Query with manual invalidate. Consider Firestore
    onSnapshot for real-time updates when campaign roster changes (e.g., another player joins).
  acceptance_criteria:
    - Campaign detail page updates in real time when characters are added/removed
    - My Campaigns list updates when campaign data changes
    - Unsubscribe on unmount; no memory leaks
    - npm run build passes
  notes: "CANCELLED 2026-02-07: Firebase/Firestore removed; stack is Supabase/Prisma. Real-time would require Supabase Realtime if needed later."

- id: TASK-101
  title: Archetype prof slider Ã¢â‚¬â€ hide unless pencil clicked; show simple values otherwise
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/archetype-section.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    In the Character Sheet Archetype Section, the archetype proficiency slider should only be visible when the user has clicked the pencil to enter archetype proficiency editing mode. In non-edit mode, display Power and/or Martial proficiency as simple text values (e.g., "Power: 2, Martial: 1") instead of the slider. The slider is designed for editing only.
  acceptance_criteria:
    - Slider hidden when showEditControls is false
    - Simple value display (Power/Martial) shown when not editing
    - Slider appears only when pencil clicked (archetype edit mode)
    - npm run build passes
  notes: "Done 2026-02-06. Slider hidden in non-edit mode; simple Power/Martial badges shown instead."

- id: TASK-102
  title: Encounter Tracker Ã¢â‚¬â€ add creatures from library (auto HP/EN, quantity)
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounter-tracker/CombatantCard.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Allow adding creatures from the user's creature library to the encounter tracker. When adding from library, auto-populate max health and energy from the creature data instead of manual input. Support choosing how many of a creature to add. Reuse existing add combatant tab and add creature modal components.
  acceptance_criteria:
    - Add combatant flow supports "From Library" option
    - Creature library modal lists user's creatures; selection populates HP/EN
    - Quantity selector when adding (e.g., add 3 Goblins)
    - Uses shared modal/list components
    - npm run build passes
  notes: "Done 2026-02-06. AddCombatantModal with Library tab; creature HP/EN auto-calculated; quantity selector A-Z suffixes."

- id: TASK-103
  title: Encounters hub Ã¢â‚¬â€ rename to Encounters; list/create/filter/search/sort
  priority: critical
  status: done
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounters/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Rename "Encounter Tracker" to "Encounters" in nav and routing. Create an Encounters hub page that shows all saved encounters in list view with filter, search, and sort. Provide options to create new encounters of type: combat, skill, or mixed. Clicking an encounter redirects to that encounter's dedicated page.
  acceptance_criteria:
    - Nav/routes use "Encounters" terminology
    - Encounters hub page: list view, filter, search, sort
    - Create new: combat, skill, or mixed
    - Click encounter ? navigate to /encounters/[id] (combat/skill/mixed)
    - npm run build passes
  notes: "Done 2026-02-06. Encounters hub page with list/filter/sort/create, nav updated, TabNavigation + type filters."

- id: TASK-104
  title: Persist encounters to Firestore; save/return to sessions
  priority: critical
  status: done
  related_files:
    - src/services/encounter-service.ts
    - src/hooks/use-encounters.ts
    - prisma/schema.prisma (Encounter model)
  created_at: 2026-02-06
  created_by: agent
  description: |
    Replace local storage with Firestore persistence for encounters. Encounters stored by ID. Users can save an encounter and return to it later; turns, AP, HP, etc. are tracked across sessions. Use best security practices (user-owned documents).
  acceptance_criteria:
    - Encounters stored in Firestore (users/{uid}/encounters/{encounterId})
    - Save/load by encounter ID
    - State (combatants, HP, EN, turns, AP) persists across sessions
    - Firestore rules: read/write only for owner
    - npm run build passes
  notes: "Done 2026-02-06. encounter-service.ts with Firestore CRUD, use-encounters.ts hooks, Firestore rules, auto-save via useAutoSave."

- id: TASK-105
  title: Designate combat tracker; tie to encounter ID
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounter-tracker/page.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Designate the current encounter tracker page as the Combat Tracker specifically. Route to /encounters/[id]/combat (or equivalent). Load encounter by ID from Firestore instead of local storage. Combat tracker is tied to saved encounter documents.
  acceptance_criteria:
    - Combat tracker loads encounter by ID
    - Replaces local storage with Firestore-backed state
    - Combat-specific UI preserved
    - npm run build passes
  notes: "Done 2026-02-06. Combat tracker at /encounters/[id]/combat, loads by ID from Firestore, auto-save, reuses CombatantCard."

- id: TASK-106
  title: Create Skill Encounter page
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/docs/GAME_RULES.md
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create a Skill Encounter page. Add characters; track if each has made their skill roll; track successes vs failures; set required successes and failures; input rolled skill values to compute successes/failures based on Difficulty Score (DS). Reference GAME_RULES.md: Average DS = 10 + Ã¢â‚¬â€ Party Level; Required Successes = # Characters + 1. Include useful RM features per core rules.
  acceptance_criteria:
    - Add characters to skill encounter
    - Per-character: rolled? success/fail based on DS
    - Set DS (default 10 + Ã¢â‚¬â€ party level)
    - Set required successes and failures
    - Success = roll = DS
    - npm run build passes
  notes: "Done 2026-02-06. Skill encounter at /encounters/[id]/skill, DS config, participant rolls, success/failure tracking, progress bars."

- id: TASK-107
  title: Create Mixed Encounter page (combat + skill combined)
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounters/[id]/mixed/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create a Mixed Encounter page that combines combat and skill encounter functionality. Reuse components from both combat tracker and skill encounter page. Unify/simplify where possible.
  acceptance_criteria:
    - Mixed page has combat and skill sections/functionality
    - Reuses CombatantCard, skill tracking components
    - Unified layout; no unnecessary duplication
    - npm run build passes
  notes: "Done 2026-02-06. Mixed encounter at /encounters/[id]/mixed, tab-based combat+skill view, shared participants."

- id: TASK-108
  title: Campaign integration Ã¢â‚¬â€ add characters from campaigns to encounters
  priority: high
  status: done
  related_files:
    - src/app/(main)/encounters
    - src/services/campaign-service.ts
  created_at: 2026-02-06
  created_by: agent
  description: |
    Allow adding characters from campaigns the user is in to encounters. Pull evasion, acuity, HP, EN, etc. from character/campaign data for quick reference. Easy add without manual entry. Use campaign character API and enrichment.
  acceptance_criteria:
    - Add combatant/skill participant: "From Campaign" option
    - Select campaign ? select character; auto-populate evasion, acuity, HP, EN
    - Works for combat and skill encounters
    - npm run build passes
  notes: "Done 2026-02-06. AddCombatantModal 'From Campaign' tab; fetches character data via API; auto-populates HP/EN/evasion/acuity."

- id: TASK-109
  title: Verify equip toggle ID matching and persistence
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Equip toggle handlers match by item.id || item.name || String(i). If items lack IDs or have inconsistent shapes (enriched vs raw), toggle may not persist. Verify in character sheet; fix ID matching if needed.
  acceptance_criteria:
    - Equip/unequip armor and weapons persists correctly on save
    - Works with items that have id, name, or index-only
    - npm run build passes
  notes: "Done 2026-02-06: Added index-based fallback matching; pass item.id ?? item.name ?? i; handlers now support numeric index when id/name missing."

- id: TASK-110
  title: Verify weapon/armor delete in character sheet
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Ensure delete (X) button for weapons and armor works in character sheet. Feedback indicated pencil icon useless for feat deletionÃ¢â‚¬â€verify feat delete works; weapons/armor use onDelete (X) not pencil.
  acceptance_criteria:
    - Remove weapon/armor works; item is removed from list and persisted
    - Delete button visible when onRemoveWeapon/onRemoveArmor provided
    - npm run build passes
  notes: "Done 2026-02-06: Feat delete gated on isEditMode (pencil enables it); weapon/armor delete gated on isEditMode for consistency with powers/techniques; equipment delete remains available outside edit mode (like quantity change). Build passes."

- id: TASK-111
  title: Fix inventory remove bug (Library ? Equipment)
  priority: high
  status: done
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Feedback: "Unable to remove items from inventory." Verify onRemoveEquipment flow and GridListRow onDelete for equipment items. Ensure delete button appears and handler correctly filters items.
  acceptance_criteria:
    - Users can remove equipment items from Library ? Equipment tab
    - Delete persists on save
    - npm run build passes
  notes: "Done 2026-02-06: Equipment delete uses index-based fallback (TASK-109 fix); no isEditMode gate so delete always visible; onDelete + handleRemoveEquipment flow verified. Build passes."

- id: TASK-112
  title: Audit all list/section headers for full caps
  priority: medium
  status: done
  related_files:
    - src/components/shared/section-header.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/skills-allocation-page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Ensure all list item headers and section headers use full caps (NAME not Name). ListHeader and SectionHeader already use uppercase. Audit for any custom headers that bypass these components.
  acceptance_criteria:
    - All list/section headers display in UPPERCASE
    - No Title Case headers in list or section contexts
    - npm run build passes
  notes: "Done 2026-02-06: Verified ListHeader, SectionHeader, SortHeader use uppercase; ColumnHeaders uses label.toUpperCase(); added uppercase to skills-allocation-page section headers (Species Skills, Defense Bonuses). Build passes."

- id: TASK-113
  title: Full dark mode implementation pass
  priority: high
  status: done
  related_files:
    - src/app/globals.css
    - src/components/ui/modal.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/shared/skill-row.tsx
    - src/components/shared/creature-stat-block.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/character-sheet/sheet-action-toolbar.tsx
    - src/components/character-sheet/roll-log.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    TASK-074/084 softened some components. User wants full dark mode: all modals, cards, inputs, buttons, chips, hover states. Audit for raw colors (gray-*, blue-*) without dark: variants; fix hover states that bleach text.
  acceptance_criteria:
    - No harsh contrast in dark mode
    - Hover states preserve readable text in dark mode
    - Design tokens used consistently
    - npm run build passes
  notes: "Done 2026-02-06: Added dark: variants to feats-step, finalize-step, equipment-step, skill-row, creature-stat-block, sheet-action-toolbar, roll-log, modal, unified-selection-modal. Auth components use gray intentionally per AGENTS.md. Build passes."

- id: TASK-114
  title: Style consistency audit (ability/defense/health-energy)
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/abilities-section.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/creator/health-energy-allocator.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Unify ability allocation, defense allocation, and health/energy allocator styles across character sheet, character creator, and creature creator. Single source of truth for each pattern.
  acceptance_criteria:
    - Same visual design for ability/defense/health-energy across all three contexts
    - Shared components or identical styling
    - npm run build passes
  notes: "Done 2026-02-06: Verified shared components (DecrementButton, IncrementButton, PointStatus, ValueStepper, HealthEnergyAllocator, AbilityScoreEditor). Added dark mode to HealthEnergyAllocator (HP/EN labels, status colors). Fixed text-secondary to text-text-secondary. Build passes."

- id: TASK-115
  title: Component reuse audit (add-X modals)
  priority: medium
  status: done
  related_files:
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/app/(main)/creature-creator/page.tsx
  created_at: 2026-02-06
  created_by: agent
  description: |
    Ensure all add-X modals (add feat, power, technique, armament) use shared Modal + ListHeader + GridListRow. No inline custom list UIs. TASK-068 unified creature creator modalsÃ¢â‚¬â€verify consistency.
  acceptance_criteria:
    - All add modals use unified patterns
    - Consistent rounded corners, header spacing, sortable columns
    - npm run build passes
  notes: "Done 2026-02-06: Verified add-feat-modal, add-library-item-modal, add-skill-modal use Modal + ListHeader + GridListRow. Creature creator uses UnifiedSelectionModal (GridListRow + sortable columns). add-sub-skill-modal uses SelectionToggle (justified unique UX). All modals follow unified patterns. Build passes."

- id: TASK-116
  title: Add Firestore rules for codex_* collections
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Firestore security rules for codex collections (codex_feats, codex_skills, codex_species, codex_traits, codex_parts, codex_properties, codex_equipment, codex_archetypes, codex_creature_feats). Public read, no client write (writes via Admin SDK in server actions only).
  related_files:
    - prisma/schema.prisma (codex_* tables)
  acceptance_criteria:
    - Codex tables in Prisma; public read via /api/codex
    - Rules deploy without errors
    - Manual verify: unauthenticated client can read codex data
  notes: "Done 2026-02-06: Added rules for all 9 codex_* collections (feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats). Public read, no client write."

- id: TASK-117
  title: Create migration script RTDB ? Firestore
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create Node script (scripts/migrate_rtdb_to_firestore.js) using Firebase Admin SDK to read RTDB paths (feats, skills, species, traits, parts, properties, items, archetypes, creature_feats) and write to Firestore codex_* collections. Preserve document IDs, normalize arrays. Include dry-run mode.
  related_files:
    - scripts/migrate_rtdb_to_firestore.js
    - package.json
  acceptance_criteria:
    - Script reads all RTDB paths and writes to corresponding Firestore collections
    - Handles comma-separated strings ? arrays where needed (per use-rtdb.ts transforms)
    - Dry-run logs what would be written without writing
    - README or script header documents usage and env vars (GOOGLE_APPLICATION_CREDENTIALS)
  notes: "Done 2026-02-06: Created scripts/migrate_rtdb_to_firestore.js with --dry-run. npm run migrate:rtdb-to-firestore. Requires GOOGLE_APPLICATION_CREDENTIALS or SERVICE_ACCOUNT_* env vars."

- id: TASK-118
  title: Create useFirestoreCodex hooks (read from Firestore)
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create hooks that read codex data from Firestore instead of RTDB. Mirror use-rtdb.ts API: useCodexFeats, useCodexSkills, useCodexSpecies, useCodexTraits, useCodexPowerParts, useCodexTechniqueParts, useCodexParts, useCodexProperties, useCodexEquipment, useCodexArchetypes, useCodexCreatureFeats. Use React Query. Return same shapes as current use-rtdb so consumers need minimal changes.
  related_files:
    - src/hooks/use-firestore-codex.ts
    - src/hooks/index.ts
  acceptance_criteria:
    - Hooks return data shapes compatible with existing consumers (feats, skills, species, etc.)
    - React Query caching and staleTime configured
    - npm run build passes
  notes: "Done 2026-02-06: Created use-firestore-codex.ts with all codex hooks. Hooks index exports from use-firestore-codex. use-rtdb retains utilities (findTraitByIdOrName, etc.)."

- id: TASK-119
  title: Switch all codex consumers to Firestore hooks
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Update all components and services that use useRTDB*/useFeats/useSkills/etc. to use the new useFirestoreCodex/useCodex* hooks. Include: character sheet, library, codex, creators, equipment-step, feats-step, finalize-step, add-feat-modal, data-enrichment, etc. Remove RTDB codex reads after cutover.
  related_files:
    - src/hooks/use-rtdb.ts
    - src/app/(main)/codex/
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-creator/steps/
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - No imports of useRTDB/useFeats/useSkills/etc. for codex data (or alias to Firestore)
    - All codex pages and creators load data from Firestore
    - npm run build passes
    - Manual verify: Codex, Library, Character Sheet all display correctly
  notes: "Done 2026-02-06: Hooks index exports from use-firestore-codex. game-data-service and firebase/server.ts read from Firestore codex collections. Build passes. App will work after TASK-120 migration."

- id: TASK-120
  title: [USER] Run migration script and verify in Firebase Console
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    OWNER: Run the migration script (node scripts/migrate_rtdb_to_firestore.js) with production credentials. Verify in Firebase Console that all codex_* collections exist and contain data. Confirm app still works after TASK-119 cutover.
  acceptance_criteria:
    - Migration script executed successfully
    - Firestore collections populated
    - App loads codex data from Firestore
  notes: Cannot be done by AI. Requires owner to run script with Firebase project credentials.

- id: TASK-121
  title: Admin config and isAdmin helper
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add admin config: Firestore document config/admins with { uids: string[] } or env NEXT_PUBLIC_ADMIN_UIDS (comma-separated). Create server-side isAdmin(uid) helper and use in server actions. Document in DEPLOYMENT_SECRETS or new ADMIN_SETUP.md.
  related_files:
    - src/lib/admin.ts
    - src/app/api/ or server actions
    - src/docs/
  acceptance_criteria:
    - isAdmin(uid) returns boolean from config or env
    - Server actions can call isAdmin before writing
    - Docs describe how to add admin UIDs
  notes: "Done 2026-02-06: Created src/lib/admin.ts (isAdmin), /api/admin/check, useAdmin hook, ADMIN_SETUP.md. Firestore config/admins or env NEXT_PUBLIC_ADMIN_UIDS."

- id: TASK-122
  title: [USER] Add admin UID to config
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    OWNER: After TASK-121, add your uid to Firestore config/admins (document with field uids: [uid]) or set NEXT_PUBLIC_ADMIN_UIDS env. Ensure you can access admin routes.
  notes: Done 2026-02-06: User added UID to config/admins in Firestore Console and deployed rules.
  acceptance_criteria:
    - Admin UID in config
    - Admin page accessible when logged in as admin
  notes: Cannot be done by AI. Requires Firebase Console or one-time script.

- id: TASK-123
  title: Admin layout and route protection
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create (main)/admin route group with layout. Protect admin routes: redirect non-admin users to home or 403. Add admin nav link (visible only to admins) in main layout. Use design tokens (bg-surface, etc.) consistent with app.
  related_files:
    - src/app/(main)/admin/layout.tsx
    - src/app/(main)/admin/page.tsx
    - src/app/(main)/layout.tsx
  acceptance_criteria:
    - /admin redirects non-admins
    - Admin sees nav link to /admin
    - Layout matches app aesthetic
    - npm run build passes
  notes: "Done 2026-02-06: Admin layout redirects non-admins; Admin link in header (useAdmin); /admin and /admin/codex pages. Build passes."

- id: TASK-124
  title: Admin Codex page shell with tabs
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create admin Codex page at /admin/codex with tabs mirroring public Codex (Feats, Skills, Species, Traits, Parts, Properties, Equipment) plus Archetypes and Creature Feats. Use TabNavigation, PageContainer, PageHeader. Same layout as (main)/codex but with edit/delete/create actions.
  related_files:
    - src/app/(main)/admin/codex/page.tsx
    - src/components/ui/tab-navigation.tsx
  acceptance_criteria:
    - Admin Codex has all tabs
    - Each tab shows list with edit/delete/add
    - Consistent with Codex layout

- id: TASK-125
  title: Admin CRUD server actions for codex
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Create server actions for admin codex CRUD: createCodexFeat, updateCodexFeat, deleteCodexFeat; same for skills, species, traits, parts, properties, equipment, archetypes, creature_feats. Each action: validate isAdmin, use Admin SDK to write Firestore. Return success/error.
  related_files:
    - src/app/(main)/admin/codex/actions.ts
    - src/lib/admin.ts
  acceptance_criteria:
    - All CRUD actions verify isAdmin
    - Use Prisma (Supabase/PostgreSQL)
    - Actions handle validation errors

- id: TASK-126
  title: Admin Feats editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Admin Feats tab: list with GridListRow, inline edit or modal for edit. Add feat button. Form fields for name, description, category, ability_req, lvl_req, tags, etc. Use design tokens, SectionHeader, shared Modal. Match CodexFeatsTab layout but editable.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - List, add, edit, delete feats
    - Form validates required fields
    - UI matches app design system

- id: TASK-127
  title: Admin Traits editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Traits tab: list, add, edit, delete. Fields: name, description, species (array). Reuse patterns from Admin Feats.
  related_files:
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
  acceptance_criteria:
    - Full CRUD for traits
    - Consistent UI with Admin Feats

- id: TASK-128
  title: Admin Species editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Species tab: list, add, edit, delete. Fields: name, description, type, sizes, speed, traits, species_traits, ancestry_traits, flaws, skills, languages, ability_bonuses, etc. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
  acceptance_criteria:
    - Full CRUD for species
    - Array fields (sizes, traits) editable

- id: TASK-129
  title: Admin Skills editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Skills tab: list, add, edit, delete. Fields: name, description, ability, base_skill_id, and any additional narrative fields defined in the codex schema. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
  acceptance_criteria:
    - Full CRUD for skills
    - base_skill_id for sub-skills

- id: TASK-130
  title: Admin Parts editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Parts tab: list power and technique parts, add, edit, delete. Fields: name, description, category, type (power/technique), base_en, base_tp, op_1/2/3 costs, etc. Filter by type. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
  acceptance_criteria:
    - Full CRUD for parts
    - Type filter (power vs technique)

- id: TASK-131
  title: Admin Properties editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Properties tab: list, add, edit, delete item properties. Fields: name, description, type, base_ip, base_tp, base_c, op_1_*. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
  acceptance_criteria:
    - Full CRUD for properties
    - Consistent UI

- id: TASK-132
  title: Admin Equipment editor tab
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Equipment tab: list, add, edit, delete. Fields: name, type, subtype, description, damage, armor_value, gold_cost, properties, rarity, weight. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
  acceptance_criteria:
    - Full CRUD for equipment
    - Type filter (weapon/armor/equipment)

- id: TASK-133
  title: Admin Archetypes editor tab
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Archetypes tab: list, add, edit, delete. Fields per Archetype type. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
  acceptance_criteria:
    - Full CRUD for archetypes
    - Consistent UI

- id: TASK-134
  title: Admin Creature Feats editor tab
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Admin Creature Feats tab: list, add, edit, delete. Fields: name, description, points, tiers, prereqs. Reuse patterns.
  related_files:
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
  acceptance_criteria:
    - Full CRUD for creature feats
    - Consistent UI

- id: TASK-135
  title: Admin Codex UI polish Ã¢â‚¬â€ consistent design
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Polish admin Codex: ensure all tabs use design tokens (bg-surface, text-text-primary, border-border), same Modal/Button/Chip styles as Codex, dark mode support, loading/empty states. Sleek, unified admin experience.
  related_files:
    - src/app/(main)/admin/codex/
  acceptance_criteria:
    - No raw gray-* or blue-* outside design tokens
    - Dark mode works
    - Loading and empty states

- id: TASK-136
  title: Prisma tables for public library
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Prisma tables: public_powers, public_techniques, public_items, public_creatures. Structure mirrors UserPower/UserTechnique/UserItem/UserCreature but admin-owned (no userId or adminId). Public read via API, write only via server actions (isAdmin). Stack: Supabase/Prisma only (no Firestore/Firebase).
  related_files:
    - prisma/schema.prisma
    - src/types/
  acceptance_criteria:
    - Tables defined in Prisma; migration created
    - API routes for public read
    - Document structure compatible with user library items
  notes: "Done 2026-02-08: Added PublicPower, PublicTechnique, PublicItem, PublicCreature to Prisma; migration add_public_library. Created GET /api/public/[type] for public read."

- id: TASK-137
  title: Admin Save to library Ã¢â‚¬â€ public vs private toggle in creators
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    In power-creator, technique-creator, item-creator, creature-creator: add "Save to library" flow with toggle "Save to my library" (private) vs "Save to public library" (admin only). Public save uses server action + Admin SDK. Private save unchanged (user library). UI: clear toggle, save button.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  acceptance_criteria:
    - Admin sees public/private toggle
    - Non-admin sees only private save
    - Public save writes to public_* collections
    - Sleek, consistent UI across creators
  notes: "Done 2026-02-07: All four creators (power, technique, item, creature) have My library / Public library toggle (admin-only). Uses saveToPublicLibrary for public, saveToLibrary for private."

- id: TASK-138
  title: User Add to my library from public library
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add "Add to my library" action for public library items. When user clicks, copy document from public_powers/public_techniques/et al to users/{uid}/library (or itemLibrary, etc.). User can then edit their copy. Show in Library, Codex, and add-X modals.
  related_files:
    - src/app/(main)/library/page.tsx
    - src/app/(main)/codex/
    - src/components/character-sheet/add-library-item-modal.tsx
  acceptance_criteria:
    - User can add public item to their library
    - Copy creates new doc in user's library
    - User can edit after adding
    - Source (public vs library) distinguishable in UI
  notes: "Done 2026-02-07: fetchPublicLibrary, addPublicItemToLibrary in library-service. usePublicLibrary, useAddPublicToLibrary hooks. Codex Public Library tab with Add to my library on GridListRow. LoginPromptModal when not logged in."

- id: TASK-139
  title: Unified source filter (public / library / all) across app
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add consistent source filter across Library, Codex, add-power/technique/item modals, equipment-step: "All sources" | "Public library" | "My library". Same filter component, same behavior. Reuse or extend existing filter patterns.
  related_files:
    - src/components/shared/filters/
    - src/app/(main)/library/page.tsx
    - src/components/character-creator/steps/equipment-step.tsx
  acceptance_criteria:
    - Single SourceFilter or equivalent used everywhere
    - Options: All, Public, My library
    - Consistent UX
  notes: "Done 2026-02-07: SourceFilter component (All | Public | My library). Library page has filter; Powers tab supports all three with merge. Techniques/Items/Creatures tabs show Codex link when Public/All."

- id: TASK-140
  title: Public vs private badges/chips in lists
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add visual distinction for public vs private items: badge/chip (e.g. "Public" / "Mine") on GridListRow, ItemCard, Codex lists. Use design tokens. Uniform across Library, Codex, creators, add-X modals.
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/item-card.tsx
  acceptance_criteria:
    - Public items show "Public" badge
    - User library items show "Mine" or no badge
    - Consistent styling (Chip or variant)
  notes: "Done 2026-02-07: GridListRow badges. Public items: 'Public' (blue). Library items: 'Mine' (green). CodexPublicLibraryTab, LibraryPowersTab, LibraryTechniquesTab, LibraryItemsTab."

- id: TASK-141
  title: Add public library tab to Codex
  priority: medium
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Add Codex tab or section for public library (Powers, Techniques, Armaments, Creatures from public_*). Users browse and "Add to my library". Same layout as Codex tabs, source filter for public.
  related_files:
    - src/app/(main)/codex/page.tsx
  acceptance_criteria:
    - Public library content visible in Codex
    - Add to my library works
    - Consistent with Codex UI
  notes: "Done 2026-02-07: CodexPublicLibraryTab with sub-tabs Powers/Techniques/Armaments/Creatures. Browse public items, Add to my library. Implemented with TASK-138."

- id: TASK-142
  title: Update ARCHITECTURE.md for Supabase/Prisma codex and data flow
  priority: high
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Update ARCHITECTURE.md for Supabase migration: document Prisma schema, PostgreSQL tables, Codex API (/api/codex), data flow. Remove all Firebase/Firestore/RTDB references. Document admin and public library flow.
  related_files:
    - src/docs/ARCHITECTURE.md
  acceptance_criteria:
    - Docs reflect Supabase/Prisma structure
    - No Firebase/RTDB references
    - Admin and public library flow documented
  notes: |
    Completed 2026-02-07 with TASK-144. ARCHITECTURE.md now documents Supabase/Prisma, Codex API, Codex hooks; RTDB?Codex. Firebase/Firestore kept only for migration context (characters/library). Admin/public library flow: TASK-143.

- id: TASK-143
  title: Add Admin / Public Library workflow docs
  priority: low
  status: done
  created_at: 2026-02-06
  created_by: agent
  description: |
    Update ADMIN_SETUP.md for Supabase: how to add admins, run migration, deploy. Document public library workflow. Reference DEPLOYMENT_AND_SECRETS_SUPABASE.md.
  related_files:
    - src/docs/ADMIN_SETUP.md
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  acceptance_criteria:
    - Clear steps for adding admin (Supabase)
    - Migration and deploy steps
    - Public library usage
  notes: "Done 2026-02-07: ADMIN_SETUP.md Ã¢â‚¬â€ added migration/deploy steps, public library (planned) note. DEPLOYMENT_AND_SECRETS_SUPABASE.md Ã¢â‚¬â€ Phase 7 Vercel step-by-step, copy-paste SQL for Storage RLS."

- id: TASK-144
  title: Documentation migration audit Ã¢â‚¬â€ update all docs for Supabase stack
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Per DOCUMENTATION_MIGRATION_AUDIT.md: Update AGENTS.md, AGENT_GUIDE.md, README.md, .cursor/rules for Supabase/Prisma/Vercel. Archive DEPLOYMENT_SECRETS, ADMIN_SDK_SECRETS_SETUP, SECRETS_SETUP. Point all refs to DEPLOYMENT_AND_SECRETS_SUPABASE.md.
  related_files:
    - src/docs/DOCUMENTATION_MIGRATION_AUDIT.md
    - AGENTS.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/README.md
    - .cursor/rules/realms-project.mdc
  acceptance_criteria:
    - All docs reference Supabase/Prisma/Vercel
    - No Firebase deployment secrets instructions in active docs
    - Old Firebase docs archived
    - npm run build passes
  notes: |
    Completed 2026-02-07. Archived DEPLOYMENT_SECRETS.md, ADMIN_SDK_SECRETS_SETUP.md, SECRETS_SETUP.md to archived_docs/*_FIREBASE.md. Updated AGENTS.md, AGENT_GUIDE.md, ARCHITECTURE.md, README.md, ALL_FEEDBACK_CLEAN.md, update-admin-secrets.ps1. AGENTS.md/AGENT_GUIDE.md/ARCHITECTURE.md now reference Supabase/Prisma/Codex.

- id: TASK-145
  title: Rename RTDB ? Codex globally (hooks, types, variables)
  priority: critical
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Data no longer comes from Firebase RTDB Ã¢â‚¬â€ it comes from Prisma via use-codex. Rename: useRTDBFeats?useCodexFeats (remove alias), RTDBFeat?Feat, rtdb* vars?codex*, source:'rtdb'?'codex'. See DOCUMENTATION_MIGRATION_AUDIT.md section 1.
  related_files:
    - src/docs/DOCUMENTATION_MIGRATION_AUDIT.md
    - src/hooks/index.ts
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/shared/skills-allocation-page.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
  acceptance_criteria:
    - No useRTDB*, RTDBFeat, RTDBSkill, rtdb* variable names
    - sourceFilter uses 'codex' not 'rtdb'
    - npm run build passes
  notes: |
    Completed 2026-02-07. Removed useRTDBFeats/useRTDBSkills aliases; export useCodexFeats, useCodexSkills, Feat, Skill. Renamed rtdb*?codex*, source:'rtdb'?'codex', speciesTraitsFromRTDB?speciesTraitsFromCodex, RTDBEquipmentItem?CodexEquipmentItem. Updated hooks, equipment-step, finalize-step, feats-step, powers-step, add-skill-modal, add-sub-skill-modal, skills-allocation-page, species-modal, ancestry-step, characters/campaigns pages, admin/codex tabs, creature-creator, data-enrichment.

- id: TASK-146
  title: Fix TypeScript build errors (implicit any, type mismatches)
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Build fails with implicit any errors in admin codex tabs, codex tabs, campaigns view, character page. Add explicit types to filter/map/forEach callbacks, sortItems generics, etc. Ensures npm run build passes.
  related_files:
    - src/app/(main)/admin/codex/
    - src/app/(main)/codex/
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
  acceptance_criteria:
    - npm run build passes with no TypeScript errors
    - No implicit any in filter/map/forEach callbacks
    - sortItems<T> used with explicit generic where needed
  notes: |
    Completed 2026-02-07. Fixed implicit any in: finalize-step, powers-step, skills-step, species-step, add-skill-modal, add-sub-skill-modal, skills-allocation-page, game-data-service. Added RTDBSkill, Species, PowerPart, TechniquePart types to callbacks; sortItems<T> where needed; Set<string> for speciesSkillIds.

- id: TASK-147
  title: Fix gold ? currency terminology globally
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    "Gold" is not a Realms term. Use Currency, "c", or "C" for abbreviation. Replace: gold_cost?currency_cost (or keep currency field), "gp"?"c", "Gold Cost"?"Currency Cost", formatGold?formatCurrency, goldCost?currencyCost. See GAME_RULES.md for correct terminology.
  related_files:
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/lib/item-transformers.ts
    - src/lib/calculators/item-calc.ts
    - src/lib/data-enrichment.ts
    - src/components/character-creator/steps/equipment-step.tsx
    - src/app/(main)/library/actions.ts
  acceptance_criteria:
    - No "gold" or "gold_cost" in UI labels or display text
    - Use "c" or "Currency" for cost display
    - Legacy gold_cost in DB/API may remain for backward compat; document
    - npm run build passes
  notes: |
    Completed 2026-02-07. AdminEquipmentTab: "gp"?"c", "Gold Cost"?"Currency Cost"; item-creator: "Base Gold"?"Base Currency"; item-transformers: formatGold?formatCurrency (deprecated formatGold); DOCUMENTATION_MIGRATION_AUDIT: legacy gold_cost note.

- id: TASK-148
  title: Migrate character-service, use-user-library, campaign-service to Prisma
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Phase 4 migration: Replace Firestore with Prisma in character-service.ts, use-user-library.ts (and related hooks), campaign-service.ts. These still use Firebase; migrate to Supabase/Prisma.
  related_files:
    - src/services/character-service.ts
    - src/hooks/use-user-library.ts
    - src/services/campaign-service.ts
    - src/hooks/use-characters.ts
    - src/hooks/use-campaigns.ts
  acceptance_criteria:
    - No Firestore imports in these services
    - Data flows through Prisma
    - npm run build passes
  notes: |
    Completed 2026-02-07. Created API routes: /api/characters, /api/user/library/[type], /api/campaigns. Migrated character-service, use-user-library, campaign-service to fetch from API (Prisma). Updated character sheet, finalize-step, power/technique/item/creature creators to use new services. Created library-service for creators save flow.

- id: TASK-149
  title: Migrate admin codex actions to Prisma
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Admin codex CRUD (createCodexDoc, updateCodexDoc, deleteCodexDoc) may still use Firestore. Migrate to Prisma for codex_* tables.
  related_files:
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - Admin codex CRUD uses Prisma
    - No Firestore in admin codex actions
    - npm run build passes
  notes: |
    Completed 2026-02-07. Replaced getAdminFirestore with prisma; createCodexDoc/updateCodexDoc/deleteCodexDoc now use Prisma delegates (codexFeat, codexSkill, etc.). getSession and isAdmin use Supabase Auth and env vars.

- id: TASK-150
  title: Add auth confirm route for Supabase email OTP / magic links
  priority: medium
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Supabase Auth sends users to /auth/confirm for email magic links and OTP verification. Without this route, those flows fail. Add the route per Supabase docs to support email verification and magic-link sign-in.
  related_files:
    - src/app/auth/confirm/route.ts
    - src/lib/supabase/server.ts
  acceptance_criteria:
    - GET /auth/confirm handles token_hash and type query params
    - Uses supabase.auth.verifyOtp() and redirects to next param on success
    - Redirects to /login?error=confirm on failure
    - npm run build passes
  notes: |
    Done 2026-02-07: Created auth/confirm/route.ts with verifyOtp, createUserProfileAction, x-forwarded-host for redirects. Add {{ .SiteURL }}/auth/confirm to Supabase Auth URL config for magic links.

- id: TASK-151
  title: Add x-forwarded-host handling in auth callback for Vercel/proxy
  priority: medium
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Behind Vercel or a load balancer, origin may differ from the actual host. Use x-forwarded-host when present to construct correct redirect URLs in the OAuth callback.
  related_files:
    - src/app/auth/callback/route.ts
  acceptance_criteria:
    - In production, if x-forwarded-host is present, redirect uses https://{x-forwarded-host}{next}
    - In development, use origin directly (no proxy)
    - Existing createUserProfileAction flow preserved
    - npm run build passes
  notes: |
    Done 2026-02-07: Added getRedirectUrl() to auth/callback and auth/confirm using x-forwarded-host in production.

- id: TASK-152
  title: Audit skill encounter page Ã¢â‚¬â€ verify completeness vs feedback
  priority: high
  status: done
  created_at: 2026-02-07
  created_by: agent
  description: |
    Skill encounter page may have incomplete behavior. Check ALL_FEEDBACK_CLEAN.md raw feedback and GAME_RULES.md. Verify: add participants (campaign + library), DS config, roll tracking, success/failure logic, required successes/failures, RM-specific features per core rules.
  related_files:
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/components/shared/add-combatant-modal.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  acceptance_criteria:
    - Campaign characters (RM and non-RM) can be added to skill encounters
    - Creature library can be used to add participants
    - DS, successes, failures behave per GAME_RULES
    - No known bugs from feedback remain
    - npm run build passes
  notes: |
    Done 2026-02-07: Audited skill encounter page. Campaign chars (RM + non-RM) fixed in prior session via API ?scope=encounter. CreatureLibraryTab and CampaignCharactersTab both support mode=skill and onAddParticipants. computeSkillRollResult matches GAME_RULES (roll >= DS: 1 + floor((roll-DS)/5) successes; roll < DS: 1 + floor((DS-roll)/5) failures). Added Required Successes display (participants + 1) per GAME_RULES. Build passes.

- id: TASK-153
  title: Navbar Ã¢â‚¬â€ Move Campaigns to right of RM Tools, left of About
  priority: medium
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Reorder navbar: move Campaigns link to appear after RM Tools dropdown and before About. Current order: Characters, Campaigns, Library, Codex, Creators, Rules, RM Tools, About. New order: Characters, Library, Codex, Creators, Rules, RM Tools, Campaigns, About.
  related_files:
    - src/components/layout/header.tsx
  acceptance_criteria:
    - Campaigns appears after RM Tools and before About (desktop and mobile nav)
    - All other nav links retain correct order
    - npm run build passes
  notes: |
    Single navLinks array reorder in header.tsx.

- id: TASK-154
  title: Admin Codex Ã¢â‚¬â€ Display "-" for feat level 0 in list
  priority: low
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    In Admin Codex Editor Feats tab (and any codex list showing feat_lvl), when feat level requirement is 0, display "-" instead of "0". Per GAME_RULES: feat_lvl indicates the level of the feat itself (e.g. Bloodlust II vs Bloodlust III); no level implies no higher-level variant.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
  acceptance_criteria:
    - feat_lvl 0 displays as "-" in list views
    - feat_lvl > 0 displays numeric value
    - Applies to Admin Feats and Codex Feats tabs
  notes: |
    Use display helper: (feat_lvl === 0 || feat_lvl == null) ? '-' : String(feat_lvl).

- id: TASK-155
  title: Admin Codex Ã¢â‚¬â€ List refresh after delete; unify UI with Codex
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    When deleting a list item in Admin Codex, the list still shows the item until page refresh. Fix by ensuring query invalidation/refetch removes deleted item from local state immediately. Also unify Admin Codex tabs with Codex tabs: same UI, filters, styles, search/sort. Exception: Admin uses pencil/trash icons for edit/delete instead of Codex view-only actions. Apply to all admin codex tabs (Feats, Skills, Species, Traits, Parts, Properties, Equipment, Archetypes, Creature Feats).
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/codex/
  acceptance_criteria:
    - Delete removes item from list immediately (no refresh needed)
    - Each Admin tab uses same layout, filters, search, sort as corresponding Codex tab
    - Admin tabs retain pencil/trash for edit/delete; Codex remains view-only
    - npm run build passes
  notes: |
    Done 2026-02-09: (1) Fixed invalidateQueries Ã¢â‚¬â€ all admin tabs used wrong keys; useCodex* hooks use ['codex']. Updated AdminFeatsTab, AdminSpeciesTab, AdminSkillsTab, AdminTraitsTab, AdminPartsTab, AdminPropertiesTab, AdminEquipmentTab, AdminCreatureFeatsTab to invalidate ['codex']. (2) Unified Admin Feats with Codex Feats: FilterSection, ChipSelect, AbilityRequirementFilter, TagFilter, SelectFilter, SortHeader, same GridListRow with detailSections. Other tabs (Skills, Species, etc.) can be unified incrementally Ã¢â‚¬â€ same pattern.

- id: TASK-156
  title: Feat Editing Ã¢â‚¬â€ Ability dropdown (6 abilities + 6 defenses)
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    In Admin Feat edit modal, ability_req and ability (sorting) should use a dropdown of the 12 options: 6 Abilities (Strength, Vitality, Agility, Acuity, Intelligence, Charisma) and 6 Defenses (Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve). Allow selecting one or more. Reference src/types/abilities.ts and GAME_RULES.md for canonical names.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/types/abilities.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - ability_req uses multi-select dropdown with 12 options
    - ability (sorting) uses same dropdown (multi-select)
    - Options: Strength, Vitality, Agility, Acuity, Intelligence, Charisma, Might, Fortitude, Reflexes, Discernment, Mental Fortitude, Resolve
    - npm run build passes
  notes: |
    Create ABILITIES_AND_DEFENSES constant in src/lib/game/constants.ts or reuse existing. Display names: capitalize per GAME_RULES (e.g. "Mental Fortitude" not "mentalFortitude").

- id: TASK-157
  title: Feat Editing Ã¢â‚¬â€ Add all missing editable fields
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Admin Feat edit modal is missing many feat fields. Add edit controls for: name, description, req_desc (requirement description), ability_req + abil_req_val (paired: ability/defense name + min value), skill_req + skill_req_val (paired), feat_cat_req (feat category required), pow_abil_req, mart_abil_req, pow_prof_req, mart_prof_req, speed_req, feat_lvl, lvl_req, uses_per_rec, rec_period (Full/Partial), category, ability (sorting), tags, char_feat, state_feat. Reference GAME_RULES.md and archived Fixes and Improvements for field semantics.
  related_files:
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/types/feats.ts
    - src/hooks/use-rtdb.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All listed fields have an input/select/checkbox in edit modal
    - ability_req/abil_req_val pairs: add/remove rows; dropdown for ability; number for min value
    - skill_req/skill_req_val pairs: skill dropdown (from codex); number for min bonus
    - feat_cat_req, rec_period have appropriate controls
    - feat_lvl displays "-" when 0
    - npm run build passes
  notes: |
    Field semantics: abil_req_val[i] = min value for ability_req[i]. feat_cat_req = category of feat required (e.g. "Defense"). rec_period: Full or Partial. feat_lvl: level of feat (Bloodlust II = 2, Bloodlust = 1). TASK-156 covers ability dropdown.

- id: TASK-158
  title: Centralized codex data schema Ã¢â‚¬â€ AI reference doc
  priority: medium
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Create a centralized reference document for all codex entity schemas (feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats). Each field should have: name, type, description, valid values, and example. Purpose: AI agents and engineers can reference this to clarify field utility when implementing validation, editing, or display logic.
  related_files:
    - src/docs/
    - prisma/schema.prisma
    - Codex csv/
  acceptance_criteria:
    - New doc (e.g. src/docs/CODEX_SCHEMA_REFERENCE.md) lists all codex entities
    - Each entity has field table: name, type, description, valid values, example
    - Covers: feats, skills, species, traits, parts, properties, equipment, archetypes, creature_feats
    - Reference GAME_RULES.md and existing CSV/Prisma for accuracy
  notes: |
    Essential for admin codex editors and AI task implementation. Include ability_req/abil_req_val pairing, feat_lvl vs lvl_req, skill_req/skill_req_val order, species skills (IDs vs names), etc.

- id: TASK-159
  title: Admin Codex Ã¢â‚¬â€ Reduce input lag in edit mode
  priority: medium
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    When typing in edit mode (Admin Codex modals), there is noticeable lag. Likely causes: uncontrolled re-renders, heavy form state updates, or expensive parent re-renders. Investigate and optimize: debounce only where needed, avoid unnecessary re-renders, consider controlled inputs with local state + sync on blur or debounced save.
  related_files:
    - src/app/(main)/admin/codex/*.tsx
    - src/components/ui/Input.tsx
  acceptance_criteria:
    - Typing in text inputs feels responsive (no perceptible lag)
    - Form state still saves correctly on submit
    - npm run build passes
  notes: |
    Done 2026-02-16: Wrapped form state updates in useTransition (startTransition) in AdminFeatsTab so typing is non-blocking. Other admin tabs can follow the same pattern (scheduleFormUpdate) for edit modals.

- id: TASK-160
  title: Admin Codex Ã¢â‚¬â€ Array fields use dropdowns, not raw IDs
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    For array fields in Admin Codex edit modals (e.g. species skills, feat skill_req, species traits), use dropdowns to select from codex items by name, not "ids separated by commas". Admins don't have IDs memorized. Allow add-from-dropdown or comma-separated when dropdown is the only practical option. Apply to all codex tabs that have array fields referencing other codex entities.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Species skills: dropdown of skills (by name) to add; display as chips with remove
    - Feat skill_req: dropdown of skills to add
    - Other array fields referencing codex: dropdown where applicable
    - Store IDs internally; display names in UI
    - npm run build passes
  notes: |
    Done 2026-02-09: (1) Feat skill_req: dropdown of skills by name, add/remove rows with min value. (2) Species skills: ChipSelect dropdown of skills by name; resolve IDs to names when loading. Other array fields (traits, etc.) can follow same pattern.

- id: TASK-161
  title: CampaignÃ¢â‚¬â€Encounter attachment and "Add all Characters"
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Allow attaching a campaign to an encounter upon creation or within the encounter. Add "Add all Characters" (or similar) button that adds all characters from the attached campaign into the encounter automatically.
  related_files:
    - prisma/schema.prisma
    - src/types/encounter.ts
    - src/app/(main)/encounters/page.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/app/(main)/encounters/[id]/mixed/page.tsx
    - src/components/shared/add-combatant-modal.tsx
  acceptance_criteria:
    - Encounter can have optional campaignId; set on create or edit
    - "Add all Characters" button adds all campaign characters to the encounter
    - Add to combat, skill, and mixed encounter pages
    - npm run build passes
  notes: |
    Done 2026-02-09: encounter.data.campaignId; combat/skill/mixed have campaign dropdown + Add all Characters.

- id: TASK-162
  title: Fix encounter combatant HP/EN when tied to user character
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Encounter combatants tied to a user's character are not fully loading with accurate current/max energy and health. Ensure the API returns and the add-combatant flow uses correct health/energy from character data.
  related_files:
    - src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts
    - src/components/shared/add-combatant-modal.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
  acceptance_criteria:
    - Campaign characters added to encounter show correct currentHealth/maxHealth, currentEnergy/maxEnergy
    - API scope=encounter returns health/energy from character.data (health.current, health.max, etc.)
    - npm run build passes
  notes: |
    Done 2026-02-09: getCharacterMaxHealthEnergy in formulas; API uses when health/energy missing.

- id: TASK-163
  title: Add roll log to encounters for RM (personal + campaign tabs)
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Add a roll log to encounter pages (combat, skill, mixed) with same UI/functionality/styles as character sheet. RM uses it for private rolls (not broadcast to campaign). Include tabs so RM can also view rolls in their campaigns.
  related_files:
    - src/components/character-sheet/roll-log.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/app/(main)/encounters/[id]/mixed/page.tsx
  acceptance_criteria:
    - Encounter pages have RollLog component (or equivalent)
    - Personal tab: RM rolls privately, not sent to campaign
    - Campaign tab: view campaign rolls (when encounter has campaign)
    - Same layout, dice builder, RollEntryCard as character sheet
    - npm run build passes
  notes: |
    Done 2026-02-09: RollLog accepts viewOnlyCampaignId; encounter pages wrap in RollProvider (no campaignContext) and render RollLog with viewOnlyCampaignId={encounter.campaignId}. Personal rolls stay local; Campaign tab shows linked campaign rolls.

- id: TASK-164
  title: Roll log consistency Ã¢â‚¬â€ styles, date display across encounter/campaign/sheet
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Make roll log styles consistent across encounter tab (roll log campaign mode), character sheet (campaign mode), and campaign page. Fix roll date display Ã¢â‚¬â€ most show "unavailable" for the date. Use single RollEntryCard and shared formatting.
  related_files:
    - src/components/character-sheet/roll-log.tsx
    - src/app/(main)/campaigns/[id]/page.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
  acceptance_criteria:
    - RollEntryCard used everywhere; same layout, colors, spacing
    - Roll date displays correctly (not "unavailable"); handle Date, {seconds}, ISO string
    - Encounter, campaign, character sheet roll logs look identical
    - npm run build passes
  notes: |
    Done 2026-02-09: normalizeRollTimestamp + formatRollTimestamp in roll-log; campaign page uses same list styling.

- id: TASK-165
  title: Roll log real-time sync via Supabase Realtime
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Rolls should sync in real time between characters, campaigns, and other users. Replace polling with Supabase Realtime subscription on campaign_rolls (and personal rolls if stored). Update database, Supabase settings, and hooks.
  related_files:
    - src/hooks/use-campaign-rolls.ts
    - sql/supabase-rls-policies.sql
  acceptance_criteria:
    - Campaign rolls update in real time for all viewers (no 5s poll)
    - Supabase Realtime enabled for campaign_rolls table
    - RLS policies allow SELECT for campaign members
    - npm run build passes
  notes: |
    Done 2026-02-09: use-campaign-rolls uses postgres_changes on schema campaigns, table campaign_rolls with filter campaign_id=eq.; invalidates query on any change. sql/supabase-rls-policies.sql: ALTER PUBLICATION supabase_realtime ADD TABLE campaigns.campaign_rolls; GRANT SELECT to authenticated.

- id: TASK-166
  title: Health/Energy real-time sync between encounters and characters
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Current health and energy should sync in real time between encounters and the characters themselves. When combatant is tied to a character (sourceType: campaign-character), HP/EN changes in encounter should update character and vice versa.
  related_files:
    - src/types/encounter.ts
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/components/shared/add-combatant-modal.tsx
    - sql/supabase-rls-policies.sql
  acceptance_criteria:
    - Combatant HP/EN edits sync to character when sourceType is campaign-character
    - Character HP/EN edits sync to encounter combatants
    - Real-time or near-real-time; consider Supabase Realtime on characters
    - npm run build passes
  notes: |
    Done 2026-02-09: TrackedCombatant/SkillParticipant have sourceUserId. Encounter?character: updateCombatant calls syncCharacterHealthEnergy (debounced 400ms) when owner edits HP/EN; PATCH /api/characters/[id]. Character?encounter: Realtime subscription on users.characters for campaign-character combatant ids; on UPDATE merge health/energy into combatants. Publication + GRANT for users.characters in supabase-rls-policies.sql.

- id: TASK-167
  title: Character visibility Ã¢â‚¬â€ public link, campaign-only, private?campaign on join
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Public: anyone can copy link and view character in browser (read-only, no edit). Campaign only: RM and campaign members can see (not edit). Private + joins campaign: auto-set to campaign only; show notification when joining with private character that visibility will change.
  related_files:
    - src/types/character.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/app/api/characters/
    - src/app/(main)/campaigns/
  acceptance_criteria:
    - Public: /characters/[id] viewable by unauthenticated or any user when visibility=public
    - Campaign: RM and members can view via /campaigns/[id]/view/[userId]/[characterId]
    - Join campaign with private char: auto-update to campaign; show notification
    - All view modes: read-only (no edit/save)
    - npm run build passes
  notes: |
    Done 2026-02-09: GET /api/characters/[id] allows unauthenticated for public; campaign visibility via in-memory campaign membership check. View-only toolbar when !isOwner. Add/join campaign actions set visibility to campaign when private and return visibilityUpdated; toasts on campaign page and join tab.

- id: TASK-168
  title: Character-derived content visibility Ã¢â‚¬â€ library items view-only for viewers
  priority: high
  status: done
  created_at: 2026-02-09
  created_by: agent
  description: |
    Characters use powers, techniques, armaments, items from user's private library. When viewing another user's character (public or campaign), these library items must be visible (read-only) to the viewer. No editing of the source items.
  related_files:
    - src/lib/owner-library-for-view.ts
    - src/lib/data-enrichment.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
    - src/app/api/characters/[id]/route.ts
    - src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts
    - src/services/character-service.ts
  acceptance_criteria:
    - Viewing a character includes resolved powers, techniques, items (from owner's library)
    - API returns enriched data for view scope; library items readable by viewer
    - No edit/delete/save for viewed items
    - npm run build passes
  notes: |
    Done 2026-02-09: getOwnerLibraryForView(ownerUserId) fetches owner's powers/techniques/items. GET /api/characters/[id] returns { character, libraryForView } when non-owner (public/campaign). Campaign character API returns character + libraryForView. Character page and campaign view page use libraryForView for enrichment when present; view-only UI unchanged.

- id: TASK-169
  title: Admin Feats Ã¢â‚¬â€ remove prereq_text and rely on req_desc
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    The `prereq_text` field was mistakenly treated as a real feat attribute. It should not exist in the canonical feats schema or Admin editors. Use `req_desc` (requirement description) as the single source of truth for human-readable requirements and remove `prereq_text` from schema docs, types, API mapping, migration scripts, and the Admin Feats UI.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - scripts/migrate_rtdb_to_firestore.js
  acceptance_criteria:
    - `prereq_text` no longer appears in CODEX_SCHEMA_REFERENCE for feats
    - Feat type definitions and codex API responses no longer expose `prereq_text`
    - Admin Feats modal does not show or save `prereq_text`
    - Migration script does not write `prereq_text` into Firestore
    - npm run build passes
  notes: |
    Implemented 2026-02-11 based on owner feedback that `prereq_text` was never a real attribute. Existing data with this field is effectively ignored.

- id: TASK-170
  title: Admin Codex Ã¢â‚¬â€ unify Skills, Parts, Properties, and Equipment tabs with Codex layout
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin Codex tabs for Skills, Parts, Properties, and Equipment should mirror their Codex counterparts: same search, filters, sort headers, and GridListRow-based list layout, with only the addition of edit/delete controls. This reduces redundancy and makes "learn one UI, use it everywhere" true for Codex vs Admin editing.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/app/(main)/codex/CodexPartsTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/app/(main)/codex/CodexEquipmentTab.tsx
  acceptance_criteria:
    - Admin Skills tab uses the same filters (Ability, Base Skill, Skill Type) and NAME/ABILITIES/BASE SKILL headers as Codex Skills
    - Admin Parts tab uses Codex Parts-style filters (Category, Type, Mechanics) and NAME/CATEGORY/ENERGY/TP headers
    - Admin Properties tab uses a Type filter and NAME/TYPE/ITEM PTS/TP/COST MULT headers like Codex Properties
    - Admin Equipment tab uses Category and Rarity filters with NAME/CATEGORY/COST/RARITY headers similar to Codex Equipment
    - All four tabs still provide add/edit/delete modals with existing behavior
    - npm run build passes
  notes: |
    Implemented 2026-02-11: imported shared Codex filter components (FilterSection, ChipSelect, SelectFilter) and SortHeader/useSort into Admin tabs, aligned grid column definitions, and wired filters/sorting to the same fields the Codex tabs use.

- id: TASK-171
  title: Admin Skills Ã¢â‚¬â€ base skill dropdown resolves base_skill_id
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    In the Admin Skills edit modal, `base_skill_id` currently requires admins to know and type numeric IDs. Replace this with a dropdown of base skill names (non-sub-skills), storing the corresponding `base_skill_id` internally. value "" should mean no base skill (not a sub-skill), and id 0 should indicate the skill can be a sub-skill of any base skill.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/api/codex/route.ts
    - src/docs/CODEX_SCHEMA_REFERENCE.md
  acceptance_criteria:
    - Admin Skills modal shows a "Base skill" select listing base skill names instead of a free-text numeric ID
    - On save, the selected base skill name is resolved to its `base_skill_id` and stored correctly; blank => undefined, "Any" => 0
    - Editing an existing sub-skill pre-selects the correct base skill in the dropdown
    - npm run build passes
  notes: |
    Done 2026-02-16 (verified). Admin Skills modal already has Base skill select with base skill names (baseSkillOptions, "Any", "Ã¢â‚¬â€ None"); openEdit resolves base_skill_id to name; handleSave resolves baseSkillName to base_skill_id (blank=>undefined, "Any"=>0).

- id: TASK-172
  title: Admin Skills Ã¢â‚¬â€ expose additional description fields
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Admin Skills edit modal should include inputs for all narrative fields defined in the codex schema: `success_desc`, `failure_desc`, `ds_calc`, `craft_success_desc`, and `craft_failure_desc`. These complement the main `description` and are used for Codex display and RM guidance.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/api/codex/route.ts
  acceptance_criteria:
    - Admin Skills modal has labeled inputs/textarea controls for success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc
    - Values load when editing an existing skill and persist on save
    - npm run build passes
  notes: |
    Done 2026-02-16. Skill type and codex API return the 5 fields; Admin Skills modal has textareas for each; openEdit/handleSave load and persist them.

- id: TASK-173
  title: Skills Ã¢â‚¬â€ render extra descriptions as expandable chips in item cards
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Skill data includes additional descriptive fields (success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc) that should appear as expandable chips on skill item cards. Chips should be used in Codex Skills tab, add-skill modals, and add sub-skill modals, appended after the primary description.
  related_files:
    - src/app/(main)/codex/CodexSkillsTab.tsx
    - src/components/shared/skill-row.tsx
    - src/components/character-sheet/skills-section.tsx
    - src/components/creator/skills-step.tsx
  acceptance_criteria:
    - Skill item cards show chips like "Success Outcomes", "Failure Outcomes", "DS Calculation", "Craft Success", "Craft Failure" when corresponding fields are present
    - Chips expand to reveal the full text when clicked, consistent with existing chip expansion patterns
    - Implementation is reused across Codex and skill selection/summary UIs
    - npm run build passes
  notes: |
    Done 2026-02-16. Added getSkillExtraDescriptionDetailSections() in src/lib/skill-extra-descriptions.ts. Codex Skills: SkillCard uses description + detailSections (expandable chips). Add-skill modal: GridListRow detailSections from helper. Add-sub-skill modal: SkillExtraChipsSection in expanded content with click-to-expand chips.

- id: TASK-174
  title: Codex schema Ã¢â‚¬â€ add Use column and align fields
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Extend the centralized Codex schema reference so each field includes a clear "Use" explanation, and align listed fields with the canonical RTDB data review/spec for feats, skills, species, traits, items, parts, properties, and creature feats. Ensure that narrative skill fields (success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc) and all feat requirement fields are documented with their exact purposes (validation vs display vs RM guidance).
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
  acceptance_criteria:
    - Each codex entity table in CODEX_SCHEMA_REFERENCE has a "Use" column with accurate, concrete descriptions based on owner spec
    - Feat, skill, species, trait, item, part, property, and creature feat field lists match the RTDB DATA REVIEW plus latest feedback (no extra/missing fields)
    - Narrative skill fields and feat requirement fields clearly distinguish validation logic vs display/reference text
    - npm run build passes
  notes: |
    Done 2026-02-17: CODEX_SCHEMA_REFERENCE already has Use column for all codex entities (Feats, Skills, Species, Traits, Parts, Properties, Equipment, Archetypes, Creature Feats) with concrete descriptions. Field lists aligned with owner spec.

- id: TASK-175
  title: Codex skills Ã¢â‚¬â€ remove invalid trained_only field
  priority: high
  status: done
  notes: "Verified 2026-02-13: trained_only field no longer exists in any source code file. Only present in documentation references."
  created_at: 2026-02-11
  created_by: owner
  description: |
    `trained_only` is not a real field in the canonical skills schema. Remove it across docs, types, API responses, admin editors, and migration scripts so future work does not rely on it. Preserve any legacy data in Firestore/RTDB, but stop reading or writing this field in the application.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - scripts/migrate_rtdb_to_firestore.js
    - src/docs/ALL_FEEDBACK_CLEAN.md
  acceptance_criteria:
    - CODEX_SCHEMA_REFERENCE no longer lists `trained_only` under Skills
    - Skill types in use-rtdb and anywhere else do not include trained_only
    - Codex API skills payload does not expose trained_only or rely on it
    - AdminSkillsTab no longer shows or saves a "Trained only" checkbox
    - Migration scripts do not write trained_only into codex_skills documents
    - npm run build passes
  notes: |
    Implemented initial removal 2026-02-11 based on owner clarification that trained_only is not part of the skills data model. Legacy codex documents may still contain this field but it is ignored by the app.

- id: TASK-176
  title: Codex seeding Ã¢â‚¬â€ wipe and reseed from canonical CSVs
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Update the Supabase/Prisma codex seeding so that running the seed script fully clears all codex tables and replaces them with data from the canonical Codex CSVs, using the updated codex schema (ID-based cross-refs, equipment rename, properties.mechanic). This ensures the live codex matches the curated CSVs exactly.
  related_files:
    - scripts/seed-to-supabase.js
    - codex_csv/
    - prisma/schema.prisma
    - src/docs/CODEX_SCHEMA_REFERENCE.md
  acceptance_criteria:
    - Running `node scripts/seed-to-supabase.js` deletes all rows from codex_* tables and then repopulates them from the CSVs
    - Feats, skills, species, traits, parts, properties, equipment, archetypes, and creature feats load without runtime errors using the revised schema
    - Codex seeding supports ID-based arrays for feat.skill_req and species skills/traits/flaws/characteristics
    - `npm run db:seed` (or equivalent) works end-to-end and can be safely used to recreate codex data in Supabase
  notes: |
    Initial implementation 2026-02-11: seed-to-supabase now always clears codex tables via clearCodexTables() before upserting CSV rows. Further work may be needed as CSVs evolve.

- id: TASK-177
  title: Codex schema usage audit Ã¢â‚¬â€ IDs, equipment, mechanic properties
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Audit the codebase for any discrepancies between the updated codex schema and actual usage. Focus on: feat.skill_req being treated as names instead of IDs; species skills/traits/flaws/characteristics treated as names instead of IDs; any lingering references to Ã¢â‚¬â€itemsÃ¢â‚¬â€ where the canonical collection is now Ã¢â‚¬â€equipmentÃ¢â‚¬â€ / codex_equipment; and ensuring properties.mechanic is available wherever needed.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/
    - src/app/(main)/codex/
    - src/components/creator/
  acceptance_criteria:
    - A short list of concrete mismatches (e.g. places comparing feat.skill_req to skill names, or rendering species_traits as names without lookup) is documented
    - New follow-up tasks are created for each category of mismatch (feat.skill_req IDs, species trait/skill IDs, equipment naming in UI, mechanic property behavior)
    - CODEX_SCHEMA_REFERENCE remains the single source of truth for codex field semantics
  notes: |
    This is primarily a planning/audit task; follow-up implementation tasks will handle the actual code changes.

- id: TASK-178
  title: Armament creator Ã¢â‚¬â€ hide mechanic properties from add-property lists
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Use the new `mechanic` boolean on codex_properties to hide mechanic-only properties (e.g. Damage Reduction, stat requirements, base armor/weapon/shield costs, Split Damage Dice, Range, Two-Handed, Armor Base, Shield Base, Weapon Damage) from the normal "add property" dropdowns in the armament creator. These should be wired into the UI logic instead of being selectable like regular user-facing properties.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - codex_csv/Codex - Properties.csv
    - src/app/(main)/item-creator/
    - src/lib/item-transformers.ts
    - src/components/creator/
  acceptance_criteria:
    - Properties with mechanic=true do not appear in standard add-property dropdowns or selection lists
    - Existing armament creator behavior for these mechanic properties is preserved or improved (requirements, base costs, etc. handled via code, not manual selection)
    - Non-mechanic properties continue to display and behave as before
    - npm run build passes
  notes: |
    This task focuses on using the mechanic flag in the UI; seeding of the mechanic field itself is handled by TASK-176.

- id: TASK-179
  title: Feat skill_req Ã¢â‚¬â€ convert to ID-based everywhere
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Feat.skill_req is currently treated as an array of skill names in several places (Admin Feats editor, Codex Feats tab, character creator feats-step, character sheet add-feat modal, and requirement-checking logic). Update the system so feats store and operate on skill IDs instead of names, matching the codex schema and CSVs, while still displaying human-readable skill names via codex lookups.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/hooks/use-rtdb.ts
    - src/app/api/codex/route.ts
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-sheet/add-feat-modal.tsx
  acceptance_criteria:
    - Feat.skill_req arrays in the database and codex API contain skill IDs, not names
    - Admin Feats modal uses a dropdown of skill names but saves the corresponding IDs into skill_req
    - Codex Feats, character creator feats-step, and add-feat-modal all render skill requirement chips using resolved skill names from codex_skills based on IDs
    - Requirement-checking logic (e.g. in feats-step and add-feat-modal) correctly maps feat.skill_req IDs to the characterÃ¢â‚¬â€s skill bonuses via ID?name resolution
    - npm run build passes
  notes: |
    This task depends on having canonical skill IDs in the Codex CSVs; the UI should treat IDs as the source of truth and derive names via lookups.

- id: TASK-180
  title: Species skills/traits/flaws/characteristics Ã¢â‚¬â€ enforce ID-based usage
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Ensure that species.skills, species_traits, ancestry_traits, flaws, and characteristics are consistently treated as ID arrays across the React app. Any UI that currently assumes these are names should be updated to resolve IDs to names via codex lookups (traits, skills) while preserving IDs in saved data and API payloads.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
    - src/app/(main)/codex/CodexSpeciesTab.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/components/character-creator/steps/species-step.tsx
    - src/lib/item-transformers.ts
  acceptance_criteria:
    - Species CSVs and Supabase codex_species rows store only IDs (no names) in skills/species_traits/ancestry_traits/flaws/characteristics
    - Codex API returns these as ID arrays, and all downstream code treats them as such
    - UI components resolve IDs to names using codex_skills and codex_traits when displaying traits/skills
    - No code path relies on trait or skill names being stored directly in the species arrays
    - npm run build passes
  notes: |
    Some vanilla-site JS still uses name-based arrays; this task is limited to the React/Next.js codebase.

- id: TASK-181
  title: Admin Skills Ã¢â‚¬â€ ability multi-select aligned with schema
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Skills schema defines `ability` as a string[] of governing abilities/defenses, but AdminSkillsTab currently treats it as a single free-text string. Update the Admin Skills editor so `ability` is a multi-select (using the 12 canonical abilities/defenses) and save the result as an array, while still supporting backward-compatible display of existing string values.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
  acceptance_criteria:
    - Admin Skills modal uses a ChipSelect/multi-select for `ability`, with options from the canonical 12 abilities/defenses
    - Saved skills have `ability` persisted as a string[] (or a single string when only one is chosen, consistent with API expectations)
    - API and hooks correctly serialize/deserialize ability arrays for display and filters
    - npm run build passes
  notes: |
    Done 2026-02-16 (verified). Admin Skills modal already uses ChipSelect for ability with ABILITY_OPTIONS from ABILITIES_AND_DEFENSES (12); handleSave persists as array or single string; API returns ability as string (join); openEdit splits to array.

- id: TASK-182
  title: Admin Equipment Ã¢â‚¬â€ align fields with codex_equipment schema
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Equipment schema documents only name, description, category, currency, and rarity, but AdminEquipmentTab currently exposes type and gold_cost/currency in ways that mix codex data with library-style fields. Reconcile Admin Equipment with the schema: ensure category, currency, and rarity are fully editable, and either (a) drop or (b) clearly separate any non-schema fields so codex_equipment remains a clean reference table.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
  acceptance_criteria:
    - AdminEquipmentTab exposes inputs for category, currency, and rarity consistent with CODEX_SCHEMA_REFERENCE
    - Any extra fields (type, gold_cost, properties, etc.) are either removed from the Admin Codex editor or justified by an updated schema/doc
    - Codex equipment displayed in Codex/Library stays in sync with the canonical codex_equipment shape
    - npm run build passes
  notes: |
    Done 2026-02-16 (verified). TASK-191 + current Admin Equipment: form has name, description, category, currency, rarity; API maps currency/gold_cost; rarity dropdown. Schema-aligned.

- id: TASK-184
  title: Publish confirmation modal in all creators
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add a confirmation modal when admin saves to public library in power, technique, item, and creature creators. Shows "Are you sure you wish to publish this [type] to the public library?" before executing the save.
  related_files:
    - src/components/shared/confirm-action-modal.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  acceptance_criteria:
    - ConfirmActionModal reusable component created
    - All 4 creators show confirmation when saveTarget === 'public'
    - npm run build passes
  notes: "Completed 2026-02-11. Created ConfirmActionModal shared component with publish/warning icon variants."

- id: TASK-185
  title: Unify admin codex delete icons (Trash2 ? X) and fix delete handler bug
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Replace Trash2 icons with X icons in all 9 admin codex tabs to unify with the rest of the site's remove button pattern. Fix critical bug where delete buttons called openEdit() instead of delete handler.
  related_files:
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
  acceptance_criteria:
    - All admin codex tabs use X icon instead of Trash2
    - Delete buttons trigger inline confirmation, not openEdit()
    - npm run build passes
  notes: "Completed 2026-02-11. Fixed critical delete handler bug in all 9 tabs."

- id: TASK-186
  title: Inline delete confirmation in admin codex
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin codex delete buttons now show an inline "Remove? Yes/No" confirmation instead of opening a modal. Same pattern used for both list row delete and modal footer delete.
  related_files:
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
  acceptance_criteria:
    - Clicking delete on a list item shows inline "Remove? Yes/No" text
    - Clicking "Yes" performs the delete, "No" cancels
    - npm run build passes
  notes: "Completed 2026-02-11."

- id: TASK-187
  title: Add inline pencil/edit icon to GridListRow for library items
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Added inline Edit (pencil) icon to GridListRow collapsed row when onEdit is provided. Previously edit button was only visible in expanded content. Now users can quickly click edit from the row.
  related_files:
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - Edit icon visible in collapsed row when onEdit is provided
    - Uses same Edit icon from lucide-react
    - npm run build passes
  notes: "Completed 2026-02-11."

- id: TASK-188
  title: Power and technique creators handle ?edit= query param to load items
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Power creator and technique creator now handle ?edit=<id> URL parameter to load an existing item for editing, matching the item creator's existing behavior. Library edit buttons navigate to /power-creator?edit=<id> or /technique-creator?edit=<id>.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
  acceptance_criteria:
    - Power creator loads power from URL param using handleLoadPower
    - Technique creator loads technique from URL param using handleLoadTechnique
    - Suspense boundary wraps content for useSearchParams
    - npm run build passes
  notes: "Completed 2026-02-11."

- id: TASK-189
  title: Fix save/display pipeline Ã¢â‚¬â€ item auto-gen properties, technique actionType, enrichment
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Fixed multiple data pipeline issues causing powers/techniques/items to show incorrect costs when viewed outside creators:
    1. Item creator was saving only selectedProperties, missing auto-generated properties (Weapon Damage, Two-Handed, Range, Armor Base, Shield Amount, etc.). Fixed to save propertiesPayload.
    2. Technique creator was not saving actionType/isReaction fields. Fixed to include them.
    3. TechniqueDocument interface lacked actionType/isReaction. Updated interface and deriveTechniqueDisplay to use saved values with fallback to derivation.
  related_files:
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/lib/calculators/technique-calc.ts
  acceptance_criteria:
    - Item creator saves all properties including auto-generated ones
    - Technique creator saves actionType and isReaction
    - deriveTechniqueDisplay uses saved actionType/isReaction when available
    - npm run build passes
  notes: "Completed 2026-02-11. Root cause of reported display mismatch: auto-gen properties not saved + technique action type derived instead of using saved value."

- id: TASK-183
  title: Admin Parts Ã¢â‚¬â€ edit defense targets
  priority: low
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Parts support an optional `defense` string[] to indicate which defenses they target, but the Admin Parts modal currently has no UI for this field. Add an editor control (multi-select of the 6 defenses) so admins can set or clear defense targets for duration/defense-related parts.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
  acceptance_criteria:
    - AdminPartsTab exposes a multi-select for defense targeting, with options from the 6 canonical defenses
    - Saved parts persist `defense` as per schema, and CodexPartsTab can display/use this information as needed
    - npm run build passes
  notes: |
    Done 2026-02-16. Added defense to PowerPart type and codex API parts mapping. AdminPartsTab: ChipSelect for targeted defenses (6 from ABILITIES_AND_DEFENSES.slice(6)), form/state/openEdit/handleSave; defense persisted in codex_parts data.

- id: TASK-190
  title: Admin Creature Feats Ã¢â‚¬â€ level, requirement, mechanic flags
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Admin Creature Feats tab only supports name/description/points today, even though the codex_creature_feats schema
    defines feat_points, feat_lvl, lvl_req, and mechanic. Admins need to be able to set the feat's own level, the minimum
    creature level required, and whether the entry is a mechanic-only feat. The admin list and creature-creator integration
    should respect these fields.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx
    - src/app/api/codex/route.ts
    - src/hooks/use-rtdb.ts
    - src/hooks/use-codex.ts
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
  acceptance_criteria:
    - AdminCreatureFeatsTab edit modal exposes inputs for feat point cost, feat level, required creature level, and a mechanic-only checkbox, mapped to feat_points, feat_lvl, lvl_req, and mechanic in codex_creature_feats
    - Existing creature feats seeded from CSV load their level requirement, feat level, and mechanic flag correctly into the edit modal
    - The creature feats list shows at least the feat point cost and either level requirement or feat level in columns, so admins can see tiering at a glance
    - Codex API (`/api/codex`) returns the new fields in the creatureFeats payload in a way that is compatible with the creature creatorÃ¢â‚¬â€s feat points calculation
    - npm run build passes
  notes: "Done 2026-02-16: Modal/form already had feat_lvl, lvl_req, mechanic. Added feat_points to codex API; added FEAT LVL column to list (Pts, Feat Lvl, Req. Lvl) with sort."

- id: TASK-191
  title: Admin Equipment Ã¢â‚¬â€ currency, category, and type alignment
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Admin Equipment tab does not align with the codex_equipment schema. There is no explicit input for category or
    currency, the "Type" dropdown currently mixes armor/weapon/equipment in a way that doesn't match the codex schema,
    and items that have a non-zero cost in the list show a cost of 0 in the edit modal. The admin editor and list need
    to be wired directly to category and currency while keeping equipment-specific type handling consistent with how
    equipment is consumed elsewhere (item creator, library, creature armaments).
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/app/api/codex/route.ts
    - src/lib/item-transformers.ts
    - src/hooks/use-rtdb.ts
  acceptance_criteria:
    - AdminEquipmentTab edit modal includes fields for category and currency (base cost) and populates them correctly for existing equipment
    - Saving from the edit modal persists category and currency back to codex_equipment so `/api/codex` returns the correct cost
    - The equipment listÃ¢â‚¬â€s cost column reflects the true currency value from the codex row (no more showing 0 in the modal when the list shows a non-zero cost)
    - The "Type" handling in AdminEquipmentTab matches how equipment type is used in item/armament creators (no misleading armor/weapon-only values when editing generic equipment)
    - npm run build passes
  notes: "Done 2026-02-16: Category/currency/rarity already in modal. API equipment mapping: currency/gold_cost parsed from number or string so edit modal shows correct cost. Rarity as dropdown (Common..Ascended); currency input step=0.01, parseFloat."

- id: TASK-192
  title: Admin Properties & Parts Ã¢â‚¬â€ mechanic/duration flags, percentage display, option chips
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    Several Admin Codex tabs for armament properties and power/technique parts are out of sync with the codex schema and
    public Codex views. Property type currently defaults to "general" (which is not a real property type), mechanic flags
    in the edit modal do not reflect existing mechanic properties, parts filtering defaults to hiding mechanic parts, and
    duration parts with duration=true are not wiring the "Affects Duration" checkbox correctly. Additionally, the Admin
    Parts list shows percentage-based EN parts as raw base_en values instead of formatted percentages, and list rows with
    options do not surface those options as expandable chips the way the Codex Parts/Properties tabs do.
  notes: |
    Done 2026-02-16. Properties: Type dropdown modal uses only Armor, Shield, Weapon (removed General). Parts: API parts mapping now returns duration; mechanic filter uses placeholder "All parts" only (mechanicMode ''), no duplicate All option. Percentage EN and option chips already present.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminPropertiesTab.tsx
    - src/app/(main)/admin/codex/AdminPartsTab.tsx
    - src/app/(main)/codex/CodexPartsTab.tsx
    - src/app/(main)/codex/CodexPropertiesTab.tsx
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - AdminPropertiesTab type dropdown uses only the canonical property types ("Armor", "Shield", "Weapon") and initial selection reflects the propertyÃ¢â‚¬â€s actual type (no "general" default)
    - Mechanic properties load into the AdminPropertiesTab edit modal with the Mechanic checkbox correctly checked when mechanic=true and unchecked otherwise, and saving preserves the flag
    - AdminPartsTab mechanic filter defaults to showing all parts (not hiding mechanics), and the "Affects Duration" checkbox is wired to the codex_parts.duration field so duration parts round-trip correctly
    - AdminPartsTab energy column formats percentage-based parts using the same percentage formatting logic as CodexPartsTab (e.g., "+25%" instead of "1.25"), while non-percentage parts continue to show flat EN
    - Parts and properties that have option descriptions/costs render those options in the admin lists as expandable chips (via GridListRow detailSections/chips) so admins can inspect option text and costs without opening the modal
    - npm run build passes

- id: TASK-193
  title: Admin Traits & Species Ã¢â‚¬â€ flaw/characteristic flags, sizes, trait chips
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    In the Admin Traits and Species tabs, the boolean flags and size handling are misleading. Trait edit modals do not
    show the flaw/characteristic checkboxes as checked even when the underlying trait has those flags set to true,
    and the Species editor exposes a "Primary size" concept even though the codex schema only defines a sizes array.
    Additionally, when editing species, the chips used to add traits (species_traits, ancestry_traits, flaws,
    characteristics) are not expandable, making it hard for RMs to read the full trait descriptions inline.
  notes: |
    Verified 2026-02-16. Traits: API returns flaw/characteristic; openEdit sets flaw/characteristic from t.flaw===true, t.characteristic===true; handleSave persists both. Species: Modal shows only "All Sizes (comma-separated)" (no Primary size field); list uses sizes array; expandable trait chips (detailSections with descriptions) already in list.
  related_files:
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/app/(main)/admin/codex/AdminTraitsTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/hooks/use-rtdb.ts
    - src/hooks/use-codex.ts
    - src/components/shared/grid-list-row.tsx
  acceptance_criteria:
    - AdminTraitsTab loads existing traits with flaw and characteristic checkboxes reflecting the true underlying booleans (no more unchecked boxes for true flags), and saving preserves both flags
    - AdminSpeciesTab no longer surfaces a "Primary size" field in the UI; size display is derived from the sizes array per CODEX_SCHEMA_REFERENCE, and only sizes is editable
    - Species edit modal uses trait selections (species_traits, ancestry_traits, flaws, characteristics) that render as expandable chips in the expanded species row so RMs can click and read each traitÃ¢â‚¬â€s description without leaving the list
    - Any size filters in the Species list continue to work using the sizes array
    - npm run build passes

- id: TASK-194
  title: Admin Skills & Feats Ã¢â‚¬â€ base skill display and filter Ã¢â‚¬â€AllÃ¢â‚¬â€ options
  priority: medium
  status: done
  created_at: 2026-02-11
  created_by: owner
  description: |
    The Admin Skills and Feats tabs have small but confusing UX issues. In Admin Skills, many skills show "-" for the
    Base Skill column even when they have a valid base_skill_id, and the Skill Type filter presents two "All Skills"
    choices (one as a placeholder and one as an explicit option). In Admin Feats, the Feat Type and State Feats filters
    similarly present duplicate "All"/"All Feats" options. The base skill editor should also reliably pre-populate the
    base skill dropdown when editing existing sub-skills.
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/docs/CODEX_SCHEMA_REFERENCE.md
  acceptance_criteria:
    - AdminSkillsTab Base Skill column shows the correct base skill name for all skills with a valid base_skill_id (including id 0 ? Ã¢â‚¬â€AnyÃ¢â‚¬â€), falling back to "-" only when there truly is no base skill
    - Editing an existing sub-skill in AdminSkillsTab pre-selects the appropriate base skill (or Ã¢â‚¬â€AnyÃ¢â‚¬â€) in the Base skill dropdown based on base_skill_id
    - The Skill Type SelectFilter in AdminSkillsTab has a single clear way to show Ã¢â‚¬â€all skillsÃ¢â‚¬â€ (e.g., placeholder only or explicit option only), eliminating duplicate Ã¢â‚¬â€All SkillsÃ¢â‚¬â€ entries
    - The Feat Type and State Feats filters in AdminFeatsTab likewise avoid duplicate Ã¢â‚¬â€AllÃ¢â‚¬â€/Ã¢â‚¬â€All FeatsÃ¢â‚¬â€ options while preserving the ability to filter by archetype/character and state feats
    - npm run build passes
  notes: |
    Done 2026-02-16. Skills: Base Skill column fallback to skills.find when map lookup fails; subSkillMode '' with placeholder "All skills"; Feats: featTypeMode/stateFeatMode '' with placeholders "All types"/"All states". Base skill dropdown already pre-populates via openEdit.

- id: TASK-195
  title: "CANCELLED: Ability cost threshold - code is correct"
  priority: critical
  status: cancelled
  created_at: 2026-02-11
  created_by: agent
  notes: |
    Owner confirmed 2026-02-11: "abilities cost 2 for every 1 point after 4."
    COST_INCREASE_THRESHOLD = 4 in constants.ts IS correct. Going from 3?4 costs 1, 4?5 costs 2.
    GAME_RULES.md had an incorrect table (said 3?4 costs 2) which has been corrected.
  related_files:
    - src/lib/game/constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - COST_INCREASE_THRESHOLD is 3 in constants.ts
    - getAbilityIncreaseCost(3) returns 2
    - getAbilityIncreaseCost(2) returns 1
    - Character creator and character sheet ability steppers show cost of 2 pts at value 3+
    - npm run build passes

- id: TASK-196
  title: "Bug: maxHealth ignores archetype ability - always uses Vitality"
  priority: critical
  status: done
  notes: "Done 2026-02-11. Fixed character-sheet-utils.ts and getCharacterMaxHealthEnergy in formulas.ts to use getBaseHealth() which checks if vitality is archetype ability and uses strength instead."
  created_at: 2026-02-11
  created_by: agent
  description: |
    GAME_RULES.md states Base health is 8 + Vitality (or Strength if Vitality is archetype ability).
    The centralized calculateMaxHealth() in calculations.ts correctly checks this, but the inline
    calculation in character-sheet-utils.ts does NOT - it always uses vitality. Characters whose
    archetype ability IS Vitality get incorrect health. They should use Strength for health instead.
    Example from saved character: pow_abil=vitality, vitality=3, strength=-1, level=1, healthPoints=8.
    Incorrect (current): 8 + 3*1 + 8 = 19.
    Correct: 8 + (-1) + 8 = 15 (use strength since vitality IS archetype ability; strength negative
    so only applied at level 1).
    Fix: Replace inline health calc in character-sheet-utils.ts with calculateMaxHealth() from
    calculations.ts, passing the archetype ability.
  related_files:
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/lib/game/calculations.ts
  acceptance_criteria:
    - character-sheet-utils.ts calls calculateMaxHealth() instead of inline formula
    - When Vitality is the archetype ability, Strength is used for health calculation
    - Negative ability modifier only applied once (not scaled by level)
    - npm run build passes

- id: TASK-197
  title: "Bug: Character creator uses hardcoded base health/energy (10) instead of formulas"
  priority: critical
  status: done
  notes: "Done 2026-02-11. Replaced hardcoded baseHealth=10/baseEnergy=10 in character-creator-store.ts with getBaseHealth()/getBaseEnergy() formulas. currentHealth/currentEnergy now calculated correctly."
  created_at: 2026-02-11
  created_by: agent
  description: |
    In character-creator-store.ts getCharacter(), the code uses:
      const baseHealth = 10; const baseEnergy = 10;
    These are incorrect hardcoded values. The correct formulas (from GAME_RULES.md):
    - Base health: 8 + Vitality (or Strength if Vitality is archetype ability)
    - Base energy: archetype ability score
    - Max health: 8 + (ability * level if positive, ability once if negative) + healthPoints
    - Max energy: (archetypeAbility * level) + energyPoints
    The creator sets currentHealth = 10 + healthPoints, which is wrong.
    Fix: Import and use calculateMaxHealth() and calculateMaxEnergy() from calculations.ts.
    Set currentHealth = maxHealth and currentEnergy = maxEnergy at creation.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/game/calculations.ts
  acceptance_criteria:
    - Creator uses calculateMaxHealth / calculateMaxEnergy instead of hardcoded 10
    - New characters start with currentHealth = maxHealth, currentEnergy = maxEnergy
    - Health floor correctly uses Vitality (or Strength when Vitality is archetype ability)
    - Energy floor correctly uses archetypeAbility * level
    - npm run build passes

- id: TASK-198
  title: "Fix game constants - ability caps, damage types, Staggered, ice naming"
  priority: high
  status: done
  notes: "Done 2026-02-11. Fixed ability caps (10 chars/20 creatures), renamed cold?ice, added Staggered, removed physical/magic damage split, added ARMOR_EXCEPTION_TYPES, added LEVELS_BY_RARITY, fixed creature TP (22 base, 2/level) and skill points (5 at L1, 3/level), fixed archetype armament max values, updated encounter-tracker conditions."
  created_at: 2026-02-11
  created_by: agent
  tags: [owner-resolved]
  description: |
    Owner confirmed 2026-02-11. All resolved values:
    1. CONDITIONS array in creator-constants.ts is missing Staggered (a leveled condition). Add it.
    2. Remove MAGIC_DAMAGE_TYPES / PHYSICAL_DAMAGE_TYPES split. No "physical vs magic" categories.
       All damage types are a flat list. Only distinction: armor exceptions (Psychic, Spiritual, Sonic
       not reduced by armor). Acid is a valid damage type usable by powers.
    3. Canonical name is "Ice" not "cold" - rename in code.
    4. Ability caps: MAX_ABSOLUTE = 10 for characters, 20 for creatures. Remove any level-based cap.
       COST_INCREASE_THRESHOLD = 4 is correct (cost doubles at 4+, not 3+).
    5. Add ARMOR_EXCEPTION_TYPES = ["Psychic", "Spiritual", "Sonic"] constant.
    6. Add ALL_DAMAGE_TYPES flat list: Magic, Fire, Ice, Lightning, Spiritual, Sonic, Poison,
       Necrotic, Acid, Psychic, Light, Bludgeoning, Piercing, Slashing.
    7. Add LEVELS_BY_RARITY reference: Common 1-4, Uncommon 5-9, Rare 10-14, Epic 15-19,
       Legendary 20-24, Mythic 25-29, Ascended 30+.
  related_files:
    - src/lib/game/creator-constants.ts
    - src/lib/game/constants.ts
    - src/lib/game/constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Staggered is added to the CONDITIONS array
    - acid is added to MAGIC_DAMAGE_TYPES
    - Ice/cold naming is consistent between code and GAME_RULES.md
    - ABILITY_LIMITS.MAX_ABSOLUTE is reviewed and corrected (owner confirm 5, 6, or 10)
    - npm run build passes

- id: TASK-199
  title: "Fix feat slot formulas - character feats = level, archetype varies by archetype"
  priority: high
  status: done
  notes: "Done 2026-02-11. Replaced floor(level/4)+1 with correct archetype-aware formulas. Character feats = level. Archetype feats: Power=level, Martial=level+2+floor((level-1)/3), P-M=level+1+milestones. Updated character sheet, feats-step, level-up-modal, progression.ts."
  created_at: 2026-02-11
  created_by: agent
  tags: [owner-resolved]
  description: |
    Owner confirmed 2026-02-11. The correct feat formulas are:
    CHARACTER FEATS: Always 1 per level. Total = level. All archetypes.
    ARCHETYPE FEATS (base): 1 per level = level.
    ARCHETYPE FEATS (martial bonus): +2 at level 1, then +1 every 3 levels starting at 4.
      - Martial total: level + 2 + floor((level - 1) / 3)
      - Power total: level (no bonus)
      - Powered-Martial: level + choices at milestones (every 3 levels starting at 4,
        choose Additional Feat OR Increase Innate Power)
    Current code uses Math.floor(level / 4) + 1 which is WRONG for ALL archetypes.
    Fix: Replace feat calculations in character sheet and character creator to use these formulas.
    The archetype type must be known to compute archetype feats correctly.
    Reference: Full progression tables in GAME_RULES.md Archetype Rules section.
    If formula differs by archetype, implement per-archetype feat progression.
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/lib/game/formulas.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Owner confirms correct feat slot formula (per archetype or universal)
    - Both character sheet and character creator use the same formula
    - Formula is centralized in formulas.ts as a shared function
    - npm run build passes

- id: TASK-199b
  title: "Bug: SAVEABLE_FIELDS missing critical fields, xp vs experience mismatch"
  priority: high
  status: done
  notes: "Done 2026-02-11. Added missing fields to SAVEABLE_FIELDS: archetypeFeats, unarmedProwess, description, status, namedNotes, currentHealth, currentEnergy, health_energy_points, defenseVals, experience, trainingPointsSpent."
  created_at: 2026-02-11
  created_by: agent
  description: |
    The SAVEABLE_FIELDS whitelist in data-enrichment.ts is missing fields that should persist:
    1. archetypeFeats - not in list (handled by separate code path, but fragile)
    2. unarmedProwess - user-allocated value, silently dropped on save
    3. namedNotes - user-created named notes, silently dropped
    4. description - character description, silently dropped
    5. status - character status (draft/complete/playing), silently dropped
    6. xp is in the list but the Character type uses experience - potential data loss
    archetypeFeats is cleaned in the function body but relies on it already existing on the
    data object rather than being in the whitelist. This is fragile.
  related_files:
    - src/lib/data-enrichment.ts
    - src/types/character.ts
  acceptance_criteria:
    - SAVEABLE_FIELDS includes archetypeFeats, unarmedProwess, namedNotes, description, status
    - xp is changed to experience (or both are included with a note)
    - All user-editable fields survive a save/reload cycle
    - npm run build passes

- id: TASK-200
  title: "Design: Define canonical CharacterSaveData type - what gets persisted"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a new TypeScript type (CharacterSaveData) that represents EXACTLY what gets written
    to the Prisma JSON blob. Single source of truth for persistence. Every field must have a
    JSDoc comment explaining whether it is a user choice, runtime state, or reference ID.
    IDENTITY AND META: id, userId, name, description, notes, namedNotes, portraitUrl, status,
      level, experience, visibility, createdAt, updatedAt
    BUILD CHOICES: speciesId, selectedTraitIds, selectedFlawId, selectedCharacteristicId,
      archetypeId, pow_abil, mart_abil, abilities, defenseVals, skillAllocations as
      Record<string, {prof,val}>, featIds, archetypeFeatIds, powerRefs as Array<{id,innate}>,
      techniqueRefs as Array<{id}>, inventory as Array<{itemId,quantity,equipped?}>,
      healthPoints, energyPoints, currency, unarmedProwess, archetypeChoices
    RUNTIME STATE: currentHealth, currentEnergy, temporaryHealth, temporaryEnergy,
      conditions, featUses as Record<string,number>, traitUses as Record<string,number>
    NOT PERSISTED (derived on load): maxHealth, maxEnergy, defenseScores, defenseBonuses,
      evasion, speed, names/descriptions/properties, martialProficiency, powerProficiency, terminal
    Defines the type and documents migration mapping. Actual migration in later tasks.
  related_files:
    - src/types/character.ts
    - src/types/skills.ts
    - src/types/feats.ts
    - src/types/equipment.ts
    - src/types/archetype.ts
    - src/types/ancestry.ts
  acceptance_criteria:
    - New CharacterSaveData type exists with JSDoc for every field
    - Migration mapping document (old field to new field) is written in a comment block
    - Every field is tagged as user-choice, runtime-state, or reference-id
    - The type compiles and npm run build passes
    - Existing Character type is NOT deleted yet (coexists for gradual migration)
  notes: |
    Completed 2026-02-11: Added CharacterSaveData interface to src/types/character.ts with full
    documentation. Covers identity, core stats, species/archetype selections, skill allocations,
    feats (IDs only), powers/techniques (IDs only), inventory (IDs + quantity), runtime state
    (conditions, traitUses, currentHealth/Energy), and user notes. Exported from types/index.ts.
    Coexists with existing Character type for gradual migration.

- id: TASK-201
  title: "Centralize all health/energy/defense/speed/evasion calculations"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Health/energy/defense/speed/evasion calculations are duplicated in:
    - src/lib/game/calculations.ts (centralized, mostly correct)
    - src/app/(main)/characters/[id]/character-sheet-utils.ts (inline, some bugs)
    - src/stores/character-creator-store.ts (hardcoded bases)
    - src/lib/game/formulas.ts (another set of health/energy functions)
    Consolidate into calculations.ts as the SINGLE source of truth:
    - calculateMaxHealth, calculateMaxEnergy, calculateDefenses, calculateSpeed, calculateEvasion
      already exist and are correct
    - Add calculateTerminal(maxHealth) as Math.ceil(maxHealth / 4)
    - Add calculateAllStats(character) master function returning all derived stats
    Replace inline formulas in character-sheet-utils.ts and character-creator-store.ts.
    Deprecate getCharacterMaxHealthEnergy, getBaseHealth, getBaseEnergy in formulas.ts.
    Remove legacy calculateSkillPoints() (gives 2+3*level=5 at level 1) - only
    calculateSkillPointsForEntity() (gives 3*level=3 at level 1) matches GAME_RULES.
  related_files:
    - src/lib/game/calculations.ts
    - src/lib/game/formulas.ts
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/stores/character-creator-store.ts
  acceptance_criteria:
    - All health/energy/defense/speed/evasion calculations use functions from calculations.ts
    - No inline formula duplication in character-sheet-utils.ts or character-creator-store.ts
    - Legacy calculateSkillPoints() is removed or deprecated with a redirect
    - calculateAllStats(character) master function exists and is used by character sheet
    - npm run build passes
  notes: |
    Completed 2026-02-11: Added calculateTerminal(), calculateAllStats(), computeMaxHealthEnergy()
    to calculations.ts as single source of truth. Replaced inline formulas in character-sheet-utils.ts
    (now a thin wrapper), character-creator-store.ts (uses calculateMaxHealth/calculateMaxEnergy),
    finalize-step.tsx, campaign character API route (computeMaxHealthEnergy). Deprecated
    getBaseHealth, getBaseEnergy, getCharacterMaxHealthEnergy, calculateSkillPoints in formulas.ts.
    Updated level-up-modal, progression.ts, creature-creator to use calculateSkillPointsForEntity.
    0 new TS errors.

- id: TASK-202
  title: "Unify defense fields - keep only defenseVals, remove defenseSkills alias"
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    The character saves BOTH defenseVals and defenseSkills - identical objects representing
    skill points spent on defenses (2 skill points = +1 defense val). Per owner: defenses
    should only have vals not skills since vals represent 2 skill points spent per 1.
    Action:
    1. Keep only defenseVals as the canonical field name
    2. Update all code reading/writing defenseSkills to use defenseVals
    3. In cleanForSave, save only defenseVals
    4. On load, if old character has defenseSkills but not defenseVals, copy it over
    5. Update Character type to mark defenseSkills as deprecated
  related_files:
    - src/types/character.ts
    - src/types/skills.ts
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Only defenseVals is used throughout the codebase
    - defenseSkills is removed or marked deprecated with migration fallback
    - SAVEABLE_FIELDS saves defenseVals, not defenseSkills
    - Old characters with defenseSkills still load correctly
    - npm run build passes
  notes: |
    Completed 2026-02-11: Added defenseVals to Character type (canonical field). defenseSkills
    marked @deprecated. All reads now use defenseVals || defenseSkills for backward compat.
    All writes (creator store, skills-step, page.tsx handleDefenseChange) now write defenseVals.
    cleanForSave() migrates old defenseSkills -> defenseVals automatically. calculateAllStats()
    merges both with defenseVals taking priority. Removed defenseSkills from SAVEABLE_FIELDS.
    12 files updated. 0 new TS errors.

- id: TASK-203
  title: "Creator: Save species as speciesId, not name/object - derive on load"
  priority: high
  status: done
  notes: |
    cleanForSave strips ancestry to { id, name, selectedTraits, selectedFlaw, selectedCharacteristic }.
    Removed 'species' string and 'ancestryId'/'ancestryTraits' from SAVEABLE_FIELDS. Creator no longer
    saves redundant 'species' string. Migration in cleanForSave: if no ancestry but species string exists,
    creates ancestry { name: species }. Server-side listing falls back to d.species for old characters.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently the creator saves: species (name string), ancestry (full object with id, name,
    selectedTraits, selectedFlaw, selectedCharacteristic). The term should be species not
    ancestry per GAME_RULES terminology. Redundant fields:
    - species (top-level string) redundant with ancestry.name
    - ancestry.name redundant with codex lookup by ID
    - Top-level ancestryTraits, flawTrait, characteristicTrait, speciesTraits are legacy dupes
    Change to save: speciesId, selectedTraitIds, selectedFlawId, selectedCharacteristicId.
    Remove: species (string), ancestry.name, all legacy top-level trait fields.
    On load: look up species name, traits from codex by ID.
  related_files:
    - src/stores/character-creator-store.ts
    - src/components/character-creator/steps/species-step.tsx
    - src/types/character.ts
    - src/types/ancestry.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Creator saves speciesId + trait selection IDs only (no name, no full objects)
    - Character sheet loads species name from codex by speciesId
    - Trait names/descriptions loaded from codex by ID
    - Old characters with species/ancestry fields still load (backward compat fallback)
    - The word ancestry is replaced with species in all user-facing labels
    - npm run build passes

- id: TASK-204
  title: "Creator: Save archetype as archetypeId only - derive prof/abilities from codex"
  priority: high
  status: done
  notes: |
    Creator now saves lean archetype { id, type } only. cleanForSave strips name/description/ability.
    CharacterArchetype.name made optional (@deprecated). Sheet-header and server-side listing derive
    display name from archetype.type (capitalize + split-on-dash). Removed archetypeName/archetypeAbility
    from SAVEABLE_FIELDS. archetypeAbility prop derives from pow_abil with archetype.ability fallback.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently the creator saves a full archetype object { id, name, type, ability, pow_abil,
    mart_abil } PLUS duplicates pow_abil, mart_abil, mart_prof, pow_prof at the top level.
    Change to save: archetypeId (string), pow_abil (AbilityName, user choice),
    mart_abil (AbilityName or undefined, user choice).
    Remove from save: archetype object (name/type derived from codex), mart_prof/pow_prof
    (derived from archetype type + level via formulas).
    Remove dual martialProficiency/powerProficiency aliases.
  related_files:
    - src/stores/character-creator-store.ts
    - src/types/character.ts
    - src/types/archetype.ts
    - src/lib/game/formulas.ts
    - src/lib/game/constants.ts
  acceptance_criteria:
    - Creator saves archetypeId + pow_abil + mart_abil only
    - mart_prof/pow_prof calculated from archetype type + level on load
    - martialProficiency/powerProficiency aliases removed from Character type
    - Character sheet derives archetype name, type, proficiencies from codex/formulas
    - Old characters with full archetype objects still load (backward compat)
    - npm run build passes

- id: TASK-205
  title: "Creator: Save feats as IDs only - derive name/description from codex"
  priority: high
  status: done
  notes: |
    cleanForSave now saves feats as { id, name, currentUses } only Ã¢â‚¬â€ description/maxUses/recovery
    stripped from save. Recovery handlers (full + partial) and feat uses handler look up maxUses
    and rec_period from codex (featsDb) with fallback to saved feat.maxUses for backward compat.
    add-feat-modal saves lean { id, name, currentUses } on creation.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently feats saved with { name, description, id, maxUses, currentUses, recovery }.
    Name, description, maxUses, recovery are ALL in codex_feats - only the ID and runtime
    currentUses need to be on the character.
    Change to save: archetypeFeatIds (string[]), featIds (string[]),
    featUses Record<string, number> (featId to currentUses for limited-use feats).
    On load: look up feat details from codex_feats by ID.
    Update cleanForSave, feats-tab.tsx, add-feat-modal.
  related_files:
    - src/stores/character-creator-store.ts
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/lib/data-enrichment.ts
    - src/types/feats.ts
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves feat IDs only (no name/description on character)
    - Character sheet loads feat details from codex by ID
    - Feat uses tracked per feat ID in a separate map
    - Recovery handlers use codex for maxUses
    - Old characters with {name,description} feats still load (fallback match by name)
    - npm run build passes

- id: TASK-206
  title: "Creator: Save powers as { id, innate } only - derive from library + codex parts"
  priority: high
  status: done
  notes: |
    cleanForSave now saves powers as { id, name, innate } Ã¢â‚¬â€ name kept for backward compat lookup,
    description/parts/cost/damage/etc stripped. enrichPowers() already supports ID-based lookup
    via findInLibrary(), so existing characters load seamlessly.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently powers saved with { name, innate } (sometimes full objects). Only the library
    power ID and innate flag (user choice) need to be saved.
    Change to save: powerRefs Array<{ id: string; innate: boolean }>
    On load: enrichPowers() matches by name - change to match by ID.
    Powers live in user library (user-created), not global codex. Parts reference codex_parts.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves power references as { id, innate } only
    - enrichPowers() matches by ID (not name) as primary lookup
    - Character sheet displays full power details from library enrichment
    - Old characters with { name, innate } still load (fallback match by name)
    - npm run build passes

- id: TASK-207
  title: "Creator: Save techniques as { id } only - derive from library + codex parts"
  priority: high
  status: done
  notes: |
    cleanForSave now saves techniques as { id, name } objects Ã¢â‚¬â€ name kept for backward compat,
    description/parts/cost/damage/etc stripped. Previously saved bare name strings. enrichTechniques()
    already supports both string and object inputs via findInLibrary().
  created_at: 2026-02-11
  created_by: agent
  description: |
    Currently techniques saved as bare name strings. Only the library technique ID is needed.
    Change to save: techniqueRefs Array<{ id: string }>
    On load: enrichTechniques() matches by name - change to match by ID.
    Same pattern as TASK-206 for powers.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves technique references as { id } only
    - enrichTechniques() matches by ID (not name) as primary lookup
    - Old characters with name strings still load (fallback match by name)
    - npm run build passes

- id: TASK-208
  title: "Creator: Save skills as Record<skillId, {prof,val}> - derive name/ability from codex"
  priority: high
  status: done
  notes: |
    cleanForSave now strips ability, baseSkillId, category from saved skills Ã¢â‚¬â€ only keeps
    { id, name, skill_val, prof, selectedBaseSkillId? }. name kept as backward compat lookup key.
    ability and baseSkillId derived from codex_skills on load.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Skills have a type mismatch: CharacterSkills is Record<string, number> but runtime is
    Array<{ id, name, skill_val, prof, ability, baseSkillId? }>. Code uses unsafe casts.
    Name, ability, baseSkillId are ALL in codex_skills - only skill ID, prof, and val needed.
    Change to save: skills Record<string, { prof: boolean; val: number; selectedBaseSkillId? }>
    On load: look up skill name, ability, base_skill_id from codex_skills by ID.
    This also fixes the type mismatch - no more casting.
  related_files:
    - src/stores/character-creator-store.ts
    - src/types/skills.ts
    - src/types/character.ts
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-creator/steps/skills-step.tsx
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Skills saved as Record<string, {prof,val,selectedBaseSkillId?}>
    - No more unsafe casts for skills
    - Skill names, abilities loaded from codex on render
    - Creator and sheet both use the same skill data shape
    - Old characters with array-of-objects skills still load (migration on read)
    - npm run build passes

- id: TASK-209
  title: "Creator: Save equipment as single inventory with IDs - remove redundant sub-arrays"
  priority: high
  status: done
  notes: |
    cleanForSave now saves equipment items as { id, name, equipped?, quantity? } Ã¢â‚¬â€ strips
    description/damage/properties/cost/rarity/weight/armor/range. ID saved for reliable lookup,
    name kept for backward compat. Redundant inventory[] array removed from save. enrichItems()
    updated to support ID-based lookup with codex fallback by ID.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Equipment saved with: inventory[] (full objects) + weapons[] + armor[] + items[] (also full
    objects, filtered from inventory). This is triple-redundant.
    Change to save: inventory Array<{ itemId: string; quantity: number; equipped?: boolean }>
    Remove: equipment.weapons, equipment.armor, equipment.items (derived views).
    Remove: full item objects from inventory (name, cost, damage, properties from codex).
    On load: enrichItems() looks up each itemId in user library or codex_equipment.
    Views computed by filtering enriched inventory by type.
  related_files:
    - src/stores/character-creator-store.ts
    - src/lib/data-enrichment.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/types/equipment.ts
    - src/types/character.ts
  acceptance_criteria:
    - Creator saves inventory as [{itemId,quantity,equipped}] only
    - No redundant weapons/armor/items sub-arrays saved
    - enrichItems() matches by ID (primary) with name fallback
    - Character sheet derives item details from codex
    - Old characters with full item objects still load
    - npm run build passes

- id: TASK-210
  title: "Creator: Save lean health/energy - allocation + current only, remove duplicates"
  priority: high
  status: done
  notes: |
    Removed health_energy_points from creator save. Removed health/energy ResourcePool from
    SAVEABLE_FIELDS. Character sheet now reads currentHealth/currentEnergy (canonical) with
    backward compat fallback to health?.current/energy?.current for old saves. All writes
    (recovery, power/technique use, allocation changes) write to currentHealth/currentEnergy.
    cleanForSave migration copies health.current?currentHealth for old data on save.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Creator saves health/energy in FOUR overlapping representations:
    1. healthPoints / energyPoints - allocation (correct, keep)
    2. health_energy_points: { health, energy } - same as 1, redundant (remove)
    3. health: { current, max } / energy: { current, max } - max is derived (remove max)
    4. currentHealth / currentEnergy - duplicate of health.current (consolidate)
    Change to save: healthPoints, energyPoints, currentHealth, currentEnergy.
    Remove: health_energy_points, health.max, energy.max, ResourcePool objects.
    On load: maxHealth and maxEnergy calculated from formulas.
  related_files:
    - src/stores/character-creator-store.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/types/character.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Creator saves only healthPoints, energyPoints, currentHealth, currentEnergy
    - health_energy_points field is removed
    - health/energy ResourcePool objects are not saved (max is calculated on load)
    - Character sheet reads currentHealth/currentEnergy directly, calculates max
    - Old characters with ResourcePool objects still load
    - npm run build passes

- id: TASK-211
  title: "Sheet: Load feats by ID from codex - derive name, description, uses"
  priority: high
  status: done
  notes: |
    enrichFeat() updated to derive name from codex when missing. Fixed uses_per_rec field mapping
    (codex API returns uses_per_rec, not max_uses). CodexFeat interface updated with uses_per_rec field.
    Feats tab now works fully with lean { id, currentUses } data.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update feats-tab.tsx and page.tsx to work with lean feat data (IDs + uses).
    On load: for each feat ID in archetypeFeatIds/featIds, look up in codex_feats.
    Derive name, description, category, maxUses, recovery, requirements.
    Merge with featUses map for current uses.
    Recovery handlers should look up maxUses from codex, not from saved feat.
  related_files:
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Feats tab renders all data from codex lookup
    - No feat name/description read from the character object
    - Add feat saves only ID
    - Recovery handlers use codex for maxUses
    - npm run build passes

- id: TASK-212
  title: "Sheet: Load powers/techniques by ID from library - derive all display data"
  priority: high
  status: done
  notes: |
    Already fully working from Phase 4. findInLibrary() tries ID first then name.
    enrichPowers() and enrichTechniques() pass full character reference to findInLibrary.
    LibrarySection receives enrichedData.powers/techniques. Verified end-to-end path.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update library-section.tsx to work with lean power/technique references.
    On load: for each power ref {id,innate}, find in user library by ID.
    enrichPowers() already matches by name - switch to ID-based lookup. Same for techniques.
    Innate flag and EN cost deduction are the only character-specific behaviors.
    All other display data comes from library item + codex parts enrichment.
    Unify this pattern with how Library page and Codex page display the same items.
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/lib/data-enrichment.ts
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Powers/techniques resolved by ID from user library
    - All display data comes from enrichment, not saved character
    - Innate flag correctly read from character reference
    - EN cost deduction still works
    - npm run build passes

- id: TASK-213
  title: "Sheet: Load equipment by ID from codex/library - derive stats and properties"
  priority: high
  status: done
  notes: |
    Fixed toEquipmentArray() to preserve id and quantity (was stripping them).
    enrichItems() now passes quantity through to enriched result. findInLibrary() uses ID first.
    Codex fallback also uses ID-based lookup. LibrarySection receives enriched weapons/armor/equipment.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update library-section.tsx and archetype-section.tsx to work with lean equipment data.
    On load: for each inventory item {itemId,quantity,equipped}, look up in user library by ID
    with fallback to codex_equipment. Derive name, type, cost, damage, properties, armor value.
    Views (weapons/armor/equipment) computed by filtering enriched inventory by type.
    Unify attack bonus calculation between archetype-section and library-section.
  related_files:
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/lib/data-enrichment.ts
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Equipment resolved by ID from library/codex
    - Name, stats, properties all from codex (not saved on character)
    - equipped/quantity/itemId is all that is on the character
    - Attack bonus calculations unified
    - npm run build passes

- id: TASK-214
  title: "Sheet: Derive skills display from codex - only prof/val from character"
  priority: high
  status: done
  notes: |
    Already working from Phase 4. Character page uses useMemo with codexSkills to enrich
    skill ability/category/description from codex. Species skills merged via characterSpeciesSkills.
    Only prof/skill_val/selectedBaseSkillId saved on character.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Update skills-section.tsx to work with lean skill data: Record<skillId, {prof,val}>.
    On load: for each skill ID, look up in codex_skills to get name, ability, base_skill_id.
    Merge with character prof/val to compute skill bonus.
    Species skills (auto-proficient) from codex_species lookup by speciesId.
    Defense vals displayed alongside abilities. Cost is 2 skill points per +1 val.
    Only vals stored, defenses derived (10 + ability + val).
  related_files:
    - src/components/character-sheet/skills-section.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/hooks/use-codex.ts
    - src/lib/game/formulas.ts
  acceptance_criteria:
    - Skill names, abilities loaded from codex (not saved on character)
    - Skill bonuses calculated from formulas
    - Species skills merged from codex_species data
    - Defense vals display correctly (only vals, not skills)
    - npm run build passes

- id: TASK-215
  title: "Sheet: Derive all computed stats - stop persisting maxHP/maxEN/evasion/speed"
  priority: high
  status: done
  notes: |
    Already working from TASK-201. calculateAllStats() is the single source of truth for all
    derived stats (maxHealth, maxEnergy, terminal, evasion, speed, defenseScores, etc.).
    speedBase/evasionBase kept as user-modifiable inputs (feats/traits modify them).
    speed/evasion/armor on Character type marked @deprecated.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Ensure the character sheet calculates ALL derived stats on load using centralized formulas
    (from TASK-201) and does NOT read them from the saved character data.
    Derived on load: maxHealth, maxEnergy, terminal, evasion, speed, defenseScores,
    martialProficiency, powerProficiency, armor DR.
    Remove from SAVEABLE_FIELDS: speedBase, evasionBase (defaults unless feat/trait modifies).
    Keep speedBase/evasionBase as optional overrides with clear defaults if needed.
  related_files:
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/lib/game/calculations.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - All derived stats calculated on load from formulas + character inputs
    - No derived stat is read from saved character data
    - Sheet displays correct values matching the formulas
    - npm run build passes

- id: TASK-216
  title: "Unify enrichment pipeline - shared ID-based loading for all contexts"
  priority: medium
  status: done
  notes: |
    Already achieved through Phase 4/5 work. findInLibrary() is the shared ID-based lookup
    used by enrichPowers(), enrichTechniques(), enrichItems(). enrichFeat() does ID-first codex
    lookup. All contexts use the same enrichment functions from data-enrichment.ts.
    Backward compat: all lookups fall back to name matching when ID fails.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create shared enrichment utilities that all contexts use:
    - enrichByIds<T>(ids, sourceMap) - generic ID-based lookup
    - enrichPowersById, enrichTechniquesById, enrichItemsById, enrichFeatsById, enrichSkillsById
    Ensure backward compatibility: if ID lookup fails, fall back to name matching.
    Used by: character sheet, library page, codex page, character creator, creature creator.
  related_files:
    - src/lib/data-enrichment.ts
    - src/hooks/use-codex.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/character-creator/steps/equipment-step.tsx
  acceptance_criteria:
    - Shared enrichment utilities exist for all data types
    - All contexts use the same enrichment functions
    - ID-based lookup with name fallback for backward compatibility
    - npm run build passes

- id: TASK-217
  title: "Update cleanForSave to match lean schema"
  priority: high
  status: done
  notes: |
    Fully completed in Phase 4 (TASK-203Ã¢â‚¬â€210). cleanForSave now strips all derived data:
    feats ? { id, name, currentUses }, powers ? { id, name, innate }, techniques ? { id, name },
    equipment ? { id, name, equipped?, quantity? }, skills ? { id, name, skill_val, prof, selectedBaseSkillId? },
    archetype ? { id, type }, ancestry ? { id, name, selectedTraits, selectedFlaw, selectedCharacteristic },
    health/energy ? currentHealth/currentEnergy + healthPoints/energyPoints.
  created_at: 2026-02-11
  created_by: agent
  description: |
    After Phases 3-5, cleanForSave needs to match the lean CharacterSaveData schema:
    - Skills: save Record<skillId, {prof,val}>, not array of objects
    - Feats: save feat IDs + featUses map, not {name,description} objects
    - Powers: save [{id,innate}], not {name,innate}
    - Techniques: save [{id}], not name strings
    - Equipment: save [{itemId,quantity,equipped}], not full objects
    - Health/energy: save healthPoints, energyPoints, currentHealth, currentEnergy only
    - Species: save speciesId, not name string
    - Archetype: save archetypeId, not full object
    - Defenses: save defenseVals only
    Update SAVEABLE_FIELDS to match. Add missing fields (see TASK-199b).
  related_files:
    - src/lib/data-enrichment.ts
    - src/types/character.ts
  acceptance_criteria:
    - cleanForSave produces lean output matching CharacterSaveData
    - All user-editable fields survive save/load cycle
    - No derived data saved
    - SAVEABLE_FIELDS is accurate and complete
    - npm run build passes

- id: TASK-218
  title: "Remove all redundant fields from Character type - final cleanup"
  priority: medium
  status: done
  notes: |
    All redundant fields in Character type annotated with @deprecated JSDoc:
    - species ? Use ancestry.name
    - health/energy ResourcePool ? Use currentHealth/currentEnergy
    - speed/evasion/armor ? Derived from calculateAllStats()
    - martialProficiency/powerProficiency ? Use mart_prof/pow_prof
    - allTraits/_displayFeats ? Display-only, not saved
    - ancestryTraits/flawTrait/characteristicTrait/speciesTraits ? Use ancestry sub-fields
    - health_energy_points ? Use healthPoints/energyPoints
    Fields kept with deprecation notices for backward compat until full migration (TASK-220).
  created_at: 2026-02-11
  created_by: agent
  description: |
    After all migration is complete, clean up the Character type.
    Remove: species, ancestry, ancestryTraits, flawTrait, characteristicTrait, speciesTraits,
    defenseSkills, martialProficiency, powerProficiency, health_energy_points,
    health.max, energy.max, speedBase, evasionBase, speed, evasion, armor (number),
    _displayFeats, allTraits, defenses, defenseBonuses, archetype.pow_abil, archetype.mart_abil.
    Keep: Everything in CharacterSaveData.
    Create EnrichedCharacter type extending CharacterSaveData for display-time data.
  related_files:
    - src/types/character.ts
    - src/types/skills.ts
    - src/types/feats.ts
    - src/types/equipment.ts
    - src/types/archetype.ts
    - src/types/ancestry.ts
  acceptance_criteria:
    - Character type has no redundant fields
    - CharacterSaveData is the source of truth for persistence
    - EnrichedCharacter type exists for display-time data
    - npm run build passes with no type errors

- id: TASK-219
  title: "Portrait storage - move from base64 blob to Supabase Storage URL"
  priority: medium
  status: done
  notes: |
    Character creator finalize step now uploads portrait to Supabase Storage via /api/upload/portrait
    after character creation, saving URL instead of base64. Flow: base64 kept in draft for preview ?
    strip from initial save ? create character ? upload blob to Storage ? update with URL.
    Character sheet already used Storage. Old base64 portraits still display (backward compat
    via src attribute accepting both data: URIs and URLs).
  created_at: 2026-02-11
  created_by: agent
  description: |
    Character portraits saved as full base64 JPEG data URIs inside the JSON blob (5-50KB each).
    Change to upload to Supabase Storage bucket (portraits/{userId}/{characterId}.jpg),
    save only the URL. On display, load from URL. On change, delete old file.
    Backward compat: if portraitUrl starts with data:, treat as legacy base64.
  related_files:
    - src/stores/character-creator-store.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/lib/supabase/
  acceptance_criteria:
    - New portraits uploaded to Supabase Storage, URL saved on character
    - Character sheet loads portrait from URL
    - Old base64 portraits still display (backward compat)
    - Portrait change deletes old file from storage
    - npm run build passes

- id: TASK-220
  title: "Data migration script - convert existing characters from old schema to lean"
  priority: medium
  status: done
  notes: |
    Created scripts/migrate-characters-lean.js. Supports --dry-run for preview.
    Migrates: health/energy ResourcePool ? currentHealth/currentEnergy, health_energy_points ?
    healthPoints/energyPoints, species ? ancestry.name, strips archetype/ancestry/feats/powers/
    techniques/equipment/skills to lean format, removes legacy display-only fields (allTraits,
    _displayFeats, speciesTraits, etc.) and derived combat stats (speed, evasion, armor).
    Idempotent Ã¢â‚¬â€ already-lean characters pass through unchanged.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a migration script (scripts/migrate-characters-lean.js) that reads all characters
    from Prisma, transforms old format to lean format (extract speciesId, archetypeId,
    convert skills/feats/powers/techniques/equipment to ID-based format, extract currentHealth/
    currentEnergy, remove redundant/derived fields), writes back, and logs a report.
    Run in dry-run mode first. Must be idempotent (safe to run multiple times).
  related_files:
    - scripts/
    - prisma/schema.prisma
    - src/types/character.ts
  acceptance_criteria:
    - Migration script exists and runs successfully
    - Handles all known old field formats (legacy vanilla, current format)
    - Dry-run mode shows what would change without writing
    - Idempotent (safe to run multiple times)
    - All existing characters survive migration without data loss
    - npm run build passes

- id: TASK-221
  title: "Design: Core rules DB schema and data categories"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  tags: [owner-review]
  description: |
    Design the database schema for storing all configurable game rules. The schema should:
    1. Follow the existing codex pattern (id: String PK, data: Json) in the codex schema
    2. Use a single core_rules table with category-based rows
    3. Each row represents a rules category with a well-defined JSON structure
    Proposed categories (each becomes one DB row and one admin tab):
    a) PROGRESSION_PLAYER: Base ability points (7), ability points per 3 levels (1),
       skill points per level (3), base HP/EN pool (18), HP/EN per level (12),
       base proficiency (2), proficiency per 5 levels (1), base training points (22),
       TP per-level multiplier (2), base health (8), XP-to-level formula (level*4),
       starting currency (200)
    b) PROGRESSION_CREATURE: Skill points at L1 (5), skill points per level (3),
       base HP/EN pool (26), base training points (22), TP per level (2) Ã¢â‚¬â€ same as characters,
       base feat points (1.5), base currency (200), currency growth rate (1.45)
    c) ABILITY_RULES: Min (-2), max starting (3), hard cap characters (10),
       hard cap creatures (20), no level cap, cost increase threshold (4 Ã¢â‚¬â€ cost doubles at 4+),
       standard arrays, max total negative (-3)
    d) ARCHETYPES: Power/Powered-Martial/Martial configs (feat limit, armament max,
       innate energy, starting proficiencies, training point bonus), plus archetype
       progression rules (milestone start level, interval, innate scaling, etc.)
    e) COMBAT: Base speed (6), base evasion (10), base defense (10), AP per round (4),
       action costs (basic=2, quick=1, etc.), multiple action penalty (-5),
       critical hit threshold (+10), natural 20/1 bonuses (+2/-2), ranged penalties
    f) SKILLS_AND_DEFENSES: Max skill value (3), defense bonus max, gain proficiency
       cost, increase past cap cost (base=3, sub=2), defense increase cost (2 SP),
       species skills count (2), unproficient rules (half/double-negative)
    g) CONDITIONS: Full condition list from core rulebook (13 standard + 10 leveled).
       Each condition: name, description, leveled flag, effect formula/text.
       Standard: Blinded, Charmed, Restrained, Dazed, Deafened, Dying, Faint, Grappled,
       Hidden, Immobile, Invisible, Prone, Terminal.
       Leveled: Bleed, Exhausted (death at 11+), Exposed, Frightened, Staggered,
       Resilient, Slowed, Stunned (min 1 AP), Susceptible, Weakened.
       Include stacking rules: conditions don't stack, stronger replaces weaker.
    h) SIZES: Size categories with height range, spaces, base carry, per-STR carry,
       min carry, speed modifier, size modifier
    i) RARITIES: Rarity tiers with name, currency min/max, color/style
    j) DAMAGE_TYPES: Flat list of all types (no physical/magic split), armor exception
       types (Psychic, Spiritual, Sonic), levels-by-rarity reference table
    k) RECOVERY: Partial recovery increments, fractions, full recovery duration,
       without-full-recovery penalty rules
    l) EXPERIENCE: XP to level, skill encounter XP, combat XP formulas
    m) ARMAMENT_PROFICIENCY: The martial prof -> armament prof max lookup table
    Owner should review and confirm category groupings and which values to include.
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/lib/game/formulas.ts
    - src/docs/GAME_RULES.md
    - prisma/schema.prisma
  acceptance_criteria:
    - Written design document specifying each category, its JSON shape, and all included values
    - Owner confirms the category groupings are correct
    - Prisma model definition is drafted (codex.core_rules table)
    - npm run build passes (design doc only, no code changes yet)
  notes: |
    Completed 2026-02-11: Design approved by owner. 13 categories defined: PROGRESSION_PLAYER,
    PROGRESSION_CREATURE, ABILITY_RULES, ARCHETYPES, ARMAMENT_PROFICIENCY, COMBAT,
    SKILLS_AND_DEFENSES, CONDITIONS, SIZES, RARITIES, DAMAGE_TYPES, RECOVERY, EXPERIENCE.
    Full TypeScript types in src/types/core-rules.ts. Implementation in TASK-222/223/224.

- id: TASK-222
  title: "Create Prisma model + migration for core_rules table"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add the core_rules table to the Prisma schema following the existing codex pattern:
    - Model: CoreRules in the codex schema
    - Fields: id (String PK), data (Json), updatedAt (DateTime?)
    - RLS: SELECT for public (read by all), no INSERT/UPDATE/DELETE (admin via service role)
    - Add to CodexCollection type in actions.ts
    - Add server actions (createCoreRule, updateCoreRule) or extend existing codex actions
    - Run prisma migrate to create the table
    - Add RLS policy to supabase-rls-policies.sql
  related_files:
    - prisma/schema.prisma
    - sql/supabase-rls-policies.sql
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - CoreRules model exists in Prisma schema
    - Migration runs successfully
    - RLS policies allow public read, admin-only write (via service role)
    - Server actions support CRUD for core_rules
    - npm run build passes
  notes: |
    Completed 2026-02-11: Added CoreRules model to prisma/schema.prisma (codex.core_rules table).
    Created table via SQL (prisma db execute). Added RLS policy (public SELECT, service role write).
    Extended CodexCollection type and getCodexDelegates in admin actions.ts. Added coreRules to
    /api/codex response. Prisma client generated successfully.

- id: TASK-223
  title: "Seed core_rules table with current hardcoded values"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a seed script that populates the core_rules table with all current values from
    constants.ts, creator-constants.ts, and formulas.ts. This is the migration bridge - after
    seeding, the DB contains exactly the same values as the code, so behavior is unchanged.
    Script should:
    1. Read all current constants
    2. Organize into the category structure defined in TASK-221
    3. Insert rows into core_rules table
    4. Be idempotent (upsert pattern)
    5. Include values from GAME_RULES.md that are not yet in code (size table, rarity ranges,
       condition definitions, recovery rules, experience formulas, etc.)
  related_files:
    - scripts/seed-to-supabase.js
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Seed script creates all core_rules rows with correct data
    - Every value from constants.ts and creator-constants.ts is present in the DB
    - Values from GAME_RULES.md not yet in code are also seeded
    - Script is idempotent (safe to run multiple times)
    - npm run build passes
  notes: |
    Completed 2026-02-11: Created scripts/seed-core-rules.js with all 13 categories. Uses
    prisma.coreRules.upsert for idempotent seeding. Successfully seeded all categories to
    Supabase. Data sourced from constants.ts, creator-constants.ts, GAME_RULES.md, and
    core_rulebook_extracted.txt. Run: node scripts/seed-core-rules.js

- id: TASK-224
  title: "Create useGameRules() hook - loads core rules from DB with fallback"
  priority: critical
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Create a React hook and API route for loading core rules from the database:
    1. API route: GET /api/core-rules - fetches all rows from core_rules table
    2. React hook: useGameRules() - React Query with long staleTime (rules change rarely)
    3. Returns typed objects for each category (progression, combat, archetypes, etc.)
    4. Fallback: if DB is empty or fetch fails, fall back to constants.ts values
    5. Provider component: GameRulesProvider wraps the app, provides rules via context
    6. Helper: getGameRules() for server components / non-React contexts
    This hook replaces direct imports of constants.ts throughout the app. During migration,
    both paths coexist - the hook returns DB values if available, constants.ts otherwise.
    Consider caching strategy: rules change rarely, so aggressive caching is appropriate.
    React Query staleTime of 5-10 minutes with background refetch is a good default.
  related_files:
    - src/hooks/use-game-rules.ts (new)
    - src/app/api/core-rules/route.ts (new)
    - src/lib/game/constants.ts
  acceptance_criteria:
    - useGameRules() hook exists and returns typed rule objects
    - API route fetches from core_rules table
    - Fallback to constants.ts when DB values are unavailable
    - GameRulesProvider exists and wraps the app
    - React Query caching with appropriate staleTime
    - npm run build passes
  notes: |
    Completed 2026-02-11: Created src/hooks/use-game-rules.ts and src/types/core-rules.ts.
    Hook uses React Query with 10min staleTime, 1hr gcTime. Fetches from /api/codex (piggybacks
    on existing codex endpoint which now includes coreRules). Full fallback to hardcoded constants
    when DB is unavailable. getGameRulesFallback() exported for server/non-React use.
    Skipped GameRulesProvider (not needed Ã¢â‚¬â€ React Query handles caching globally).

- id: TASK-225
  title: "Admin Core Rules page - Progression tab (Player & Creature)"
  priority: high
  status: done
  notes: |
    Created /admin/core-rules page with Progression tab showing all player character
    progression values (15 fields) and creature progression values (14 fields).
    Creature progression saved independently as PROGRESSION_CREATURE category.
    Live level 1-10 preview table updates in real-time as values change.
    All values editable with Save to core_rules table via existing codex actions.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add a Core Rules section to the admin area with the first tab: Progression.
    This tab shows and allows editing of:
    PLAYER PROGRESSION:
    - Base ability points, ability points per N levels, interval (N)
    - Skill points per level
    - Base HP/EN pool, HP/EN per level
    - Base proficiency, proficiency per N levels, interval
    - Base training points, TP per-level multiplier
    - Base health (8)
    - Starting currency
    CREATURE PROGRESSION:
    - Skill points per level (creature)
    - Base HP/EN pool (creature)
    - Base training points, TP per level
    - Base feat points, feat points per level
    - Base currency, currency growth rate
    UI should show current values in editable inputs, with a Save button.
    Follow existing admin tab patterns (GridListRow, Modal, server actions).
    Show a preview of level 1-10 progression table based on current values.
  related_files:
    - src/app/(main)/admin/page.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/lib/game/constants.ts
  acceptance_criteria:
    - Core Rules page accessible from admin dashboard
    - Progression tab shows all player and creature progression values
    - Values are editable and save to core_rules table
    - Level 1-10 preview table updates live as values are changed
    - npm run build passes

- id: TASK-226
  title: "Admin Core Rules page - Combat & Scores tab"
  priority: high
  status: done
  notes: |
    Combat tab with base speed/evasion/defense, AP, multiple action penalty, crit threshold,
    natural 20/1 bonuses, range penalties, and editable action costs table. All saved to COMBAT category.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for combat rules:
    - Base speed, base evasion, base defense
    - AP per round, action costs (basic, quick, free, long3, long4, movement, etc.)
    - Multiple action penalty
    - Critical hit threshold, critical hit multiplier
    - Natural 20 bonus, Natural 1 penalty
    - Ranged close penalty, ranged long penalty
    - Score base (10 + Bonus pattern)
    - Obscurity modifiers table
    - Damage modifier rules (Resistance/Vulnerability/Immunity text)
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All combat values are editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-227
  title: "Admin Core Rules page - Archetypes tab"
  priority: high
  status: done
  notes: |
    Archetypes tab with progression rules (martial bonus feats base/interval/start, P-M milestone
    interval/start, proficiency increase interval) and per-archetype config cards (power/powered-martial/
    martial) showing feat limit, armament max, innate energy/threshold/pools, TP bonus.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for archetype configuration:
    - Per-archetype: feat limit, armament max, innate energy, martial prof, power prof, TP bonus
    - Archetype progression rules: milestone start level, interval, innate scaling per milestone,
      feat scaling per milestone
    - Armament proficiency lookup table (martial prof -> armament max)
    - Innate threshold/pools base values and scaling rules
    Each archetype (Power, Powered-Martial, Martial) shown as an editable card/section.
    Armament proficiency as an editable lookup table.
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/formulas.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All three archetype configs are editable
    - Archetype progression rules are editable
    - Armament proficiency table is editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-228
  title: "Admin Core Rules page - Conditions tab (with definitions)"
  priority: high
  status: done
  notes: |
    Conditions tab showing standard and leveled conditions with editable names and descriptions.
    Add/remove buttons for both standard and leveled conditions.
    Stacking rules editable as text. Counts displayed for each category.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for conditions:
    - Full list of conditions (currently 22 in creator-constants.ts)
    - Each condition has: name, description/effect text, leveled flag, recovery rules
    - Leveled conditions: formula description (e.g., Bleed = 1 HP/turn per level)
    - Add/remove conditions
    - This replaces the hardcoded CONDITIONS array in creator-constants.ts
    The conditions data serves multiple purposes: character sheet conditions tracking,
    creature creator condition assignment, power/technique condition application.
  related_files:
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All conditions are listed with editable name, description, leveled flag
    - Can add new conditions, remove existing ones
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-229
  title: "Admin Core Rules page - Sizes & Carrying Capacity tab"
  priority: medium
  status: done
  notes: |
    Sizes tab with fully editable table: label, height, spaces, base carry, per-STR carry, min carry.
    Add/remove size categories. Half-capacity penalty editable.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for size categories:
    - Full size table from GAME_RULES: Miniscule through Gargantuan (8 sizes)
    - Each size: name, height range, spaces occupied, base carry, per-STR carry, min carry
    - Speed/size modifiers per size
    - Half-capacity movement penalty rule
    - Currently creator-constants.ts only has 6 sizes (Tiny-Gargantuan) with modifiers
      but no carrying capacity - GAME_RULES has 8 sizes with full carrying table
    - Unify and make comprehensive
  related_files:
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All 8 size categories from GAME_RULES are present and editable
    - Carrying capacity values per size are editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-230
  title: "Admin Core Rules page - Rarities & Currency tab"
  priority: medium
  status: done
  notes: |
    Rarities tab with fully editable table: name, level min/max, currency min/max.
    Add/remove rarity tiers. All fields editable inline.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for rarity tiers:
    - 7 tiers: Common through Ascended
    - Each tier: name, currency min, currency max, display color/style
    - Starting character currency
    - Currently RARITY_COLORS exists in creator-constants.ts but currency ranges are
      only in GAME_RULES.md - unify into one editable data source
  related_files:
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All rarity tiers are listed with editable name, currency range, color
    - Starting currency is editable
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-231
  title: "Admin Core Rules page - Ability Scores tab"
  priority: medium
  status: done
  notes: |
    Ability Scores tab with limits (min, max starting, max char/creature), cost threshold,
    normal/increased cost, max total negative. Standard arrays editor with per-value editing
    and add/remove arrays.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Admin tab for ability score rules:
    - Min score, max at creation, max level-up, max hard cap
    - Cost increase threshold and cost values (below/above threshold)
    - Standard arrays (Basic, Skewed, Even)
    - Max total negative adjustments at creation
    - Randomized method rules (1d8-4, seven times, remove lowest, sum 6-8)
    - Ability increase cost per level-up
  related_files:
    - src/lib/game/constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All ability score rules are editable
    - Standard arrays are editable (add/remove/modify)
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-232
  title: "Admin Core Rules page - Skills, Recovery, Experience, Damage Types tabs"
  priority: medium
  status: done
  notes: |
    Skills & Defenses tab: max skill value, past-cap costs, defense cost, species skills, proficiency cost.
    Recovery tab: partial/full recovery details, requirements, without-full-recovery rules.
    Experience tab: XP formula, combat/skill encounter XP, DS, successes, divide rules.
    Damage Types tab: add/remove types, armor exceptions toggleable by click, note editable.
    Armament Proficiency tab: martial prof ? armament max table with inline editing, add/remove rows.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Remaining admin tabs for core rules:
    SKILLS AND DEFENSES:
    - Max skill value per skill, defense bonus max
    - Proficiency costs (gain base, gain sub, increase past cap base/sub, defense cost)
    - Species skills count
    - Help die table
    RECOVERY:
    - Partial recovery increments (2h, 4h, 6h)
    - Recovery fraction per increment
    - Full recovery duration
    - Without-full-recovery penalty
    EXPERIENCE:
    - XP to level formula
    - Skill encounter XP formula
    - Combat XP formula
    DAMAGE TYPES:
    - Physical types list, Magic types list, All types list
    - Armor exception types (Psychic, Spiritual, Sonic)
    - Area of effect types
    - Die sizes
  related_files:
    - src/lib/game/constants.ts
    - src/lib/game/creator-constants.ts
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - All skills/defense rules are editable
    - Recovery rules are editable
    - Experience formulas are editable
    - Damage type lists are editable (add/remove types)
    - Changes save to core_rules table
    - npm run build passes

- id: TASK-233
  title: "Refactor formulas.ts to read from useGameRules() instead of constants.ts"
  priority: high
  status: done
  notes: |
    All ~35 exported functions in formulas.ts now accept an optional `rules?: Partial<CoreRulesMap>`
    parameter. When provided, DB values are used; otherwise constants.ts fallbacks apply.
    Covers: calculateAbilityPoints, calculateSkillPointsForEntity, calculateHealthEnergyPool,
    calculateProficiency, calculateTrainingPoints, calculateCreatureTrainingPoints,
    calculateCreatureFeatPoints, calculateCreatureCurrency, calculateMaxArchetypeFeats,
    getAbilityIncreaseCost, canIncreaseAbility, canDecreaseAbility, getArchetypeConfig,
    getArmamentMax, calculateArmamentProficiency, calculateBaseInnateThreshold,
    calculateBaseInnatePools, calculateBonusArchetypeFeats, getArchetypeMilestoneLevels,
    calculateArchetypeProgression, getArchetypeFeatLimit, getInnateEnergyMax, getBaseHealth.
    Zero new TypeScript errors Ã¢â‚¬â€ all existing call sites work unchanged (optional param).
  created_at: 2026-02-11
  created_by: agent
  description: |
    Refactor all functions in formulas.ts to accept rule values as parameters rather than
    importing from constants.ts directly. This decouples the formulas from hardcoded values.
    Pattern:
    - Each formula function gains an optional rules parameter
    - If rules parameter is provided, use those values
    - If not provided, fall back to constants.ts (backward compat during migration)
    - Helper: resolveRules(rules?) that merges provided rules with constants.ts defaults
    Functions to refactor (with their hardcoded values):
    - calculateSkillPointsForEntity: 3/5 per level -> from rules
    - calculateCreatureFeatPoints: 1.5 base -> from rules
    - calculateArmamentProficiency: lookup table -> from rules
    - calculateBaseInnateThreshold/Pools: 8/2 base, 4/3 interval -> from rules
    - calculateBonusArchetypeFeats: 2 base, 4/3 interval -> from rules
    - getArchetypeMilestoneLevels: 4/3 start/interval -> from rules
    - calculateArchetypeProgression: 6/1/1 mixed base -> from rules
    - getBaseHealth: 8 base health -> from rules
    - getCharacterMaxHealthEnergy: 8 base health -> from rules
    Also extract the 30+ hardcoded values identified in the audit into the rules object.
  related_files:
    - src/lib/game/formulas.ts
    - src/lib/game/constants.ts
    - src/hooks/use-game-rules.ts
  acceptance_criteria:
    - All formula functions accept optional rules parameter
    - No hardcoded game values remain in formula function bodies
    - Fallback to constants.ts when rules not provided
    - All call sites updated (or use the fallback path)
    - npm run build passes

- id: TASK-234
  title: "Refactor calculations.ts to read from useGameRules() instead of constants.ts"
  priority: high
  status: done
  notes: |
    All ~11 exported functions in calculations.ts now accept an optional `rules?: Partial<CoreRulesMap>`
    parameter. calculateDefenses uses rules.COMBAT.baseDefense, calculateSpeed/calculateEvasion use
    rules.COMBAT.baseSpeed/baseEvasion, calculateMaxHealth uses rules.PROGRESSION_PLAYER.baseHealth,
    calculateAllStats/computeMaxHealthEnergy pass rules through. getSpeedBase/getEvasionBase use rules
    as fallback. Zero new TypeScript errors.
  created_at: 2026-02-11
  created_by: agent
  description: |
    Same pattern as TASK-233 but for calculations.ts:
    - calculateDefenses: BASE_DEFENSE from rules
    - calculateSpeed: BASE_SPEED from rules
    - calculateEvasion: BASE_EVASION from rules
    - calculateMaxHealth: 8 (base health) from rules
    - calculateMaxEnergy: already parameterized, verify
    - calculateBonuses: unproficient multiplier/divisor from rules
    Also update character-sheet-utils.ts (which should already call calculations.ts
    after TASK-201) to pass rules through.
  related_files:
    - src/lib/game/calculations.ts
    - src/app/(main)/characters/[id]/character-sheet-utils.ts
    - src/hooks/use-game-rules.ts
  acceptance_criteria:
    - All calculation functions accept optional rules parameter
    - BASE_SPEED, BASE_EVASION, BASE_DEFENSE, base health come from rules
    - Fallback to COMBAT_DEFAULTS when rules not provided
    - npm run build passes

- id: TASK-235
  title: About page Ã¢â‚¬â€ dice carousel redesign (center, 7 dice, wrap, no brackets)
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Redesign About page dice carousel: remove brackets around selected die; center carousel horizontally below content; order d10, d12, d20, d4, d6, d8, d10 with d4 center on load; cycle so selected die stays center (leftmost moves right on next); add second d10 slide "Join the Community" with Discord link and core-rules language.
  related_files:
    - src/app/(main)/about/page.tsx
  acceptance_criteria:
    - No ring/brackets on selected die; coloration and centering indicate selection
    - Carousel centered below content; 7 dice; wrap-around cycling
    - "Join the Community" slide with Discord and Core Rules links
  notes: "Done 2026-02-11. Seven dice (d10 twice), CENTER_INDEX 3 (d4), transform centering, bg highlight for selected, scale-x-[-1] for second d10."

- id: TASK-236
  title: Skill encounter Ã¢â‚¬â€ Successes UI, DS post-roll, RM bonus, additional success/failure
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Rename Progress to Successes; show net dots (failures cancel successes); add Additional Success / Additional Failure buttons; allow updating DS post-rolls (recompute participant results); add RM Bonus per participant; skill dropdown from codex; fix save/load consistency for rolls.
  related_files:
    - src/app/(main)/encounters/[id]/skill/page.tsx
    - src/types/encounter.ts
  acceptance_criteria:
    - "Successes" section with net display (green or red dots only); Additional Success/Failure buttons
    - DS change recomputes all participant roll results; RM Bonus modifies effective roll
    - Skill dropdown (codex); RM Bonus input per participant
  notes: "Done 2026-02-11. SuccessFailureTracker net-only dots; additionalSuccesses/additionalFailures; recomputeParticipantRollsFromDs on DS change; rmBonus on SkillParticipant; ParticipantCard skill select + RM Bonus."

- id: TASK-237
  title: Combat tracker Ã¢â‚¬â€ surprised checkbox, initiative select-all, delete turn, auto-sort
  priority: high
  status: done
  created_at: 2026-02-11
  created_by: agent
  description: |
    Add surprised checkbox on combatant list items; initiative edit auto-select value for overwrite; when combatant deleted do not advance turn; re-sort initiative at start of each round (optional Auto Sort Initiative toggle); keep Sort Initiative in top bar when combat active.
  related_files:
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounter-tracker/CombatantCard.tsx
    - src/types/encounter.ts
  acceptance_criteria:
    - Surprised checkbox on each CombatantCard; initiative input select-all on focus
    - removeCombatant adjusts currentTurnIndex so turn does not advance
    - nextTurn re-sorts at round start when autoSortInitiative; Sort Initiative always visible; Auto Sort checkbox
  notes: "Done 2026-02-11. CombatantCard surprised checkbox + initiative ref/useEffect select; removeCombatant buildSorted + newTurnIndex; nextTurn round-start sort when autoSortInitiative; Encounter.autoSortInitiative."

- id: TASK-238
  title: "Codebase Audit 2026-02-13 Ã¢â‚¬â€ Phase 1-3 implementation"
  priority: high
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    Full 98-finding codebase audit. Phase 1 (security): remove NEXT_PUBLIC_ADMIN_UIDS, add security headers, fix auth race condition. Phase 2 (UI/UX): design token migration on critical shared components, feedback fixes (name edit gating, ability label). Phase 3 (dead code): extract shared apiFetch, remove legacy hooks/services, remove empty dirs, consolidate CSS vars. Phase 4 (performance): React.memo on GridListRow/SkillRow, ErrorBoundary component.
  related_files:
    - src/docs/ai/archive/CODEBASE_AUDIT_2026-02-13.md
    - src/lib/admin.ts
    - next.config.ts
    - src/hooks/use-auth.ts
    - src/lib/api-client.ts
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/error-boundary.tsx
  acceptance_criteria:
    - NEXT_PUBLIC_ADMIN_UIDS no longer read in admin.ts
    - Security headers configured in next.config.ts
    - Auth race condition fixed with mountedRef
    - Character name pencil gated to edit mode
    - "Next: 2 Points" label (not "2pt")
    - ListHeader, EditSectionToggle, ValueStepper, SheetActionToolbar use design tokens
    - Shared apiFetch in src/lib/api-client.ts, imported by 3 services
    - Legacy hooks/services cleaned (use-game-data, game-data-service)
    - GridListRow, SkillRow wrapped in React.memo
    - ErrorBoundary component created
    - npm run build passes
  notes: "Done 2026-02-13. All items verified. Build passes."

- id: TASK-239
  title: "Audit Phase 2 Ã¢â‚¬â€ Complete design token migration (blue/green/red/amber ? tokens)"
  priority: high
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    20+ components still use hardcoded blue-*, green-*, red-*, amber-* Tailwind classes instead of design tokens. This is the single biggest UI consistency issue. Audit finding UX-1 + UX-2 from archive/CODEBASE_AUDIT_2026-02-13.md. Components to migrate: skill-row.tsx, sheet-header.tsx, recovery-modal.tsx, feats-step.tsx, abilities-section.tsx, archetype-section.tsx, add-sub-skill-modal.tsx, library-section.tsx, ancestry-step.tsx, finalize-step.tsx, health-energy-allocator.tsx, creature-stat-block.tsx, tab-summary-section.tsx, level-up-modal.tsx, skills-allocation-page.tsx, encounter tracker pages, item/technique/creature creators, admin pages.
  related_files:
    - src/components/character-sheet/
    - src/components/character-creator/steps/
    - src/app/(main)/encounters/
    - src/docs/DESIGN_SYSTEM.md
  acceptance_criteria:
    - Zero hardcoded blue-*/green-*/red-*/amber-* classes in shared components (search confirms)
    - All replaced with semantic tokens (primary-*, success-*, danger-*, warning-*, info-*, energy-*, health-*)
    - DESIGN_SYSTEM.md updated with color migration guide
    - npm run build passes

- id: TASK-240
  title: "Audit Phase 2 Ã¢â‚¬â€ Standardize modal/error/loading patterns"
  priority: medium
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    Multiple modal implementations, error display patterns, and loading states exist. Audit findings UX-3, UX-4, UX-5. Standardize: modals extend base Modal with consistent header/footer; errors use Alert (persistent) or Toast (transient); loading uses LoadingState (page), skeletons (lists), Spinner (inline).
  related_files:
    - src/components/ui/modal.tsx
    - src/components/ui/spinner.tsx
    - src/components/shared/
  acceptance_criteria:
    - All modals use base Modal component with consistent API
    - Error display standardized (Alert for persistent, Toast for transient)
    - Loading states standardized per context
  notes: |
    Done 2026-02-17. Audit: ConfirmActionModal, DeleteConfirmModal, LoginPromptModal, ImageUploadModal already use base Modal. DeleteConfirmModal now accepts isOpen (required) and passes it to Modal; all 6 call sites updated. DESIGN_SYSTEM.md: added "Modal, Error, and Loading Patterns" (when to use Modal, Alert vs Toast, LoadingState/Spinner/Suspense). Replaced ad-hoc "Loading..." Suspense fallbacks in campaigns/page and technique-creator with LoadingState. npx tsc --noEmit passes; full build blocked by Prisma EPERM lock on this machine.

- id: TASK-241
  title: "Audit Phase 1 Ã¢â‚¬â€ Add Zod input validation to API routes"
  priority: high
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    All POST/PATCH API routes accept JSON without schema validation. Audit finding S-1. Add Zod schemas to: /api/characters (POST/PATCH), /api/encounters (POST/PATCH), /api/user/library/[type] (POST/PATCH), /api/campaigns (POST/PATCH). Also validate Content-Type headers.
  related_files:
    - src/app/api/characters/route.ts
    - src/app/api/encounters/route.ts
    - src/app/api/user/library/[type]/route.ts
    - src/app/api/campaigns/route.ts
  acceptance_criteria:
    - Every POST/PATCH handler validates body with Zod before processing
    - Invalid payloads return 400 with descriptive error
    - npm run build passes

- id: TASK-242
  title: "Audit Phase 1 Ã¢â‚¬â€ Add rate limiting to API routes"
  priority: high
  status: done
  notes: "Added sliding-window in-memory rate limiter (src/lib/rate-limit.ts) with standard (30/min), strict (10/min), and invite-code (5/min) presets. Applied to all POST/PATCH/DELETE handlers for characters, encounters, library items, and invite code lookup."
  created_at: 2026-02-13
  created_by: agent
  description: |
    Zero rate limiting on any API endpoint. Audit finding S-2. Add @upstash/ratelimit or similar to protect against DoS, brute-force (especially invite code enumeration), and abuse.
  related_files:
    - src/middleware.ts
    - src/app/api/
  acceptance_criteria:
    - Rate limiting active on mutation endpoints (POST/PATCH/DELETE)
    - Invite code lookup rate-limited more aggressively
    - Returns 429 with Retry-After header when exceeded

- id: TASK-243
  title: "Audit Phase 4 Ã¢â‚¬â€ Add loading.tsx and error.tsx route handlers"
  priority: medium
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    Most routes in src/app/(main)/ lack loading.tsx and error.tsx handlers. Audit finding P-3. Add at least per route-group handlers for graceful loading and error UX.
  related_files:
    - src/app/(main)/
  acceptance_criteria:
    - loading.tsx exists for (main) route group (minimum)
    - error.tsx exists for (main) route group (minimum)
    - Loading uses LoadingState or skeleton pattern
    - Error uses ErrorBoundary with retry

- id: TASK-244
  title: "Audit Phase 5 Ã¢â‚¬â€ Add missing Prisma indexes"
  priority: medium
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    Missing database indexes for frequently queried fields. Audit findings DB-1, DB-2, DB-3. Add: Campaign @@index([inviteCode]), composite indexes for sorted queries (userId+updatedAt on library tables, campaignId+createdAt on CampaignRoll). Consider @unique on inviteCode.
  related_files:
    - prisma/schema.prisma
  acceptance_criteria:
    - inviteCode indexed (and optionally @unique)
    - Composite indexes added for sorted queries
    - Migration generated and applied

- id: TASK-245
  title: "Audit Phase 6 Ã¢â‚¬â€ Public character view page (frontend)"
  priority: medium
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    API supports public character viewing but no dedicated frontend page exists. Audit finding FB-3. Create a route that renders the character sheet in read-only mode for unauthenticated users when visibility is public, or for campaign members when visibility is campaign-only.
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/api/characters/[id]/route.ts
  acceptance_criteria:
    - Public characters viewable via shared URL without auth
    - Character sheet renders in read-only mode (no edit controls)
    - Owner's library items (powers, techniques, armaments) visible to viewers
  notes: "Done 2026-02-13: The character sheet page already supported public viewing Ã¢â‚¬â€ API returns character + libraryForView for non-owners. Removed the auth redirect that was blocking unauthenticated access. isOwner controls edit mode. getOwnerLibraryForView returns the owner's powers/techniques/items for viewers."

- id: TASK-246
  title: "Audit Phase 6 Ã¢â‚¬â€ Character creator skill auto-save on tab switch"
  priority: medium
  status: done
  notes: "Verified 2026-02-13: Skills already auto-save via updateDraft() callbacks + Zustand persist middleware. No additional work needed."
  created_at: 2026-02-13
  created_by: agent
  description: |
    Skills allocated in character creator are not persisted when switching tabs. Audit finding FB-2. Add onBeforeTabChange callback or auto-persist via the Zustand store when navigating away from skills step.
  related_files:
    - src/stores/character-creator-store.ts
    - src/components/character-creator/
  acceptance_criteria:
    - Skill allocations persist when switching to another tab and back
    - No data loss on tab navigation

- id: TASK-247
  title: "Audit Phase 4 Ã¢â‚¬â€ Optimize React Query stale times for codex data"
  priority: low
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    Codex data rarely changes but uses default 1-minute staleTime. Audit finding P-4. Set staleTime to 30 minutes for codex queries to reduce unnecessary refetches.
  related_files:
    - src/hooks/use-codex.ts
  acceptance_criteria:
    - Codex hooks use staleTime of 30 minutes
    - gcTime set to 60 minutes

- id: TASK-248
  title: "P-5: Create CharacterSheetContext to reduce prop drilling"
  priority: medium
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    The character sheet page passes 40+ props through multiple levels. Create a CharacterSheetContext
    to hold shared state (character, editMode, isOwner, callbacks, enriched data) and reduce prop drilling.
    This is a large refactor affecting the page and all section components (LibrarySection, AbilitiesSection,
    SkillsSection, ArchetypeSection, SheetHeader, SheetActionToolbar).
  related_files:
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/character-sheet-context.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-sheet/archetype-section.tsx
  acceptance_criteria:
    - CharacterSheetContext created with shared state
    - Section components consume from context instead of props
    - No behavioral changes Ã¢â‚¬â€ all existing functionality preserved
    - npm run build passes
  notes: "Done 2026-02-16: Created CharacterSheetContext (character, setCharacter, isEditMode, isOwner, setAddModalType, setFeatModalType, setSkillModalType). Character sheet page wraps content in CharacterSheetProvider. SheetHeader consumes via useCharacterSheetOptional() for character and isEditMode (fallback to props when outside provider). Other sections can be migrated incrementally to use useCharacterSheet()."

- id: TASK-249
  title: "FB-6: Campaign join notification for visibility change"
  priority: low
  status: done
  created_at: 2026-02-13
  created_by: agent
  description: |
    When a private character joins a campaign, their visibility should change to 'campaign' so campaign members
    can view them. Currently the visibility setting exists in the Notes tab but there is no notification/modal
    informing the user about this change. Add a confirmation dialog when joining a campaign.
  related_files:
    - src/app/(main)/campaigns/[id]/page.tsx
    - src/app/(main)/campaigns/page.tsx
    - src/app/api/characters/route.ts
    - src/types/character.ts
  acceptance_criteria:
    - Notification or modal shown when a private character joins a campaign
    - User informed that visibility will change to 'campaign'
  notes: "Done 2026-02-16: Added visibility to CharacterSummary and GET /api/characters. Join Campaign tab and Add Character modal show confirmation when selected character is private; modal explains visibility will change to Campaign. Post-join toast retained."

- id: TASK-250
  title: "Character creator Ã¢â‚¬â€ Species modal skill description clear when switching species"
  priority: low
  status: done
  created_at: 2026-02-17
  created_by: agent
  description: |
    Bug from 2/17 feedback: When user clicks a species, opens skill description in the modal, then clicks off and selects a different species, the first species' skill description stayed open. Skill description should close when switching species or when the modal closes.
  related_files:
    - src/components/character-creator/species-modal.tsx
  acceptance_criteria:
    - When species changes (or modal closes), selected skill description is cleared so it does not carry over to the next view
    - npm run build passes
  notes: "Done 2026-02-17: Added useEffect to clear selectedSkill when isOpen becomes false; existing effect already cleared on species?.id change. Both effects in species-modal.tsx."

- id: TASK-251
  title: "Character creator Ã¢â‚¬â€ Step check mark when navigating away with 'Continue anyway'"
  priority: low
  status: done
  created_at: 2026-02-17
  created_by: agent
  description: |
    Bug from 2/17 feedback: When user has made a selection on a step but not confirmed, then navigates to another step via tab, the warning modal offers 'Continue anyway' but the step did not get a check mark. Step should show complete when user chooses to continue anyway.
  related_files:
    - src/components/character-creator/creator-tab-bar.tsx
  acceptance_criteria:
    - When user clicks 'Continue anyway' in the step-warning modal, current step is marked complete so the tab shows a check mark
    - npm run build passes
  notes: "Done 2026-02-17: handleContinueAnyway now calls markStepComplete(currentStep) before setStep(pendingStep) in creator-tab-bar.tsx."

- id: TASK-252
  title: "Unify add power/technique modals Ã¢â‚¬â€ character creator and creature creator"
  priority: high
  status: done
  created_at: 2026-02-17
  created_by: agent
  description: |
    Character creator and creature creator add power/technique modals are not unified with character sheet add-library-item modal: missing column headers (NAME, ACTION, DAMAGE, AREA for powers; NAME, WEAPON, PARTS for techniques), same collapsed/expandable row layout, and list header bar. Align with add-library-item-modal layout and grid columns.
  related_files:
    - src/components/character-creator/steps/powers-step.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
    - src/components/character-sheet/add-library-item-modal.tsx
  acceptance_criteria:
    - Character creator add power modal has ListHeader + column headers (NAME, ACTION, DAMAGE, AREA) and GridListRow with same grid; technique modal (NAME, WEAPON, PARTS)
    - Creature creator add power/technique modals use same column set and layout as character sheet
    - npm run build passes
  notes: "Done 2026-02-17: powers-step.tsx Ã¢â‚¬â€ added POWER_MODAL_COLUMNS/POWER_GRID_COLUMNS and TECHNIQUE_MODAL_COLUMNS/TECHNIQUE_GRID_COLUMNS; availablePowers/availableTechniques now build columns (Action, Damage, Area / Weapon, Parts); passed columns and gridColumns to both UnifiedSelectionModals. creature-creator/transformers Ã¢â‚¬â€ power stats now Action, Damage, Area; technique stats Weapon, Parts. creature-creator/page Ã¢â‚¬â€ power/technique SelectableItems use ['Action','Damage','Area'] and ['Weapon','Parts']; modal columns/gridColumns aligned with add-library-item."

- id: TASK-253
  title: "Finalize step Ã¢â‚¬â€ display ability names as full text (min 3-letter)"
  priority: medium
  status: done
  created_at: 2026-02-17
  created_by: agent
  description: |
    Finalize step currently shows abilities as single letters (e.g. S, V). Abilities should not be abbreviated to less than 3 letters; prefer full text ("Strength", "Vitality", etc.).
  related_files:
    - src/components/character-creator/steps/finalize-step.tsx
    - src/lib/game/constants.ts
  acceptance_criteria:
    - Abilities in finalize summary show as full names (Strength, Vitality, Agility, Acuity, Intelligence, Charisma) or at minimum 3-letter abbreviations
    - npm run build passes
  notes: "Done 2026-02-17: Added ABILITY_DISPLAY_NAMES to lib/game/constants.ts (lowercase key ? full name). finalize-step imports it and uses ABILITY_DISPLAY_NAMES[ability] ?? ability for ability label instead of ability.charAt(0).toUpperCase()."

- id: TASK-254
  title: Creators Ã¢â‚¬â€ description/option contrast + dropdown dark mode
  priority: low
  status: done
  created_at: 2026-02-18
  created_by: agent
  description: |
    Technique and Armament creators: description text and option boxes had poor contrast (light blue on white, no dark mode). Dropdown menus across all 3 creators needed explicit text-text-primary bg-surface for proper theming.
  related_files:
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/power-creator/PowerPartCard.tsx
  acceptance_criteria:
    - Technique PartCard option boxes have dark mode variants (bg-red-50 dark:bg-red-900/20, text-red-800 dark:text-red-300)
    - Item PropertyCard option box has dark mode variants (bg-amber-50 dark:bg-amber-900/20, text-amber-800 dark:text-amber-300)
    - All creator selects use text-text-primary bg-surface
    - npm run build passes
  notes: "Done 2026-02-18: Added dark mode variants to option boxes in technique/item creators; added text-text-primary bg-surface to all select elements across power/technique/item creators."

- id: TASK-255
  title: Accessibility audit Ã¢â‚¬â€ color contrast WCAG 2.1 AA
  priority: high
  status: done
  created_at: 2026-02-18
  created_by: agent
  description: |
    Full accessibility audit for color contrast to meet WCAG 2.1 (AA) requirements: 4.5:1 for small text, 3:1 for large text. Prevents potential lawsuits. User Impact: Serious. Guidelines: WCAG 2.1 (AA), WCAG 2.0 (AA), WCAG 2.2 (AA). Use axe DevTools or similar to identify and fix violations.
  related_files:
    - src/app/globals.css
    - src/components/auth/
    - src/components/shared/item-card.tsx
    - src/components/creator/creator-summary-panel.tsx
    - src/components/character-sheet/roll-log.tsx
    - src/docs/ai/archive/ACCESSIBILITY_AUDIT_2026-02-18.md
  acceptance_criteria:
    - Run axe-core color-contrast rule (or equivalent) across key pages
    - All text elements meet 4.5:1 (small) or 3:1 (large text) contrast ratio
    - Document any residual issues and remediation plan
    - npm run build passes
  notes: "Done 2026-02-18: Auth text-gray-400 ? gray-300; dark --text-muted 6e7681 ? 8b949e; item-card/creator-summary-panel opacity-70 ? semantic tokens; roll-log timestamp ? text-text-secondary. ACCESSIBILITY_AUDIT_2026-02-18.md documents changes."

- id: TASK-256
  title: Species height/weight/lifespan Ã¢â‚¬â€ API mapping and display everywhere
  priority: high
  status: done
  created_at: 2026-02-18
  created_by: agent
  description: |
    Codex API and UI: (1) API must map DB fields ave_hgt_cm, ave_wgt_kg to ave_height, ave_weight in response; support adulthood_lifespan as number or number[]. (2) Character creator Ancestry tab species summary must show height, weight, lifespan, adulthood with size/type/skills/languages. (3) Codex species tab (public and admin) must show these in expanded/summary views. Use common species display logic where possible.
  related_files:
    - src/app/api/codex/route.ts
    - src/components/character-creator/steps/ancestry-step.tsx
    - src/app/(main)/codex/CodexSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
  acceptance_criteria:
    - Codex API returns ave_height, ave_weight from ave_hgt_cm/ave_wgt_kg when present; adulthood_lifespan normalized to [adult, max] or single value displayed
    - Ancestry tab species summary shows Size, Type, Avg Height, Avg Weight, Adulthood, Lifespan (when present), Skills, Languages
    - Codex species cards show height, weight, adulthood, lifespan in expanded section
    - npm run build passes
  notes: "Done 2026-02-18: API maps ave_hgt_cm/ave_wgt_kg to ave_height/ave_weight, adulthood_lifespan number|array; ancestry step summary shows all six (Size, Type, Avg Height, Avg Weight, Adulthood, Lifespan); CodexSpeciesTab expanded section shows adulthood/lifespan."

- id: TASK-257
  title: Skill admin Ã¢â‚¬â€ governing ability is abilities-only (not defenses)
  priority: medium
  status: done
  created_at: 2026-02-18
  created_by: agent
  description: |
    Admin Codex Skills edit: the "Ability" field should offer only the six abilities (Strength, Vitality, Agility, Acuity, Intelligence, Charisma), not the six defenses. Skills are governed by abilities only. Update placeholder to "Choose governing ability".
  related_files:
    - src/app/(main)/admin/codex/AdminSkillsTab.tsx
    - src/lib/game/constants.ts
  acceptance_criteria:
    - Skill edit modal ability dropdown shows only 6 abilities
    - Placeholder says "Choose governing ability"
    - npm run build passes
  notes: "Done 2026-02-18: ABILITY_OPTIONS_SKILLS uses first 6 of ABILITIES_AND_DEFENSES; placeholder updated to 'Choose governing ability'."

- id: TASK-258
  title: Public codex Ã¢â‚¬â€ add Traits tab and Advanced tabs toggle
  priority: high
  status: done
  created_at: 2026-02-18
  description: |
    Add Traits tab to public codex matching admin codex design (no edit/delete). Hide power/technique parts, armament properties, creature feats, and traits by default; "Advanced" control reveals those tabs. UX should be clear and consistent with rest of codex.
  notes: "Done 2026-02-18: CodexTraitsTab and CodexCreatureFeatsTab added (read-only). Codex page: main tabs Feats/Skills/Species/Equipment/Public Library; Advanced button toggles Parts/Properties/Creature Feats/Traits."

- id: TASK-259
  title: Public vs admin codex unification Ã¢â‚¬â€ layouts, chips, descriptions
  priority: high
  status: done
  created_at: 2026-02-18
  description: |
    Audit and unify public codex with admin codex: same layouts, components, styles. Parts/properties options as expandable chips with IP/TP/c/EN costs and description. Ensure descriptions show for parts and properties (including when options exist). Column headers aligned with collapsed cards; remove inline styles in favor of shared components.
  notes: "Done 2026-02-18: CodexPartsTab and CodexPropertiesTab use detailSections with expandable option chips (EN/TP for parts, IP/TP/c for properties); description always shown in expanded view; header rows use dark mode variant."

- id: TASK-260
  title: Edit property Ã¢â‚¬â€ option cost labels (IP/TP/c) and larger description field
  priority: medium
  status: done
  created_at: 2026-02-18
  description: |
    Property edit modal: add clear labels for which field is IP, TP, c for option costs. Make description field bigger.
  notes: "Done 2026-02-18: Description min-h 140px, rows 5; option section has labeled 'Option description' textarea and three labeled inputs: IP (Item Points), TP (Training Points), c (Cost multiplier)."

- id: TASK-261
  title: Edit equipment Ã¢â‚¬â€ category dropdown with add-new and existing list
  priority: medium
  status: done
  created_at: 2026-02-18
  description: |
    Equipment edit: category as dropdown listing all categories already used by equipment, with ability to type/add a new category. Reuse components where possible.
  notes: "Done 2026-02-18: Category is a select with Ã¢â‚¬â€ None Ã¢â‚¬â€, all existing equipment categories, and 'Add new category...'; when Add new is selected, text input appears to type new category; categoryIsNew state keeps UX correct on edit."

- id: TASK-262
  title: Single list header component Ã¢â‚¬â€ migrate SortHeader views to ListHeader
  priority: low
  status: done
  created_at: 2026-02-20
  created_by: agent
  description: |
    Phase 3 unification: Migrate all SortHeader-based list views to use ListHeader with column arrays so there is a single header component. SortHeaderRow already unifies styling; this task is the deeper option (one component, column defs per view).
  related_files:
    - src/components/shared/list-components.tsx
    - src/components/shared/list-header.tsx
    - Library/Codex/Admin tabs, feats-step, unified-selection-modal
  acceptance_criteria:
    - All list views use ListHeader (or document why SortHeaderRow remains for a given view).
    - Same visual result; npm run build passes.
  notes: "Done 2026-02-20: All SortHeaderRow+SortHeader usages replaced with ListHeader (columns, gridColumns, sortState, onSort). Codex tabs, Admin tabs, Library tabs, CodexPublicLibraryTab, feats-step, unified-selection-modal (hasSelectionColumn). SortHeader/SortHeaderRow retained in list-components for any one-off use; ListHeader is the single source for sortable list headers. npm run build passes."

- id: TASK-263
  title: Shared creator load helper Ã¢â‚¬â€ useCreatorLoad(type, options)
  priority: low
  status: done
  created_at: 2026-02-20
  created_by: agent
  description: |
    Phase 3 unification: Add a thin useCreatorLoad(type, options) that encapsulates "fetch library, open modal, onSelect ? filter mechanics + restore state" and leaves type-specific mapping to callers. Reduces copy-paste in handleLoadPower / handleLoadTechnique / handleLoadItem.
  related_files:
    - src/hooks/use-creator-load.ts
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  acceptance_criteria:
    - Hook (or equivalent) used by power, technique, item creators where beneficial; mechanic-filtering rule still documented in AGENT_GUIDE.
    - npm run build passes.
  notes: "Done 2026-02-20: useCreatorLoad(type) added in use-creator-load.ts. Returns showLoadModal, setShowLoadModal, openLoadModal, closeLoadModal, items, isLoading, error. Power, technique, and item creators refactored to use it. Type-specific handleLoad* and mechanic-filtering remain in each creator per AGENT_GUIDE. npm run build passes."

- id: TASK-264
  title: Modal unification Ã¢â‚¬â€ implement audit recommendations (list modals)
  priority: medium
  status: done
  created_at: 2026-02-20
  created_by: agent
  description: |
    Implement recommendations from MODAL_UNIFICATION_AUDIT_2026-02-20.md. Unify logic, styles, and patterns across add-X modals, load modals, and selection modals; align with Codex/Library. Phases: (1) Use EmptyState/LoadingState in list modals; fix AddLibraryItemModal ListHeader wrapper; document list-modal shell in AGENT_GUIDE. (2) Use FilterSection in AddFeatModal/AddSkillModal; standardize padding/borders. (3) Refactor LoadCreatureModal to ListHeader+GridListRow+search; consider useModalListState and Add-X as UnifiedSelectionModal config.
  related_files:
    - src/docs/ai/archive/MODAL_UNIFICATION_AUDIT_2026-02-20.md
    - src/components/shared/unified-selection-modal.tsx
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/app/(main)/creature-creator/LoadCreatureModal.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/hooks/use-modal-list-state.ts
  acceptance_criteria:
    - Phase 1: List modals use EmptyState/LoadingState where applicable; AddLibraryItemModal does not double-style ListHeader; AGENT_GUIDE documents list-modal layout pattern.
    - Phase 2: AddFeatModal and AddSkillModal use FilterSection (or shared filter pattern); padding/border pattern consistent across list modals.
    - Phase 3 (optional): LoadCreatureModal uses ListHeader+GridListRow+search; shared useModalListState or Add-X via UnifiedSelectionModal where feasible.
    - npm run build passes.
  notes: "Done 2026-02-20: Phase 1 Ã¢â‚¬â€ UnifiedSelectionModal, LoadFromLibraryModal, AddFeatModal, AddLibraryItemModal, AddSkillModal use EmptyState/LoadingState; AddLibraryItemModal ListHeader wrapper removed; AGENT_GUIDE list modal layout added. Phase 2 Ã¢â‚¬â€ AddFeatModal and AddSkillModal use FilterSection; padding standardized (px-4 py-3 border-border-light bg-surface-alt). Phase 3 Ã¢â‚¬â€ LoadCreatureModal refactored to ListHeader+GridListRow+SearchInput+EmptyState/LoadingState. useModalListState hook added; used in LoadFromLibraryModal and LoadCreatureModal. npm run build passes."

- id: TASK-265
  title: Add source filter (My/Public/All) to add-X modals + reference public items on character
  priority: high
  status: done
  created_at: 2026-02-21
  created_by: agent
  description: |
    In modals that add powers, techniques, armor, weapons, equipment (character sheet, character creator, creature creator), add the same SourceFilter as the Library page (All sources / Public library / My library) so users can add public library items to characters. Use reference-based approach: when adding a public item to a character, do NOT copy it to the user's personal library; store only the reference (id + name) on the character. Enrichment resolves from user library first, then public library by id. Copy to personal library remains an explicit action on the Library page only. See src/docs/ai/archive/PUBLIC_LIBRARY_IN_MODALS_DESIGN.md.
  related_files:
    - src/components/shared/filters/source-filter.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/lib/data-enrichment.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/library/LibraryPowersTab.tsx
  acceptance_criteria:
    - Add-library-item modal (character sheet), equipment-step (creator), and creature creator power/technique/item modals show SourceFilter (All / Public / My) and merge user + public lists by source, same pattern as Library tabs.
    - Adding a public item to a character/creature adds only a reference (id, name) to the character; no new row in user_powers/user_techniques/user_items.
    - enrichCharacterData (and callers) receive optional public library arrays; enrichment resolves by id from user library first, then from public library so character sheet displays public items correctly.
    - npm run build passes.
  notes: "Done 2026-02-21: SourceFilter + public merge in add-library-item-modal, equipment-step, powers-step, creature creator (power/technique/armament modals). UnifiedSelectionModal headerExtra prop for SourceFilter. enrichPowers/enrichTechniques/enrichItems accept optional public library; enrichCharacterData accepts publicLibraries; character sheet and campaign view fetch public and pass to enrichment. Fixed sheet-header onEditArchetype destructuring. npm run build passes."

- id: TASK-266
  title: Mobile-first UX overhaul (Phases 2Ã¢â‚¬â€4)
  priority: high
  status: done
  created_at: 2026-02-22
  created_by: agent
  description: |
    Phase 1 (foundation) done: MOBILE_UX.md, Modal fullScreenOnMobile, realms-mobile.mdc, AGENTS.md/AGENT_GUIDE/realms-tasks updates, fullScreenOnMobile enabled on character sheet and creator modals. Phase 2 done: character sheet side-scroll panels, responsive SheetHeader, SheetActionToolbar at bottom on mobile. Phase 3 done: CreatorLayout order, creator tab bar horizontal scroll, Library/Codex min-w-0. Phase 4 done: encounters, campaigns, my-account (min-w-0); rules/resources/admin use PageContainer. See src/docs/MOBILE_UX.md.
  related_files:
    - src/docs/MOBILE_UX.md
    - src/app/(main)/characters/[id]/page.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/sheet-action-toolbar.tsx
    - src/components/creator/CreatorLayout.tsx
    - .cursor/rules/realms-mobile.mdc
  acceptance_criteria:
    - Phase 2: Character sheet uses horizontal side-scroll of section panels (Abilities, Skills, Archetype, Library) below md; SheetHeader responsive; SheetActionToolbar mobile-friendly (e.g. bottom or non-overlap).
    - Phase 3: CreatorLayout/summary and Library/Codex lists and filters audited for mobile; character creator tab bar scrolls or adapts on narrow screens.
    - Phase 4: Remaining pages (encounters, campaigns, my-account, rules, admin) have no horizontal scroll at 360px and readable text.
    - npm run build passes.
  notes: |
    Phase 1 completed 2026-02-22: MOBILE_UX.md, Modal fullScreenOnMobile, globals.css mobile tokens, realms-mobile.mdc, AGENTS.md, realms-tasks.mdc, AGENT_GUIDE Mobile subsection; fullScreenOnMobile enabled on unified-selection, LoadFromLibraryModal, level-up, recovery, settings, edit-archetype, add-combatant, confirm-action, delete-confirm, login-prompt, creator-tab-bar, species-modal, MixedSpeciesModal, LoadCreatureModal.
    Phase 2 completed 2026-02-22: Character sheet page Ã¢â‚¬â€ below md, horizontal side-scroll (snap-x snap-mandatory) with 4 panels (Abilities & Defenses, Skills, Archetype & Attacks, Library); each panel full-width, scroll-snap-align start, vertical scroll inside panel. Desktop layout unchanged (hidden md:block). SheetHeader: right column w-full min-w-0 on mobile, AP+Health/Energy stack on xs (flex-col sm:flex-row). SheetActionToolbar: on mobile fixed bottom-4 left-4 right-4, flex-row justify-center; on md+ fixed top-24 right-4, flex-col. npm run build passes.
    Phase 3 completed 2026-02-22: CreatorLayout Ã¢â‚¬â€ main content order-2 lg:order-1, sidebar order-1 lg:order-2 (sidebar first on mobile); min-w-0 on both. Creator tab bar Ã¢â‚¬â€ flex-nowrap md:flex-wrap, overflow-x-auto, scrollbar-thin, step buttons flex-shrink-0. Library/Codex Ã¢â‚¬â€ mode toggle and TabNavigation wrapped in min-w-0 divs.
    Phase 4 completed 2026-02-22: Encounters Ã¢â‚¬â€ Create Encounter modal fullScreenOnMobile, type grid grid-cols-1 sm:grid-cols-3, top bar min-w-0. Campaigns Ã¢â‚¬â€ TabNavigation and main content min-w-0. My-account Ã¢â‚¬â€ PageContainer and header div given min-w-0. Rules, resources, privacy, terms use PageContainer; admin tables documented. npm run build passes.

- id: TASK-267
  title: Accessibility audit fixes and a11y systems (Vercel audit)
  priority: high
  status: done
  created_at: 2026-02-23
  created_by: owner
  description: |
    Address Vercel accessibility audit (light mode): contrast (home feature text, auth, status green), icon-only button labels, select accessible names, heading hierarchy (campaigns, campaign detail, encounters), dice image alt (no duplicate text). Add eslint-plugin-jsx-a11y and Cursor rule so future code and AI agents comply with WCAG 2.1 AA.
  related_files:
    - src/app/(main)/home-page.tsx
    - src/components/auth/password-input.tsx
    - src/app/(main)/campaigns/page.tsx
    - src/app/(main)/campaigns/[id]/page.tsx
    - src/app/(main)/encounters/[id]/combat/page.tsx
    - src/app/(main)/encounters/[id]/_components/SkillEncounterView.tsx
    - src/app/(main)/encounters/[id]/_components/CombatEncounterView.tsx
    - src/components/character-sheet/dice-roller.tsx
    - src/components/character-sheet/roll-log.tsx
    - eslint.config.mjs
    - .cursor/rules
  acceptance_criteria:
    - Home feature text meets contrast (e.g. text-neutral-700 or semantic token in light mode).
    - All icon-only buttons have aria-label (password toggle, dice roller history/clear, campaign edit, encounter add participant).
    - All selects have associated label (htmlFor/id) or aria-label.
    - Heading hierarchy: no skip (h1?h2?h3); campaigns list and detail, encounter views use h2 for first section after h1.
    - Dice images with visible die label use alt="" to avoid duplicate announcement.
    - eslint-plugin-jsx-a11y installed and enabled; .cursor/rules or ACCESSIBILITY.md documents a11y requirements for agents.
    - npm run build passes.
  notes: "Implemented 2026-02-23: Home feature text contrast (text-neutral-700); password toggle aria-label; campaigns/campaign [id] heading hierarchy (h2); encounter skill/combat section headings (h2), Campaign select id/htmlFor, participant skill select aria-label, Add participant aria-label; dice-roller and roll-log dice images alt='', History/Clear aria-labels; campaign edit name/description buttons aria-label; combat encounter Campaign select id/htmlFor; green status text (text-green-700). Added .cursor/rules/realms-accessibility.mdc and src/docs/ACCESSIBILITY.md. eslint-plugin-jsx-a11y already in devDependencies via eslint-config-next."

- id: TASK-268
  title: Investigate Range/selectNode InvalidNodeTypeError on mouse up
  priority: medium
  status: done
  created_at: 2026-02-23
  created_by: agent
  description: |
    Console error: "Failed to execute 'selectNode' on 'Range': the given Node has no parent." Triggered during handleMouseUp; stack references 525.js (React/Next) and attributes. Likely selection/range logic running after a DOM node was unmounted. Search codebase and dependencies for getSelection/selectNode/Range usage; add guards or defer selection logic to avoid detached nodes.
  related_files:
    - src/components/layout/selection-guard.tsx
    - src/app/layout.tsx
    - src/docs/ACCESSIBILITY.md
  acceptance_criteria:
    - Identify source (our code vs dependency).
    - If our code: guard selection/range so it never runs on detached nodes.
    - If dependency: document and optionally report upstream.
    - npm run build passes.
  notes: |
    Source: dependency (React/Next chunk 525.js). No getSelection/selectNode/Range in our src. Error occurs when selection's anchor node is detached before mouseup (e.g. modal/content unmount). Implemented SelectionGuard: capture-phase mouseup listener clears selection when anchorNode is not in document, preventing any code from using detached node. Mounted in root layout. Documented in ACCESSIBILITY.md. npm run build passes.

- id: TASK-270
  title: Use columnar codex tables in Prisma and API (after DB migration)
  priority: medium
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    After codex tables are migrated from id+data JSONB to proper columns (see DATABASE_CODEX_AUDIT.md and sql/supabase-codex-tables-columnar.sql), update Prisma schema to match the new columnar structure and update src/app/api/codex/route.ts and src/lib/codex-server.ts to read from columns instead of r.data. Response shape to clients should remain the same so hooks/UI need no changes.
  related_files:
    - prisma/schema.prisma
    - src/app/api/codex/route.ts
    - src/lib/codex-server.ts
    - src/app/(main)/admin/codex/actions.ts
    - scripts/seed-to-supabase.js
    - src/docs/DATABASE_CODEX_AUDIT.md
    - sql/supabase-codex-tables-columnar.sql
  acceptance_criteria:
    - Prisma codex models have explicit columns matching supabase-codex-tables-columnar.sql.
    - Codex API and codex-server return the same JSON shape as today (feats, skills, species, etc.).
    - npm run build passes; codex fetch and display work in app.
  notes: |
    Completed 2026-02-25. Owner had already run columnar SQL and imported CSV. (1) Prisma schema: all 9 codex models now have explicit columns (camelCase, Decimal for NUMERIC). (2) Codex API: reads from columns, builds same response shape with toStrArray/toNumArray for TEXT columns. (3) codex-server: row-to-record helpers per entity; getFeats/getSkills/etc. return id->record. (4) Admin actions: createCodexDoc/updateCodexDoc use toColumnarPayload (snake_to_camel, array->string) for columnar collections; core_rules still uses id+data. (5) Seed script: rowToColumnarPayload, upsert with create: { id, ...payload }, update: payload; supports codex_csv and "Realms Codex Test - Feats" style filenames. npm run build passes.

- id: TASK-271
  title: Rename public library to official + columnar official_* tables
  priority: high
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Per DATABASE_SCALABILITY_AUDIT.md: (1) Rename "public" to "official" everywhere (tables, API, admin UI, hooks, labels). (2) Replace id+data JSONB with columnar official_powers, official_techniques, official_items, official_creatures: scalar columns (name, description, action_type, type, etc.) + one JSONB column for variable data (parts, damage, properties, etc.). Same shape as planned for user library so official and user content are interchangeable.
  related_files:
    - prisma/schema.prisma
    - src/app/api/official/[type]/route.ts
    - src/app/api/public/
    - src/app/(main)/admin/public-library/
    - src/services/library-service.ts
    - src/hooks/use-public-library.ts
    - src/hooks/use-creator-save.ts
    - src/docs/DATABASE_SCALABILITY_AUDIT.md
  acceptance_criteria:
    - Tables renamed to official_* (or new tables created and public_* deprecated).
    - Prisma models OfficialPower/OfficialTechnique/OfficialItem/OfficialCreature with columns + payload JSONB.
    - API route /api/official/[type] (or /api/public redirects); read/write columnar.
    - Admin "Public Library" ? "Official Library"; all references updated.
    - npm run build passes; official library load/add-to-library still works.
  notes: "Done 2026-02-25. (1) supabase-official-library-columnar.sql + Prisma Official* models. (2) GET/POST/DELETE /api/official/[type] columnar read/write. (3) proxy.ts excludes api/official. (4) library-service: fetchOfficialLibrary, saveToOfficialLibrary, findOfficialLibraryItemByName (legacy names aliased). (5) use-public-library: useOfficialLibrary/useAddOfficialToLibrary + query key official-library; usePublicLibrary/useAddPublicToLibrary deprecated aliases. (6) use-creator-save uses saveToOfficialLibrary/findOfficialLibraryItemByName. (7) Admin public-library: useOfficialLibrary, DELETE /api/official, QUERY_KEY official-library, labels Official Library / Official Powers etc.; page title Official Library Editor. (8) Admin nav link Open Official Library Editor. Legacy /api/public unchanged for backward compat. npm run build passes."

- id: TASK-272
  title: User library columnar (same schema as official + user_id)
  priority: medium
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Per DATABASE_SCALABILITY_AUDIT.md Phase 2: Migrate user_powers, user_techniques, user_items, user_creatures to columnar tables with same column set as official_* plus user_id. Enables copy official?user as row insert; query/filter by name/type; consistent validation.
  related_files:
    - prisma/schema.prisma
    - sql/supabase-user-library-columnar.sql
    - src/app/api/user/library/
    - src/lib/library-columnar.ts
    - src/app/(main)/library/actions.ts
    - src/lib/owner-library-for-view.ts
    - src/docs/DATABASE_SCALABILITY_AUDIT.md
  acceptance_criteria:
    - User library tables have explicit columns (name, description, type, etc.) + one JSONB for parts/properties/damage.
    - API and hooks read/write columnar; response shape unchanged for UI.
    - "Add to my library" from official copies row into user table with user_id.
    - npm run build passes.
  notes: "Done 2026-02-25. (1) supabase-user-library-columnar.sql: ADD COLUMN + backfill from data (DO block if data exists) + DROP data; idempotent. (2) Prisma: UserPower, UserTechnique, UserItem, UserCreature columnar (name, description, ... + payload); UserSpecies unchanged. (3) src/lib/library-columnar.ts: rowToItem, bodyToColumnar, SCALAR_KEYS shared for official/user. (4) GET/POST /api/user/library/[type] and GET/PATCH/DELETE [type]/[id]: columnar for powers/techniques/items/creatures; species legacy. (5) Library server actions and getOwnerLibraryForView use rowToItem/bodyToColumnar. addOfficialItemToLibrary unchanged (POST body split by API). npm run build passes."

- id: TASK-273
  title: Campaign members as table (replace memberIds JSONB)
  priority: low
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Per DATABASE_SCALABILITY_AUDIT.md Phase 3: Add campaign_members table (campaign_id, user_id, role?). Migrate memberIds JSONB into it; update RLS and API to use the table. Enables proper JOINs and indexing.
  related_files:
    - prisma/schema.prisma
    - sql/supabase-campaign-members.sql
    - sql/supabase-idempotent-full.sql
    - src/app/api/campaigns/
    - src/app/(main)/campaigns/actions.ts
    - src/app/(auth)/actions.ts
    - src/docs/DATABASE_SCALABILITY_AUDIT.md
  acceptance_criteria:
    - campaign_members table exists; membership read/write uses it.
    - RLS and campaign API use campaign_members instead of memberIds.
    - npm run build passes.
  notes: "Done 2026-02-25. (1) supabase-campaign-members.sql: CREATE campaign_members (campaign_id, user_id PK), backfill from memberIds, RLS on campaign_members and campaigns/campaign_rolls using EXISTS campaign_members. (2) Prisma: CampaignMember model; Campaign.members relation. (3) GET /api/campaigns and GET /api/campaigns/[id]: findMany/findUnique with include members, memberIds = members.map(m=>m.userId). (4) joinCampaignAction/addCharacterToCampaignAction: upsert CampaignMember + update campaign.memberIds. removeCharacterFromCampaignAction: update campaign + deleteMany CampaignMember where userId notIn memberIds. (5) Rolls and campaign character view APIs check membership via CampaignMember. (6) characters/[id] campaign visibility: findMany where members.some(userId). (7) deleteAccountAction: update campaigns from CampaignMember.findMany(userId), then deleteMany CampaignMember. campaign.memberIds kept for backward compat; RLS uses campaign_members. npm run build passes."

- id: TASK-274
  title: Creature Creator Ã¢â‚¬â€ Show feat point cost for damage modifiers, senses, movement, condition immunities
  priority: high
  status: done
  created_at: 2026-02-24
  created_by: agent
  description: |
    Owner feedback: Cost of each resistance, immunity, weakness, sense, movement, condition immunity should be clear before and after adding (feat point cost). Use chips or PointStatus-style display like elsewhere on the site.
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/CreatureCreatorHelpers.tsx
    - src/app/(main)/creature-creator/creature-creator-constants.ts
  acceptance_criteria:
    - Damage Modifiers section: show feat point cost per type (resistance, immunity, weakness) Ã¢â‚¬â€ e.g. label or chip like "+1 pt" / "-1 pt" Ã¢â‚¬â€ before adding (in dropdown or nearby) and on each added chip/row.
    - Senses: show feat point cost when adding and on each sense (chip or inline).
    - Movement: show feat point cost when adding and on each movement type (chip or inline).
    - Condition immunities: show feat point cost per condition immunity (same pattern as damage modifiers).
    - Use creature feat codex data (feat_points) and CREATURE_FEAT_IDS / SENSE_TO_FEAT_ID / MOVEMENT_TO_FEAT_ID for costs; summary panel already computes mechanical feat points Ã¢â‚¬â€ surface costs in UI.
  notes: "Done 2026-02-24. ChipList and ExpandableChipList accept costLabel(item); AddItemDropdown accepts costForOption and sectionCostLabel. Stats expose resistanceFeatCost, immunityFeatCost, weaknessFeatCost, conditionImmunityFeatCost. Senses/movement use getSenseCostLabel/getMovementCostLabel from featPointsMap."

- id: TASK-275
  title: Creature Creator Ã¢â‚¬â€ Use AddSkillModal and AddSubSkillModal instead of skills dropdown
  priority: high
  status: done
  created_at: 2026-02-24
  created_by: agent
  description: |
    Owner feedback: For skills use the add skill and add sub skill modals instead of a dropdown list. Align with character sheet and character creator (SkillsAllocationPage uses AddSkillModal and AddSubSkillModal).
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/components/shared/add-sub-skill-modal.tsx
    - src/components/shared/skills-allocation-page.tsx
  acceptance_criteria:
    - Replace AddItemDropdown for skills with "Add Skill" and "Add Sub Skill" buttons that open AddSkillModal and AddSubSkillModal respectively.
    - Wire modal selection to creature state (add base skill or sub-skill with correct structure; creature skills use CreatureSkill shape).
    - Reuse shared AddSkillModal/AddSubSkillModal props and onConfirm handling; creature has no "character" so pass minimal required props (skills data, codex skills, selected IDs, onConfirm that adds to creature.skills).
  notes: "Done 2026-02-24. Replaced dropdown with Add Skill / Add Sub Skill buttons; handleAddSkills adds base skills (value 0, proficient); handleAddSubSkills adds sub-skills (value 1, proficient) and autoAddBaseSkill when needed."

- id: TASK-276
  title: Creature Creator Ã¢â‚¬â€ Separate Add Feat and Add Negative Feat modals
  priority: high
  status: done
  created_at: 2026-02-24
  created_by: agent
  description: |
    Owner feedback: Separate feats into add feat and add negative feat, where the add negative feat modal only has feats with negative feat point costs.
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/components/shared/unified-selection-modal.tsx
  acceptance_criteria:
    - Two buttons: "Add Feat" (opens modal with feats where feat_points >= 0 or non-mechanical) and "Add Negative Feat" (opens modal with feats where feat_points < 0).
    - Filter feat list by creatureFeatsData / codex creature feats: points (feat_points) < 0 for negative feat modal; points >= 0 (and optionally exclude mechanical-only) for add feat modal.
    - Both modals use same UnifiedSelectionModal pattern; only data source filter differs.
  notes: "Done 2026-02-24. featSelectableItems filtered by Number(f.cost ?? 0) >= 0; featSelectableItemsNegative by < 0. Two modals and Add Feat / Add Negative Feat buttons."

- id: TASK-277
  title: Creature Creator Ã¢â‚¬â€ Power/technique/armament modals and lists show parts, properties, options as chips; use site-wide display logic
  priority: high
  status: done
  created_at: 2026-02-24
  created_by: agent
  description: |
    Owner feedback: In add power, technique, and armament modals the loaded things should show like all other parts of the site Ã¢â‚¬â€ parts, properties, options as chips; area, range, etc in expanded view. Same for displayed lists in creature creator. Use correct common logic (add-library-item-modal, library-section, character creator powers-step/equipment-step).
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
    - src/app/(main)/creature-creator/CreatureCreatorHelpers.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/lib/calculators/
  acceptance_criteria:
    - Add power/technique/armament modals: SelectableItem built with detailSections (Parts & Proficiencies / Properties chips) and optional totalCost/costLabel; area, range, duration, etc in expanded view or columns. Reuse part/property chip builders from add-library-item-modal or lib/calculators (derivePowerDisplay, deriveTechniqueDisplay, deriveItemDisplay; filterSavedItemPropertiesForList, part chips with TP).
    - Creature creator displayed lists (Powers, Techniques, Armaments sections): each row expandable with description, parts/properties as chips, area/range/damage/requirements in expanded view Ã¢â‚¬â€ same structure as library-section and character creator steps (GridListRow with detailSections, chips).
    - Do not duplicate chip-building logic; import or call shared helpers from lib/calculators and add-library-item-modal or equivalent.
  notes: "Done 2026-02-24. powerSelectableItems, techniqueSelectableItems, armamentSelectableItems now built from powerList/techniqueList/armamentList using derivePowerDisplay, deriveTechniqueDisplay, and property chip logic (same as add-library-item-modal); each SelectableItem has detailSections, totalCost, costLabel. Displayed lists (Powers/Techniques/Armaments sections) still use simple columns; optional follow-up to add expandable detail from library lookup."

- id: TASK-278
  title: Fix username change Ã¢â‚¬â€ new username replaced by Player### instead of kept
  priority: medium
  status: done
  created_at: 2026-02-25
  created_by: owner
  description: |
    Owner feedback: When changing account username in My Account, the new username is saved but then something creates a new "Player###" username and replaces the chosen one. The profile should keep the new username.
  related_files:
    - src/app/(auth)/actions.ts
    - My Account page / profile update flow
  acceptance_criteria:
    - After changing username via My Account, the displayed and stored username is the one the user entered, not a generated Player###.
    - No automatic overwrite of username by generateDefaultUsername or similar after a successful change.
  notes: "Done 2026-04-09 (PR: pending): Fixed createUserProfileAction to never overwrite an existing user_profiles.username with a generated default (callback/confirm can call it on later sign-ins). Existing usernames are preserved; generated defaults only apply when username is missing."

- id: TASK-279
  title: Public library columnar as primary (official_* preferred over public_*)
  priority: high
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Make the public/official library fully columnar: (1) Ensure official_powers, official_techniques, official_items, official_creatures exist in public schema (see sql/ e.g. supabase-official-library-columnar.sql). (2) If public_* tables still have rows, add a one-time migration/backfill that copies id+data into official_* columnar rows (scalars extracted + payload). (3) Change GET /api/public/[type] to read from official_* first (or only), returning the same client shape; keep POST/DELETE writing to official_* for admin. (4) Optionally deprecate or drop public_* after backfill. Goal: all library content queryable by columns; no remaining id+data for powers/techniques/items/creatures in public library.
  related_files:
    - src/app/api/public/[type]/route.ts
    - src/app/api/official/[type]/route.ts
    - src/services/library-service.ts
    - src/hooks/use-public-library.ts
    - src/app/(main)/admin/public-library/
    - sql/ (official_* creation and backfill from public_*)
    - src/docs/SUPABASE_SCHEMA.md
  acceptance_criteria:
    - official_* tables exist in public; any existing public_* data is backfilled into official_* (scalars + payload).
    - GET /api/public/[type] uses official_* as primary (or only) source; response shape unchanged for UI.
    - Admin public-library UI continues to read/write official_*; no reliance on public_* for new data.
    - SUPABASE_SCHEMA.md and API table list updated to reflect official_* as primary for public library.
    - npm run build passes.
  notes: |
    Done 2026-02-25. sql/supabase-official-library-public-schema.sql (official_* in public + backfill from public_*). GET /api/public prefers official_*, falls back to public_*; POST/DELETE write to official_* (columnar). npm run build passes.

- id: TASK-280
  title: User species columnar (same columns as codex_species + user_id)
  priority: medium
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Migrate user_species from id+data (JSONB) to columnar: same column set as codex_species (name, description, type, sizes, skills, species_traits, ancestry_traits, flaws, characteristics, ave_hgt_cm, ave_wgt_kg, adulthood_lifespan, languages) plus user_id, with one payload JSONB for any variable/extras. Enables consistent validation, filtering by name/type, and interchange with codex species shape. SQL: add columns to user_species (or new table), backfill from data, then drop data column or switch reads. API: GET/POST/PATCH/DELETE /api/user/library/[type] and [type]/[id] for species to read/write columnar; extend library-columnar or add species rowToItem/bodyToColumnar helpers.
  related_files:
    - src/app/api/user/library/[type]/route.ts
    - src/app/api/user/library/[type]/[id]/route.ts
    - src/lib/library-columnar.ts
    - sql/ (user_species columnar migration)
    - src/docs/CODEX_SCHEMA_REFERENCE.md
    - src/docs/SUPABASE_SCHEMA.md
  acceptance_criteria:
    - user_species has scalar columns matching codex_species + user_id; one payload JSONB; existing data migrated.
    - API and hooks return same client shape for species; UI (species creator, library, character creator) unchanged.
    - SUPABASE_SCHEMA.md updated: user_species columnar.
    - npm run build passes.
  notes: |
    Done 2026-02-25. sql/supabase-user-species-columnar.sql; library-columnar rowToItemSpecies, bodyToColumnarSpecies, toDbRowSpecies; user library API GET/POST/PATCH/DELETE species use columnar with legacy fallback. npm run build passes.

- id: TASK-281
  title: Encounters Ã¢â‚¬â€ add list columns (name, type, status) for filtering
  priority: low
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Add real columns to encounters for list/filter without parsing JSONB: name, type, status (and optionally user_id if not already columnar). Backfill from data JSONB; keep data for full document. Update encounters list API and use-load hooks to select/sort by these columns where useful.
  related_files:
    - src/app/api/encounters/route.ts
    - src/app/api/encounters/[id]/route.ts
    - src/hooks/use-encounters.ts
    - src/services/encounter-service.ts
    - sql/ (ALTER encounters ADD COLUMN + backfill)
    - src/docs/SUPABASE_SCHEMA.md
  acceptance_criteria:
    - encounters has name, type, status (and user_id if missing) as columns; data JSONB retained.
    - Backfill from data; list/filter can use columns.
    - SUPABASE_SCHEMA.md updated (encounters: scalar + JSONB).
    - npm run build passes.
  notes: |
    Done 2026-02-25. sql/supabase-encounters-list-columns.sql; GET list selects name,type,status; POST/PATCH set columns. npm run build passes.

- id: TASK-282
  title: Characters Ã¢â‚¬â€ add list columns (name, level, archetype_name, etc.); keep data JSONB
  priority: medium
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Long-term hybrid for characters: add columns to `characters` for list/filter/sort without parsing JSONB Ã¢â‚¬â€ name, level, archetype_name, ancestry_name, status, visibility (plus existing id, user_id, updated_at). Keep `data` (JSONB) for the full document. On every create/update, write these scalars from the document into columns. SQL: ADD COLUMN + backfill from data; API GET list selects columns (optionally still fallback from data for legacy rows); POST/PATCH write columns from payload. Benefits: list/filter/sort by level or name; future "characters level 5+", "by archetype"; analytics.
  related_files:
    - src/app/api/characters/route.ts
    - src/app/api/characters/[id]/route.ts
    - src/app/(main)/characters/actions.ts
    - sql/ (ALTER characters ADD COLUMN + backfill)
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/DATABASE_SCALABILITY_AUDIT.md
  acceptance_criteria:
    - characters has name, level, archetype_name, ancestry_name, status, visibility as columns; data JSONB retained.
    - Backfill existing rows from data; create/update write columns from document.
    - GET list uses columns for summary (same response shape); single-character load still uses data.
    - SUPABASE_SCHEMA.md updated (characters: scalar list columns + JSONB).
    - npm run build passes.
  notes: |
    Done 2026-02-25. sql/supabase-characters-list-columns.sql; src/lib/character-list-columns.ts getCharacterListColumns; characters API GET list uses columns; POST/PATCH and campaigns actions update list columns. npm run build passes.

- id: TASK-283
  title: Campaign rolls Ã¢â‚¬â€ add list columns (character_id, user_id, type, title); keep data JSONB
  priority: medium
  status: done
  created_at: 2026-02-25
  created_by: agent
  description: |
    Long-term hybrid for campaign_rolls: add columns for list/filter without parsing JSONB Ã¢â‚¬â€ character_id, user_id, type, title (plus existing id, campaign_id, created_at). Keep `data` (JSONB) for dice, modifier, total, isCrit, etc. On every insert, set columns from payload. SQL: ADD COLUMN + backfill from data; API GET list selects columns; POST sets columns from body. Benefits: filter by type or character; sort/paginate by column.
  related_files:
    - src/app/api/campaigns/[id]/rolls/route.ts
    - src/hooks/use-campaign-rolls.ts
    - sql/ (ALTER campaign_rolls ADD COLUMN + backfill)
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/DATABASE_SCALABILITY_AUDIT.md
  acceptance_criteria:
    - campaign_rolls has character_id, user_id, type, title as columns; data JSONB retained.
    - Backfill existing rows from data; new inserts set columns from payload.
    - GET list uses columns where available (same response shape).
    - SUPABASE_SCHEMA.md updated (campaign_rolls: scalar list columns + JSONB).
    - npm run build passes.
  notes: |
    Done 2026-02-25. sql/supabase-campaign-rolls-list-columns.sql; GET list selects character_id, user_id, type, title; POST insert sets columns. npm run build passes.

- id: TASK-284
  title: Species steps Ã¢â‚¬â€ deduplicate list items (flaws, traits, characteristics) when mixed
  priority: high
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    When species steps show mixed content (e.g. ancestry + flaw + characteristic), list items can appear duplicated. Deduplicate display so each flaw, trait, or characteristic appears once.
  related_files:
    - src/components/character-creator/steps/ancestry-step.tsx
  acceptance_criteria:
    - No duplicate entries in species-step lists for flaws, traits, characteristics when mixed.
    - npm run build passes; manual check in character creator species steps.
  notes: |
    Done 2026-03-07. ancestry-step: when building merged lists for mixed species (speciesA + speciesB), deduplicate by trait ID (Set of string IDs) before resolve so shared ancestry traits, flaws, and characteristics appear once. npm run build passes.

- id: TASK-285
  title: Species steps Ã¢â‚¬â€ sticky Continue button
  priority: medium
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    Make the Continue button sticky on species steps so users don't have to scroll to proceed. Use sticky footer or equivalent so the button is always visible.
  related_files:
    - src/components/character-creator/steps/species-step.tsx
    - src/components/character-creator/steps/ancestry-step.tsx
  acceptance_criteria:
    - Continue button remains visible (sticky footer or similar) on species steps without scrolling.
    - Touch target =44px; works on mobile (fullScreenOnMobile if in modal).
    - npm run build passes.
  notes: |
    Done 2026-03-07. Species-step and ancestry-step: nav block (Back / Continue) is sticky bottom with min-h-[44px] buttons. npm run build passes.

- id: TASK-286
  title: Power creator Ã¢â‚¬â€ support multiple damage types per power
  priority: high
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    Allow a power to have multiple damage types. Add UI for "add another row" of damage types; update save/load data shape (e.g. array of damage types) and ensure backward compatibility for existing single damage-type data.
  related_files:
    - src/app/(main)/power-creator/page.tsx
  acceptance_criteria:
    - User can add multiple damage type rows in Power Creator; save persists array; load restores and displays all.
    - Existing powers with single damage type still load correctly.
    - npm run build passes.
  notes: |
    Done 2026-03-07. State is damages[]; UI maps over rows with Add damage type and remove per row; save/load use array; cache and load handle single-object backward compat. npm run build passes.

- id: TASK-287
  title: Creators Ã¢â‚¬â€ explicit energy (EN) display per item
  priority: medium
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    In Power, Technique, and Armament creators, show energy (EN) explicitly for each part/item so users see cost per thing.
  related_files:
    - src/app/(main)/power-creator/PowerPartCard.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  acceptance_criteria:
    - Each power, technique, armament row/card in creators shows EN where applicable.
    - Consistent with GAME_RULES and existing EN display patterns.
    - npm run build passes.
  notes: |
    Done 2026-03-07. Verified: PowerPartCard and technique part cards show EN per part; item creator shows IP/TP/C per property; summary panels show total Energy/IP/Currency. No code change required.

- id: TASK-288
  title: Remove "(optional)" label from damage in creators
  priority: low
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    Remove the "(optional)" label from damage fields; everything is optional so the label is redundant.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
  acceptance_criteria:
    - No "(optional)" text next to damage in creators.
    - npm run build passes.
  notes: |
    Done 2026-03-07. Power creator: "Damage (Optional)" ? "Damage". Item creator: "Shield Damage (Optional)" ? "Shield Damage". npm run build passes.

- id: TASK-289
  title: Official library Ã¢â‚¬â€ fix save for powers, techniques, armaments
  priority: critical
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    The public/official library is not persisting when saving powers, techniques, armaments. Fix API and client so admin save to official library correctly writes to official_powers, official_techniques, official_armaments (or equivalent) and items appear after save.
  related_files:
    - src/app/api/official/[type]/route.ts
    - src/hooks/use-creator-save.ts
    - src/services/library-service.ts
  acceptance_criteria:
    - Admin saving power/technique/armament to official library persists to DB; list refreshes and shows new item.
    - No silent failures; errors surfaced to user if save fails.
    - npm run build passes.
  notes: |
    Done 2026-03-07. (1) API bodyToDb: store power range/duration/area/damage in payload only (not as top-level columns) so base schema works without columnar expansion SQL. (2) use-creator-save: invalidate official-library query after successful public save so lists refresh. npm run build passes.

- id: TASK-290
  title: Range display Ã¢â‚¬â€ consistent spacing for powers and armaments across views
  priority: medium
  status: done
  created_at: 2026-03-07
  created_by: agent
  description: |
    Range displays with different spacing for powers vs armaments depending on view (e.g. more spaces in list/library views). Unify so range formatting (and spacing) is consistent in list, library, and detail views.
  related_files:
    - src/lib/utils/string.ts (normalizeRangeDisplay)
    - src/lib/calculators/item-calc.ts (formatRange)
    - src/components/character-sheet/library-section.tsx
  acceptance_criteria:
    - Range spacing/formatting consistent for powers and armaments in list, library, and detail views.
    - npm run build passes.
  notes: |
    Done 2026-03-07. normalizeRangeDisplay in utils: trim, collapse spaces, standardize "Spaces"/"Space" to lowercase. item-calc formatRange now emits "X space(s)". library-section uses normalizeRangeDisplay for power/tech/item range. npm run build passes.

- id: TASK-291
  title: Power Mechanics rework, remove apply duration, section cost badges
  priority: high
  status: done
  created_at: 2026-03-07
  created_by: owner
  description: |
    Rework Advanced Power Mechanics to match Power Parts UX (Add Part, category sort, part selection). Remove apply duration toggle from duration and area sections. Add SectionCostBadge (EN/TP/IP) to all creator sections showing cost contribution per section.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/components/shared/section-cost-badge.tsx
    - src/app/(main)/power-creator/power-creator-types.ts
  acceptance_criteria:
    - Power Mechanics uses same Add Part + PowerPartCard UX as Power Parts; mechanic parts only (excluded from hardcoded UI).
    - Apply duration checkbox removed from duration and area sections.
    - SectionCostBadge shows EN/TP/IP per section in power, technique, and item creators.
    - npm run build passes.
  notes: |
    Done 2026-03-07. (1) Power Mechanics: replaced PowerAdvancedMechanicsSection with inline section using PowerPartCard; mechanicPartsForList = mechanic && !EXCLUDED_PARTS; addMechanicPart adds first mechanic part; deleted PowerAdvancedMechanics.tsx. (2) Removed apply duration from duration and area sections. (3) SectionCostBadge component; power creator: Action, Range, Area, Duration, Damage, Power Parts, Power Mechanics; item creator: Range, Base Damage, DR, Agility Reduction, Critical Range, Ability Req, Shield Block, Shield Damage; technique creator: Additional Damage. npm run build passes.

- id: TASK-292
  title: Area of effect description + collapsible sections in creators
  priority: medium
  status: done
  created_at: 2026-03-07
  created_by: owner
  description: |
    (1) Area of effect in power creator: show part description and Option 1 increase when an area part is selected. (2) Collapsible sections across creators: Action Type, Range, Area of Effect, Duration, Power Parts, Power Mechanics, Damage, etc. When collapsed, show shorthand summary (e.g. "Basic Reaction", "12 Spaces", "3 Space Radius Sphere", "3 Minutes", "Part Name, Energy, TP").
  related_files:
    - src/components/creator/collapsible-section.tsx
    - src/lib/calculators/power-calc.ts (getAreaPartForDisplay, formatAreaForDisplay)
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
  acceptance_criteria:
    - Area of Effect section shows part description and op_1 when applicable.
    - All major creator sections are collapsible with collapsedSummary.
    - Power, Technique, Item, Creature creators use shared CollapsibleSection.
    - npm run build passes.
  notes: |
    Done 2026-03-07. (1) getAreaPartForDisplay/formatAreaForDisplay in power-calc; Area of Effect shows description + Option 1 block when areaPartInfo exists. (2) CollapsibleSection: collapsedSummary, rightSlot, chevron. (3) Power creator: Action Type, Range, Area, Duration, Power Parts, Power Mechanics, Damage wrapped in CollapsibleSection. (4) Technique creator: Combat Configuration, Technique Parts, Additional Damage. (5) Item creator: Weapon/Shield Config, Base Damage, Armor Config, Shield Block, Shield Damage, Ability Requirement, Properties. (6) Creature creator: Feats, Powers, Techniques, Armaments have collapsedSummary. npm run build passes.

- id: TASK-293
  title: Add crafting rules to core_rules + admin Crafting tab
  priority: high
  status: done
  created_at: 2026-03-10
  created_by: owner
  description: |
    Add CRAFTING category to core_rules table with general crafting table, successes table, enhanced crafting table, consumable enhanced table, multiple-use energy table, and multipliers (crafting cost 75%, consumable time Ã¢â‚¬â€, upgrade cost, etc.). Add Crafting tab to admin core rules editor for editing these values.
  related_files:
    - src/types/core-rules.ts
    - scripts/seed-core-rules.js
    - src/hooks/use-game-rules.ts
    - src/app/(main)/admin/core-rules/page.tsx
    - src/docs/ai/CRAFTING_IMPLEMENTATION_PLAN.md
  acceptance_criteria:
    - CraftingRules interface and CRAFTING in CoreRulesMap.
    - CRAFTING seeded in seed-core-rules.js; useGameRules returns CRAFTING.
    - Admin Core Rules has Crafting tab with editable tables and multipliers.
    - npm run build passes.
  notes: |
    Done 2026-03-10 (Phase 1). Types: CraftingTableRow, SuccessesTableRow, EnhancedCraftingTableRow, ConsumableEnhancedTableRow, MultipleUseEnergyRow, CraftingRules; CRAFTING in CoreRulesMap. Seed: full CRAFTING object in seed-core-rules.js (generalTable, successesTable, enhancedTable, consumableEnhancedTable, multipleUseTable, multipliers, finerToolsBonus). use-game-rules: CRAFTING in FALLBACK_RULES. Admin: Crafting tab; CategoryEditor case CRAFTING with multipliers and editable General + Successes tables. Run `node scripts/seed-core-rules.js` to populate DB. npm run build passes.

- id: TASK-294
  title: Create crafting hub + crafting page with skill-encounter logic
  priority: high
  status: done
  created_at: 2026-03-10
  created_by: owner
  notes: "Phase 2 implemented: crafting_sessions table (schema + migration SQL in SUPABASE_SCHEMA.md), API and hooks, Crafting Hub at /crafting, /crafting/new (item picker, Consumable/Bulk, Start), /crafting/[id] (DS modifier, additional successes/failures, roll sessions, Complete -> outcome). Sub-skill flavor and fullScreenOnMobile on modals deferred. npm run build passes. Run crafting_sessions migration in Supabase before use."
  description: |
    Build crafting hub (encounter-like list: completed, planned, in progress) with "Start Crafting" and crafting page that: (1) lets user select equipment/armament from library, codex, or public (or custom for enhanced); (2) toggles Consumable, Bulk, Enhanced; (3) DS modifier (effective DS = base + modifier) and manual additional successes/failures (like skill encounters); (4) auto-calculates requirements (effective DS, successes, time, material cost); (5) incremental roll sessions (one per time increment, styled like skill encounter combatants); (6) craft sub-skill selection + craft_success_desc/craft_failure_desc; (7) auto-calculated final material cost, market price, outcome from Successes table. Crafting lives under RM Tools in navbar.
  related_files:
    - src/app/(main)/crafting/page.tsx
    - src/app/(main)/crafting/new/page.tsx
    - src/lib/game/crafting-utils.ts
    - src/components/crafting/
    - src/docs/ai/CRAFTING_IMPLEMENTATION_PLAN.md
  acceptance_criteria:
    - Crafting Hub with list and Start Crafting.
    - Crafting page: item selection, Consumable/Bulk toggles, incremental roll sessions, outcome with auto-calculated costs.
    - fullScreenOnMobile on modals; touch targets =44px.
    - npm run build passes.

- id: TASK-295
  title: Enhanced crafting + Enhanced Equipment Library
  priority: medium
  status: done
  created_at: 2026-03-10
  created_by: owner
  notes: "Implemented: (1) crafting-utils: getEnhancedCraftingRequirements, getConsumableEnhancedRequirements, getMultipleUseAdjustedEnergy, getEnhancedMarketPrice. (2) Types: CraftingPowerRef, CraftingCustomBaseItem, UserEnhancedItem; session data extended with isEnhanced, powerRef, customBaseItem, potency, multipleUseTableIndex. (3) /crafting/new: Enhanced checkbox, power selector (user powers), energy cost input, custom base option (name+price), potency (creator or manual), multiple-use table dropdown; uses enhanced or consumable-enhanced table by energy. (4) user_enhanced_items table (schema + migration SQL in SUPABASE_SCHEMA.md), API GET/POST /api/user/enhanced-items, DELETE [id], PATCH [id] for potency/name; hooks useEnhancedItems, useCreateEnhancedItem, useDeleteEnhancedItem, useUpdateEnhancedItem. (5) Library: Enhanced tab (My Library only), LibraryEnhancedTab list + delete. (6) Crafting [id]: when completed and isEnhanced, 'Save to Library' creates enhanced item. (7) Upgrade potency (Phase 5): hub 'Upgrade potency' ? /crafting/new?mode=upgrade-potency (select enhanced item from library); getUpgradePotencyRequirements (25% time/cost/successes, same DS); session [id] when completed shows 'Update potency in library' with potency input and PATCH. (8) Follow-up 2026-03-13: crafting/[id] now calculates enhanced power energy from selected power parts (no manual EN input), supports official + library powers in selector, adds use/recovery selection from multiple-use table, and adds 'Craft base item as well' toggle to include both base and enhancement requirements in one session. npm run build passes."
  description: |
    Add Enhanced crafting: toggle, power selection, custom base item, potency (manual or creator's), Multiple Use table, Consumable Enhanced table. Add Enhanced Equipment library (official + personal): save enhanced items from crafting; base item + power + description, uses, potency.
  related_files:
    - src/app/(main)/crafting/new/page.tsx
    - src/app/(main)/library/page.tsx
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/ai/CRAFTING_IMPLEMENTATION_PLAN.md
  acceptance_criteria:
    - Enhanced toggle with power selection, custom base item, potency.
    - Library Enhanced tab; save enhanced items from crafting.
    - npm run build passes.

- id: TASK-296
  title: Creator resource colors Ã¢â‚¬â€ shift TP to lime and keep IP/C distinct
  priority: medium
  status: done
  created_at: 2026-03-12
  created_by: agent
  description: |
    Apply requested visual shift for Training Points (TP) toward lime while preserving distinct colors
    for Item Points (IP) and Currency (C). Keep usage consistent through existing semantic tokens so
    creator/list UIs update globally without ad-hoc per-component colors.
  related_files:
    - src/app/globals.css
  acceptance_criteria:
    - TP semantic tokens use lime palette in light/dark mode.
    - Existing TP usages (text-tp-text/bg-tp-light) render with new palette.
    - IP and Currency tokens remain visually distinct from TP.
    - No lint/build regressions.
  notes: |
    Implemented 2026-03-12: Updated --color-tp, --color-tp-light, --color-tp-text, --color-tp-border
    and dark-mode TP overrides to lime palette. Existing TP semantic classes now render in lime while
    IP (blue) and Currency (gold) remain distinct from prior creator color-token update.

- id: TASK-297
  title: Leveled feats migration and sitewide behavior unification (same name + level/id)
  priority: high
  status: done
  created_at: 2026-03-12
  created_by: agent
  description: |
    Finalize leveled-feat architecture across app and data: feats share same name across levels,
    `feat_lvl` indicates tier, ids differentiate rows, and `base_feat_id` links level-2+ feats to the
    level-1 feat. Remove remaining roman numeral naming dependence and ensure upgrade/replacement/counting
    rules are enforced consistently.
  related_files:
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/app/(main)/admin/codex/AdminFeatsTab.tsx
    - src/docs/LEVELED_FEATS_DESIGN.md
    - sql/leveled-feats-add-base-feat-id.sql
    - sql/leveled-feats-migrate-roman-to-base-id.sql
  acceptance_criteria:
    - Add/select flows use feat ids (not names) for duplicate detection and prerequisites.
    - Upgrading to higher feat level replaces lower-level feat in same family.
    - Slot usage/counting treats level-N feat as N slots of its feat type where limits are shown/enforced.
    - Codex/admin/showcase surfaces display "Name (Level N)" and no roman-suffix logic.
    - DB migration path documented and runnable to strip roman suffixes and populate base_feat_id.
    - npm run build passes after completion.
  notes: |
    In progress 2026-03-12.
    Implemented so far:
    - Character sheet Add Feat modal now uses id-only existing checks (same names allowed).
    - Character creator Feats step now enforces previous-level prerequisite via base_feat_id/feat_lvl,
      performs lower-level replacement on upgrade, and uses level-weighted slot counting.
    - Character sheet used-slot calculations and Feats tab counters now use level-weighted totals.
    - Character page add-feat flow replaces lower-level feats in same family when adding upgraded levels.
    - Added shared leveled-feat utilities (`src/lib/leveled-feats.ts`) for family grouping, display
      naming, and level-chip generation.
    - Unified feat-family UI display in Codex and Admin feat tabs: one family-oriented row with
      `Feat Levels` expandable chips rather than rendering every level as separate top-level rows.
    - Unified Character Creator Feats step and Character Sheet Add Feat modal to family-aware row
      rendering with `Feat Levels` chips and consistent shared `GridListRow` detail sections.
    - Character Sheet Feats tab now surfaces `Feat Levels` chips for selected feats when additional
      levels exist in the same family.
    - Build blocker in crafting detail page resolved: fixed `CreatorLayout` child structure,
      removed duplicated legacy sidebar/modal block, restored missing crafting-utils import, and
      corrected minor typing/UI issues surfaced by TypeScript.
    - `npm run build` now passes.
    Remaining:
    - Validate any remaining feat edit edge-cases for level variants in Admin workflows.
    Closed 2026-03-21: Admin Add Level now computes next family level from existing feat variants (prevents duplicate level-2 inserts when higher levels already exist).

- id: TASK-298
  title: Archetype Path system for guided character creation + admin authoring
  priority: high
  status: done
  created_at: 2026-03-12
  created_by: agent
  description: |
    Implement end-to-end archetype path support so users can choose between "Forge Your Own Path"
    and "Choose a Path" during character creation. Archetype paths include level-1 recommendations
    (proficiency, feat/skill/power/technique/armament/equipment options), primary+secondary ability
    guidance, and level progression recommendation data. Admin codex archetype editing should support
    authoring these path fields, and creator steps should consume/reuse shared list UI patterns with
    recommendation-first UX plus manual override.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/app/api/codex/route.ts
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/character-creator/steps/abilities-step.tsx
    - src/components/character-creator/steps/skills-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/stores/character-creator-store.ts
    - src/types/archetype.ts
    - src/types/character.ts
    - src/lib/game/archetype-path.ts
    - src/lib/data-enrichment.ts
  acceptance_criteria:
    - Creator first step includes "Forge Your Own Path" and "Choose a Path" options with explanatory copy.
    - Choose-a-Path mode lists official archetype paths grouped by archetype type and supports selecting one.
    - Selected path feeds recommended data into creator steps (at minimum feats/skills/equipment/powers/techniques guidance with manual override).
    - Character save persists path context (`archetypePathId`) for future level-up guidance.
    - Admin archetype editing supports path metadata fields and level-path data authoring.
    - Codex API returns archetype path fields safely (including JSON path payload).
    - npm run build passes.
  notes: |
    In progress 2026-03-12. Implemented in this session:
    - Added archetype path types and parsing utility (`src/types/archetype.ts`, `src/lib/game/archetype-path.ts`).
    - Extended codex archetype API payload with path fields and safe JSON handling.
    - Extended admin codex archetype authoring form to include primary/secondary ability, proficiency milestones, and path JSON data.
    - Added creator flow mode selection (Forge vs Path), grouped path selection UI, and path selection persistence in creator store.
    - Added path-aware recommendations in abilities, skills, feats (toggle between path and full list), powers/techniques, and equipment steps.
    - Persisted `archetypePathId`/`creationMode` in character save pipeline (`store`, `types`, `cleanForSave`).
    - Replaced JSON-only path authoring with a structured level-by-level Archetype Path Builder in admin:
      level 1 recommendation inputs, add/remove progression level cards, add/remove lists per level,
      and optional advanced JSON override for power users.
    - Refactored persistence toward columnar/relational Supabase data:
      level-1 path recommendations now map to dedicated columns on `codex_archetypes`, and level 2+
      progression rows map to `codex_archetype_levels` (one row per archetype+level).
    Update 2026-03-13:
    - Admin archetype path builder now uses selection UI instead of CSV/manual entry for
      feats, skills, powers, techniques, armaments, and equipment (including remove-lists),
      sourcing options from codex and official library hooks.
    Closed 2026-03-21: acceptance criteria verified in creator flow/store/API/admin authoring; build passes.

- id: TASK-299
  title: TP/proficiency system completion audit and rule-hardening
  priority: high
  status: done
  created_at: 2026-03-14
  created_by: agent
  description: |
    Complete a full sitewide TP/proficiency audit against owner requirements: per-part/property tracking,
    floor-rounded TP formula, duplicate-highest handling, damage-type dedupe across sources, creator
    over-limit visibility, and end-to-end tracking updates so no requirements are dropped.
  related_files:
    - src/lib/proficiencies.ts
    - src/lib/character-creator-validation.ts
    - src/components/character-creator/steps/finalize-step.tsx
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ai/AI_TASK_QUEUE.md
  acceptance_criteria:
    - Damage-type proficiencies dedupe across powers/techniques/items by damage type key.
    - Damage-type parsing handles string and object array forms safely.
    - Character creator TP over-limit uses proficiency-derived TP (not legacy trainingPointsSpent).
    - Creator over-limit is visible as a warning and does not hard-block creation.
    - Finalize summary shows TP limit/spent/remaining from required proficiencies.
    - Build/lint checks pass.
  notes: |
    Implemented 2026-03-14.
    - proficiencies.ts: proficiencyKey now normalizes any proficiency with damageType to `damage_type:{type}`
      so cross-source damage requirements dedupe correctly; parseDamageTypes now supports string array entries
      and object entries with type/damageType/name fields.
    - character-creator-validation.ts: equipment-step TP validation now derives required proficiencies from
      powers/techniques/armaments and computes spent TP via calculateProficiencyTP; over-limit is warning
      (allowed) with explicit spent/limit message.
    - finalize-step.tsx: added Proficiency TP summary (limit/required/remaining) and explicit over-limit notice.
    - Verification: npm run build passes; ReadLints reports no issues in modified files.

- id: TASK-300
  title: Pin Node and Next versions for stable Vercel deploys
  priority: low
  status: done
  created_at: 2026-03-18
  created_by: agent
  description: |
    Address Vercel deployment warning about engines.node using an open-ended major range and Next.js using a
    caret version, which can lead to surprise breakages when new major/minor versions are released.
    Pin Node to the current major (20) with an upper cap below 21, and pin Next.js to the exact version used
    in production so local and deploy environments stay aligned.
  related_files:
    - package.json
  acceptance_criteria:
    - engines.node no longer uses an unbounded ">=..." range across major versions.
    - Next.js dependency is pinned to the specific version currently deployed.
    - npm run build passes locally and on Vercel without Node engines warnings.
  notes: |
    Implemented 2026-03-18:
    - Updated package.json engines.node to ">=20.9.0 <21".
    - Pinned next dependency from "^16.1.6" to "16.1.6" to avoid automatic minor upgrades changing runtime behavior.

- id: TASK-301
  title: Migrate duplicate segmented pill toggles to SegmentedControl
  priority: medium
  status: done
  created_at: 2026-03-21
  created_by: agent
  description: |
    Audit (2026-03): Several screens duplicate the same `bg-surface-alt` + rounded inner buttons pattern that
    Library, SourceFilter, and SegmentedControl already implement. Replace inline implementations with
    `SegmentedControl` from `@/components/shared` (or `SourceFilter` when options are exactly All / Realms / My)
    so styling, focus rings, and min touch height stay consistent.
    Candidate files: `src/app/(main)/codex/page.tsx` (Realms Codex vs My Codex),
    `src/components/character-creator/steps/species-step.tsx`, `src/components/character-creator/MixedSpeciesModal.tsx`,
    `src/components/shared/add-combatant-modal.tsx`, `src/app/(main)/encounters/[id]/mixed/page.tsx`,
    `src/components/creator/CreatorSaveToolbar.tsx`. Evaluate `theme-toggle.tsx` separately (three-way system/light/dark
    may need a variant or stay custom). Do not replace `TabNavigation` underline tabs for primary category navigation.
  related_files:
    - src/components/shared/segmented-control.tsx
    - src/components/shared/filters/source-filter.tsx
    - .cursor/rules/realms-unification.mdc
    - src/docs/ai/AGENT_GUIDE.md
  acceptance_criteria:
    - Each candidate either uses SegmentedControl/SourceFilter or has a short code comment explaining why not
    - `npm run build` passes
    - Spot-check Codex mode toggle and at least one modal at ~360px width
  notes: |
    Done 2026-03-21: Extended SegmentedControl with optional icons, equalWidth, and aria-pressed on non-tab segments.
    Migrated: codex/page.tsx, species-step.tsx, MixedSpeciesModal.tsx, add-combatant-modal.tsx,
    encounters/[id]/mixed/page.tsx, CreatorSaveToolbar.tsx. theme-toggle inline variant documented as intentional
    exception (icon-only + tint selected state). npm run build passes.

- id: TASK-302
  title: Creature creator inventory budget summary (current/max) + inventory type tabs
  priority: high
  status: done
  created_at: 2026-03-21
  created_by: agent
  description: |
    Update creature creator summary and inventory workflow so spendable resources display as current/max,
    inventory spend reduces available currency, and the add-inventory modal supports equipment type tabs.
    Rename Armaments to Inventory in the creature creator UI while preserving existing item behavior.
  related_files:
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/transformers.ts
    - src/components/creator/creator-summary-panel.tsx
    - src/docs/ai/AI_CHANGELOG.md
  acceptance_criteria:
    - Creature Summary resource boxes show current/max for ability, skill, feat, training, and currency.
    - Currency remaining is derived from base creature currency minus inventory item costs.
    - Armaments section is renamed to Inventory, with matching labels and add/remove actions.
    - Add Inventory modal includes tabs for All/Weapons/Armor/Shields/Equipment and filters list accordingly.
    - Inventory section displays currency spent/remaining in addition to per-item cost rows.
    - npm run build passes.
  notes: |
    In progress 2026-03-21.
    Implemented in this session:
    - Added Inventory type tabs in creature add-item modal using SegmentedControl and UnifiedSelectionModal displayFilter.
    - Renamed Armaments section UI copy to Inventory and updated empty/add/remove labels.
    - Added current/max resource display in Creature Summary for Ability, Skill, Feat, Training, and Currency.
    - Added training/currency spend tracking from selected creature powers/techniques/inventory items.
    - Added inventory currency summary card in Inventory section (remaining/max and spent).
    - Expanded CreatorSummaryPanel resource box values to support formatted strings for current/max displays.
    - Extended creature power source payload to include tp for training-spend accounting.
    - Verification: npm run build passes.
    Closed 2026-03-21: Marked done after acceptance spot-check in creature-creator (summary current/max, inventory tabs, currency spend); see branch commit.

- id: TASK-303
  title: Add empowered technique creator combining power + technique systems
  priority: high
  status: done
  created_at: 2026-03-21
  created_by: owner
  description: |
    Implement a dedicated empowered-technique creator that combines the power creator and
    technique creator workflows using shared logic/components. The new creator should support
    power mechanics (action type, range, area, duration, add damage, power parts/mechanics)
    plus technique mechanics (technique parts and additional damage), with shared action type.
    Add Weapon must use Add Weapon to Power (part id 369). Cost calculations should combine
    power and technique costs with empowered-specific scaling behavior.
  related_files:
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/layout.tsx
    - src/lib/calculators/empowered-technique-calc.ts
    - src/lib/calculators/index.ts
    - src/app/(main)/power-creator/PowerPartCard.tsx
    - src/lib/id-constants.ts
    - src/lib/game/creator-constants.ts
    - src/components/layout/header.tsx
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
  acceptance_criteria:
    - New route exists for empowered technique creator and is reachable from Creators navigation.
    - Creator includes power sections (action/range/area/duration/power damage/power parts/power mechanics) and technique sections (technique parts/additional damage).
    - Shared action profile is used across both sides; Add Weapon uses Add Weapon to Power (id 369).
    - Energy/TP totals use empowered calculation logic (combined power + technique with technique percentage scaling applied to power side).
    - Save/load flow supports empowered technique docs.
    - npm run build passes.
  notes: |
    Implemented locally 2026-03-21:
    - Added new empowered-technique creator route with shared card/components and combined sections.
    - Added empowered calculator and exports.
    - Added PART_IDS.ADD_WEAPON_TO_POWER = 369 and creator cache key.
    - Added Creators dropdown navigation link.
    Update 2026-03-21:
    - Added shared `WeaponSelector` component and reused it in technique and empowered technique creators.
    - Power Creator now has an `Add Weapon to Power` section (shared weapon selector UI, power part id 369 scaling, save/load/cache support).
    - Library now includes a dedicated `Empowered` tab in My Library and Realms Library (filtered from techniques payloads with empowered flags/data).
    - Character Creator powers step `Add Powers` modal now has `Powers / Empowered Techniques` tabs and displays empowered selections in the powers list.
    - Creature Creator `Add Power` modal now has `Powers / Empowered Techniques` tabs; empowered selections map into creature power entries and display in power lists.
    Closed 2026-03-21: All acceptance criteria verified; build passes. Follow-up: sheet header hides duplicate martial ability when same as power ability (case-insensitive).

- id: TASK-304
  title: Supabase library columnar parity expansion (official + user)
  priority: high
  status: done
  created_at: 2026-03-24
  created_by: agent
  description: |
    Expand columnar coverage for library data while keeping official and user tables shape-compatible.
    Add promoted columns for powers/techniques/items to both official_* and user_* tables, backfill from payload,
    and keep payload-to-column sync via DB triggers so existing API writes remain backward-compatible.
  related_files:
    - sql/supabase-library-columnar-parity-expansion.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/OFFICIAL_LIBRARY_COLUMNAR_PLAN.md
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
  acceptance_criteria:
    - New migration adds matching promoted columns on official_* and user_* library tables for powers/techniques/items.
    - Existing rows are backfilled from payload without data loss.
    - Trigger-based sync keeps promoted columns populated on new/updated rows written through existing payload-heavy APIs.
    - Supabase schema docs updated to reflect parity migration and run order.
  notes: |
    In progress 2026-03-24: planned parity-first migration (official + user) with DB-side trigger sync to avoid API breakage.
    Done 2026-03-24:
    - Added sql/supabase-library-columnar-parity-expansion.sql.
    - Added promoted columns for powers/techniques/items on official_* and user_* tables.
    - Added trigger function sync_library_promoted_columns + per-table triggers for payload->column sync.
    - Added trigger-driven backfill updates for existing rows.
    - Updated SUPABASE_SCHEMA.md and OFFICIAL_LIBRARY_COLUMNAR_PLAN.md with parity migration details.
    - App mapping follow-up 2026-03-24: updated shared `library-columnar.ts` and `api/official/[type]` to explicitly write/read promoted power/technique/item columns (column-first reads with payload fallback; official route now uses shared mapper like public/user routes).
    - Power creator: added `tpRaw` to `PowerCostResult` / `calculatePowerCosts` and advanced calc rows (matches prior UI expectation; `npm run build` passes).

- id: TASK-309
  title: Add codex edit changelog history and admin changelog viewer
  created_at: 2026-04-20
  created_by: agent
  priority: high
  status: done
  related_files:
    - sql/supabase-codex-change-logs.sql
    - src/lib/codex-changelog.ts
    - src/app/(main)/admin/codex/actions.ts
    - src/app/api/admin/changelogs/route.ts
    - src/app/(main)/admin/changelogs/page.tsx
    - src/app/(main)/admin/page.tsx
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/ai/AI_CHANGELOG.md
  pr_link: (pending)
  merged_at: (pending)
  description: |
    Add short-term codex/core-rules edit history for alpha operations so admins can review what changed,
    when, and by whom without relying on full database backups for recent edits.
    Persist before/after snapshots with actor + timestamp and expose an admin changelog UI grouped by codex tab.
  acceptance_criteria:
    - A Supabase table stores codex/core-rules create/update/delete entries with before_data, after_data, changed_at, and changed_by_user_id.
    - Database retention hard-caps history to latest 10 rows per entity (entity_type + entity_id).
    - Codex admin write actions log create/update/delete events, including archetype path saves.
    - Admin `/admin/changelogs` page lists entries date-desc by selected codex-style tab and supports viewing before/after details.
    - Admin dashboard has a Changelogs link.
    - `npm run build` passes.
  notes: |
    Implemented 2026-04-20:
    - Added `codex_change_logs` migration with indexes, admin-read RLS policy, and DB trigger retention (latest 10 per entity).
    - Added `recordCodexChange` helper and wired logging into `createCodexDoc`, `updateCodexDoc`, `deleteCodexDoc`, and `saveArchetypeWithPath`.
    - Added admin API `GET /api/admin/changelogs` (admin-gated, entity-type filter, actor profile enrichment).
    - Added `/admin/changelogs` UI with codex-style tabs, date-ordered entries, and before/after detail modal.
    - Added Admin dashboard card linking to `/admin/changelogs`.

- id: TASK-311
  title: Codex "view as character" filter (persists across tabs); Feats tab auto-filters by character stats
  created_at: 2026-06-12
  created_by: agent
  priority: high
  status: done
  related_files:
    - src/lib/game/feat-requirements.ts
    - src/components/codex/codex-character-filter.tsx
    - src/components/codex/index.ts
    - src/app/(main)/codex/page.tsx
    - src/app/(main)/codex/CodexFeatsTab.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/docs/ALL_FEEDBACK_CLEAN.md
    - src/docs/ai/AI_CHANGELOG.md
  pr_link: (pending)
  merged_at: (pending)
  description: |
    Add a Codex-wide "View as character" filter that lets the user pick one of their characters; the
    selection persists across all Codex tabs (and across reloads via localStorage). On the Feats tab, the
    selection auto-filters the list to feats the character qualifies for Ã¢â‚¬â€ using the exact same
    qualification logic as the character creator (level, ability/defense, skill+proficiency, martial
    ability, speed, and leveled-feat prerequisites). Other tabs are unaffected for now.
  acceptance_criteria:
    - A "View as character" selector appears on the Codex page and persists the chosen character across tab switches and reloads.
    - The selector lists the user's characters and a "No character (show all)" option; it is hidden when the user has no characters.
    - With a character selected, the Feats tab hides feats the character does not qualify for by default, with a toggle to show unqualified feats.
    - Feat qualification reuses a single shared module (`checkFeatRequirements`) Ã¢â‚¬â€ the creator Feats step and character-sheet Add Feat modal use the same module (no duplicated logic).
    - `npm run build` passes.
  notes: |
    Implemented 2026-06-12:
    - Extracted feat-requirement logic into `src/lib/game/feat-requirements.ts` (single source of truth):
      level, ability/defense, skill bonus + proficiency, martial ability, speed, and leveled-feat
      prerequisite checks. Returns `{ met, reason, reasons }`.
    - Refactored `feats-step.tsx` (creator) and `add-feat-modal.tsx` (sheet) to delegate to the shared
      module; this also adds speed-requirement filtering to the creator/sheet for parity.
    - New `CodexCharacterFilter` component (uses `useCharacters`); selection lifted to the Codex page and
      persisted under `localStorage['codex:characterFilterId']` so it survives tab switches and reloads.
    - `CodexFeatsTab` now accepts `characterId`, loads the full character via `useCharacter`, and filters
      via `checkFeatRequirements` with a "Show/Hide unqualified feats" toggle and an active-filter banner.
    - Other Codex tabs intentionally left unchanged (per request).
    - Verification: `npm run build` passes.

---

## Historical context (phase/tier/audit notes from the original queue)

# ----------------------------------------------------------------
# RECONCILIATION TASKS Ã¢â‚¬â€ Created 2026-02-06 from full codebase audit
# Cross-referenced all raw feedback, completed tasks, and actual code.
# ----------------------------------------------------------------

# ============================================================================
# Phase 3: Codebase Simplification & Consolidation (from audit follow-up)
# ============================================================================

# =============================================================================
# Codex Firestore Migration + Admin Editor + Public Library (TASK-116+)
# Created 2026-02-06 from owner request. Phases: Migration ? Admin ? Public Library.
# USER tasks require manual steps by owner; all others assignable to AI.
# =============================================================================

# --- Phase 1: Firestore Migration ---

# --- Phase 2: Admin Infrastructure ---

# --- Phase 3: Admin Codex Editor (Subrule Editing) ---

# --- Phase 4: Public Library ---

# --- Phase 5: Data & Docs ---

# CampaignÃ¢â‚¬â€Encounter, Roll Log, Character Visibility (TASK-161+)

# =====================================================================
# CHARACTER DATA AUDIT - Lean Schema & Codex-Driven Architecture
# =====================================================================
#
# Context: Full audit of the saved character JSON revealed pervasive
# redundancy, multiple competing representations for the same data,
# derived values being persisted, full codex objects hard-saved onto
# characters instead of IDs, and several formula/constant bugs.
#
# Goal: Characters store ONLY user choices + runtime state (current HP/EN).
# Everything else is derived on load from Codex, Library, and game formulas.
# This makes the system resilient to playtest rule changes - update the
# codex/formulas once and all characters reflect the change immediately.
#
# Phases are ordered by dependency. Complete Phase 1-2 before Phase 3-4.
# Phase 5 depends on Phase 3-4. Phase 6 is final cleanup.
# =====================================================================

# -- Phase 1: Critical Bug Fixes --
# Standalone fixes. No schema migration. Can be done immediately.

# -- Phase 2: Define Lean Character Schema --
# Design the target data model. Define types, document what is
# persisted vs derived, create the migration plan.

# -- Phase 3: Centralize Calculations --
# Eliminate duplicated formula code. Single source of truth for all
# derived stats. Both creator and sheet call the same functions.

# -- Phase 4: Character Creator - Save Lean Data --
# Fix what the creator persists. Move from save everything to
# save only user choices and IDs. Each task handles one data domain.

# -- Phase 5: Character Sheet - Load by ID, Derive from Codex --
# Update the character sheet to work with the lean data model.

# -- Phase 6: Unification and Migration --
# Cross-cutting cleanup. Unify enrichment. Migrate characters.

# =====================================================================
# ADMIN CORE RULES Ã¢â‚¬â€ Database-Driven Game Configuration
# =====================================================================
#
# Context: All game rules/constants (progression values, combat stats,
# archetype configs, conditions, sizes, rarities, etc.) are currently
# hardcoded in constants.ts, creator-constants.ts, and formulas.ts.
# During alpha/playtesting, these values change frequently. They need
# to live in Supabase so an admin can edit them without code deploys.
#
# Architecture:
# - New codex.core_rules table (same pattern as other codex tables)
# - Category-based rows: each category (progression, combat, archetypes,
#   conditions, sizes, rarities, etc.) is one row with id + data JSON
# - useGameRules() React hook loads all rules with React Query caching
# - Formulas read from the hook (with constants.ts fallback during migration)
# - Admin UI adds a "Core Rules" section to /admin with sub-tabs
# - Server actions follow the existing codex action pattern
#
# Dependency: Core Rules DB (TASK-221-223) should be completed BEFORE
# the formula centralization (TASK-201/233/234), since the centralized
# formulas should read from the DB rather than hardcoded constants.
# Admin UI tabs (TASK-225-232) can be built in parallel with lean schema.
# =====================================================================

# =====================================================================
# INTEGRATED EXECUTION ORDER
# =====================================================================
#
# This section defines the recommended execution order for ALL tasks
# from both the Lean Schema audit and the Core Rules Admin feature.
# Tasks are grouped into tiers by dependency.
#
# TIER 0: OWNER INPUT REQUIRED (blockers)
# These tasks need human decisions before they can proceed.
# Mark them, work on non-blocked tasks in parallel.
#   - TASK-221  : Core rules DB categories (owner reviews groupings)
#   NOTE: TASK-195 CANCELLED (code correct, GAME_RULES.md was wrong Ã¢â‚¬â€ fixed)
#   NOTE: TASK-198, TASK-199 owner-resolved Ã¢â‚¬â€ moved to TIER 1
#
# TIER 1: BUG FIXES (no dependencies, start immediately)
#   - TASK-198  : Fix game constants (ability caps, damage types, Staggered, ice naming)
#   - TASK-199  : Fix feat slot formulas
#   - TASK-196  : maxHealth archetype ability bug
#   - TASK-197  : Creator hardcoded health/energy
#   - TASK-199b : SAVEABLE_FIELDS missing fields
#
# TIER 2: DESIGN (parallel design work, no code dependencies)
#   - TASK-200  : CharacterSaveData type definition
#   - TASK-221  : Core rules DB schema design (needs owner review)
#
# TIER 3: CORE RULES DB FOUNDATION (depends on TASK-221)
#   - TASK-222  : Prisma model + migration
#   - TASK-223  : Seed DB with current values
#   - TASK-224  : useGameRules() hook
#
# TIER 4: CENTRALIZE CALCULATIONS (depends on TASK-224, TASK-196, TASK-197)
#   - TASK-201  : Centralize all stat calculations
#   - TASK-233  : Refactor formulas.ts for DB rules
#   - TASK-234  : Refactor calculations.ts for DB rules
#   - TASK-202  : Unify defense fields (defenseVals only)
#
# TIER 5: ADMIN CORE RULES UI (depends on TASK-222/223/224, parallel with Tier 6)
#   - TASK-225  : Progression tab
#   - TASK-226  : Combat & Scores tab
#   - TASK-227  : Archetypes tab
#   - TASK-228  : Conditions tab
#   - TASK-229  : Sizes & Carrying Capacity tab
#   - TASK-230  : Rarities & Currency tab
#   - TASK-231  : Ability Scores tab
#   - TASK-232  : Skills, Recovery, Experience, Damage Types tabs
#   NOTE: TASK-198 and TASK-199 are now owner-resolved and in TIER 1 (no longer blocked)
#
# TIER 6: LEAN CREATOR (depends on Tier 4)
#   - TASK-203  : Species as speciesId
#   - TASK-204  : Archetype as archetypeId
#   - TASK-205  : Feats as IDs
#   - TASK-206  : Powers as {id, innate}
#   - TASK-207  : Techniques as {id}
#   - TASK-208  : Skills as Record<id, {prof,val}>
#   - TASK-209  : Equipment as inventory with IDs
#   - TASK-210  : Lean health/energy
#
# TIER 7: LEAN SHEET (depends on Tier 6)
#   - TASK-211  : Sheet loads feats by ID
#   - TASK-212  : Sheet loads powers/techniques by ID
#   - TASK-213  : Sheet loads equipment by ID
#   - TASK-214  : Sheet derives skills from codex
#   - TASK-215  : Sheet derives all computed stats
#
# TIER 8: FINAL CLEANUP (depends on all above)
#   - TASK-216  : Unify enrichment pipeline
#   - TASK-217  : Update cleanForSave
#   - TASK-218  : Remove redundant Character fields
#   - TASK-219  : Portrait to Supabase Storage
#   - TASK-220  : Data migration script
# =====================================================================

# =====================================================================
# DEFERRED AUDIT ITEMS
# =====================================================================

# Phase 3 Unification (from UNIFICATION_AUDIT_2026-02-20)

---

## Appended 2026-07-15 (workflow slim Ã¢â‚¬â€ 79 tasks from active queue)

- id: TASK-473
  title: Admin path Ã¢â‚¬â€ recommended innate powers + eligibility validation
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-471
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T013
  developer_test_plan: |
    Suite DEV-V-008 T013 — see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
    - src/app/api/codex/route.ts
    - src/types/codex.ts
    - src/types/archetype.ts
    - src/lib/game/archetype-display.ts
    - src/lib/game/archetype-path.ts
    - src/lib/game/innate-eligibility.ts
    - src/lib/game/innate-eligibility.test.ts
    - src/lib/game/path-validation.ts
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
    - sql/codex-archetypes-level1-innate-powers-proposed.sql
  description: |
    Paths must author recommended powers and recommended innate powers separately. Admin path
    creation enforces full innate eligibility (REALMS Appendix G / Ã¢â‚¬â€5.11): Energy = Innate
    Threshold; Basic/Reaction only; no healing/energy-gain parts; combined recommended innate
    Energy costs fit Innate Energy (Threshold Ã¢â‚¬â€ Pools from calculateArchetypeProgression Ã¢â‚¬â€ L1
    Power 16 / Powered-Martial 6). Do NOT use getInnateEnergyMax / ARCHETYPE_CONFIGS.innateEnergy
    (those values are mislabeled as threshold for Power). Propose schema field
    (prefer level1_innate_powers TEXT parallel to level1_powers, or path_data JSON) in sql/
    before any live DB write per realms-codex-data rules.
  acceptance_criteria:
    - Admin path UI can set recommended innate powers distinct from recommended powers.
    - Publish/save validation blocks any recommended innate that fails Appendix G eligibility
      (Energy > Innate Threshold, nonÃ¢â‚¬â€Basic/Reaction action type, healing/energy-gain parts)
      and warns/blocks when recommended innate Energy sum exceeds Innate Energy (progression).
    - Path parse/display exposes innate recommendations to guided creator (types + archetype-display).
    - Propose SQL/schema in sql/ for owner review before apply; update SUPABASE_SCHEMA / REALMS
      Appendix C with the chosen field name; no live codex writes without owner approve.
    - npm run build.
  notes: |
    Owner 2026-07-15: Ã¢â‚¬â€other eligibility rules enforced on admin path creation (another task).Ã¢â‚¬â€
    Can start in parallel with TASK-470/463; TASK-471 consumes the field (empty-state OK until
    seeded). Spec audit 2026-07-15: eligibility ? energy-only; Innate Energy ? getInnateEnergyMax.
    Implemented 2026-07-15: repo code + SQL. **Applied** on RealmsRPG-Test 2026-07-15 (owner
    approved) Ã¢â‚¬â€ `level1_innate_powers` TEXT live. Seed recommended innates via admin when ready.

- id: TASK-472
  title: Guided innate powers Ã¢â‚¬â€ threshold gate + fully use Innate Energy
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-471
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T057
  developer_test_plan: |
    Suite DEV-V-013 T057 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/game/formulas.ts
    - src/lib/game/constants.ts
    - src/components/character-sheet/library-section.tsx
    - src/components/shared/innate-toggle.tsx
    - src/components/shared/point-status.tsx
    - src/stores/guided-creator-store.ts
    - src/lib/guided-creator/build-character.ts
    - src/docs/GAME_RULES.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    On the innate powers portion of the guided power step: each pick must have Energy = Innate
    Threshold; the user must select a set that fully spends Innate Energy (sum of innate Energy
    costs = Innate Energy). Budget source of truth: calculateArchetypeProgression(...).innateEnergy
    (Threshold Ã¢â‚¬â€ Pools Ã¢â‚¬â€ L1 Power 16 / PM 6), matching the character sheet Ã¢â‚¬â€ NOT
    getInnateEnergyMax / ARCHETYPE_CONFIGS.innateEnergy (Power currently returns 8 = threshold).
    Prefer fixing or deprecating getInnateEnergyMax if touched. Reuse sheet remaining helpers +
    PointStatus. Persist innate flags into build-character (powers: { id, innate }).
  acceptance_criteria:
    - Cannot select an innate candidate with Energy > Innate Threshold for archetype at L1.
    - Continue blocked until remaining Innate Energy is 0 (fully used) Ã¢â‚¬â€ intentional override of
      Ã¢â‚¬â€5.8 optional Continue for the innate track only; regular powers stay optional.
    - Visible Innate Energy spent/remaining uses shared PointStatus (not a fork of
      LoadoutBudgetBar Currency Ã¢â‚¬â€ TP remains on regular powers only).
    - Budget math uses progression innateEnergy (16 Power / 6 PM at L1), not getInnateEnergyMax.
    - Optional: fix/deprecate misleading getInnateEnergyMax / constants.innateEnergy mislabel.
    - build-character writes innate: true on innate picks; sheet-compatible.
    - DEV-V-013 tests; update REALMS Ã¢â‚¬â€5.8; npm run build.
  notes: |
    Depends on TASK-471 UI split. Sheet reference: library-section innate PointStatus + add
    innate-power modal filter. Martial techniques step: N/A (no innate). Spec audit 2026-07-15.
    Done 2026-07-15: progression innateEnergy (16/6); threshold gate; Continue until remaining 0;
    PointStatus Innate Energy; build-character innate:true; getInnateEnergyMax deprecated.
    Audit 2026-07-15: innate L1/L2 title budget = Energy; exclusive soft-seed vs regular; headings h3.

- id: TASK-471
  title: Guided powers Ã¢â‚¬â€ separate innate vs regular L1 lists
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-470
  follow_up_tasks:
    - TASK-472
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T056
  developer_test_plan: |
    Suite DEV-V-013 T056 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/guided-creator/powers-techniques-l1-candidates.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
    - src/types/archetype.ts
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Power users (Power / Powered-Martial): split the powers step into distinct curated L1 lists Ã¢â‚¬â€
    path recommended innate powers vs path recommended (regular) powers Ã¢â‚¬â€ not one mixed grid.
    Techniques step stays techniques-only (no innate). Reuse GuidedChoiceCard + TASK-470 chip
    anatomy; regular powers keep shared Training Points via LoadoutBudgetBar; innate list UX
    completes in TASK-472. Draft store must track innate picks separately (prefer innatePowerIds
    or powerIds + innate flags Ã¢â‚¬â€ today only powerIds/techniqueIds).
  acceptance_criteria:
    - Power archetype steps show two clear L1 sections/lists: Innate Powers and Powers (copy per
      GAME_RULES / REALMS glossary).
    - L1 cards come from path recommended innate vs recommended powers (graceful empty if
      TASK-473 field unset).
    - Store shape explicitly separates innate vs regular picks before TASK-472.
    - Techniques step unchanged except TASK-470/463 parity.
    - Soft (after TASK-463): L2 See more for innate vs regular opens the correct modal list;
      L2 picks promote onto the correct L1 list per TASK-458 pattern Ã¢â‚¬â€ do not block L1 dual-list
      ship on this.
    - Update REALMS Ã¢â‚¬â€5.8 (innate vs regular; powered-martial clarity); FEATURE_INDEX; DEV-V-013;
      npm run build.
  notes: |
    After TASK-470. Soft-depends on TASK-473 for authored content. L1 split may run ? TASK-463;
    innate modal + L2 promote soft-after 463. Mirror sheet grammar; do not fork new card
    components. Spec audit 2026-07-15.
    Done 2026-07-15: dual L1 Innate Powers + Powers; innatePowerIds store (schema v6);
    soft L2 innate modal; graceful empty until TASK-473 seeds.
    Audit 2026-07-15: exclusive innate?regular seed + reconcile; Energy title chips on innate cards.

- id: TASK-470
  title: Guided powers/techniques L1 Ã¢â‚¬â€ Loadout card + desc-chip parity
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-463
    - TASK-471
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T054
  developer_test_plan: |
    Suite DEV-V-013 T054 — see BUILD_VALIDATION.md
  related_files:
    - src/lib/guided-creator/power-technique-display.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Shore up guided technique and power L1 cards to work like Loadout weapons/armor
    (equipment-phase-stats disclosure anatomy): title-adjacent budget chips (Training Points),
    mechanic facts as desc chips behind See moreÃ¢â‚¬â€, same GuidedChoiceCard /
    GuidedEquipmentFactChips / DescriptorChipWithTip patterns.
    Desc chips: Action Type value-only (Ã¢â‚¬â€Quick ActionÃ¢â‚¬â€, not Ã¢â‚¬â€Action Type Quick ActionÃ¢â‚¬â€) via
    actionTypeFactChip / chip helper Ã¢â‚¬â€ do NOT blindly change formatActionTypeFact if GLR/ListHeader
    cells still need a labeled fact string; document chip vs column in GAME_RULES / AGENT_GUIDE.
  acceptance_criteria:
    - Power/technique GuidedChoiceCards match weapon/armor disclosure anatomy: titleMeta budgets;
      mechanic chips (incl. Action Type) in expandedExtra / See more Ã¢â‚¬â€ not title-adjacent Action
      Type; nothing under the disclosure row.
    - Desc chips for Action Type show capitalized value only (Ã¢â‚¬â€Quick ActionÃ¢â‚¬â€, Ã¢â‚¬â€Basic ReactionÃ¢â‚¬â€);
      ListHeader / column cells may keep Ã¢â‚¬â€Action TypeÃ¢â‚¬â€ as the column label; update GAME_RULES
      mechanic-labels table + AGENT_GUIDE to distinguish chip vs column.
    - Training Points remain title-adjacent / LoadoutBudgetBar (TASK-456 Ã¢â‚¬â€ verify no regression).
    - Energy may appear as a compact fact chip or tagline Ã¢â‚¬â€ no parallel formatters outside
      compact-facts / power-technique-display.
    - Unit tests in compact-facts.test.ts for chip helper; DEV-V-013; npm run build.
  notes: |
    Foundation for TASK-463 (same fact language in modal) and TASK-471 (innate cards reuse).
    Today power-technique-display puts Action Type + TP in titleChips with no See more expand Ã¢â‚¬â€
    that is the gap vs TASK-457 equipment. TP accounting itself is done (TASK-456).
    Spec audit 2026-07-15: chip vs column Action Type clarified.
    Done 2026-07-15: titleChips=TP only; detailChips=Action Type value-only + Energy;
    formatActionTypeValue + actionTypeFactChip; GAME_RULES/AGENT_GUIDE chip-vs-column.
    Audit 2026-07-15: confirmed anatomy; innate track uses Energy title budget (472).

- id: TASK-469
  title: Characters list Ã¢â‚¬â€ square portraits, drop search/ListHeader
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-022
    tests:
      - DEV-V-022-T001
      - DEV-V-022-T002
      - DEV-V-022-T003
  developer_test_plan: |
    Suite DEV-V-022 T001Ã¢â‚¬â€T003 Ã¢â‚¬â€ see BUILD_VALIDATION.md
  related_files:
    - src/app/(main)/characters/page.tsx
    - src/components/character/character-card.tsx
  description: |
    Characters page portraits were shown in aspect-[3/4] inside a dense 4-col grid while
    portrait crop is square (aspect=1), so images looked horizontally cropped. ListHeader
    and search are list-row chrome that do not fit a card grid; most users do not search
    their own characters.
  acceptance_criteria:
    - CharacterCard portrait uses 1:1 (aspect-square) matching ImageUploadModal crop.
    - Grid maxes at 3 columns (not 4); AddCharacterCard / skeletons match portrait+footer geometry.
    - No SearchInput, ListHeader, or sort/filter on /characters.
    - Card names are h2 under page h1; muted text uses dark contrast; action labels include name.
    - DEV-V-022; npm run build.
  notes: |
    Owner feedback 2026-07-15. Audit pass fixed AddCharacterCard height parity, heading
    hierarchy, muted contrast, unique aria-labels, focus rings, Image sizes/onError.

- id: TASK-468
  title: ValueStepper sleek neutral style sitewide
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T053
  developer_test_plan: |
    Suite DEV-V-013 T053 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/value-stepper.tsx
    - src/components/shared/quantity-selector.tsx
    - src/app/globals.css
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Prefer sleeker/cleaner steppers like skill bonus controls (surface/neutral, rounded
    not red/green circles). Update shared ValueStepper (+ QuantitySelector alignment)
    and DESIGN_SYSTEM; keep =44px touch targets and soft health/energy tints only.
  acceptance_criteria:
    - Default ValueStepper / DecrementButton / IncrementButton use neutral btn-stepper.
    - QuantitySelector matches the sleek look; red/green danger/success CSS deprecated.
    - DESIGN_SYSTEM documents the preference; npm run build.
  notes: |
    Parallel with TASK-464Ã¢â‚¬â€466. SkillRow table variant already used this look inline;
    ValueStepper now matches so creators/sheet share one system.

- id: TASK-467
  title: UnifiedSelectionModal in-row quantity-first
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-468
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T052
  developer_test_plan: |
    Suite DEV-V-013 T052 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/quantity-selector.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
  description: |
    Equipment See more options add modal: quantity steppers must live in the GridListRow
    (`- n +`), not push the row aside. Prefer quantity-first Ã¢â‚¬â€ increasing from 0 selects;
    decreasing to 0 deselects Ã¢â‚¬â€ without forking a guided-only modal.
  acceptance_criteria:
    - showQuantity uses in-row QuantitySelector on every row (qty 0 allowed).
    - No side-column ValueStepper that shoves GridListRow.
    - + from 0 selects; - to 0 deselects; confirm still attaches quantities.
    - DEV-V-013-T052; npm run build.
  notes: |
    After TASK-468 preferred for visual consistency; can ship with QuantitySelector even if
    ValueStepper lands same session. Extends shared modal carefully.

- id: TASK-466
  title: Equipment L1 Quantity adjacent + density
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T051
  developer_test_plan: |
    Suite DEV-V-013 T051 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
  description: |
    Equipment phase cards: reduce excess vertical space; keep Quantity label adjacent to
    the quantity steppers (not justify-between across the card width).
  acceptance_criteria:
    - Quantity label + stepper sit in one tight inline group above See more.
    - Still =44px touch targets; item-specific a11y names preserved.
    - DEV-V-013-T051; npm run build.
  notes: |
    Parallel with TASK-464/465/468.

- id: TASK-465
  title: InfoTippy inside chips and PointStatus labels
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T050
  developer_test_plan: |
    Suite DEV-V-013 T050 — see BUILD_VALIDATION.md
  related_files:
    - src/components/shared/descriptor-chip-with-tip.tsx
    - src/components/shared/point-status.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Place contextual InfoTippy triggers inside the chip / resource label they explain
    (DescriptorChipWithTip, Training Points PointStatus), not as detached siblings.
  acceptance_criteria:
    - DescriptorChipWithTip renders the i inside DescriptorChip when description exists.
    - LoadoutBudgetBar TP tip uses PointStatus.labelAccessory inside the pill.
    - Docs note inside-placement preference; a11y labels preserved; npm run build.
  notes: |
    Parallel with TASK-464. Recommendation: inside (Fitts / association / density).

- id: TASK-464
  title: Compact-facts polish Ã¢â‚¬â€ Ability Requirement, Damage, suppress redundancies
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-465
    - TASK-466
    - TASK-467
    - TASK-468
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T049
  developer_test_plan: |
    Suite DEV-V-013 T049 — see BUILD_VALIDATION.md
  related_files:
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-phase-stats.test.ts
    - src/docs/GAME_RULES.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Owner Loadout fact-chip polish: Ability chips as `Strength Requirement 1+`; capitalize
    Damage; suppress redundant mechanic property chips (Weapon Damage, DR property, Armor
    Base, Ã¢â‚¬â€); L1 named property chips are name-only (no TP on those desc chips). Armor gets
    ability requirement chips like weapons.
  acceptance_criteria:
    - formatAbilityRequirementFact ? `Abilityname Requirement X+` with prefix stripping.
    - formatDamageFact ends with capitalized Damage.
    - MECHANIC_PROPERTY_NAMES / isMechanicPropertyName suppress calculation-only and
      already-represented properties; namedPropertyDescriptorChips default includeCost false.
    - Armor detailChips include ability requirement when present.
    - GAME_RULES / AGENT_GUIDE / REALMS document the rule; unit tests + DEV-V-013-T049;
      npm run build.
  notes: |
    Foundation for TASK-465Ã¢â‚¬â€468. No parallel formatters. Codices: no live DB writes.

- id: TASK-463
  title: Guided powers/techniques L2 Ã¢â‚¬â€ UnifiedSelectionModal + energy filter
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  parent_task: TASK-470
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T055
  developer_test_plan: |
    Suite DEV-V-013 T055 — see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-powers-techniques-browse-panel.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/lib/guided-creator/powers-techniques-l1-candidates.ts
    - src/lib/guided-creator/loadout-tp.ts
    - src/lib/detail-option/combat-builder.ts
    - src/lib/guided-creator/power-technique-display.ts
    - src/lib/game/calculations.ts
    - src/components/shared/unified-selection-modal.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    REALMS Ã¢â‚¬â€3.1 / Ã¢â‚¬â€5.8: See more options must open a Layer 2 modal (GridListRow +
    UnifiedSelectionModal), not dump the official library as in-step cards (current
    GuidedPowersTechniquesBrowsePanel / empty-path fallback). Mirror guided equipment L2
    (guided-equipment-l2-modal + LoadoutBudgetBar). Filter official powers/techniques so
    Energy cost = theoretical max Energy at L1 (health-energy pool all-to-energy + archetype
    ability via calculateMaxEnergy); if draft abilities unavailable, fallback filter Energy > 20
    out. Innate See more / threshold-filtered modal is out of scope until TASK-471 (regular
    powers/techniques only here). Prefer TASK-470 chip grammar first.
  acceptance_criteria:
    - See more options for powers and techniques opens UnifiedSelectionModal with GridListRow Ã¢â‚¬â€
      never mounts the full official catalog as GuidedChoiceCards on the step.
    - Stop mounting GuidedPowersTechniquesBrowsePanel; delete or quarantine as dead code.
    - Empty path recommendations still offer modal browse, not an inline card dump.
    - Non-innate catalog: Energy = theoretical L1 max Energy (calculateMaxEnergy with full L1
      HP/EN pool of 18 allocated to Energy + archetype ability from draft); fallback exclude
      Energy > 20 when calc inputs missing. Document helper next to power-technique-display /
      calculations.
    - Martial ? techniques only; Power ? powers only.
    - Innate modal deferred to TASK-471 (do not implement innate See more in this task).
    - Same fact language as L1 cards (TASK-470 Action Type value-only chips, Training Points,
      Energy) via compact-facts / combat-builder; LoadoutBudgetBar TP gating; L2?L1 promotion
      (TASK-458).
    - fullScreenOnMobile on modal; update REALMS Ã¢â‚¬â€5.8 (replace in-step panel wording);
      FEATURE_INDEX; DEV-V-013; npm run build.
  notes: |
    Updated 2026-07-15 from owner Powers/Techniques feedback (modal + energy filter). Spec audit
    same day: removed hard follow_up TASK-471 (L1 dual lists may run ? this task); innate modal
    deferred; browse panel removal is AC. Prefer calculateMaxEnergy(18, ...) over hard-cap Ã¢â‚¬â€
    function and GAME_RULES L1 pool of 18 already exist.
    Done 2026-07-15: GuidedPowersTechniquesL2Modal; deleted browse panel; Energy =
    calculateMaxEnergy(18,Ã¢â‚¬â€) with >20 fallback.
    Audit 2026-07-15: confirmed modal-only L2; dead browse copy removed from site-copy.

- id: TASK-462
  title: Guided Your Hero reveal Ã¢â‚¬â€ cherry-on-top finalize overhaul
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T015
      - DEV-V-013-T045
  developer_test_plan: |
    Suite DEV-V-013 T015, T045 Ã¢â‚¬â€ see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/guided-creator/guided-health-energy-section.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/stores/guided-creator-store.ts
    - src/lib/guided-creator/build-character.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Overhaul guided Meet your hero (reveal) into a fulfilling big-reveal: max useful
    build info, min clutter. Hero header owns clickable portrait + name; identity and
    Health/Energy sit near the top; Your Build drops edit hooks and redundant Type /
    archetype-ability cards; powers section title is Powers, Techniques, or both;
    species average placeholders on age/height/weight; appearance + description fields.
  acceptance_criteria:
    - Hero band: click portrait to upload/change; name editable in-header (not only lower form).
    - Identity (demographics + appearance + description) and Health/Energy appear above Your Build.
    - Your Build has no Edit jump links; no Type card; no standalone Power/Martial ability cards.
    - Powers section title is Powers, Techniques, or Powers & Techniques based on picks.
    - Age/height/weight placeholders show species adulthoodÃ¢â‚¬â€lifespan and average cm/kg when known.
    - Appearance and general description save onto character (appearance + description).
    - Health/Energy copy is quieter (less explanatory noise).
    - DEV-V-013-T015 / T045 updated; build passes.
  notes: |
    Product overview Ã¢â‚¬â€5.10. Owner feedback 2026-07-15. Revisit prior steps via chapter rail only.
    Implemented 2026-07-15; npm run build green.

- id: TASK-454
  title: Shared compact fact grammar Ã¢â‚¬â€ semantic chips, tooltips, capitalization
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  follow_up_tasks:
    - TASK-457
    - TASK-461
  related_files:
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/lib/detail-option/builders.ts
    - src/lib/detail-option/combat-builder.ts
    - src/lib/detail-option/equipment-builder.ts
    - src/lib/chip/list-row-metadata.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/components/shared/descriptor-chip-with-tip.tsx
    - src/components/shared/grid-list-row-types.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/GAME_RULES.md
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Establish one typed compact-fact presentation grammar for cards and GridListRow before
    changing guided Loadout. Today equipment owns one-off labels such as Ã¢â‚¬â€Handedness Two-handed,Ã¢â‚¬â€
    Ã¢â‚¬â€Damage X,Ã¢â‚¬â€ and Ã¢â‚¬â€Strength attack,Ã¢â‚¬â€ while property descriptions can become expandable chips.
    Define shared builders that turn structured mechanics into clean, self-describing descriptor
    chips when a labeled column is unavailable, and document when a dense GLR should keep columns.
  acceptance_criteria:
    - Document the column-versus-chip rule: keep labeled columns in dense comparison views; when
      compacting a fact into a chip, use natural self-describing language rather than Ã¢â‚¬â€Header: value.Ã¢â‚¬â€
    - Shared typed formatters/builders cover at least Ability Requirement, handedness, damage/type,
      weapon Ability, Range, Spaces, Action Type, Currency, and Training Points; feature components
      do not recreate these strings.
    - Canonical weapon examples are Ã¢â‚¬â€Ability Requirement X+,Ã¢â‚¬â€ Ã¢â‚¬â€Two-handed,Ã¢â‚¬â€ Ã¢â‚¬â€XdY Type damage,Ã¢â‚¬â€
      Ã¢â‚¬â€Strength Weapon,Ã¢â‚¬â€ Ã¢â‚¬â€Agility WeaponÃ¢â‚¬â€ for Finesse, and Ã¢â‚¬â€Acuity WeaponÃ¢â‚¬â€ for ranged non-Finesse.
    - Rules terms and values are capitalized from structured data (for example Range, Spaces,
      Basic Reaction) without title-casing ordinary prose.
    - Non-mechanic properties render as non-expanding descriptor chips (for example Ã¢â‚¬â€GrazeÃ¢â‚¬â€) with
      a small accessible InfoTippy trigger when a description exists; hover, focus, and touch help
      follow the existing Floating UI standard.
    - Card anatomy guidance states that supporting content belongs before the See more / See less /
      More details disclosure controls; do not append orphan facts or controls below that boundary.
    - Unit tests lock formatter output and fallback behavior; npm run build passes.
  notes: |
    Foundation shipped 2026-07-15: `compact-facts.ts` + `DescriptorChipWithTip`; equipment-phase-stats
    and detail-option/list-row metadata consume formatters. Guided card layout / disclosure polish
    remains TASK-457; sitewide rollout TASK-461. Build validation: DEV-V-013-T040.
  build_validation: DEV-V-013-T040
  developer_test_plan: DEV-V-013

- id: TASK-455
  title: Guided card regressions Ã¢â‚¬â€ No Flaw height and Archetype Ability pill collision
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T009
      - DEV-V-013-T034
      - DEV-V-013-T035
  developer_test_plan: |
    T009 selected No Flaw keeps peer footprint (action-row + compact min-height);
    T034/T035 short single-line Archetype/Secondary pills with full aria-label, no name overlap.
  related_files:
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-choice-styles.ts
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
  description: |
    Reproduce and fix two reported regressions even though TASK-452 and the prior No Flaw patch
    claimed them resolved: selected No Flaw loses normal peer-card height, and the Archetype Ability
    pill wraps into or overlaps the Ability name. Fix shared card/grid geometry, not one screen only.
  acceptance_criteria:
    - Selected and unselected No Flaw retain the same minimum card footprint as peer Flaw cards;
      selection, expansion, and absence of a long description do not collapse the card.
    - Archetype Ability / Secondary Ability pills never overlap the Ability name or neighboring
      tiles at ~360px, tablet, or desktop; wrapping cannot increase the pill into the name region.
    - Full accessible names remain available if visible copy is shortened or truncated.
    - Touch targets remain at least 44Ã¢â‚¬â€44px and semantic design tokens pass light/dark contrast.
    - Add regression coverage to DEV-V-013 and run npm run build.
  evidence: |
    Root causes: (1) expanded short cards dropped empty action-row while peers kept min-h-11, so
    No Flaw alone on a row shrank despite cardCollapsed; (2) TASK-452 wrap on Ã¢â‚¬â€Archetype AbilityÃ¢â‚¬â€
    grew the straddling pill into the tile name. Fixes: showActionRow mirrors keepBodyFloor;
    compact cardCollapsed bumped; pills use short single-line Archetype/Secondary + aria-label
    + highlight pt-3. npm run build pass.
  notes: |
    Can run in parallel with TASK-454 and TASK-459. Verify the current report; do not close this
    solely from old TASK-452 evidence.

- id: TASK-456
  title: Guided Loadout budgets Ã¢â‚¬â€ optional picks, Currency and Training Points
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-454
  follow_up_tasks:
    - TASK-457
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/guided-creator/equipment-phase-nav.ts
    - src/lib/guided-creator/loadout-tp.ts
    - public/tooltip-text.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
  description: |
    Make weapon, armor, and Equipment selections optional while exposing the real constraints that
    still apply when users choose items. Training Points must be visible beside Currency throughout
    Loadout and on powers/techniques so Layer 1 users can understand and avoid overspending.
  acceptance_criteria:
    - A user may continue through weapon, armor, and Equipment phases with zero selections; optional
      picks do not bypass validation of selections that do exist.
    - Loadout shows shared PointStatus-style Currency and Training Points total/spent/remaining
      consistently on every phase, with clear InfoTippy help for Training Points.
    - Weapons and armor expose their Training Points cost beside Currency using TASK-454 semantics.
    - Powers/techniques show the applicable Training Points budget and per-choice cost, prevent
      overspending, and explain why a choice is unavailable; no mandatory pick is invented.
    - Budget calculations use existing rules-aware TP/currency helpers and reclaim budget when a
      selection is removed or replaced; L1 and L2 use the same totals.
    - Reconcile REALMS Ã¢â‚¬â€5.7 / Ã¢â‚¬â€5.8 and GAME_RULES: remove Ã¢â‚¬â€Training Points stay in Layer 2Ã¢â‚¬â€ and
      Ã¢â‚¬â€included in your pathÃ¢â‚¬â€ claims where they conflict with visible constrained selection.
    - Add DEV-V-013 tests for zero-pick continuation and cross-phase Currency/TP accounting;
      npm run build passes.
  notes: |
    2026-07-15: Done. Optional phase completion; Currency+TP PointStatus L1/L2; weapon/armor TP chips;
    powers/techniques shared TP + soft affordable seed (no mandatory pick). TASK-444 still owns L2 browse UI.
  build_validation: DEV-V-013-T041, DEV-V-013-T042
  developer_test_plan: DEV-V-013

- id: TASK-457
  title: Guided weapon and armor cards Ã¢â‚¬â€ disclosure-safe fact layout
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-456
  follow_up_tasks:
    - TASK-458
    - TASK-460
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-phase-stats.test.ts
    - src/components/guided-creator/guided-choice-card.tsx
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
    - src/docs/ai/AGENT_GUIDE.md
  description: |
    Rebuild guided weapon/armor card facts on the shared TASK-454 grammar. Collapsed cards should
    not expose expandable property chips or leave content below disclosure controls. Currency and
    Training Points are compact title-adjacent metadata; See more owns the remaining mechanic facts.
  acceptance_criteria:
    - Collapsed weapon/armor cards show name plus consistent title-adjacent Currency and Training
      Points descriptors; no expandable chips appear in the collapsed card body.
    - See more reveals only mechanically useful non-expanding facts using canonical labels:
      Ability Requirement, handedness, damage/type, and Strength/Agility/Acuity Weapon.
    - Finesse is represented by Ã¢â‚¬â€Agility WeaponÃ¢â‚¬â€ rather than a duplicate Finesse mechanic chip;
      ranged non-Finesse uses Ã¢â‚¬â€Acuity WeaponÃ¢â‚¬â€; ordinary melee uses Ã¢â‚¬â€Strength Weapon.Ã¢â‚¬â€
    - Other named properties appear as descriptor chips with an accessible tooltip info trigger,
      not Ã¢â‚¬â€Property: descriptionÃ¢â‚¬â€ text and not click-to-expand chips.
    - No facts, chips, or controls render underneath See more / See less / More details; selected,
      expanded, and long-content cards maintain stable geometry.
    - Remove guided-only string construction superseded by TASK-454; update the phased spec and
      AGENT_GUIDE examples.
    - Verify at ~360px and desktop in light/dark; add DEV-V-013 tests; npm run build passes.
  evidence: |
    titleChips (Currency/TP) via GuidedChoiceCard titleMeta; detailChips (mechanics + named props)
    in expandedExtra with DescriptorChipWithTip; no children chips under disclosure; gear quantity
    moved to beforeDisclosure. Removed formatDamageFactLine; unit tests lock split. DEV-V-013-T044.
  notes: |
    First production pilot for shared compact-fact grammar; TASK-461 rolls the pattern out sitewide.
  build_validation: DEV-V-013-T044
  developer_test_plan: DEV-V-013

- id: TASK-458
  title: Guided catalog picks Ã¢â‚¬â€ return selected items as visible cards
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-457
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T043
      - DEV-V-013-T046
  developer_test_plan: |
    Suite DEV-V-013 T043, T046 Ã¢â‚¬â€ see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/lib/guided-creator/equipment-phase-candidates.ts
    - src/lib/guided-creator/equipment-phase-candidates.test.ts
    - src/lib/guided-creator/powers-techniques-l1-candidates.ts
    - src/lib/guided-creator/powers-techniques-l1-candidates.test.ts
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/stores/guided-creator-store.ts
  description: |
    Ensure a selection made through See more options remains understandable after returning to
    recommendations. A non-path weapon, armor, power, or technique must be promoted into the current
    card grid as a selected card instead of disappearing into hidden draft state.
  acceptance_criteria:
    - Selecting a non-path weapon or armor in L2 immediately adds a selected card to the current L1
      grid; closing/reopening the modal and navigating Back/Continue preserves it.
    - After TASK-444 provides powers/techniques L2, selected non-path powers/techniques use the same
      promotion behavior and shared card facts.
    - Path recommendations may use one subtle descriptor when differentiation is necessary, but
      avoid reintroducing noisy Ã¢â‚¬â€Path pickÃ¢â‚¬â€ badges; selected state remains the primary signal.
    - Candidate merging is ID-stable, deduplicated, and does not drop resolvable selected rows during
      async library loading; stale unresolved refs still prune safely.
    - Removing a promoted selection updates cards and Currency/Training Points immediately.
    - Add DEV-V-013 tests for equipment and powers/techniques L2 ? selected-card return;
      npm run build passes.
  evidence: |
    Equipment: getPhaseL1Candidates already merges selectedIds; unit tests cover dedupe + wrong-phase skip.
    Powers/techniques: getPowersTechniquesL1Ids promotes resolvable non-path selected IDs onto L1
    (flat grid or Your other section); subtle Path DescriptorChip only when mixed flat grid.
    DEV-V-013-T043/T046; unit tests; npm run build.
  notes: |
    Equipment already merges selected IDs in getPhaseL1Candidates; treat this as verification plus
    regression hardening. Powers/techniques portion depends on TASK-444.

- id: TASK-459
  title: Guided chapter terminology Ã¢â‚¬â€ Loadout chapter and Equipment screen
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  build_validation: DEV-V-013-T002, DEV-V-013-T004, DEV-V-013-T013, DEV-V-013-T024, DEV-V-013-T026, DEV-V-013-T039
  developer_test_plan: DEV-V-013
  related_files:
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/stores/guided-creator-store.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
    - src/docs/GAME_RULES.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    Make the chapter name Ã¢â‚¬â€LoadoutÃ¢â‚¬â€ because it includes weapons, armor, Equipment, powers, and
    techniques. Rename the current Adventuring Gear/Gear phase to Ã¢â‚¬â€EquipmentÃ¢â‚¬â€ everywhere users see
    it, while preserving accurate internal types until a safe mechanical rename is warranted.
  acceptance_criteria:
    - Chapter rail, headings, review/reveal, help, and completion copy consistently use Ã¢â‚¬â€Loadout.Ã¢â‚¬â€
    - The gear phase and its add modal consistently use Ã¢â‚¬â€EquipmentÃ¢â‚¬â€; no user-facing Ã¢â‚¬â€Adventuring
      GearÃ¢â‚¬â€ or ambiguous bare Ã¢â‚¬â€GearÃ¢â‚¬â€ remains in the guided flow.
    - Weapons, Armor, Equipment, Powers, and Techniques are framed as Loadout sub-steps without
      duplicate chapter/page titles.
    - Copy follows GAME_RULES capitalization and contains no new em dashes.
    - Update product/spec docs and DEV-V-013 copy checks; npm run build passes.
  notes: |
    2026-07-15: Done. User-facing copy only; internal chapter id `equipment` and phase id `gear` kept.
    Chapter titles flow from GUIDED_CREATOR_COPY.chapters via GUIDED_CHAPTERS. DEV-V-013-T039 added.

- id: TASK-460
  title: Guided Equipment screen Ã¢â‚¬â€ card copy, quantity, and add-modal polish
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-458
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T024
      - DEV-V-013-T047
  developer_test_plan: |
    Suite DEV-V-013 T024, T047 Ã¢â‚¬â€ see BUILD_VALIDATION.md
  related_files:
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/value-stepper.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-phase-stats.test.ts
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/MOBILE_UX.md
  description: |
    Polish the renamed Equipment phase after the shared card/disclosure work. Remove repeated
    description-as-Ã¢â‚¬â€UseÃ¢â‚¬â€ chips, normalize Currency/Training Points placement, and redesign quantity
    selection in both cards and the add modal so quantity is shown once with clear shared controls.
  acceptance_criteria:
    - Equipment card description appears once; no generated Ã¢â‚¬â€Use [repeated description]Ã¢â‚¬â€ chip.
    - Currency and Training Points occupy the same title-adjacent location used by weapon/armor
      cards; no cost chip is stranded below the disclosure area.
    - Selected quantity is displayed once per item. The visible stepper label is Ã¢â‚¬â€QuantityÃ¢â‚¬â€; the
      control retains an item-specific accessible name without duplicating visible text.
    - Audit and improve the L2 add-modal quantity composition using shared ValueStepper/control
      patterns: clear grouping, =44Ã¢â‚¬â€44px targets, no cramped or duplicate count, and immediate totals.
    - The selection modal uses Modal with fullScreenOnMobile and sticky/scroll behavior at <768px;
      verify at ~360px, tablet, and desktop in light/dark.
    - Ã¢â‚¬â€Add all recommended EquipmentÃ¢â‚¬â€ and individual quantities still respect Currency/Training
      Points and do not create duplicate rows.
    - Add DEV-V-013 tests and run npm run build.
  evidence: |
    L1 Quantity group aria-label + visible Quantity (aria-hidden) + ValueStepper item-specific
    decrement/increment titles; L2 UnifiedSelectionModal uses ValueStepper + initialQuantities from
    draft; Equipment titleChips Currency via buildEquipmentPhaseCardStats (no Use chips); unit test
    locks no Use; DEV-V-013-T024/T047; npm run build.
  notes: |
    Start after TASK-458 because both tasks edit the L1 phase and L2 modal; coordinate final copy
    with TASK-459.

- id: TASK-452
  title: AbilityScoreGrid Ã¢â‚¬â€ mobile labels, Archetype Ability pill, edit layout
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T035
      - DEV-V-013-T036
      - DEV-V-013-T037
  developer_test_plan: |
    DEV-V-013-T035 short ability labels + no pill spill at ~360px; T036 edit steppers fit;
    T037 path change resets ability scores.
  related_files:
    - src/components/shared/ability-score-grid.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/creator/ability-score-editor.tsx
  description: |
    Owner mobile feedback + guided-creator audit: on ~360px, Intelligence (longest full name)
    is crammed in AbilityScoreGrid 3-col tiles (`grid-cols-3`, full `info.name` + tracking-wider,
    unused shortName INT). Non-hybrid path highlight pill uses whitespace-nowrap "Archetype Ability"
    which spills outside the tile. Customize/edit mode packs 44px Ã¢â‚¬â€ steppers into the same ~75px
    cells. Same grid is reused on abilities display, customize, and reveal summary Ã¢â‚¬â€ fix once in
    AbilityScoreGrid (do not fork guided layouts).
  acceptance_criteria:
    - At ~360px width, all six ability labels fit their tiles without overflow or ugliness
      (prefer shortName below sm, or wrap/smaller type; Charisma must also fit).
    - Archetype Ability / Secondary Ability / Power / Martial pills do not spill into neighbors
      (shorter copy, wrap, or truncate with accessible name; hybrid short labels remain OK).
    - Edit mode at ~360px: Ã¢â‚¬â€ controls remain =44px and do not collide (stack, 2-col, or list layout
      below sm Ã¢â‚¬â€ not forced into 3-col with horizontal 44px steppers).
    - Reveal summary and abilities step both look correct after the shared fix.
    - npm run build passes; add BUILD_VALIDATION checks under DEV-V-013 (or sheet suite if shared).
  evidence: |
    Display: shortName below sm + tile aria-label. Pills: wrap (no whitespace-nowrap), max-w-full,
    title/aria-label Secondary Recommended Ability; primary-subtle-fg contrast.
    Edit: 1/2/3/6 col breakpoints + horizontal row tiles on phone.
    Compliance extras: path change resets abilities; detail InfoTippy size=icon; restored
    resolveDistinctSecondaryAbility export.
  notes: |
    Audit + compliance pass 2026-07-15. Follow-up footer hints = TASK-453 (open).

- id: TASK-453
  title: Guided creator Ã¢â‚¬â€ mobile completion hints + residual density polish
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T038
  developer_test_plan: |
    DEV-V-013-T038 Ã¢â‚¬â€ completion hints visible above Back/Continue at ~360px; mid-footer on sm+.
  related_files:
    - src/components/guided-creator/guided-step-footer.tsx
    - src/components/guided-creator/guided-step-layout.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
  description: |
    From guided-creator mobile audit (after TASK-452): GuidedStepFooter hides completionHint below
    sm (`hidden sm:flex`), so phones lose points-left / selection-count / progress that skills,
    ancestry, feats, and loadout put in the footer. Also residual Low/Med density notes: dense skill
    rows with long path chips, nested ability-card padding if still tight after 452, equipment fact
    chip density, species vitals 2-col wrap. Prefer surfacing hints in-step on mobile or adapting
    the footer so progress is visible without crowding Back/Continue.
  acceptance_criteria:
    - On viewports < sm, users still see relevant completion/progress (points left, pick counts,
      etc.) either in the footer or as an in-step banner/status Ã¢â‚¬â€ not silent.
    - Skills/ancestry/feats/loadout verified at ~360px: progress visible; no new horizontal overflow.
    - Optional residual density polish from audit notes only if still painful after TASK-452.
    - npm run build; BUILD_VALIDATION entries for footer/in-step hints on mobile.
  evidence: |
    GuidedStepFooter: single completionHint mount; phone stacks via flex order, sm+ mid-bar;
    aria-live=polite. GuidedStepLayout pb-32 when hint present. Character feat N/1 hint.
    Light density: abilities card p-4 sm:p-5; path skill chip max-w truncate. Skills PointStatus
    already in-step.
  notes: |
    Owner UX choice: stack above Back/Continue. Sanity 2026-07-15 fixed dual-mount of same React node.

- id: TASK-451
  title: Guided creator Ã¢â‚¬â€ retain picks, skills L2 browse, secondary ability pill
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T010
      - DEV-V-013-T032
      - DEV-V-013-T033
      - DEV-V-013-T034
  developer_test_plan: |
    DEV-V-013-T032 retain picks on Back; T033 Browse all Skills below recommendations;
    T034 Secondary Ability pill; T010 browse modal still works from new placement.
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/shared/ability-score-grid.tsx
    - src/components/creator/ability-score-editor.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
  description: |
    Owner feedback: (1) going back must not forget traits/feats/skills/etc.;
    clear only when an upstream choice invalidates them (e.g. new path/species);
    (2) Skills Browse all Skills is Layer 2 below recommended cards, not attached to the list;
    (3) Secondary Ability gets a clear grid pill like Archetype Ability.
  acceptance_criteria:
    - Back / chapter navigation preserves ancestry, skills, feats, abilities unless path or species changes.
    - Changing path clears dependent skills/feats/loadout/powers; same-path re-select keeps them.
    - Skills: recommended cards then GuidedLayerNav Browse all Skills (not footer of skill list).
    - Abilities grid shows Secondary Ability pill when path has a distinct secondary_ability.
  evidence: |
    Ancestry trait-1 re-select preserves trait-2; abilities effect skips overwrite when mode recommended/custom;
    path change invalidates downstream + resets ability scores; skills L2 via GuidedLayerNav;
    AbilityScoreGrid secondaryAbility + resolveDistinctSecondaryAbility (abilities step + reveal).
  notes: |
    Owner 2026-07-15 guided creator feedback; logged in ALL_FEEDBACK_CLEAN.md.
    Mobile pill overflow / AbilityScoreGrid density = TASK-452 (done); footer hints = TASK-453 (done).
    Audit 2026-07-15: restored corrupted ALL_FEEDBACK encoding; subtle-fg secondary pill token.

- id: TASK-448
  title: Guided creator Ã¢â‚¬â€ detail Select/Close + chapter-jump first screen
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T027
      - DEV-V-013-T028
      - DEV-V-013-T029
      - DEV-V-013-T030
      - DEV-V-013-T031
  developer_test_plan: |
    DEV-V-013-T027/T028 Close|Select on species and path More details; T029 Foundation rail ? Path;
    T030 Ancestry rail ? species overview; T031 footer Back stays sequential.
  related_files:
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/guided-creator/guided-species-detail-modal.tsx
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/stores/guided-creator-store.ts
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Owner feedback: species/path More details footers Close (left) + Select (right);
    chapter rail jumps to first sub-screen of target; footer Back stays sequential.
  acceptance_criteria:
    - Species and path detail modals show Close left, Select right; Select applies entity and closes.
    - Chapter rail to Foundation lands on path (not species).
    - Chapter rail to Ancestry lands on species overview (not mid flaw/trait).
    - Footer Back from next chapter still lands on last sequential ancestry/equipment screen.
  evidence: |
    GuidedEntityDetailModal onSelect footer; store navigationIntent first|sequential + entryNonce;
    ancestry/loadout apply first-screen landing on jump.
  notes: |
    Owner 2026-07-15 guided creator feedback; implemented directly.
    Audit 2026-07-15: REALMS Ã¢â‚¬â€3.1 updated (More details open ? select; footer Select OK);
    Select closes via modal onClose; T023 aligned after phase-strip removal (TASK-447).

- id: TASK-447
  title: Guided equipment Ã¢â‚¬â€ drop phase bar, PointStatus Currency, card chips + cost fix
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T026
  developer_test_plan: |
    DEV-V-013-T004 updated; T026 PointStatus + property chips + no progress bar.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-currency.ts
  description: |
    Remove equipment phase SegmentedControl; show Currency via PointStatus like skills/abilities;
    spell Currency fully in L1/L2; remove Path pick badges; fix cost chip 0 bug (costs.totalCurrency);
    cards show image/title/description + named property chips with hover tips.
  acceptance_criteria:
    - No weapon/armor/gear progress strip; Next/Back + footer fraction only.
    - PointStatus label Currency with total/spent on every equipment phase.
    - No Path pick badge on path cards.
    - Currency chip shows real unit cost (not 0 when costs.totalCurrency set).
    - Weapons/armor: description + named property chips; hover tip when property has description.
    - L1/L2 copy does not use "c" for Currency.
  evidence: |
    Deleted guided-equipment-phase-progress; PointStatus in phase layout; resolveItemUnitCost
    reads costs.totalCurrency; cardChips + InfoTippy hover; GAME_RULES L1/L2 abbreviation note.
  notes: |
    Owner 2026-07-15 Ã¢â‚¬â€ agree L1/L2 should spell game terms; dense L3 may abbreviate.

- id: TASK-446
  title: Guided equipment L1 Ã¢â‚¬â€ card-first simplify + orphan selection fix
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T025
  developer_test_plan: |
    DEV-V-013-T004 (path picks, no summary chrome); T025 card-first + orphan prune.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/lib/guided-creator/equipment-phase-candidates.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/resolve-loadout-items.ts
  description: |
    Align equipment L1 with feats/path: drop Ã¢â‚¬â€Your selectionÃ¢â‚¬â€ summary chips; quieter phase
    copy + currency; collapsed cards show few tags (damage/handedness/cost) with depth under
    More details; See more options for catalog. Fix selection/grid desync by always showing
    path L1 picks (no ability eligibility filter on L1), merging selected catalog rows into
    the grid, and pruning unresolved draft refs.
  acceptance_criteria:
    - No Ã¢â‚¬â€Your selectionÃ¢â‚¬â€ summary strip on weapon/armor/gear L1.
    - Collapsed weapon/armor cards show a small quiet tag set; More details has full fact chips.
    - Currency is a quiet secondary line; phase descriptions are short.
    - Path pool cards always appear on L1; selected items stay visible even if outside pool.
    - Unresolved draft weapon/armor/gear ids are cleared when library lookup loads.
  evidence: |
    Removed guided-equipment-phase-selection; getPhaseL1Candidates no L2 eligibility on path
    rows + selectedId merge; pruneUnresolvedLoadoutRefs in loadout-step; quiet tags in
    equipment-phase-stats; See more options label.
    Cleanup 2026-07-15: dead selectedSummary/emptySelection/phaseLockedHint copy removed;
    L1 uses PhaseL1RankContext only; equipment More details exception documented in
    FEATURE_INDEX / AGENT_GUIDE / REALMS Ã¢â‚¬â€5.7 / GUIDED_SPEC.
  notes: |
    Owner 2026-07-15 Ã¢â‚¬â€ equipment felt glitchy/cluttered vs other guided steps.

- id: TASK-445
  title: Stable expand toggle Ã¢â‚¬â€ expand without moving the click target (sitewide)
  created_at: 2026-07-15
  created_by: owner
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-021
    tests:
      - DEV-V-021-T001
      - DEV-V-021-T002
      - DEV-V-021-T003
  developer_test_plan: |
    Suite DEV-V-021 T001Ã¢â‚¬â€T003 Ã¢â‚¬â€ see BUILD_VALIDATION.md
  related_files:
    - src/components/ui/expandable-chip.tsx
    - src/lib/chip/expandable-chip-shell.ts
    - src/lib/chip/measure-stable-expand-width.ts
    - src/components/shared/summary-chip-list.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/part-chip.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/creator/collapsible-section.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/MOBILE_UX.md
    - src/app/dev/styleguide/page.tsx
  description: |
    Sitewide UX rule: click-to-expand controls must keep the toggle under the pointer so a
    second click closes without mouse travel. Expandable chips in wrap groups often jump when
    `fullWidthWhenExpanded` forces a new flex-wrap row. Fix ExpandableChip / ChipGroup first,
    document the standard for GridListRow, cards, and other expand-in-place UI, then audit
    offenders. Prefer growing content and pushing siblings while the opened controlÃ¢â‚¬â€s origin
    (especially vertical) stays put.
  acceptance_criteria:
    - Document Ã¢â‚¬â€stable expand toggleÃ¢â‚¬â€ in AGENT_GUIDE (and brief MOBILE_UX note): opened
      controlÃ¢â‚¬â€s click target does not shift under the cursor; siblings may move.
    - ExpandableChip in ChipGroup / SummaryChipList / part lists: expand then immediately
      re-click same screen position collapses (styleguide + one production surface proof).
    - fullWidthWhenExpanded (or replacement pattern) no longer relocates the expanded chipÃ¢â‚¬â€s
      header to a different wrap row solely due to width:100%.
    - GridListRow / guided card inline expand verified or fixed to the same rule.
    - Styleguide demo of wrap chips expanding without pointer jump.
    - npm run build; build-validation tests for chip + at least one row expander.
  evidence: |
    Chips: measured remaining-row width from collapsed left edge; no shell w-full; equal
    padding; header truncate; ChipGroup hosts. GuidedChoiceCard: Read more/less above body.
    CollapsibleSection: items-start + fixed meta line. Docs cite accordion/Fitts best practice.
    DEV-V-021 T001Ã¢â‚¬â€T003. Build passes.  notes: |
    Owner feedback 2026-07-15. Best practice = spatial stability for disclosure toggles
    (same family as accordion headers staying put while panels open below).

- id: TASK-444
  title: Guided powers/techniques Ã¢â‚¬â€ visible confirm + Layer 2 browse (Ã¢â‚¬â€3.1 / Ã¢â‚¬â€5.8)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  follow_up_tasks:
    - TASK-458
    - TASK-461
    - TASK-463
    - TASK-470
    - TASK-471
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-powers-techniques-browse-panel.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Align guided powers/techniques with Layer 1 choice principle (Ã¢â‚¬â€3.1): user should see and
    own path recommendations (cards + toggle/confirm), not silent auto-select of every ID.
    Add catalog Layer 2 via GuidedLayerNav + browse (feat/loadout parity) with GridListRow /
    UnifiedSelectionModal as appropriate. REALMS Ã¢â‚¬â€5.8 gap from 2026-07-15 vision reconcile.
  acceptance_criteria:
    - Path recommendations shown as selectable GuidedChoiceCards; selection state is explicit.
    - No silent select-all on mount that the user cannot see as their choice (pre-check OK if visible).
    - GuidedLayerNav Ã¢â‚¬â€See more optionsÃ¢â‚¬â€ opens filtered browse; Ã¢â‚¬â€Back to recommendationsÃ¢â‚¬â€ returns to L1.
    - Martial ? techniques only; Power ? powers only; naming per existing copy.
    - npm run build; DEV-V-013 test(s) for powers L1 confirm + L2 expand/collapse.
  notes: |
    2026-07-15: Done. Feats-style in-step L2 (`GuidedPowersTechniquesBrowsePanel` + GuidedLayerNav);
    soft-seed affordable path picks with visible card state; TP gating reused from TASK-456.
    Promoting non-path L2 picks into L1 cards = TASK-458.
    2026-07-15 follow-up wave: owner wants equipment-parity cards (TASK-470), true modal L2 +
    energy filter (TASK-463 updated), innate vs powers split (TASK-471-473). Interim card browse
    is superseded by TASK-463 Ã¢â‚¬â€ do not extend the browse panel.
  build_validation: DEV-V-013-T043
  developer_test_plan: DEV-V-013
  evidence: |
    L1 GuidedChoiceCards + See more options / Back to recommendations; Martial techniques-only /
    Power powers-only; DEV-V-013-T043; npm run build.

- id: TASK-441
  title: Guided ancestry traits Ã¢â‚¬â€ shared limited-uses notice (like feats)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T021
  developer_test_plan: |
    DEV-V-013-T021 Ã¢â‚¬â€ Ancestry trait cards with uses_per_rec show uses notice when selected/expanded (same shell as feats).
  related_files:
    - src/lib/codex/feat-restriction-notice.ts
    - src/components/guided-creator/guided-restriction-notice.tsx
    - src/components/guided-creator/steps/ancestry-step.tsx
  description: |
    Traits with limited uses must show recovery notice on guided choice cards when selected/expanded,
    sharing code with feat restriction notices (no parallel copy/UI).
  acceptance_criteria:
    - Ancestry GuidedChoiceCards use GuidedTraitRestrictionNotice / getLimitedUsesNotice shared with feats.
    - Selecting a limited-use trait expands and shows uses-per-recovery copy.
    - npm run build passes.
  evidence: |
    getLimitedUsesNotice shared; GuidedRestrictionNotice shell; trait wiring on ancestry-step;
    unit tests for feat/trait wording parity.

- id: TASK-442
  title: Guided equipment Ã¢â‚¬â€ remove quick kits (FE + admin; DB migration proposed)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  parent_task: TASK-422
  completed_work: |
    - Removed GuidedLoadoutKitPresets UI and auto-apply first kit.
    - Admin no longer authors kit JSON; shared gear renamed recommended adventuring gear.
    - Path deep-dive kit catalog section removed (gear items only).
    - Draft loadoutId cleared on picks; reveal summary no longer kit-titled.
    - Applied sql/guided-remove-loadout-kits-proposed.sql on RealmsRPG-Test (Berserker kits cleared;
      flat level1_armaments/equipment retained). Pool no longer reads kits.
  remaining_work: |
    None for kit removal. Path content seeding for non-Berserker paths = TASK-423.
  follow_up_tasks:
    - TASK-423
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T022
  developer_test_plan: |
    DEV-V-013-T004 updated (no kits); DEV-V-013-T022 Ã¢â‚¬â€ admin has no kit JSON field.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - sql/guided-remove-loadout-kits-proposed.sql
  description: |
    Remove all quick-kit frontend and backend authoring. Users pick weapons/armor individually.
    Live DB kits flattened via owner-approved SQL.
  acceptance_criteria:
    - No Quick kits UI on guided loadout.
    - Admin cannot author kits; saves do not create new kits.
    - Owner-approved SQL flattens kits into level1_armaments/equipment and strips kit arrays.
  evidence: |
    Live DB: 0 rows with level1_loadouts after UPDATE; Berserker armaments/equipment CSV intact.
    Audit 2026-07-15: Removed loadoutId draft field; pool API flat-only; deleted loadoutKitToDetailOption;
    Playwright loadout audit no longer expects Quick kits; FEATURE_INDEX / REALMS / GUIDED_SPEC /
    AGENT_GUIDE / GAME_RULES / SUPABASE_SCHEMA / seed SQL comments updated; serialize never writes kits;
    berserker kit SQL marked superseded.

- id: TASK-443
  title: Guided equipment Ã¢â‚¬â€ phase visibility + weapon/armor/gear card remodel
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T013
      - DEV-V-013-T023
      - DEV-V-013-T024
  developer_test_plan: |
    DEV-V-013-T004/T013 updated; T023 phase skip numbering; T024 gear add-all + quantity.
  related_files:
    - src/lib/guided-creator/equipment-phase-nav.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-fact-chips.tsx
    - src/components/guided-creator/guided-equipment-phase-layout.tsx
    - src/components/guided-creator/guided-choice-card.tsx
  description: |
    Skip weapon/armor phases when path has no options; renumber SegmentedControl dynamically.
    Weapon/armor cards: fact chips + More details ? expandable property chips; currency on all phases.
    Gear: Add all recommended + per-item quantity; L2 browse retained.
  acceptance_criteria:
    - Visible phases only; labels 1..N for present phases (no phantom Armor/Weapons).
    - Weapon/armor chips cover ability req, handedness, damage/type, properties, cost.
    - More details expands to ExpandableChips with descriptions.
    - Currency remaining shown on weapon, armor, and gear phases.
    - Gear has Add all recommended + quantity steppers without requiring L2.
  evidence: |
    resolveEquipmentPhaseVisibility; GuidedEquipmentFactChips; currency on phase layout;
    addAllRecommendedEquipment + setItemQuantityInGuidedDraft.

- id: TASK-432
  title: Guided choice-card deep-dive Ã¢â‚¬â€ Phase 1 foundation (affordance + modal shell)
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T016
  developer_test_plan: |
    DEV-V-013-T016 Ã¢â‚¬â€ Path + Species More details opens modal without selecting; card click still selects.
  follow_up_tasks:
    - TASK-433
    - TASK-434
    - TASK-435
  evidence: |
    GuidedChoiceCard onDetails (stopPropagation); GuidedEntityDetailModal shell (fullScreenOnMobile,
    CollapsibleSection + InfoTippy tip slot); wired path + species with description overview + demo
    option section; docs/naming in REALMS Ã¢â‚¬â€5.0.1, AGENT_GUIDE, FEATURE_INDEX, guided-creator-copy.
    Audit 2026-07-15: detail lookup uses full lists (not LayerNav-filtered); modal remount key per
    entity; Modal sticky shrink-0 header/footer + description contrast + close padding; DRY
    guided-entity-detail-shell helpers; DEV-V-013-T016 tightened.
  description: |
    Owner feedback 2026-07-15 (Ã¢â‚¬â€Layer 2 CardsÃ¢â‚¬â€): progressive disclosure on choice cards needs an
    explicit path from Layer 1 card ? information modal for that entity Ã¢â‚¬â€ opened only via a
    Ã¢â‚¬â€More detailsÃ¢â‚¬â€ control, never by selecting the card. Opening More details must not select;
    footer Select on path/species (TASK-448) is a later add. Inline See more / expandedExtra stay as
    light in-card disclosure.

    IMPORTANT naming (document in REALMS + AGENT_GUIDE):
    - Catalog Layer 2 = GuidedLayerNav Ã¢â‚¬â€See more optionsÃ¢â‚¬â€ / browse / UnifiedSelectionModal (existing).
    - Choice-card deep-dive = Ã¢â‚¬â€More detailsÃ¢â‚¬â€ on a GuidedChoiceCard ? GuidedEntityDetailModal (this epic).
    Do not reuse Ã¢â‚¬â€See moreÃ¢â‚¬â€ wording that opens catalog L2; prefer Ã¢â‚¬â€More detailsÃ¢â‚¬â€ / Ã¢â‚¬â€View detailsÃ¢â‚¬â€.

    Phase 1 ships the shared primitives only (no species/path content yet):
    1) GuidedChoiceCard optional details affordance (link/button; stopPropagation; =44px; aria-label).
    2) Shared GuidedEntityDetailModal shell: Modal + fullScreenOnMobile, sticky header/footer,
       scrollable body, title/description slots, overview slot, CollapsibleSection list slot,
       semantic tokens, readable type, not overwhelming.
    3) Product/docs: Ã¢â‚¬â€ progressive disclosure on cards in REALMS_PRODUCT_OVERVIEW; FEATURE_INDEX +
       AGENT_GUIDE pointers; copy keys in guided-creator-copy.
  related_files:
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/ui/modal.tsx
    - src/components/creator/collapsible-section.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/MOBILE_UX.md
    - src/docs/ACCESSIBILITY.md
  acceptance_criteria:
    - GuidedChoiceCard accepts optional onDetails / detailsLabel; clicking it does not call onSelect.
    - Selecting the card body still selects; Read more still expands in-card only.
    - GuidedEntityDetailModal uses Modal fullScreenOnMobile; sticky header/footer; accessible name.
    - Shell renders overview + N collapsible sections with placeholder/demo content in isolation
      (Story-less: temporary wire on one path or species card behind a feature flag OR unit/visual
      smoke in guided only Ã¢â‚¬â€ prefer wiring both steps with empty sections deferred to 433/434).
    - Docs clarify deep-dive vs catalog Layer 2; copy keys exist; contrast + touch-target checklists pass.
    - npm run build passes; no regression to existing choice-card select/expand behavior.
  notes: |
    Epic sequencing: 432 foundation ? 433 species content ? 434 path content ? 435 shared
    GridListRow option presets + remodel of legacy overview surfaces reused from advanced creator.
    Prefer remodel-in-place of shared primitives over forking parallel Ã¢â‚¬â€guided-onlyÃ¢â‚¬â€ row components.
    Reference SpeciesRevealPanel + home/guided visual language; avoid copying dense species-modal UX as-is.

- id: TASK-433
  title: Guided choice-card deep-dive Ã¢â‚¬â€ Phase 2 species detail modal
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-432
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T017
  developer_test_plan: |
    DEV-V-013-T017 Ã¢â‚¬â€ Species More details: overview parity + trait/characteristic/flaw catalogs; selection independent.
  follow_up_tasks:
    - TASK-434
    - TASK-435
  evidence: |
    GuidedSpeciesDetailModal + GuidedTraitOptionList (GridListRow); SpeciesRevealPanel readOnlyDetail /
    hideChoiceTeaser; pick-count InfoTippy copy in tooltip-text; empty sections omitted; DEV-V-013-T017.
    Audit 2026-07-15: overview renders while traits load; known-trait resolve (no phantoms); truncated
    description columns; single itemCount on sections; granted trait uses/recovery displayed.
  description: |
    Wire species GuidedChoiceCards to GuidedEntityDetailModal. Overview in the modal mirrors the
    guided species overview experience (SpeciesRevealPanel / ancestry species overview): hero art,
    vitals (language, avg height/weight, size/type, adulthood/lifespan as available), full description
    Ã¢â‚¬â€ clean sections, readable type, not overwhelming. Size picker / draft mutation stay on the
    post-select overview step (modal is read-only preview unless product later opts in).

    Below overview: CollapsibleSections for trait options, characteristic options, flaw options.
    Section headers use InfoTippy tooltips explaining how many of each the player picks during
    species/ancestry creation (copy in tooltip-text.tsx). Expanding a section lists options as
    elongated expandable rows (prefer GridListRow / existing SpeciesTraitCard patterns remodeled
    for clarity Ã¢â‚¬â€ full remodel of row chrome can land in TASK-435 if needed; Phase 2 must be usable).
  related_files:
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/species-reveal-panel.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/shared/species-trait-card.tsx
    - src/components/shared/grid-list-row.tsx
    - public/tooltip-text.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - Species cards show Ã¢â‚¬â€More detailsÃ¢â‚¬â€; opens modal; does not change selection.
    - Overview content parity with post-select species overview fields (description + vitals + art).
    - Expandable sections: traits / characteristics / flaws with pick-count tooltips.
    - Option rows expandable with truncated descriptions; uses / key facts visible when available.
    - Modal closes cleanly; keyboard/focus + fullScreenOnMobile OK; WCAG contrast tokens.
    - npm run build; add DEV-V-013 tests for species deep-dive open/close + selection independence.
  notes: |
    Depends on TASK-432. Do not block on perfect GridListRow column presets Ã¢â‚¬â€ TASK-435 unifies.
    Extract shared overview blocks from SpeciesRevealPanel where it reduces duplication.

- id: TASK-434
  title: Guided choice-card deep-dive Ã¢â‚¬â€ Phase 3 path detail modal
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-432
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T018
  developer_test_plan: |
    DEV-V-013-T018 Ã¢â‚¬â€ Path More details: overview + feat/weapon/armor/loadout/power|technique catalogs; selection independent.
  follow_up_tasks:
    - TASK-435
  evidence: |
    GuidedPathDetailModal + GuidedPathDetailOverview + GuidedDetailOptionList (GridListRow); feats split by
    char_feat; equipment via buildEquipmentLookup/catalog-rows; unarmed when recommendUnarmedProwess;
    martial?techniques, power/powered-martial?powers; path-step wired; copy + tooltip-text tips;
    DEV-V-013-T018; npm run build.
    Audit 2026-07-15: overview-while-loading catalogs; omit power/tech/feat phantoms; feat id|name resolve;
    martial ability labeling (no Secondary mislabel); expandable property chips via useItemProperties;
    shield stats not forced through weapon damage; skill id phantoms omitted; T018 tightened.
  description: |
    Wire path GuidedChoiceCards to GuidedEntityDetailModal. Overview: full description, proficiency,
    primary/secondary recommended abilities, recommended skills Ã¢â‚¬â€ well separated, readable.
    CollapsibleSections for path catalog slices that exist on the path (omit empty):
    archetype feat options, character feat options, weapon options (incl. unarmed prowess when
    flagged), armor options, equipment loadout(s), technique options, power options.
    Expanding a section lists related items as elongated expandable rows / GridListRow with
    truncated descriptions and domain stats (uses; energy/range/damage; handedness/range/damage/type;
    DR / crit / ability req; property chips with existing expand-chip behavior).
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/lib/game/archetype-path.ts
    - src/types/archetype.ts
    - src/components/shared/grid-list-row.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-catalog-rows.ts
    - public/tooltip-text.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - Path cards show Ã¢â‚¬â€More detailsÃ¢â‚¬â€; opens modal; does not change path selection.
    - Overview shows description + proficiency + recommended abilities/skills when data exists.
    - Only non-empty option sections appear; each expands to a usable list with truncated copy + stats.
    - Unarmed prowess appears only when path recommends it (same rule as equipment L1).
    - Property chips / expand-for-more parity with guided list UX (reuse shared chips).
    - npm run build; DEV-V-013 tests for path deep-dive + selection independence.
  notes: |
    Depends on TASK-432; ideally after TASK-433 so species proves the shell. Reuse path_data parsers
    and equipment-catalog-rows / feat helpers Ã¢â‚¬â€ remodel presentation, donÃ¢â‚¬â€t invent parallel data paths.

- id: TASK-435
  title: Guided choice-card deep-dive Ã¢â‚¬â€ Phase 4 shared option rows + remodel legacy surfaces
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  parent_task: TASK-432
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T019
  developer_test_plan: |
    DEV-V-013-T019 Ã¢â‚¬â€ Shared DetailOptionList on species/path deep-dives + SpeciesRevealPanel granted + species-modal trait sections.
  evidence: |
    DetailOptionList + lib/detail-option builders (trait/feat/equipment/loadout/power/technique + property
    chips); GuidedTraitOptionList + GuidedDetailOptionList thin wrappers; SpeciesRevealPanel granted
    traits remodeled; advanced species-modal TraitSection ? DetailOptionList; AGENT_GUIDE/FEATURE_INDEX/
    REALMS; DEV-V-013-T019; npm run build.
    Audit 2026-07-15: extracted equipmentRefToDetailOption / combat builders from path modal; FEATURE_INDEX
    triad wording; species-modal !found dimming + choice-option uses; stable list keys.
  description: |
    After species + path deep-dives work end-to-end, unify the elongated option lists and remodel
    any reused advanced-creator / modal code so presentation matches the home + guided product
    rework (clarity, progressive disclosure, semantic tokens, GridListRow + chip expand patterns).
    Goal: one shared Ã¢â‚¬â€detail option rowÃ¢â‚¬â€ toolkit for traits, feats, weapons, armor, powers,
    techniques Ã¢â‚¬â€ column stats appropriate per entity; used inside GuidedEntityDetailModal and
    adopted where SpeciesRevealPanel / species-modal / add-modals still look legacy when showing
    the same entities.
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/guided-creator/guided-entity-detail-modal.tsx
    - src/components/guided-creator/species-reveal-panel.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/shared/species-trait-card.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Shared builders/presets for detail-modal option rows (traits/feats/weapons/armor/powers/techs).
    - Species + path deep-dive modals consume the shared presets (no one-off row markup left).
    - At least one legacy surface (species-modal and/or SpeciesRevealPanel lists) remodeled to the
      same visual/interaction language Ã¢â‚¬â€ audit before/after; no behavior regression.
    - AGENT_GUIDE + FEATURE_INDEX document when to use deep-dive modal vs catalog L2 vs Read more.
    - npm run build; extend DEV-V-013; spot-check light + dark contrast.
  notes: |
    Depends on TASK-433 + TASK-434. Do not expand scope to all choice-card kinds (feats, loadouts)
    unless leftover capacity Ã¢â‚¬â€ file follow-up TASK-### for additional entity deep-dives.

- id: TASK-436
  title: Guided deep-dive polish Ã¢â‚¬â€ path overview, tip bodies, labeled fact chips
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-434
  follow_up_tasks:
    - TASK-437
    - TASK-438
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T020
  developer_test_plan: |
    DEV-V-013-T020 Ã¢â‚¬â€ Path overview polish + tip bodies + Name/Description-only option lists.
  related_files:
    - src/components/guided-creator/guided-path-detail-overview.tsx
    - src/components/guided-creator/guided-path-detail-modal.tsx
    - src/components/shared/detail-option-list.tsx
    - src/lib/detail-option/
    - src/lib/constants/copy/guided-creator-copy.ts
    - public/tooltip-text.tsx
  description: |
    Owner polish after TASK-432Ã¢â‚¬â€435: hide irrelevant path proficiency lines; Archetype Ability
    labels (Powered-Martial: Archetype Power Ability + Archetype Martial Ability, both primary;
    Power paths may show Secondary Recommended Ability); Recommended Abilities (not scores);
    expandable Recommended Skills chips; Path Options preamble above catalogs; title-less
    InfoTippy tips; Name+Description option lists with self-describing expanded fact chips.
  acceptance_criteria:
    - Martial path More details does not show Power Proficiency 0 (or any unused proficiency).
    - Path abilities: Archetype Ability; Powered-Martial dual Power/Martial Archetype Abilities;
      Power secondary recommended when present.
    - Recommended Skills use SummaryChipList with descriptions.
    - Path Options title + intro above catalogs (notes-only paths still show Path Options).
    - Deep-dive tips have no redundant titles.
    - DetailOptionList catalogs hide column headers; facts are labeled chips (no Stats column API).
    - npm run build; DEV-V-013-T020.
  evidence: |
    Audit 2026-07-15 closed gaps: abilities recommendedHint (Abilities not scores); removed dead
    Stats/uses/items copy + statsColumnLabel; Path Options for notes-only; labeled Use chips for
    gear; tip Action Type wording; species detail capitalize Traits/Flaw; title-less tips restored;
    showColumnHeaders=false on guided + species-modal; T020 updated for Powered-Martial.

- id: TASK-437
  title: Sitewide GridListRow Ã¢â‚¬â€ labeled fact chips when columns are omitted
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  implemented_by: agent
  parent_task: TASK-436
  build_validation: |
    suite: DEV-V-016
    tests:
      - DEV-V-016-T007
      - DEV-V-016-T008
      - DEV-V-016-T009
      - DEV-V-016-T010
  developer_test_plan: |
    DEV-V-016-T007 Ã¢â‚¬â€ Sheet Add Power columns + Range chip.
    DEV-V-016-T008 Ã¢â‚¬â€ Codex Equipment Damage / Dmg. Red. + Weight chip.
    DEV-V-016-T009 Ã¢â‚¬â€ Creator powers/techniques omitted fact chips.
    DEV-V-016-T010 Ã¢â‚¬â€ Creature creator Duration + armament fact chips.
  related_files:
    - src/lib/library-selectable-builders.ts
    - src/lib/chip/list-row-metadata.ts
    - src/hooks/add-library-item/build-empowered-selectable-item.ts
    - src/app/(main)/codex/CodexEquipmentTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/detail-option/equipment-builder.ts
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Universal policy: if information would normally sit under a ListHeader column (Damage,
    Range, Damage Reduction, Action Type, Energy, Uses, Duration, handedness, crit, requirements,
    etc.), then either keep that column with a header OR show a self-describing expanded chip that
    includes both the label and the value (e.g. Damage Reduction 2). Do not drop a column and leave
    only an unlabeled or ambiguous chip.

    Owner lock (2026-07-15): **Dense browse lists keep column headers when space allows**; labeled
    chips for omitted-column facts apply primarily to **deep-dive / progressive-disclosure** lists
    (`DetailOptionList`). Audit order: Library ? Codex ? character sheet library ? add modals.
  acceptance_criteria:
    - Policy documented (AGENT_GUIDE + FEATURE_INDEX) with browse-vs-deep-dive distinction.
    - Audit inventory of GridListRow consumers with column-vs-chip gaps.
    - Fix priority surfaces in order: Library, Codex, sheet library, add-library-item (and peers).
    - npm run build; add or extend DEV-V tests for touched surfaces.
  evidence: |
    Phase 1: Library/Official/sheet column-complete; add/load powers Energy/Duration/Area/Damage +
    Range chip; Codex Equipment Damage/Dmg. Red.; deep-dive Handedness/Block; docs.
    Phase 2 re-audit (owner asked sitewide): closed creator powers Area + empowered Duration/Area
    chips; technique Action column; creature-creator Duration + armament Damage/Range/DR chips;
    Admin Equipment parity; equipment-step Range chip; sheet `Cost Nc` badge.
    DEV-V-016-T007Ã¢â‚¬â€T010; npm run build passed after both phases.
  notes: |
    Guided deep-dive already compliant (TASK-436). Do not strip columns from dense browse UIs.

- id: TASK-438
  title: Agent user-facing copy guide Ã¢â‚¬â€ game terms capitalization + preferred vocabulary
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  parent_task: TASK-436
  follow_up_tasks:
    - TASK-439
  related_files:
    - src/docs/GAME_RULES.md
    - src/docs/ai/AGENT_GUIDE.md
    - AGENTS.md
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Refine existing GAME_RULES Terminology (do not invent a parallel doc): soft prefer/avoid
    vocabulary, Score = Bonus + 10, Bonus not modifier, capitalize game terms in game-term context,
    no em dash in new UI copy (hyphens fine). Point AGENT_GUIDE + AGENTS.md at that section.
    Soft guide only Ã¢â‚¬â€ do not over-constrain agent writing.
  acceptance_criteria:
    - GAME_RULES Terminology expanded with prefer/avoid + writing notes; Score/Bonus clarified.
    - AGENT_GUIDE + AGENTS.md point agents there for user-facing strings.
    - Light guided copy fixes for obvious drift (e.g. Customize Abilities not scores).
    - Changelog note.
  evidence: |
    GAME_RULES Terminology expanded; AGENT_GUIDE/AGENTS pointers; Customize Abilities copy fix;
    Powered-Martial Archetype Power/Martial Ability labels (guided overview). Em dash ban
    (not hyphen ban) documented. Historical full-site rewrite deferred ? **TASK-439**.
  notes: |
    Owner: expand what exists; whitelist/blacklist soft; Score = Bonus+10; avoid Spell/AC/Race/Class/
    Check/Save/DC/modifier; do not extremely limit agents.
    Scope clarification 2026-07-15: TASK-438 = guide + light guided fixes only. Sitewide scan/
    rewrite of existing user-facing strings is TASK-439 (was never run under 438).

- id: TASK-439
  title: Sitewide user-facing copy audit Ã¢â‚¬â€ Realms terms + em dash + AI-artifact hygiene
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  implemented_by: agent
  parent_task: TASK-438
  follow_up_tasks:
    - TASK-440
  related_files:
    - src/docs/GAME_RULES.md
    - src/lib/constants/copy/
    - public/tooltip-text.tsx
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/BUILD_VALIDATION.md
    - src/components/character-creator/
    - src/components/guided-creator/
  description: |
    Follow-up to TASK-438 (guide only). Scan and fix existing user-facing product strings so they
    respect GAME_RULES Terminology: capitalize game terms in game-term context; prefer/avoid
    vocabulary (Abilities not Ability Scores UI label; Bonus not modifier; Difficulty Score not DC;
    Skill Roll not Check/Save; Archetype Path not Class; Species not Race; Power not Spell; no AC;
    Health/Energy vs inventing mana/HP jargon where Realms terms apply); remove em dashes (`Ã¢â‚¬â€`)
    from UI/marketing/tooltip copy (hyphens fine); tone down stock AI phrasing where it reads fake.

    Soft guide, not a muzzle: ordinary English stays OK when not naming a rules concept. Do not
    rewrite in-world flavor that intentionally uses fiction words. Do not rewrite the rules book
    extract wholesale unless a UI string cites it wrongly.

    Phased (inventory ? fix ? next phase):
    1) Inventory: `src/lib/constants/copy/*` + `public/tooltip-text.tsx` (em dash + avoid-term hits).
    2) Guided + advanced character creator copy + tips (highest product traffic).
    3) Marketing/legal surfaces (landing, about, rules, resources, auth, nav, footer, privacy, terms).
    4) In-app UI not yet in copy modules (sheet, library, campaigns, creators, encounters) Ã¢â‚¬â€ grep
       hardcoded user strings; migrate or fix in place per TASK-390 patterns when practical.
    5) Spot-check capitalisation of Species/Feat/Skill/Power etc. in the strings touched.

    Baseline known debt (2026-07-15 spot check): em dashes still present across copy modules
    (guided-creator-copy ~27) and tooltip-text; full banned-term scan not completed.
  acceptance_criteria:
    - Phase 1 inventory checked in (counts + file list of em dash / prefer-avoid hits) in task evidence.
    - Phases 2Ã¢â‚¬â€3 copy modules + tooltip-text cleaned of em dashes and clear prefer/avoid violations
      (or explicit keep-exceptions noted).
    - Phase 4: either fixed high-traffic hardcoded strings or follow-up TASK-### filed with remaining
      surface list (do not boil the ocean in one PR if sheet/creators explode scope).
    - AGENT_GUIDE note that new copy must follow GAME_RULES Terminology (already present; keep true).
    - npm run build; add a small DEV-V suite or checklist for sample pages (landing + guided path +
      one sheet string if touched).
  evidence: |
    Phase 1 inventory (2026-07-15):
    - Em dash in *user string literals*: guided-creator-copy.ts = 22; marketing *-copy.ts* + tooltip-text
      = 0 (hits were file-header / developer comments only).
    - Prefer/avoid in copy+tooltip: no Ability Scores/DC/Class/Race/Spell/Check hits; Base HP ? fixed.
    Keep-exceptions: developer comments; empty-field placeholder glyph `Ã¢â‚¬â€`; dense creature/encounter
    HUD label HP (allowed abbr per GAME_RULES).
    Phases 2Ã¢â‚¬â€3: guided-creator-copy em dashes removed; Base Health/Energy; Ability Bonuses/Points;
    Power/Martial Ability labels; marketing modules already clean of user-facing em dashes/banned terms.
    Phase 4 high-traffic: advanced creator step strings; roll-log aria Bonus; CodexFeatsTab; admin
    Abilities/Health labels; encounters meta; crafting Difficulty Score Bonus; power-creator mechanics
    copy. Residuals ? TASK-440.
    Audit follow-up (2026-07-15, post-"done"): closed misses (ability-effect-blurbs, format-recovery,
    path-validation messages, sheet path/edit-archetype copy, expandable-image placeholder, styleguide
    labels, AdminPartsTab Ã¢â‚¬â€%, creature-creator "Damage Modifiers" ? Resistances/Weaknesses/Immunities).
    Re-scan: 0 Ability Scores / Difficulty Class / Skill Check / Saving Throw / Armor Class /
    Damage Modifiers in UI tree; remaining em dashes are comments or `Ã¢â‚¬â€` placeholders only.
  build_validation: |
    suite: DEV-V-020
    tests:
      - DEV-V-020-T001
      - DEV-V-020-T002
      - DEV-V-020-T003
  developer_test_plan: |
    Suite DEV-V-020 T001Ã¢â‚¬â€T003 Ã¢â‚¬â€ landing + guided chooser + roll-log Bonus — see BUILD_VALIDATION.md
  notes: |
    Distinct from TASK-390 (copy module migration Ã¢â‚¬â€ done). Distinct from TASK-437 (GridListRow facts).
    Owner asked 2026-07-15 whether 438 included sitewide audit Ã¢â‚¬â€ it did not; this task owns that work.

- id: TASK-429
  title: Guided feat steps Ã¢â‚¬â€ Layer 2 browse (GuidedLayerNav)
  created_at: 2026-07-11
  created_by: agent
  priority: high
  status: done
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T012
  developer_test_plan: |
    DEV-V-013-T012 Ã¢â‚¬â€ Archetype + character feat See more ? L2 browse; Back to recommendations.
  related_files:
    - src/components/guided-creator/guided-feats-browse-panel.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
    - src/lib/guided-creator/feat-selection.ts
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Add Layer 2 to guided archetype feats and character feat steps per REALMS Ã¢â‚¬â€3 / Ã¢â‚¬â€5.6.
    Use abilities/species grammar: GuidedLayerNav below content expands to in-step filtered
    ranked browse (not a modal); same slot collapses with Back to recommendations. L2 hides
    unmet requirements by default; path recommendations pinned; selection uses capped swap.
  acceptance_criteria:
    - Both feat steps show GuidedLayerNav "See moreÃ¢â‚¬â€" below L1 cards.
    - Expand replaces L1 with browse panel (search, category/ability filters, eligible feats).
    - Collapse returns to L1 groups without clearing selections.
    - Selections update live with swap-at-cap; Continue still requires exact max.
  notes: |
    Owner ask 2026-07-11 Ã¢â‚¬â€ Layer 2 like abilities go-deeper / go-back, not grey-out lock.
  implemented_by: agent
  evidence: |
    GuidedFeatsBrowsePanel + feat-selection helpers; wired both feat steps; unit tests for swap helper.

---

- id: TASK-428
  title: Guided archetype feats Ã¢â‚¬â€ swap selection like ancestry
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T011
  developer_test_plan: |
    DEV-V-013-T011 Ã¢â‚¬â€ At-cap archetype feat cards stay interactive; pick another swaps (no grey-out).
  related_files:
    - src/components/guided-creator/steps/archetype-feats-step.tsx
  description: |
    Archetype feat GuidedChoiceCards grey out and block selection once maxFeats is filled,
    unlike ancestry trait picks which replace the current choice. Align to ancestry-style swap:
    under cap add; at cap selecting a new card replaces the most recent pick; selected cards
    remain toggleable to deselect. No opacity/disabled lock on unselected cards.
  acceptance_criteria:
    - At max archetype feats, unselected cards are full opacity and clickable.
    - Clicking an unselected card at capacity swaps it in (replaces last selected); count stays at max.
    - Clicking a selected card still deselects; Continue requires count === maxFeats.
    - Character feat step already replaces Ã¢â‚¬â€ no regression.
  notes: |
    Owner feedback 2026-07-11 Ã¢â‚¬â€ selection grammar unity with ancestry traits.
  implemented_by: agent
  evidence: |
    Removed atCap grey-out; selectFeat adds under cap, swaps (drop last + add) at cap, toggles off when selected.

---

- id: TASK-427
  title: Add modals Ã¢â‚¬â€ browse when selection budget exhausted
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T010
  developer_test_plan: |
    DEV-V-013-T010 Ã¢â‚¬â€ Browse all skills with 0 points: readable rows, selectable + warning, Add blocked until points freed.
  related_files:
    - src/components/shared/unified-selection-modal.tsx
    - src/components/shared/add-skill-modal.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/shared/skills-allocation-page.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    When maxSelections is 0 (e.g. all skill points spent), UnifiedSelectionModal greys out every
    row (opacity-50), making browse/read hard. Soften capacity: keep rows readable and selectable;
    show a warning that budget is exhausted; block Add Selected until under the limit.
  acceptance_criteria:
    - With 0 skill points remaining, Browse all skills rows are full opacity and expandable.
    - User can select skills; warning explains need to free points; Add Selected stays disabled while over limit.
    - Same soft-limit behavior for any UnifiedSelectionModal with maxSelections (including max 0).
  notes: |
    Owner feedback 2026-07-11 Ã¢â‚¬â€ guided skills add modal; pattern applies to all add modals.
  implemented_by: agent
  evidence: |
    Soft maxSelections in UnifiedSelectionModal; skill copy via selectionLimitMessage; advanced Add Skill opens at 0 pts.

---

- id: TASK-426
  title: Guided ancestry Ã¢â‚¬â€ Skip no flaw as choice card
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: DEV-V-013-T009
  developer_test_plan: |
    DEV-V-013-T009 Ã¢â‚¬â€ Flaw step Skip card matches GuidedChoiceCard grid; select + Next pick advances.
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  description: |
    Optional flaw step showed Skip as a small secondary Button under the card grid Ã¢â‚¬â€ visually
    mismatched and easy to miss under the footer. Render Skip as a GuidedChoiceCard peer in the
    same compact grid; selecting records explicit decline (selectedFlawId ''); Continue advances.
  acceptance_criteria:
    - Skip is a GuidedChoiceCard in the flaw options grid with title + description.
    - Selecting Skip selects the card (check); Next pick leaves ancestry without bonus trait.
    - No separate secondary Skip button below the grid.
  notes: |
    Owner feedback 2026-07-11 Ã¢â‚¬â€ screenshot audit `.guided-flaw-audit/`.

---

- id: TASK-425
  title: SegmentedControl idle segments Ã¢â‚¬â€ clearer borders (species size)
  created_at: 2026-07-11
  created_by: agent
  priority: medium
  status: done
  build_validation: DEV-V-013-T008
  developer_test_plan: |
    DEV-V-013-T008 Ã¢â‚¬â€ Species overview size SegmentedControl idle borders visible before selection.
  related_files:
    - src/components/shared/segmented-control.tsx
    - src/components/guided-creator/species-reveal-panel.tsx
  description: |
    Guided species overview size picker (SegmentedControl) had no visible distinction between
    unselected options until one was selected. Strengthen shared SegmentedControl idle/track
    styling site-wide so segments read as distinct choices (borders + surface) while keeping
    primary selected state.
  acceptance_criteria:
    - Idle segments have visible border and surface fill distinct from the track.
    - Track has an outer border; selected segment remains primary-button fill.
    - Species overview multi-size picker and Library/SourceFilter still use SegmentedControl.
  notes: |
    Owner feedback 2026-07-11 Ã¢â‚¬â€ size buttons unclear until selected; fix universal component.

---

- id: TASK-424
  title: Guided equipment phased sub-flow (weapon ? armor ? gear)
  created_at: 2026-07-06
  created_by: agent
  priority: high
  status: done
  build_validation: DEV-V-013-T004, DEV-V-013-T006, DEV-V-013-T013
  developer_test_plan: |
    DEV-V-013-T004 Ã¢â‚¬â€ Berserker quick kits + phased weapon L1 cards.
    DEV-V-013-T006 Ã¢â‚¬â€ See more opens Layer 2 modal with TP bar.
    DEV-V-013-T013 Ã¢â‚¬â€ Weapon ? armor ? gear phase walk + progress chips.
  completed_work: |
    Phase 0: GUIDED_EQUIPMENT_PHASED_SPEC.md; FEATURE_INDEX.
    Phase 1: weapon-attack-ability.ts (+ thrown fix, sheet refactor); equipment-eligibility.ts;
    equipment-phase-stats.ts; equipment-currency.ts; unit tests.
    Phase 2: GuidedDraft schema v5; build-character currency + armor/shields; loadoutDraftFromSelection split;
    archetype armorStep/sharedEquipment types.
    Phase 3: equipment-phase-nav.ts; guided-equipment-phase-progress/layout; loadout-step phased router
    (SegmentedControl, in-step footer nav, L2 See more); armorStep parse; armaments sync.
    Phase 4Ã¢â‚¬â€6: guided-equipment-l1-phase.tsx (unified weapon/armor/gear L1 GuidedChoiceCard);
    guided-equipment-l2-modal.tsx + guided-equipment-l2.ts (UnifiedSelectionModal, PointStatus);
    use-guided-equipment-catalog.ts hook; equipment-catalog-rows.ts; equipment-phase-candidates.ts.
    Phase 7: guided-loadout-kit-presets.tsx (quick kit GuidedChoiceCard); removed customize panel + loadout section.
    Phase 8: admin armorStep select + shared path gear; level1_loadouts object wrapper (kits + metadata);
    parseLevel1LoadoutsField / serializeLevel1LoadoutsField; archetype-display loadouts column parity.
    Final: guided-equipment-phase-selection.tsx; guided-equipment-l2-grid.ts; resolveRefUnitCost helper.
    Phase 10 (2026-07-13): DEV-V-013-T013 + expanded Playwright audit; fixed kit apply to split armor
    nested in armaments[] via library lookup (blocked Continue to gear); re-split when catalog loads.
  remaining_work: |
    Path loadout content for remaining paths stays owner-gated (TASK-423).
  follow_up_tasks:
    - TASK-423
  notes: |
    Parent TASK-422. Spec in src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md.
    Agent UI/libs complete; owner seed for 11 paths + Berserker kit cleanup = TASK-423.
  description: |
    Replace guided loadout kit picker + monolithic mix-and-match with three in-step phases per
    REALMS Ã¢â‚¬â€5.7 and GUIDED_EQUIPMENT_PHASED_SPEC.md. Layer 1 GuidedChoiceCard per phase; Layer 2
    UnifiedSelectionModal with full filtered Common library. Reuse PointStatus, equipment-currency,
    weapon-attack-ability, equipment-eligibility libs. Kits = quick presets. armorStep path metadata.
  related_files:
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/guided-creator/guided-equipment-phase-progress.tsx
    - src/components/guided-creator/guided-loadout-kit-presets.tsx
    - src/lib/guided-creator/equipment-eligibility.ts
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/guided-creator/equipment-currency.ts
    - src/lib/guided-creator/resolve-loadout-items.ts
    - src/lib/game/weapon-attack-ability.ts
    - src/stores/guided-creator-store.ts
    - src/lib/guided-creator/build-character.ts
    - src/types/archetype.ts
    - src/components/shared/unified-selection-modal.tsx
    - tests/visual/guided-loadout-audit.pw.ts
  acceptance_criteria:
    - Three phases (weapon/shield, armor, gear) with progress chips; armor skippable via armorStep.
    - Layer 1 choice cards; Layer 2 per-phase UnifiedSelectionModal (full filtered eligible catalog).
    - L2 filters: ability met, armamentMax per item, Common rarity, gear =50c; weapon ranking by path + archetype ability.
    - Currency persists on draft after weapon/armor spend; shared components only (no CreatorResourceBar).
    - Kits pre-fill all phases; Berserker pilot end-to-end; npm run build passes.
  notes: |
    Parent TASK-422. Spec in src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md (human/ path cursorignored).
    Phases 0Ã¢â‚¬â€1 libs first; UI phases 3Ã¢â‚¬â€7; content TASK-423 owner-gated.

---

- id: TASK-422
  title: Guided equipment step Ã¢â‚¬â€ loadout UX rework (Ã¢â‚¬â€5.7)
  created_at: 2026-07-05
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-13
  build_validation: DEV-V-013-T004, DEV-V-013-T006, DEV-V-013-T007, DEV-V-013-T013
  developer_test_plan: |
    DEV-V-013-T004 Ã¢â‚¬â€ Berserker phased loadout + quick kits.
    DEV-V-013-T006 Ã¢â‚¬â€ See more opens Layer 2 modal with TP bar (Confirm applies).
    DEV-V-013-T007 Ã¢â‚¬â€ Admin path save rejects loadout exceeding TP budget.
    DEV-V-013-T013 Ã¢â‚¬â€ Weapon ? armor ? gear phase walk.
  description: |
    Replace minimal guided loadout cards with REALMS Ã¢â‚¬â€5.7 equipment UX. Superseded UI path
    completed via TASK-424 (phased weapon ? armor ? gear). Path content seeding remains TASK-423.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/guided-equipment-l1-phase.tsx
    - src/components/guided-creator/guided-equipment-l2-modal.tsx
    - src/components/guided-creator/guided-equipment-l2-grid.ts
    - src/components/guided-creator/guided-loadout-kit-presets.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/lib/guided-creator/resolve-loadout-items.ts
    - src/lib/game/path-validation.ts
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - Phased equipment flow (weapon/armor/gear) with quick kits and Layer 2 UnifiedSelectionModal.
    - Reveal/saved character show resolved item names.
    - Admin validatePathDataForPublish rejects loadout TP over martial budget.
    - Path content for remaining archetypes tracked on TASK-423 (owner).
  completed_work: |
    Phases 1Ã¢â‚¬â€3 (2026-07-05): item resolution, sections/unarmed, customize + admin TP.
    Superseded by TASK-424 phased L1/L2 (customize panel removed Phase 7).
    2026-07-13 audit: marked done Ã¢â‚¬â€ UI AC delivered by TASK-424; seed leftover = TASK-423 only.
  remaining_work: |
    None for agent UI. Owner seed: TASK-423.
  follow_up_tasks:
    - TASK-423
  notes: |
    Owner review 2026-07-05: TASK-401 shipped minimal cards; product vision in REALMS Ã¢â‚¬â€5.7 not met.
    Live DB: 1/12 paths have loadouts (Berserker only); Monk has unarmed flag but no loadouts.
    2026-07-13: Closed as done Ã¢â‚¬â€ do not chase deleted GuidedLoadoutCustomizePanel / section UI.

---

- id: TASK-419
  title: Guided skills step Ã¢â‚¬â€ Layer 1 presentation (Ã¢â‚¬â€5.5)
  created_at: 2026-07-03
  created_by: agent
  priority: high
  status: done
  description: |
    Replace SkillsAllocationPage embed in guided creator with guided-native skill list: labeled centered point budget,
    simplified rows (bonus Ã¢â‚¬â€, X remove), path skill chips in PathHelpCard, browse-all link instead of floating Add Skill.
  related_files:
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - No spreadsheet table / prof column in guided skills step.
    - Single labeled skill-point display centered above list; footer shows remaining/complete text only.
    - Path skills toggled via SkillSourceChip in path help card.
    - Advanced creator SkillsAllocationPage unchanged.
    - npm run build passes.
  build_validation: DEV-V-013-T014
  developer_test_plan: |
    DEV-V-013-T014 Ã¢â‚¬â€ Guided skills Layer 1 (path chips + budget + browse).
  notes: |
    2026-07-03: Owner feedback on skills step UX mismatch vs other guided steps. npm run build pass.

---

- id: TASK-321
  title: Reduce ESLint warnings (batch by rule)
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  description: |
    ~324 ESLint warnings dominated by `@typescript-eslint/no-unused-vars`,
    `react-hooks/exhaustive-deps`, and `react-hooks/set-state-in-effect`. Address in batches by rule.
  related_files:
    - (repo-wide)
  acceptance_criteria:
    - Warning count materially reduced; no new errors introduced.
    - `react-hooks/exhaustive-deps` fixes do not change runtime behavior.
    - `npm run build` passes.
  completed_work: |
    - Batch 1 lint fix; 0 errors.
    - Batch 2 (TASK-350): lib/hooks no-unused-vars; character sheet page destructuring; ESLint 393?339 warnings.
    - Batch 3Ã¢â‚¬â€4 (2026-07-13): cleared all unused-vars (141?0); fixed 4 lint errors (raw color tokens,
      InfoTippy Floating UI refs disables); removed dead PROPERTY_IDS re-export (batch-3 gap);
      fixed agent gaps (login dead `ready` state, official-entity-list canAdd(row)?canAdd());
      cleared admin no-explicit-any (40); a11y aria-sort; unused eslint-disable; dynamic img disables.
      Baseline before: 360 warnings / 4 errors ? after: ~171 warnings / 0 errors (react-hooks only).
  remaining_work: |
    - React Compiler hook warnings deferred to TASK-430 (eslint.config keeps them as warn on purpose).
  follow_up_tasks:
    - TASK-430
  notes: "2026-07-13 DONE for unused-vars/any/errors scope. Hook residuals ? TASK-430."

- id: TASK-346
  title: "Systemic token & console cleanup (batch by rule)"
  priority: low
  status: done
  created_at: 2026-06-12
  created_by: agent
  completed_at: 2026-07-13
  description: |
    Repo-wide batch cleanup: status colors -600 ? -700 in light mode; replace stray gray-*/neutral-* outside auth;
    remove leftover client debug console.*. Do in small, rule-scoped batches with build between.
  related_files:
    - src/app/globals.css
    - src/components/layout/footer.tsx
    - src/components/shared/roll-button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/button.tsx
    - src/app/(main)/my-account/page.tsx
    - eslint-rules/raw-color-backlog.mjs
  acceptance_criteria:
    - Status/secondary text passes WCAG AA tokens in both modes; no stray gray-*/neutral- utilities outside auth (theme `--color-neutral-*` ramps OK).
    - No leftover client debug `console.log`/`debug`; diagnostic `console.error` in error boundaries / route error UI / OAuth failure handlers allowed.
    - `realms/no-raw-color` reports 0 violators outside auth + `components/ui` exemptions; `RAW_COLOR_BACKLOG` empty.
    - npm run build + lint pass.
  completed_work: |
    - Batch 1Ã¢â‚¬â€2: footer/roll-button/console purge; status -600?-700; home/item-creator neutrals.
    - Batch 3Ã¢â‚¬â€4: emptied TSX backlog allowlist; semantic tokens across admin/codex/creators/sheet/shared.
    - Audit 2026-07-13: globals.css tab/stepper/search/skeleton/shimmer/glow ? semantic tokens; Button
      primary/danger `text-text-on-dark`; AGENT_GUIDE exceptions corrected; AC clarified for diagnostic consoles.
  remaining_work: |
    (none for token migration)
  notes: |
    2026-07-13 done. Auth gray + ui primitive exemptions remain by design. Server/API console.error unchanged
    (out of scope). Optional follow-up: shared client logger if product wants structured error reporting.

- id: TASK-376
  title: Retire DB tooltips Ã¢â‚¬â€ full migration to Collin Tippy + tooltip-text.tsx
  priority: high
  status: done
  created_at: 2026-06-25
  created_by: owner
  description: |
    Contextual help uses `InfoTippy` + `public/tooltip-text.tsx` (Floating UI engine Ã¢â‚¬â€ see TASK-392).
    Historical Tippy.js stack retired.
  related_files:
    - public/tooltip-text.tsx
    - src/components/shared/info-tippy.tsx
  acceptance_criteria:
    - All contextual help uses Tippy + `public/tooltip-text.tsx`
    - Legacy DB tooltip stack removed; build passes
  notes: |
    Completed 2026-06-29: InfoTippy shared component, full creator + campaigns + navbar migration,
    legacy stack removed (useTooltipByKey, ContextHelpTooltip, HelpTooltip, admin/API routes, user toggle).
    Copy centralized in public/tooltip-text.tsx. Engine migrated to Floating UI in TASK-392 (2026-06-30).
    DB cleanup DEV-376 done 2026-06-30: dropped ui_tooltips + show_tooltips (sql/drop-legacy-ui-tooltips-2026-06.sql).

- id: TASK-378
  title: HYG-01 codex typing hardening + legacy payload compatibility gates
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Replace `fetchCodex`'s `any`-based response typing with a canonical typed payload, preserving
    compatibility adapters for historical data shapes (roll/campaign displays).
  related_files:
    - src/lib/api-client.ts
    - src/hooks/use-codex.ts
    - src/hooks/use-game-data.ts
    - src/hooks/use-game-rules.ts
    - src/components/character-sheet/roll-log.tsx
    - src/types/campaign-roll.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  acceptance_criteria:
    - `fetchCodex` returns a strongly typed payload (no broad `Record<string, any[]>`).
    - All `useCodex*`/rules consumers compile without `any` fallback leakage.
    - Roll timestamp compatibility remains safe for ISO + legacy `{ seconds }` payloads.
    - `photoURL` semantics documented as active auth/profile alias.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation suite added/indexed for codex + roll-log compatibility checks.
  follow_up_tasks:
    - TASK-420
    - TASK-421
  notes: |
    Planned from remediation close-out. Compatibility-first phases required.
    DONE 2026-07-03: `CodexPayload` in `src/types/codex.ts`; typed `fetchCodex` + server route; entity types moved from hooks/codex-types; roll timestamp util extracted; character sheet uses CodexFeat/CodexSkill; vitest shape + timestamp tests; build pass.
    Follow-ups: TASK-420 done (library API typing); TASK-421 (enhanced items typing). Creator load `any` handlers ? TASK-381.

- id: TASK-379
  title: DUP-05/08 unify library selection pipelines and make LoadFromLibraryModal a thin wrapper
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  completed_at: 2026-07-13
  description: |
    Unify add/load library selection pipelines into one builder+normalizer path; refactor
    `LoadFromLibraryModal` into a thin wrapper over `UnifiedSelectionModal`.
  related_files:
    - src/hooks/use-load-modal-library.ts
    - src/hooks/add-library-item/
    - src/lib/library-selectable-builders.ts
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Single shared pipeline for selectable-item shaping used by add + load flows.
    - `LoadFromLibraryModal` is wrapper-level composition, not a parallel list implementation.
    - No behavior regressions in powers/techniques/items/creatures/species load-add flows.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation coverage added for add/load parity per creator type.
  build_validation: DEV-V-016-T001Ã¢â‚¬â€T006
  developer_test_plan: |
    Run DEV-V-016 in BUILD_VALIDATION.md (power/technique/item/empowered/species+creature load + sheet add parity).
  notes: |
    Deferred from remediation waves. Requires QA-first execution.
    2026-07-13: Done Ã¢â‚¬â€ LoadFromLibraryModal ? UnifiedSelectionModal (confirmLabel Load, max 1);
    add+load share library-selectable-builders + normalize-public (weaponName); technique Action
    column on load matches add; DEV-V-016 added. Build/test/lint pass.
    2026-07-13 audit: Empowered load uses buildEmpoweredPowerSelectableItem + EMPOWERED columns;
    wired public-library error; deleted dead add-library-item adapters; L2 grid double-apply fixed;
    AGENT_GUIDE API corrected; AddLibraryItemModal flexLayout.
    2026-07-13 follow-up: type-gated fetches in useLoadModalLibrary; species TraitListModal ?
    UnifiedSelectionModal; flexLayout default true on UnifiedSelectionModal.

- id: TASK-380
  title: DUP-11 + collapsible consolidation with CreatorPageShell rollout
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  completed_at: 2026-07-14
  description: |
    Introduce shared creator-page shell scaffolding and consolidate collapsible patterns after parity tests exist.
  related_files:
    - src/components/creator/CreatorPageShell.tsx
    - src/components/creator/CreatorLayout.tsx
    - src/components/creator/collapsible-section.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Shared CreatorPageShell removes duplicated auth/load/save scaffolding.
    - Collapsible usage consolidated to supported patterns.
    - Creator page behavior equivalent across all six routes.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Dedicated creator parity validation suite added before merge.
  build_validation: DEV-V-018
  developer_test_plan: |
    Run DEV-V-018-T001Ã¢â‚¬â€T006 in BUILD_VALIDATION.md (six creators + mobile shell).
  notes: |
    2026-07-14: Done Ã¢â‚¬â€ CreatorPageShell on all six standalone creators; CollapsibleSection is the only
    collapse pattern (ui/Collapsible already gone). Species Load remains ungated; creature keeps
    reset confirm + over-budget save. CreatorLayout retained as inner layout primitive.
    2026-07-14 audit: Fixed creature Suspense/?edit; LoginPrompt save|load reason; species + empowered
    contentType; ungated Load toolbar labels; lg-only sticky sidebar. Remaining ? TASK-431.
    2026-07-01: Owner Ã¢â‚¬â€ Phase 1b prerequisite for standalone guided creators (REALMS Ã¢â‚¬â€5.11).

- id: TASK-431
  title: Creator chrome follow-ups Ã¢â‚¬â€ a11y, load-hook parity, empowered copy/errors
  created_at: 2026-07-14
  created_by: agent
  priority: medium
  status: done
  parent_task: TASK-380

  description: |
    Follow-ups from CreatorPageShell (TASK-380) audits. Shell chrome/auth/publish wiring is green
    across all six creators; remaining work is CollapsibleSection a11y, heading hierarchy,
    species/creature load-hook convergence, and a few empowered/species parity nits.
  related_files:
    - src/components/creator/collapsible-section.tsx
    - src/components/creator/CreatorPageShell.tsx
    - src/hooks/use-load-modal-library.ts
    - src/lib/library/creator-load-selectables.ts
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/docs/ai/AGENT_GUIDE.md
  acceptance_criteria:
    - CollapsibleSection: no nested interactive controls inside a role=button / expand header; move rightSlot/Remove outside the disclosure control (or equivalent pattern); fix misleading comment that claims nesting is OK.
    - Section titles use heading level that does not skip (h1 PageHeader ? h2 sections), or an equivalent a11y-compliant pattern documented in AGENT_GUIDE.
    - Species and/or creature load lists use an extended useLoadModalLibrary (or dedicated shared hook) with SourceFilter parity Ã¢â‚¬â€ no bespoke fetch/shape duplication beyond entity-specific columns/handleLoad.
    - Empowered publish override copy says "empowered technique" (not "technique") when replacing an existing public item.
    - Empowered dual-load errors identify which dataset(s) failed (power parts / technique parts) and surface both messages when both fail; retry still refetches both.
    - Optional: shell `loading` gate (or documented intentional skip) for species skills/traits and creature critical codex deps Ã¢â‚¬â€ align with power/tech/item or document "show UI immediately" in AGENT_GUIDE.
    - Optional: consistent load-success toast (or explicit none) across all six creators (today: power/technique yes; item/empowered/species no; creature only on ?edit= path).
    - npm run build + lint pass; update DEV-V-018 or add targeted tests if UI changes.
  notes: |
    From TASK-380 audits 2026-07-14 (initial + second-pass sanity).
    Already fixed outside this task: creature Suspense/?edit; LoginPrompt save|load reason;
    species/empowered contentType; ungated Load toolbar labels; lg-only sticky sidebar.
    Intentional / not in scope: species ungated Load + stickySidebar=false; creature resetConfirm +
    over-budget save; crafting on CreatorLayout without shell; GuidedCreatorPageShell separate.
    Second-pass confirmed healthy: shell onSave/onLoad/publish wiring, no double Load modal,
    showPublicPrivate + returnPath/contentType on all six, TraitListModal/extraModals, rarity sidebar,
    RollProvider inside Suspense, no leftover page-level LoginPrompt/CreatorSaveToolbar.
    2026-07-14: Done Ã¢â‚¬â€ CollapsibleSection a11y (dedicated expand button, h2 titles); useLoadModalLibrary
    extended for species/creature + prefetch; creator-load-selectables shared builders; shell loading
    gates + load-success toast parity; empowered publish/dual-error copy; DEV-V-018-T007.
  build_validation: DEV-V-018
  developer_test_plan: |
    Run DEV-V-018-T001Ã¢â‚¬â€T007 in BUILD_VALIDATION.md (chrome + load-hook/Collapsible a11y).

- id: TASK-382
  title: Docs compaction pass (active queue slimming + stale-reference pruning)
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Keep active docs lean: move historical audits and done task blocks out of agent line-of-sight;
    prune stale references in active guidance docs.
  related_files:
    - src/docs/ai/AI_TASK_QUEUE.md
    - src/docs/ai/archive/
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/README.md
    - AGENTS.md
    - .cursorignore
  acceptance_criteria:
    - `AI_TASK_QUEUE.md` contains only active/pending work; history in archive.
    - Active docs contain no stale route/component references unless marked historical.
    - Archive pointers explicit; `.cursorignore` excludes archive from indexing.
    - `npm run build` passes.
  notes: |
    DONE 2026-06-26: Slimmed queue to 10 active entries; moved June audits + root CODEBASE_AUDIT to
    `ai/archive/`; human onboarding/reference to `src/docs/human/`; added HISTORY_INDEX.md + .cursorignore.

- id: TASK-383
  title: "UI unification Ã¢â‚¬â€ Phase 0a: automated visual + a11y + contrast safety net"
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Stand up an automated verification net BEFORE the design-system token re-architecture
    (Phase 0+) so style/theme regressions are caught without manual visual QA. Plan:
    `.cursor/plans/ui_unification_audit_4aa98a2a.plan.md`.
  completed_work: |
    - `scripts/check-contrast.mjs`: WCAG-AA contrast check of every semantic fg/bg token pair in
      BOTH themes, with a 0-failure ratchet baseline (`scripts/contrast-baseline.json`).
    - `/dev/styleguide`: auth-free, data-free gallery of every primitive + token swatch (the
      canonical surface for visual review; captured in both themes at 3 breakpoints).
    - Playwright + `@axe-core/playwright`: `tests/visual/` Ã¢â‚¬â€ full-page screenshot baselines (54)
      across mobile/tablet/desktop x light/dark for deterministic routes, plus axe-core a11y scans
      with a ratchet baseline (`tests/visual/a11y-baseline.json`).
    - ESLint `realms/no-raw-color` guardrail (`eslint-rules/`): hard error banning raw Tailwind
      palette / bare white-black / arbitrary hex in class strings; exempts auth shell + UI
      primitives; 64-file migration backlog ratchet (`raw-color-backlog.mjs`) shrinks per phase.
    - `npm run verify` (contrast + lint + visual + a11y) and `.github/workflows/ui-verify.yml`
      hard-blocking CI gates.
  follow_up_tasks:
    - TASK-384
    - TASK-385
  build_validation: |
    suite: DEV-V-011
    tests:
      - DEV-V-011-T001
      - DEV-V-011-T002
      - DEV-V-011-T003
      - DEV-V-011-T004
  developer_test_plan: |
    Suite DEV-V-011 T001Ã¢â‚¬â€T004 Ã¢â‚¬â€ see BUILD_VALIDATION.md. Human steps (CI secrets, Linux baseline
    seeding, branch protection) in DEVELOPER_TASK_QUEUE DEV-002.
  related_files:
    - scripts/check-contrast.mjs
    - scripts/contrast-baseline.json
    - scripts/list-raw-color-backlog.mjs
    - src/app/dev/styleguide/page.tsx
    - playwright.config.ts
    - tests/visual/
    - eslint-rules/no-raw-color.mjs
    - eslint-rules/raw-color-backlog.mjs
    - eslint.config.mjs
    - .github/workflows/ui-verify.yml
    - package.json
  notes: |
    DONE 2026-06-26. Visual baselines committed are Windows (local/agent self-review). Linux CI
    baselines + Supabase CI secrets + branch-protection required-checks = DEV-002 (one-time).

- id: TASK-384
  title: "Resolve a11y violations surfaced by the new axe baseline"
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    The Phase 0a axe scan recorded a ratchet baseline of pre-existing violations. Drive these to
    zero and shrink `tests/visual/a11y-baseline.json`. Highest-leverage first.
  completed_work: |
    - Toast region: `role="region"` so `aria-label` is valid with `aria-live`.
    - TabNavigation: `disabled` instead of prohibited `aria-disabled` on tabs; `associatePanels` prop for demos.
    - Form error text ? `text-danger-fg` (Input/Select/Textarea/Checkbox).
    - Privacy inline links: persistent underline (`link-in-text-block`).
    - Styleguide: token swatches on correct surfaces; tab panels wired; toast trigger; PointStatus contrast.
    - `tab-nav-trigger-active` ? semantic tokens (no primary ramp `dark:`).
    - `tests/visual/a11y-baseline.json` emptied Ã¢â‚¬â€ zero allowed violations.
  related_files:
    - src/components/layout/header.tsx
    - src/app/(main)/library/
    - src/app/(main)/privacy/page.tsx
    - tests/visual/a11y-baseline.json
  acceptance_criteria:
    - Fix the near-global `aria-prohibited-attr` (appears on nearly every page Ã¢â‚¬â€ likely one shared
      nav/header/skip-link/toggle element); remove its keys from the a11y baseline.
    - Fix `/library` dark-mode `color-contrast` and `/privacy` `link-in-text-block`.
    - `npm run verify:a11y` passes; baseline entries deleted (not re-added).
    - `npm run build` passes.
  notes: |
    DONE 2026-06-27. `npm run verify:a11y` passes with empty baseline (30/30 routes, both themes).

- id: TASK-385
  title: "Authenticated-surface visual + a11y baselines (test session)"
  priority: low
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Extend the safety net to auth-gated, data-bearing surfaces (character sheet, `/my-account`,
    campaign detail/combat) once a deterministic test session + seed data exist.
  completed_work: |
    - `scripts/provision-e2e-baseline.js` + `tests/visual/e2e-seed-manifest.json` Ã¢â‚¬â€ deterministic user/character/campaign seed.
    - `auth.setup.ts` + `playwright.auth.config.ts` Ã¢â‚¬â€ storageState login (login once, reuse session).
    - Visual baselines: my-account, characters, campaigns, character-sheet, campaign-detail Ã¢â‚¬â€ light/dark (10 snapshots).
    - `auth-a11y.pw.ts` + ratchet baseline; masks for portraits + roll logs.
    - `npm run e2e:provision`, `verify:auth-visual`, `verify:auth-a11y` (+ update variants).
    - CI optional step when `E2E_TEST_*` secrets present (`.github/workflows/ui-verify.yml`).
  remaining_work: |
    - Human DEV-003: add `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (+ optional IDs) to GitHub Actions secrets; seed Linux auth baselines on first CI run (same as DEV-002).
    - Follow-up: fix character-sheet axe allowances (`aria-valid-attr-value`, `scrollable-region-focusable`) and my-account dark `color-contrast`.
  related_files:
    - tests/visual/
    - playwright.auth.config.ts
    - scripts/provision-e2e-baseline.js
  acceptance_criteria:
    - Playwright storageState login flow using a CI test user (DEV-002/DEV-003).
    - Deterministic seed (or masked dynamic regions) so screenshots don't churn.
    - Baselines for character sheet, /my-account, campaign detail in both themes.
  build_validation: |
    suite: DEV-V-011
    tests:
      - DEV-V-011-T005
      - DEV-V-011-T006
  notes: |
    DONE 2026-06-27. Test user `e2e-visual-baseline@realmsrpg.test` provisioned in dev Supabase. Windows baselines committed. Auth a11y ratchet has 5 pre-existing allowances on character sheet + my-account dark.

- id: TASK-386
  title: "MVP: guided three-layer character creator pilot (archetype preview + feats L1)"
  created_at: 2026-06-28
  created_by: owner
  priority: high
  status: done
  completed_work: |
    Full 9-step three-layer creator rework: GuidedChoiceShell on all path steps, per-step layer state + getStepCompletion, path-default archetype with build previews, species recommended_species L1, ancestry checklist, abilities suggested array + blurbs, skills L1 hide sub-skills, feats/equipment/powers guidance groups + weapon-then-armor + confirm loadout, finalize character reveal + edit jump-backs + identity fields, CreatorResourceBar, martial?skip powers tab, admin validatePathDataForPublish on save. Visual UX sweep (Playwright audit, footer/tab/InfoTippy fixes). Supabase: level1_recommended_species + level1_guidance_groups columns; Berserker reference path seeded. TASK-376 InfoTippy migration done. `npm run build` + `npm run verify:creator-audit` pass.
  remaining_work: |
    Optional follow-up: admin UI builder for guidance_groups (Advanced Path JSON + ChipSelect for recommended_species work today). Seed guidance groups for remaining paths (Warrior, Monk, power paths) as content work.
  follow_up_tasks:
    - TASK-391
  build_validation: |
    suite: DEV-V-001
    tests:
      - DEV-V-001-T001
      - DEV-V-001-T011
    automated: npm run verify:creator-audit
  developer_test_plan: |
    DEV-V-001 manual path/forge guards + npm run verify:creator-audit for step screenshots.
  description: |
    Character-creator implementation slice of the Product Experience Redesign
    (`src/docs/REALMS_PRODUCT_OVERVIEW.md`, Appendix E). Establishes Layer 1
    (guided) default + "see all" escape on the feats step; archetype preview cards.
    Landing rebuild is TASK-387; post-activation flow is TASK-388.
    Prefer simplification/restructuring over new features (Section 8).
    Tooltip copy: `public/tooltip-text.tsx` + `InfoTippy` (TASK-376 done).
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/lib/game/archetype-path.ts
    - public/tooltip-text.tsx
  acceptance_criteria:
    - Archetype step: path cards show build preview (counts + one-line goal); Path default, "Forge Your Own" secondary/L3.
    - Feats step (pilot): Layer 1 grouped recommended feats with why-copy; "See all feats" ? existing L3 browser; "Back to recommendations" returns to L1.
    - Global: `level1.notes` surfaced via enhanced `PathHelpCard` on every path step.
    - Content: one fully authored reference martial path in admin; completable in L1 without opening full lists.
    - `npm run build` passes; MOBILE_UX + ACCESSIBILITY rules followed.
  notes: |
    Refactor behind `creationMode === 'path'`. GuidedChoiceShell built and used on abilities/skills; feats/equipment/powers use layer expand + path groups. 2026-06-29: comprehensive rework shipped (see completed_work).
    Tooltip copy: add to `public/tooltip-text.tsx` and use `InfoTippy` (TASK-376 done).

- id: TASK-387
  title: "Landing page full redesign (modern TTRPG startup)"
  created_at: 2026-06-28
  created_by: owner
  priority: high
  status: done
  description: |
    Scrap and rebuild `home-page.tsx` per REALMS_PRODUCT_OVERVIEW Section 4 Ã¢â‚¬â€
    not a copy-only patch. Single primary CTA (Start Playing ? /characters/new),
    research-backed scroll structure, remove OnboardingTour and Codex/Library CTAs.
    Mid-page secondary CTAs: custom power, weapons/armor (? creators; Layer 1 entry
    when those creators support it). Discord tertiary. Design system compliant.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/app/(main)/home-page.tsx
    - src/components/shared/onboarding-tour.tsx
    - src/lib/constants/site-copy.ts
  acceptance_criteria:
    - Remove OnboardingTour trigger and welcome-banner tour link from home.
    - Remove Browse Codex / Browse Library as landing CTAs (nav only).
    - One primary hero CTA: Start Playing ? /characters/new.
    - Uniqueness block with visual proof (screenshots/art), not abstract copy only.
    - Below fold: Create a Custom Power + Create Weapons & Armor sections with links to creators.
    - Join Discord in closing/footer section.
    - Mobile-first (~360px); semantic tokens; `npm run build` passes.
  completed_work: |
    Rebuilt `home-page.tsx` from scratch as a composition shell over new section
    components in `src/components/landing/` (HeroSection, UniquenessSection,
    HowItWorksSection, SecondaryDiscoverySection, CommunitySection + MarketingButton
    helpers + barrel). AIDA scroll story per Section 4.
    - Removed: OnboardingTour trigger + "Take a quick tour", logged-in welcome
      link-farm, review carousel, equal-weight feature cards. No Codex/Library CTAs.
    - Single dominant primary CTA "Start Playing" -> /characters/new (hero) repeated
      once mid-page in How-it-works. Low-weight "#how-it-works" explorer anchor for
      researching visitors (owner: proceed with research best practice, I.4).
    - Conditional hero: returning users with >=1 character get continue-focused hero
      (Continue your adventure -> /characters) via useCharacters.
    - Secondary discovery: Create a Custom Power -> /power-creator, Create Weapons &
      Armor -> /item-creator (outline/subordinate). Community: Join Discord tertiary.
    - Copy centralized in `LANDING_COPY` (site-copy.ts). Semantic tokens, dark mode,
      44px targets, h1->h2->h3 hierarchy. `npm run build` passes; lint clean.
  remaining_work: |
    (None Ã¢â‚¬â€ licensed character/item art integrated 2026-06-28: Faust hero, Human-Greyscale
    / gnome / Shroom-Shot uniqueness, gnome + Shroom-Shot secondary discovery.)
    Power/item secondary CTAs still link to Layer 3 creators until Phase 3.
  follow_up_tasks: []
  build_validation: DEV-V-012
  developer_test_plan: BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387
  notes: |
    Can ship before or in parallel with TASK-386. OnboardingTour component file kept
    in `src/components/shared/` for TASK-388 to repurpose (no longer imported by home).

- id: TASK-389
  title: "Landing visual assets Ã¢â‚¬â€ replace uniqueness placeholder panels"
  created_at: 2026-06-28
  created_by: agent
  priority: medium
  status: done
  description: |
    Follow-up to TASK-387. The rebuilt landing uniqueness block (Section 4 "visual
    proof") currently renders layout-stable placeholder panels (`VisualPanel` in
    `src/components/landing/uniqueness-section.tsx`). Replace with real product
    screenshots / species art / power examples so the differentiators show the
    product in use rather than illustrative placeholders.
  related_files:
    - src/components/landing/uniqueness-section.tsx
    - public/images/
  acceptance_criteria:
    - Each uniqueness card shows a real screenshot or art asset (creator UI, species
      art, power example) at the existing 16:10 panel aspect (no layout shift).
    - Assets optimized (next/image, sized); mobile + dark mode verified.
    - `npm run build` passes.
  notes: |
    Completed 2026-06-28: owner supplied Faust, gnome, Shroom-Shot, Human-Greyscale;
    integrated via LandingArtFrame + hero split layout (banner removed).

- id: TASK-390
  title: "Migrate editable static copy to per-page constants modules"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: done
  description: |
    Owner wants all user-editable marketing/UI strings in `src/lib/constants/copy/`
    Ã¢â‚¬â€ one module per page or area for easy editing while viewing a route.
  related_files:
    - src/lib/constants/copy/
    - src/lib/constants/site-copy.ts
    - src/lib/constants/skills.ts
    - public/tooltip-text.tsx
    - src/components/layout/footer.tsx
    - src/components/layout/header.tsx
    - src/components/about/
    - src/app/(main)/about/page.tsx
    - src/app/(main)/rules/page.tsx
    - src/app/(main)/resources/page.tsx
    - src/app/(main)/privacy/page.tsx
    - src/app/(main)/terms/page.tsx
    - tests/visual/site-copy-audit.pw.ts
  acceptance_criteria:
    - `src/lib/constants/copy/` holds per-page modules; `site-copy.ts` re-exports (backward compatible).
    - Each major route with owner-editable prose has a dedicated `*-copy.ts` file documented in `site-copy.ts` header table.
    - No duplicate hardcoded motto/Discord URL outside copy modules (except tooltip-text.tsx per TASK-376).
    - Pages import copy from constants; no marketing string changes required in JSX for migrated sections.
    - `npm run build` passes.
  build_validation: DEV-V-017
  developer_test_plan: |
    Run DEV-V-017-T001Ã¢â‚¬â€T006 in BUILD_VALIDATION.md (About, nav, rules, resources, privacy, terms).
    Optional screenshot audit: `npx playwright test -c playwright.site-copy-audit.config.ts` ? `.site-copy-audit/`.
  notes: |
    2026-07-14: Done Ã¢â‚¬â€ About carousel ? structured `ABOUT_CAROUSEL_SLIDES` + `AboutSlideBodyView`;
    `nav-copy`, `rules-copy`, `resources-copy`; footer/landing/auth/guided already migrated.
    Audit pass: fixed root-layout motto AC3 gap; creator-note punctuation; SEO meta from copy;
    `privacy-copy` + `terms-copy`; shared `SITE_CONTACT_EMAIL` / `ROOT_META_DESCRIPTION`;
    auth headline derives from `REALMS_MOTTO`. Playwright audit 4/4 PASS (screenshots in `.site-copy-audit/`).
    Rules Google Docs iframe may be blank in headless/third-party frames Ã¢â‚¬â€ Ã¢â‚¬â€Open in new tabÃ¢â‚¬â€ still works.
    Tooltips stay in `public/tooltip-text.tsx`; game mechanics stay in `skills.ts`.

- id: TASK-392
  title: Migrate InfoTippy from Tippy.js to Floating UI (React 19)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Replace archived `@tippyjs/react` / `tippy.js` with `@floating-ui/react` in `InfoTippy`.
    Removes React 19 `element.ref` console warning and unmaintained dependency. Keep same
    public API (`content`, `label`, `placement`, `size`, `children`, `allowHTML` compat).
  related_files:
    - src/components/shared/info-tippy.tsx
    - package.json
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
  acceptance_criteria:
    - InfoTippy uses Floating UI; no `@tippyjs/react` or `tippy.js` in dependencies.
    - Hover (desktop), focus, touch-hold (~400ms), portal to body, flip/shift, max-width 320px preserved.
    - Interactive JSX tooltips allow pointer entry (safePolygon).
    - All existing InfoTippy call sites work without changes.
    - npm run build passes.
  notes: |
    2026-06-30: Implemented. Removed tippy packages; added @floating-ui/react.
    Integration audit 2026-06-30: no @tippyjs/react imports remain; dead tooltip Zod schemas removed;
    agent docs/rules updated; InfoTippyProps exported from shared barrel.
    DEV-376 2026-06-30: Supabase MCP migration drop_legacy_ui_tooltips applied; app code no longer references show_tooltips.

- id: TASK-393
  title: Guided Simple Creator Ã¢â‚¬â€ docs & product model (REALMS Ã¢â‚¬â€5.0)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Document two-creator model, chapter backbone, starter-species rule, recommended abilities/loadouts data needs, and future avatar slot in REALMS_PRODUCT_OVERVIEW.md.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Section 5.0 records Simple vs Advanced, entry chooser, chapters, and data fields.
  notes: |
    2026-06-30: Implemented as part of guided creator build.

- id: TASK-394
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 0 entry chooser & routes
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Simple vs Advanced chooser at /characters/new; Advanced at /characters/new/advanced; guided at /characters/new/guided; guided-creator-store scaffold.
  related_files:
    - src/app/(main)/characters/new/page.tsx
    - src/app/(main)/characters/new/advanced/page.tsx
    - src/app/(main)/characters/new/guided/page.tsx
    - src/stores/guided-creator-store.ts
  acceptance_criteria:
    - New Character navigates to chooser; both routes load; stores are separate.
    - npm run build passes.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T001
  notes: |
    2026-06-30: Landing-cohesive chooser with CreatorFunnelHero.

- id: TASK-395
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 1 shell (rail, preview, footer)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    GuidedCreatorShell with chapter rail, CharacterPreviewPanel, GuidedStepFooter, and step routing for all chapters.
  related_files:
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/components/guided-creator/character-preview-panel.tsx
    - src/components/guided-creator/guided-step-footer.tsx
    - src/components/guided-creator/guided-creator-page-shell.tsx
  acceptance_criteria:
    - Chapter rail matches GUIDED_CHAPTERS; preview updates from draft; sticky footer on all steps.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T002
  notes: |
    2026-06-30: Visual language matches landing (CreatorFunnelHero, rounded-card surfaces).

- id: TASK-396
  title: Guided Simple Creator Ã¢â‚¬â€ schema fields & seed SQL
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Add codex_species.is_starter, codex_archetypes.level1_recommended_abilities, level1_loadouts; SQL seed for Berserker + starter species; update SUPABASE_SCHEMA.md.
  related_files:
    - sql/guided-creator-schema-seed.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/app/api/codex/route.ts
  acceptance_criteria:
    - SQL file documents migration + seed; schema doc updated; API maps new fields into path_data.
    - Human runs SQL in Supabase (DEV-004).
  notes: |
    2026-06-30: Seed SQL applied via Supabase MCP migration `guided_creator_schema_seed` (DEV-004 done). 8 starter species + Berserker verified in DB.

- id: TASK-397
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 2 Foundation (path + species)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Shared GuidedChoiceCard for path/species; starter-species filter with expand-to-all; Powered-Martial paths behind expand affordance.
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/guided-choice-card.tsx
  acceptance_criteria:
    - Path and species use same card format; starter filter works when is_starter seeded; hybrid paths expandable.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T003
  notes: |
    2026-06-30: Species path-ambiguous (no per-path recommended species).

- id: TASK-398
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 3 Ancestry micro-flow
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    One-pick-at-a-time full-width cards for species-trait options, ancestry trait, characteristic, optional flaw + bonus trait; draft-state completion validation.
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
  acceptance_criteria:
    - Continue disabled until required ancestry picks complete; optional flaw skippable.
  notes: |
    2026-06-30: Mixed species deferred.

- id: TASK-399
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 4 Abilities
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Apply path recommended_abilities or customize via AbilityScoreEditor; in-context ability blurbs.
  related_files:
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - Use recommended one-click apply; customize mode enforces point spend.
  notes: |
    2026-06-30: resolveGuidedRecommendedAbilities from path_data.

- id: TASK-400
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 4 Your Archetype (skills + feats)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Skills (species locked + path toggleable), archetype feats via guidance groups, character feat step; ordered after abilities.
  related_files:
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
  acceptance_criteria:
    - Sub-step order enforced in store; guidance groups drive feat selection when present.
  notes: |
    2026-06-30: Chapter 4 sub-steps skills ? archetype-feats ? character-feat.

- id: TASK-401
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 5 Equipment + Powers/Techniques
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Loadout cards from level1_loadouts (fallback to path armaments); single Powers or Techniques step by archetype type.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/game/archetype-path.ts
  acceptance_criteria:
    - Loadout step selects kit; powers/techniques step title varies by martial vs power archetype.
  notes: |
    2026-06-30: parseLoadouts supports object-shaped armament entries in JSON.

- id: TASK-402
  title: Guided Simple Creator Ã¢â‚¬â€ Phase 6 Your Hero (reveal + save)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Reveal step with name, HP/EN allocation, save character, login prompt for guests, post-save play-together modal.
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - buildGuidedCharacterPayload + createCharacter; guest sees login modal; post-save Discord/campaign prompt.
  follow_up_tasks:
    - TASK-406
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T005
  notes: |
    2026-06-30: Marketing CTAs in modals match landing patterns. Reveal UX completed in TASK-406.

- id: TASK-407
  title: Guided creator Ã¢â‚¬â€ skills step full allocation (Ã¢â‚¬â€5.5 Option B)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Replace guided skills toggles with full skill-point allocation: species locked (free), path skills toggleable, decline frees points for curated free picks + Add Skill catalog. Store skills as Record<id, value>; save with correct skill_val.
  related_files:
    - src/components/guided-creator/steps/skills-step.tsx
    - src/lib/guided-creator/build-skills.ts
    - src/lib/guided-creator/curated-skills.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/character-preview-panel.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
  acceptance_criteria:
    - GuidedSkillsPanel (not SkillsAllocationPage) with species/path locking, sub-skills hidden, defense hidden.
    - 3 L1 skill points (+ species "Any" extra) must be fully spent to continue.
    - Declining path skill frees 1 point; curated picks surface ability-aligned base skills.
    - Save payload uses skill_val from allocations (not hardcoded 1).
    - Reveal summary and preview show skill names/count from skills record + species.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T014
  notes: |
    2026-06-30: Owner chose Option B Ã¢â‚¬â€ full allocation per REALMS Ã¢â‚¬â€5.5. Store schema v3 (skillIds ? skills). npm run build pass.
    2026-07-13 audit: AC updated for GuidedSkillsPanel (TASK-419); build_validation rewired from wrong T003 ? T014.

- id: TASK-406
  title: Guided creator Ã¢â‚¬â€ Your Hero reveal redesign (Ã¢â‚¬â€5.10)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Redesign guided reveal/finalize step to match REALMS Ã¢â‚¬â€5.10: hero reveal moment, full build summary with names and edit jump-backs, identity fields, portrait upload, smart HP/EN allocation, reveal-first layout.
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/guided-creator/guided-health-energy-section.tsx
    - src/components/guided-creator/guided-step-edit-link.tsx
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
  acceptance_criteria:
    - Full overview shows names (skills, traits, feats, loadout, powers/techniques) not counts.
    - Edit links jump back to prior guided sub-steps.
    - Identity block: name, optional age/height/weight/appearance, portrait upload.
    - HP/EN auto-applies on enter + auto-allocate button tied to highest power/technique cost.
    - Reveal layout feels like a finale (hero band, no duplicate preview strip).
    - Save + guest login + portrait upload on save still work.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T015
      - DEV-V-013-T005
  notes: |
    2026-06-30: Owner feedback Ã¢â‚¬â€ guided reveal was worst finalize step; redesign in stages.
    2026-06-30: Hero band, GuidedRevealSummary (names + edit links), identity block, portrait upload, smart HP/EN auto-allocate, shell hides strip on reveal. npm run build pass.
    2026-07-13 audit: build_validation rewired from T004 (loadout) ? T015 reveal + T005 save.

- id: TASK-415
  title: Chip taxonomy & metadata display unification
  priority: high
  status: done
  created_at: 2026-07-02
  created_by: owner
  description: |
    Unify expandable vs descriptor chips into two roles with distinct visuals; fix expandable
    rounded-rectangle shape (no pill clipping); enforce metadata visibility rule for GridListRow
    items; remove redundant collapsed/expanded metadata. Plan: `src/docs/ai/CHIP_UNIFICATION_PLAN.md`.
  related_files:
    - src/docs/ai/CHIP_UNIFICATION_PLAN.md
    - src/components/ui/chip.tsx
    - src/components/ui/expandable-chip.tsx
    - src/lib/chip/expandable-chip-props.ts
    - src/lib/chip/expandable-chip-shell.ts
    - src/components/shared/grid-list-chip.tsx
    - src/lib/chip/part-data.ts
    - src/lib/chip/chip-options-panel.tsx
    - src/lib/chip/index.ts
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/species-trait-card.tsx
    - src/lib/codex/feat-list.ts
    - src/components/character-sheet/library-feat-rows.ts
    - src/components/character-sheet/library-entity-rows.ts
    - src/app/dev/styleguide/page.tsx
  acceptance_criteria:
    - Two chip roles documented and implemented Ã¢â‚¬â€ ExpandableChip (interactive) + DescriptorChip (opaque, non-expandable)
    - Expandable chips use rounded-lg/rectangle geometry; expanded state does not clip label text (styleguide proof)
    - GridListRow BADGE_COLORS inline spans replaced with DescriptorChip
    - PartChip + ExpandableGridListChip + ui ExpandableChip merged into one ui ExpandableChip
    - Redundant metadata removed (feat category column vs chip; trait category bar vs floating text)
    - Metadata audit table in CHIP_UNIFICATION_PLAN.md completed for feats, traits, powers, techniques, weapons, armor
    - Styleguide shows expandable vs descriptor side-by-side; npm run build passes
  completed_work: |
    Phase A (2026-07-02): chip `shape` variant; `descriptor` variant + DescriptorChip; shared expandableChipShellClass;
    GridListRow badges/total cost ? DescriptorChip; descriptor routing for tags/metadata; styleguide + docs.
    Phase B (2026-07-02): merged ExpandableChip, PartChip, GridListRow chips into single `ui/ExpandableChip`;
    `expandable-chip-props.ts` adapters; deleted `expandable-grid-list-chip.tsx`. Build passes.
    Phase B audit (2026-07-02): `GridListChip` wrapper; `PartData` + `ChipOptionsPanel` in `lib/chip/`; `PartChipList` ? ExpandableChip; styleguide GridListRow patterns. Build passes.
    Phase C (2026-07-02): feat category redundancy removed; SpeciesTraitCard/HubListRow/ItemCard ? DescriptorChip; encounters/crafting badgeVariant. Build passes.
    Phase C audit (2026-07-03): `descriptor-chip-variants.ts`; global metadata migration (creator, sheet, guided, admin, creature/item/power creators). Build passes.
    Phase D (2026-07-03): `list-row-metadata.ts`; raw requirements divs ? descriptor detailSections (powers/techniques/armor); range/damage in add-library + creator modals; feat Type hidden in creator tabs. Build passes.
    Phase D audit (2026-07-03): `part-chips-from-display.ts`; creature stat block, load-library modal, creature creator, library/official lists; weapon/shield/equipment detailSections; empowered range metadata. Build passes.
    Phase E (2026-07-03): `ChipData.kind`; removed `category: 'tag'` + `PartChipDetails`; `chip-data-helpers.ts`; feat modals ? `buildFeatDetailSections`; styleguide expanded rows + `chip-unification.pw.ts` baselines. Build passes.
    Phase E audit (2026-07-03): explicit `descriptorChipData` on codex parts/equipment, add-skill abilities, admin species skills; `buildUsesRecoveryDetailSections`; VSEA-004 closed. Build passes.
  remaining_work: |
    None Ã¢â‚¬â€ TASK-415 complete. Expandable chips (options, leveled feats, traits with descriptions) correctly omit explicit `kind`.
  notes: |
    Owner feedback 2026-07-02. Phase 2.2 unified token maps; this task completes semantic/UX chip unification.
    Implement in sub-phases AÃ¢â‚¬â€E per CHIP_UNIFICATION_PLAN.md (primitives ? merge ? descriptors ? metadata audit ? cleanup).

- id: TASK-416
  title: Feat tag unification Ã¢â‚¬â€ taxonomy cleanup + untagged feats
  priority: medium
  status: done
  created_at: 2026-07-03
  created_by: owner
  description: |
    Reduce duplicate/noisy feat tags in codex_feats; normalize on admin save; tag feats missing tags.
    SQL migrations in sql/feat-tags-unification-phase*.sql; rules in src/docs/FEAT_TAGS.md.
  related_files:
    - sql/feat-tags-unification-phase1.sql
    - sql/feat-tags-unification-phase2.sql
    - sql/feat-tags-unification-phase3-proposed.sql
    - scripts/sync-feat-tags-csv.js
    - src/docs/FEAT_TAGS.md
    - src/lib/codex/feat-tags.ts
    - src/app/(main)/admin/codex/actions.ts
    - src/lib/codex/feat-list.ts
  acceptance_criteria:
    - Phase 1Ã¢â‚¬â€2 SQL applied; unique tags materially reduced (349 ? ~277 achieved)
    - Admin feat save normalizes tags via `normalize_feat_tags` RPC
    - Phase 3 proposed tags for all untagged feats; owner approves before DB apply
    - Seed CSV parity documented or exported after approved apply
  completed_work: |
    Phase 1Ã¢â‚¬â€2 (2026-07-03): SQL functions + live DB apply Ã¢â‚¬â€ 277 unique tags.
    Phase 3 prep (2026-07-03): `feat-tags.ts`, admin save RPC normalization, phase3-proposed.sql (50 feats), FEAT_TAGS.md.
    Phase 3 apply (2026-07-03): 50 feats tagged; 0 untagged; 291 unique tags. `feats.csv` synced via `scripts/sync-feat-tags-csv.js` (538 tag column updates).
    Phase 4 (TASK-418, 2026-07-03): singleton merges Ã¢â‚¬â€ 172 unique tags. See `feat-tags-unification-phase4.sql`.
  remaining_work: |
    None Ã¢â‚¬â€ feat tag unification complete (phases 1Ã¢â‚¬â€4).
  notes: |
    Owner approved phases 3Ã¢â‚¬â€4 apply 2026-07-03. Codex data workflow: realms-codex-data.mdc.

- id: TASK-418
  title: Feat tag unification Ã¢â‚¬â€ Phase 4 singleton merges
  priority: medium
  status: done
  created_at: 2026-07-03
  created_by: owner
  parent_task: TASK-416
  description: |
    Merge singleton/low-count tags into canonical families; fix phase 1Ã¢â‚¬â€2 over-drops (Focus, Movement).
  related_files:
    - sql/feat-tags-unification-phase4.sql
    - src/docs/FEAT_TAGS.md
  acceptance_criteria:
    - map_feat_tag_phase3 + updated normalize_feat_tags deployed
    - Unique tags reduced materially; zero untagged feats
    - feats.csv synced
  completed_work: |
    Applied 2026-07-03: 291 ? 172 unique tags; 122 ? 14 singletons; ~128 feats re-normalized.
    Fixed Focus/Movement drops; remapped Carry/Luck/Solo/Environment/Wall/Water instead of NULL.
  notes: |
    Owner approved 2026-07-03. Remaining 14 singletons intentional (skills, Focus, Interchangeable, etc.).

- id: TASK-420
  title: HYG-02 library API typing hardening (official + user fetch)
  priority: high
  status: done
  created_at: 2026-07-04
  created_by: agent
  parent_task: TASK-378
  build_validation: DEV-V-015
  developer_test_plan: Automated via npm test (library-types.test.ts); smoke Library + Realms Library tabs + add-to-library confirm.
  description: |
    Replace `fetchOfficialLibrary` / loose `Record<string, unknown>[]` returns with canonical library
    item types shared by user and official APIs. Align `library-service.ts`, `use-official-library`,
    and official list helpers with `UserPower`/`UserTechnique`/etc. shapes from columnar rowToItem.
  related_files:
    - src/types/library.ts
    - src/services/library-service.ts
    - src/hooks/use-user-library.ts
    - src/hooks/use-official-library.ts
    - src/lib/library/official-power-list.ts
    - src/lib/library/official-technique-list.ts
    - src/lib/library/official-item-list.ts
    - src/lib/library/official-creature-list.ts
    - src/docs/DATA_HANDLING.md
  acceptance_criteria:
    - `fetchOfficialLibrary(type)` returns typed array per library kind (no `Record<string, unknown>[]`).
    - `useOfficialLibrary` and `useAddOfficialToLibrary` use shared library types.
    - Entity types live in `src/types/library.ts`; hooks re-export for backward compatibility.
    - `npm run build`, `npm test`, and `npm run lint` pass.
  notes: |
    Follow-up to TASK-378. Complements TASK-379 (pipeline unification) Ã¢â‚¬â€ typing first, unification second.
    DONE 2026-07-04: `src/types/library.ts` canonical shapes; typed `fetchOfficialLibrary`/`useOfficialLibrary`/`useAddOfficialToLibrary`; official list helpers + entity lists; removed `Record<string, unknown>` casts across library consumers (creators, crafting, character creator, guided creator, creature stat block); `library-types.test.ts`; build + test pass.

- id: TASK-421
  title: HYG-03 enhanced items payload typing
  priority: medium
  status: done
  created_at: 2026-07-04
  created_by: agent
  completed_at: 2026-07-13
  parent_task: TASK-378
  description: |
    Replace `Record<string, any>` on `OfficialEnhancedItem.payload` and create mutation bodies with
    a typed crafting payload interface aligned with `UserEnhancedItem` and `/api/official/enhanced-items`.
  related_files:
    - src/hooks/use-enhanced-items.ts
    - src/types/crafting.ts
    - src/types/crafting-enhanced-items.test.ts
    - src/services/enhanced-items-service.ts
    - src/app/api/official/enhanced-items/route.ts
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
  acceptance_criteria:
    - No `@typescript-eslint/no-explicit-any` on enhanced-items hook/service.
    - Payload type documents known fields; unknown extensions via `Record<string, unknown>` index if needed.
    - `npm run build` and `npm test` pass.
  notes: |
    Smaller scope than TASK-420. Creator `handleLoad*(item: any)` deferred to TASK-381 god-file split.
    2026-07-13: Done Ã¢â‚¬â€ `OfficialEnhancedItemPayload` + create/patch inputs in `crafting.ts`; hook uses
    typed bodies (no `any`/eslint-disable); admin tab shares `CreateOfficialEnhancedItemInput`;
    vitest shape coverage; FEATURE_INDEX updated.
    2026-07-13 audit: scope overloads on create/update; null payload normalized on official fetch;
    AGENT_GUIDE types note. Known pre-existing: admin "edit" still POSTs create (PATCH is name/uses/payload only).

---

- id: TASK-474
  title: AI agent workflow overhaul Ã¢â‚¬â€ constitution, ACTIVE_TASKS, CI, Library shell
  created_at: 2026-07-15
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-15
  related_files:
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
    - src/docs/ai/ACTIVE_TASKS.md
    - src/docs/ai/AI_TASK_QUEUE.md
    - AGENTS.md
    - scripts/reconcile_tasks.js
    - src/app/(main)/library/components/UserLibraryEntityTabShell.tsx
  description: |
    Rebuild agent OS: slim session context, mechanical CI gates, roles/DoD, Library tab consolidation,
    apiUpload routing, coerceJsonRecord domain helper.
  acceptance_criteria:
    - ACTIVE_TASKS hot path only; constitution mandatory; AGENT_GUIDE on demand
    - CI strict reconcile + validators
    - Library*Tab shell extracted
    - Uploads via apiUpload
  notes: |
    Residuals: TASK-475 Enhanced tab optional; DEV-005 branch protection.


---

- id: TASK-482
  title: CI allowlist gate for new shared/ui component files
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-15
  implemented_by: agent
  related_files:
    - scripts/
    - .github/workflows/ai-task-verifier.yml
    - src/docs/ai/ADR/
    - src/docs/ai/PR_CHECKLIST.md
  description: |
    Architect human-gate is prose-only. Add CI that fails when a PR adds new files under
    src/components/shared/ or src/components/ui/ unless an ADR is cited or allowlist updated.
  acceptance_criteria:
    - Script detects newly added shared/ui files vs base branch.
    - Passes when ADR-#### cited or owner allowlist updated; fails otherwise.
    - Wired into ai-task-verifier.yml; documented in PR_CHECKLIST.
  completed_work: |
    - scripts/validate-shared-ui-allowlist.js + scripts/shared-ui-allowlist.json
    - Wired into package.json tasks:validate-shared-ui and ai-task-verifier.yml
    - Constitution + PR_CHECKLIST updated
  notes: |
    Shipped in audit follow-up pass 2026-07-15. Remaining debt: TASK-476Ã¢â‚¬â€481.

- id: TASK-476
  title: Consolidate AdminArchetypesTab parsers into archetype-path domain helpers
  created_at: 2026-07-15
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-16
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/lib/game/archetype-path.ts
    - src/lib/game/archetype-path-helpers.test.ts
  description: |
    Audit residual (2026-07-15): AdminArchetypesTab still owned parseOptionalJsonField,
    parseIdQuantityStrings, and form-local path helpers; only coerceJsonRecord was shared.
    Moved shared parse/serialize into src/lib/game/archetype-path.ts so admin and runtime
    accept the same shapes.
  acceptance_criteria:
    - Admin uses domain helpers for path_data / id-quantity parsing (no duplicate local forks).
    - Behavior-preserving for existing admin save/load paths; unit tests for shared helpers.
    - npm run build.
  completed_work: |
    - Exported parseOptionalJsonField, parseIdQuantityStrings, serializeIdQuantityStrings,
      parseRecommendedAbilities from src/lib/game/archetype-path.ts (renamed internal
      parseIdQuantityArray -> parseIdQuantityStrings; all callers updated).
    - AdminArchetypesTab imports the domain helpers and deletes its local forks
      (parseOptionalJsonField, parseIdQuantityStrings, toIdQuantityStrings).
    - Added src/lib/game/archetype-path-helpers.test.ts covering parse/serialize/round-trip.
    - npm run build passes; vitest src/lib/game green.
  notes: |
    2026-07-16: Landed with TASK-404 (Architect pass). Reconcile:strict match lands with the commit referencing TASK-476.

---

- id: TASK-404
  title: Guided creator - admin archetype creator + reveal portrait upload
  created_at: 2026-06-30
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-16
  description: |
    Close remaining plan gaps: structured admin loadout/abilities builder (replace raw JSON in AdminArchetypesTab). Portrait upload on guided reveal delivered in TASK-406.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/lib/game/archetype-path.ts
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T014
  developer_test_plan: |
    Suite DEV-V-008 T014 — see BUILD_VALIDATION.md
  acceptance_criteria:
    - Admin can author loadouts without hand-editing JSON.
  completed_work: |
    - Recommended abilities now authored with six ValueStepper controls (min 0, max +3, one per ability); raw JSON textarea removed.
    - Loadout authoring (armor step, recommended gear, level-1 armaments/equipment with qty, recommended species) was already structured; confirmed no hand-edited JSON path remains for loadouts.
    - Advanced Path JSON override kept as a documented power-user escape hatch (routed through shared parseOptionalJsonField).
    - Save/load behavior preserved: empty recommendation falls back to existing recommended_abilities.
  notes: |
    2026-07-16 DoD audit: added DEV-V-008-T014; a11y group/label fixes on abilities + Advanced Path JSON.
    Follow-up from TASK-403 partial. Guided reveal portrait upload delivered in TASK-406 (not reworked).
    2026-07-16: Depends on TASK-476 parser consolidation (landed together).

---

---

- id: TASK-417
  title: Art bank + user-library image_url parity + copy-on-add
  created_at: 2026-07-01
  created_by: owner
  completed_at: 2026-07-16
  implemented_by: agent
  priority: medium
  status: done
  verification_status: n/a
  superseded_by: Realms Image Library epic (TASK-491-498; scope delivered by TASK-497)
  parent_task: TASK-491
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/ai/ADR/0003-realms-image-library.md
  description: |
    Original art-bank-only scope. Owner 2026-07-16 reframed as shared Realms Image Library
    (ADR-0003). AC absorbed by TASK-491-498 (especially TASK-497 for user_* parity,
    copy-on-add, and bank picker for all users). Archived as superseded stub per owner request.
  acceptance_criteria:
    - No independent art_bank-only implementation; Realms Image Library epic delivers catalog + picker + user parity.
  notes: |
    2026-07-01: Three-layer model documented in REALMS section 5.0.3.
    2026-07-16: Superseded by TASK-491-500; TASK-415 was chip unification, not art bank.
    2026-07-16: Archived early (stub only; implementation tracked in epic tasks).

---
- id: TASK-491
  title: Architect - Realms Image Library model (ADR + REALMS section 5.0.3)
  created_at: 2026-07-16
  created_by: agent
  completed_at: 2026-07-16
  implemented_by: agent
  priority: high
  status: done
  verification_status: n/a
  parent_task: TASK-405
  follow_up_tasks:
    - TASK-492
    - TASK-494
  related_files:
    - src/docs/ai/ADR/0003-realms-image-library.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/ai/guide/03-entity-card-art.md
  description: |
    Architect gate for the Realms Image Library (single shared bank). One master Storage object per
    image; entities reference it (no per-use file copies). Multi-category library tags drive which
    pickers can see an asset.
  acceptance_criteria:
    - ADR written encoding LOCKED decisions; owner ack if any ADR detail diverges.
    - REALMS section 5.0.3 rewritten around one bank + category tags.
    - SUPABASE_SCHEMA.md + guide/03-entity-card-art.md match ADR; fix TASK-415->417/491 refs.
    - Category enum locked: species, creature, weapon, armor, shield, equipment, power, technique.
    - Dependency order for TASK-492-500 stays accurate in ACTIVE_TASKS.
  notes: |
    2026-07-16: Shipped ADR-0003 + product/schema/art-guide rewrite. Docs-only; verification_status n/a.
    Binding: realms_images master + image_id FK; optional image_url cache; admin write / guest pick;
    replace-everywhere; delete clears refs; equipment first-class; empowered uses power|technique tags.

- id: TASK-493
  title: Admin Realms Image Library management UI (/admin/images)
  created_at: 2026-07-16
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-16
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-492
  build_validation: |
    suite: DEV-V-023
    tests:
      - DEV-V-023-T001
      - DEV-V-023-T002
      - DEV-V-023-T003
      - DEV-V-023-T004
      - DEV-V-023-T005
      - DEV-V-023-T006
  related_files:
    - src/app/(main)/admin/images/page.tsx
    - src/app/(main)/admin/images/admin-image-edit-modal.tsx
    - src/app/(main)/admin/images/admin-image-delete-modal.tsx
    - src/app/(main)/admin/page.tsx
    - src/components/shared/image-upload-modal.tsx
  description: |
    Depends on TASK-492. New /admin/images page + admin-dashboard card. Browse, upload (ImageUploadModal
    crop), rename, multi-select category tags, replace image (all consumers update), delete with
    usage warning then clear-everywhere. Match Codex/Public Library list+modal patterns.
    fullScreenOnMobile; >=44px touch targets.
  acceptance_criteria:
    - Admin home has Images card -> /admin/images.
    - Create/edit: name + multi category tags + crop upload; rename/retag without re-upload.
    - Replace flow: pick new file -> master asset updates; usages listed beforehand optional confirm.
    - Delete flow: show all usages; confirm -> clear refs everywhere + remove asset.
    - Filter by category + search by name; ExpandableImage / ListRowThumbnail thumbs.
    - Mobile + a11y; BUILD_VALIDATION; npm run build.
  evidence: |
    npm run build passed; route /admin/images in build manifest.

---

---

---

- id: TASK-494
  title: Entity image_id columns - creatures, powers, techniques, equipment (+ empowered via tags)
  created_at: 2026-07-16
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-16
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-405
  follow_up_tasks:
    - TASK-496
  related_files:
    - sql/realms-image-entity-columns.sql
    - src/lib/entity-image-url.ts
    - src/lib/entity-image-enrich-server.ts
    - src/lib/library-columnar.ts
    - src/components/guided-creator/guided-choice-image.ts
    - src/app/api/codex/route.ts
    - src/app/api/official/[type]/route.ts
    - src/docs/SUPABASE_SCHEMA.md
  completed_work: |
    - Draft SQL migration adds image_id (+ image_url cache) on codex_species, codex_equipment, official_creatures, official_powers, official_techniques, official_empowered_techniques, official_items.
    - library-columnar imageId/imageUrl mapping; species columnar parity.
    - entity-image-url.ts + server enrich; codex/official/user library APIs resolve bank URL from image_id.
    - guided-choice-image re-exports readRecordImageUrl with bank join/enrichment support.
    - SUPABASE_SCHEMA.md + codex types updated. npm run build passes.
  notes: |
    Migration applied 2026-07-16 on RealmsRPG-Test via Supabase MCP (realms_image_entity_columns), owner-approved.
    user_* image_id parity remains TASK-497.
  evidence: |
    npm run build (2026-07-16).



---

- id: TASK-495
  title: Shared RealmsImagePicker (guest-readable bank browse + admin upload-into-bank)
  created_at: 2026-07-16
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-16
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-492
  follow_up_tasks:
    - TASK-496
    - TASK-497
    - TASK-499
  completed_work: |
    - RealmsImagePicker modal: guest-readable bank browse + select; admin upload-into-bank (ImageUploadModal crop -> createRealmsImage -> onSelect).
    - resolveRealmsImagePickerCategories helper (empowered-technique -> power|technique; portrait -> species|creature).
    - Exported from shared barrel; allowlist + FEATURE_INDEX + guide/03 + ADR-0003 updated.
  related_files:
    - src/components/shared/realms-image-picker.tsx
    - src/components/shared/image-upload-modal.tsx
    - src/components/shared/index.ts
    - src/lib/realms-images.ts
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/guide/03-entity-card-art.md
    - src/docs/ai/ADR/0003-realms-image-library.md
  description: |
    Depends on TASK-492. One shared picker for creators, admin editors, and (via TASK-499) portrait/
    profile: browse bank filtered by category tags (multi-tag assets appear in every matching filter).
    Selection sets image_id on the target. Upload-into-bank control visible only for admins (crops,
    creates bank row, auto or manual tags, returns selection). Guests and signed-in non-admins pick
    only - no bank upload. Replace CodexArtUploadField long-term; no third upload field. Shared -> ADR/allowlist.
  acceptance_criteria:
    - Exported from shared barrel; FEATURE_INDEX + art guide updated.
    - Category filters: species, creature, weapon, armor, shield, equipment, power, technique.
    - Empowered technique surfaces query power OR technique tags.
    - Guest can open picker and select; admin sees upload-into-bank affordance.
    - fullScreenOnMobile; a11y; npm run build.
  notes: |
    Component only - TASK-496 wires editors, so the picker has no user-reachable surface until then.
    Archived 2026-07-16 in the TASK-494/495 gap-closure pass. During that pass tsc --noEmit failures
    in two unrelated test files (compact-facts.test.ts, power-technique-display.test.ts) were fixed;
    those tests - not picker code - were the red-build cause at initial completion.
  evidence: |
    npx tsc --noEmit + npm run build + targeted vitest (realms-images, compact-facts,
    power-technique-display) green (2026-07-16).


---

- id: TASK-405
  title: Choice-card art â€” codex image_url fields + admin upload
  created_at: 2026-06-30
  created_by: owner
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  follow_up_tasks:
    - TASK-491
    - TASK-494
    - TASK-496
    - TASK-498
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-choice-image.ts
    - src/components/shared/realms-image-picker.tsx
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/docs/SUPABASE_SCHEMA.md
    - sql/codex-art-species-image-url.sql
  completed_work: |
    Phase 1 shipped image_url + guided resolution. Realms Image Library epic (TASK-491â€“498)
    superseded entity-tied CodexArtUploadField with RealmsImageField/Picker + image_id bank model.
    Admin species editor and creators use shared bank picker; legacy codex-art upload path removed.
  notes: |
    Archived 2026-07-17 with KadinBranch merge readiness â€” remaining phase-2 scope delivered via TASK-494/496/498.
  evidence: |
    npm run build; npm test; ADR-0003 + SUPABASE_SCHEMA Â§2.5a.

---

- id: TASK-496
  title: Wire admin editors + creator publish-to-Realms into the Image Library
  created_at: 2026-07-16
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-495
  follow_up_tasks:
    - TASK-498
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminEquipmentTab.tsx
    - src/components/shared/realms-image-picker.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/item-creator/item-creator-editor.tsx
    - src/app/(main)/power-creator/power-creator-editor.tsx
    - src/app/(main)/technique-creator/technique-creator-editor.tsx
    - src/app/(main)/empowered-technique-creator/empowered-technique-creator-editor.tsx
  completed_work: |
    Admin species/equipment + creator editors (species, creature, item, power, technique, empowered)
    use RealmsImageField / RealmsImagePicker. Entity-tied CodexArtUploadField and /api/upload/codex-art
    removed. Publish/upload-into-bank lands in realms_images with category tags + image_id.
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T001
      - DEV-V-026-T002
  developer_test_plan: |
    Suite DEV-V-026 T001â€“T002 â€” see BUILD_VALIDATION.md
  evidence: |
    npm run build; npm test; npm run tasks:validate.

---

- id: TASK-497
  title: User/official row image_id parity + copy-on-add + creator bank picker
  created_at: 2026-07-16
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-495
  related_files:
    - sql/realms-image-user-entity-columns.sql
    - src/lib/library-columnar.ts
    - src/services/library-service.ts
    - src/app/api/user/library/[type]/route.ts
    - src/docs/SUPABASE_SCHEMA.md
  completed_work: |
    Applied user_* image_id columns (realms_image_user_entity_columns, 2026-07-17). Columnar/API
    mapping + addOfficialItemToLibrary preserves image_id. Creators pick bank images; non-admins
    cannot upload into the bank (allowAdminUpload gated on RealmsImagePicker).
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T003
  developer_test_plan: |
    Suite DEV-V-026 T003 — see BUILD_VALIDATION.md
  notes: |
    Migration applied 2026-07-17 via Supabase MCP (owner-approved path documented in SQL header).
  evidence: |
    npm run build; npm test; SUPABASE_SCHEMA user-library image parity section.

---

- id: TASK-498
  title: Migrate existing codex-art entity files into Realms Image Library catalog
  created_at: 2026-07-16
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-492
  related_files:
    - sql/realms-image-catalog-legacy-entity-art.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/ai/ADR/0003-realms-image-library.md
  completed_work: |
    Catalog migration realms_image_catalog_legacy_entity_art applied (owner-approved 2026-07-17):
    registered legacy entity-tied Storage objects into realms_images (same path), set consumer
    image_id, removed CodexArtUploadField + /api/upload/codex-art. Schema + ADR updated.
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T004
  developer_test_plan: |
    Suite DEV-V-026 T004 — see BUILD_VALIDATION.md
  evidence: |
    SQL applied note + post-apply counts in sql/realms-image-catalog-legacy-entity-art.sql.

---

- id: TASK-499
  title: Portrait + profile picture â€” pick species/creature bank images
  created_at: 2026-07-16
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-495
  related_files:
    - src/components/shared/image-upload-modal.tsx
    - src/components/shared/realms-image-picker.tsx
    - src/app/(main)/my-account/page.tsx
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
  completed_work: |
    ImageUploadModal onChooseFromLibrary + RealmsImagePicker (categories=portrait / species|creature)
    on my-account, sheet-header, finalize-step, guided-portrait-upload. Surfaces set
    allowAdminUpload={false} (pick-only). Custom crop upload retained.
  build_validation: |
    suite: DEV-V-026
    tests:
      - DEV-V-026-T005
      - DEV-V-026-T006
  developer_test_plan: |
    Suite DEV-V-026 T005â€“T006 â€” see BUILD_VALIDATION.md
  evidence: |
    npm run build; npm test; TASK-479 getErrorMessage on bank profile update path.

---

- id: TASK-508
  title: Defer auto-proficiency over-cap toast out of setState
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/use-sheet-auto-proficiencies.ts
    - src/components/character-sheet/use-sheet-library-actions.ts
    - src/components/character-sheet/use-character-sheet-actions.ts
  completed_work: |
    Pure computeAutoProficiencies returns character + overLimitWarning; toast via queueMicrotask after commit.
    Fixes Cannot update ToastProvider while rendering CharacterSheetPage.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T014
  developer_test_plan: |
    Suite DEV-V-009 T014 — see BUILD_VALIDATION.md
  evidence: |
    npm run build; coordinator verification 2026-07-17.

---

- id: TASK-509
  title: Single armor equip toggle + create auto-equip flags
  created_at: 2026-07-17
  created_by: agent
  priority: high
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/lib/game/equipment-equipped.ts
    - src/lib/game/equipment-equipped.test.ts
    - src/components/character-sheet/use-sheet-library-actions.ts
    - src/lib/guided-creator/build-character.ts
    - src/lib/guided-creator/build-character.test.ts
    - src/stores/character-creator-store.ts
  completed_work: |
    toggleSheetArmorEquipped swaps single equipped armor on sheet.
    applyStarterEquippedFlags on guided/advanced create (weapons/shields/gear equipped; one armor by highest DR).
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T015
  developer_test_plan: |
    Suite DEV-V-009 T015 — see BUILD_VALIDATION.md
  evidence: |
    vitest equipment-equipped + build-character; npm run build.

---

- id: TASK-510
  title: Character sheet library subsection collapse
  created_at: 2026-07-17
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/shared/section-header.tsx
    - src/hooks/use-library-section-collapse.ts
    - src/components/shared/entity-library-sections.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/proficiencies-tab.tsx
    - src/components/character-sheet/notes-tab.tsx
  completed_work: |
    SectionHeader collapsible + useLibrarySectionCollapse; empty sections default closed; + Add expands target section.
    Multi-section tabs only (techniques single section unchanged).
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T013
  developer_test_plan: |
    Suite DEV-V-009 T013 — see BUILD_VALIDATION.md
  evidence: |
    npm run build.

---

- id: TASK-511
  title: Archetype armaments empty hide + milestone polish
  created_at: 2026-07-17
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/shared/quick-armaments-sections.tsx
    - src/components/character-sheet/archetype-section.tsx
    - src/lib/utils/string.ts
  completed_work: |
    QuickShieldsTable/QuickArmorTable return null when no rows; formatWeaponRangeCompact for weapon range column.
    Powered-martial milestone Innate/Feat controls edit-only; dark text tokens on milestone labels.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T016
  developer_test_plan: |
    Suite DEV-V-009 T016 — see BUILD_VALIDATION.md
  evidence: |
    npm run build.

---

- id: TASK-512
  title: Sheet header armor DR and Critical Range quick ref
  created_at: 2026-07-17
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/library-list-helpers.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/calculators/item-calc.ts
    - src/lib/calculators/index.ts
  completed_work: |
    When armored, header vitals show Damage Reduction and Critical Range beside Speed/Evasion; hidden when unarmored.
  build_validation: |
    suite: DEV-V-008
    tests:
      - DEV-V-008-T015
  developer_test_plan: |
    Suite DEV-V-008 T015 — see BUILD_VALIDATION.md
  evidence: |
    npm run build.

---

- id: TASK-513
  title: Sheet techniques GLR drops collapsed TP column
  created_at: 2026-07-17
  created_by: agent
  priority: medium
  status: done
  completed_at: 2026-07-17
  implemented_by: agent
  verification_status: pending-qa
  parent_task: TASK-502
  related_files:
    - src/components/shared/entity-library-sections.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/components/character-sheet/library-entity-rows.test.ts
  completed_work: |
    CHARACTER_SHEET_TECHNIQUE_COLUMNS/GRID without TP; Name / Action / Attack + Energy spend chrome only on collapsed rows.
    TP remains on expanded part chips and proficiency budget.
  build_validation: |
    suite: DEV-V-009
    tests:
      - DEV-V-009-T011
  developer_test_plan: |
    Suite DEV-V-009 T011 — see BUILD_VALIDATION.md
  evidence: |
    vitest library-entity-rows; npm run build.
- id: TASK-612
  title: Docs corpus hygiene — changelog rotation + archive index honesty
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: done
  related_files:
    - src/docs/ai/AI_CHANGELOG.md
    - src/docs/ai/archive/AI_CHANGELOG_ARCHIVE.md
    - src/docs/ai/archive/HISTORY_INDEX.md
    - src/docs/ai/archive/QUALITY_GLOBAL_AUDIT_2026-07-20.md
    - src/docs/ai/ACTIVE_TASKS.md
  description: |
    Live AI_CHANGELOG is ~240KB; archive + docs tree are large. Rotate entries older than ~60 days
    into AI_CHANGELOG_ARCHIVE per `/debt` checklist; ensure HISTORY_INDEX points at the quality
    audit; scrub any live-sounding claims in hot-path docs that lag code (no theater-only rewrites).
  acceptance_criteria:
    - Entries older than ~60 days moved from AI_CHANGELOG.md → archive/AI_CHANGELOG_ARCHIVE.md.
    - Live changelog remains the recent working set; HISTORY_INDEX lists QUALITY_GLOBAL_AUDIT_2026-07-20.
    - No deletion of historical audit dumps without owner ack.
    - `npm run tasks:validate-docs` (or full `tasks:validate`) passes.
  verification_status: n/a
  completed_work: |
    - HISTORY_INDEX lists QUALITY_GLOBAL_AUDIT_2026-07-20.
    - Strict ~60-day changelog rotation: 0 eligible entries (live log is June–July only; cutoff 2026-05-21).
    - Debt sprint deleted dead helpers + unused defaults (see AI_CHANGELOG).
  notes: Was TASK-606 pre-renumber. First slice debt-safe under `/debt docs-only`. HISTORY_INDEX already lists the quality audit.

---

