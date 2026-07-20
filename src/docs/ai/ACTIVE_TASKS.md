# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-607
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-600, 599, 598, 596, 594, 597, 584, 587, 586, 583, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 8 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** `/debt` after `/global-audit` filed TASK-601–606. TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

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

- id: TASK-601
  title: Extract technique / empowered / species creator workspaces (TASK-381 remainder)
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/power-creator/use-power-creator-workspace.ts
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

---

- id: TASK-602
  title: Recovery modal → SegmentedControl + theme-aware status tokens
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
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
    From 2026-07-20 /global-audit. Visual change — verify against sheet Recovery flow.

---

- id: TASK-603
  title: Unify Advanced + Guided portrait upload components
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-creator/steps/finalize/portrait-upload.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/shared/image-upload-modal.tsx
    - src/lib/api-client.ts
  description: |
    Consolidate near-duplicate PortraitUpload / GuidedPortraitUpload onto one shared presenter
    (props for store wiring). Prefer a single save-time portrait upload helper using apiUpload +
    getErrorMessage rather than duplicated catch strings.
  acceptance_criteria:
    - One shared portrait UI module used by Advanced finalize + Guided reveal.
    - Upload errors surface via getErrorMessage (or equivalent api-client helper).
    - No parallel ImageUploadModal forks; npm run build passes.
  notes: |
    From 2026-07-20 /global-audit. Sheet portrait path already uses apiUpload — align creators.

---

- id: TASK-604
  title: CreatureStatBlock weapon attack bonus → weapon-attack-ability helper
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/shared/creature-stat-block.tsx
    - src/lib/game/weapon-attack-ability.ts
    - src/components/character-sheet/library-list-helpers.ts
  description: |
    Delete local getWeaponAttackBonus in CreatureStatBlock; wire getWeaponAttackBonusFromProperties
    (or thin wrapper) so finesse/range/strength rules match sheet + guided equipment.
  acceptance_criteria:
    - No local attack-bonus fork in creature-stat-block.tsx.
    - Displayed bonuses match sheet helper for same properties/abilities/prof.
    - Vitest or existing attack-ability tests cover the shared path; npm run build passes.
  notes: |
    From 2026-07-20 /global-audit. Behavior-sensitive — compare melee/finesse/ranged cases.

---

- id: TASK-605
  title: Document or redesign MixedSpeciesModal selection grammar
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/character-creator/MixedSpeciesModal.tsx
    - src/components/character-creator/steps/species-step.tsx
    - src/components/character-sheet/edit-species-modal.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - .cursor/rules/realms-unification.mdc
  description: |
    MixedSpeciesModal is a dual-species picker (not list add-X). Either mark it an intentional
    non-USM exception in FEATURE_INDEX + unification rule (like AddCombatantModal), or redesign
    onto UnifiedSelectionModal / dual-select product grammar with owner ack.
  acceptance_criteria:
    - FEATURE_INDEX + realms-unification document the chosen path (exception or USM redesign).
    - If redesign: Advanced species-step + sheet Edit Species keep mixed-species behavior.
    - npm run build passes.
  notes: |
    From 2026-07-20 /global-audit. Prefer docs-only exception unless owner wants USM dual-select.

---

- id: TASK-606
  title: Owner ack — Advanced CreatorResourceBar → PointStatus / LoadoutBudgetBar grammar
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/character-creator/CreatorResourceBar.tsx
    - src/components/guided-creator/loadout-budget-bar.tsx
    - src/components/shared/point-status.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Advanced creator still uses plain CreatorResourceBar (TP/currency/energy text) while Guided
    uses LoadoutBudgetBar → PointStatus. Product split was noted in TASK-596. Needs owner ack
    before unifying Advanced onto PointStatus grammar, or permanently document the fork.
  acceptance_criteria:
    - Owner chooses unify vs keep fork.
    - If unify: Advanced equipment/powers/finalize use PointStatus (or LoadoutBudgetBar where TP+currency).
    - If keep: FEATURE_INDEX states permanent Advanced vs Guided resource chrome split.
  notes: |
    From 2026-07-20 /global-audit. Pause for owner ack before implement.

---
