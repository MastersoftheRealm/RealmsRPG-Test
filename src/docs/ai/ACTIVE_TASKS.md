# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-600
**Waiting / blocked / human:** [`WAITING_TASKS.md`](WAITING_TASKS.md)
**Done archive:** [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md) · snapshot [`archive/TASK_QUEUE_DONE_2026-07-15.md`](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md) · Template: [`AI_REQUEST_TEMPLATE.md`](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [`DEVELOPER_TASK_QUEUE.md`](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-584, 587, 586, 583, 581, 582, 580, 578, etc.)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 7 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Audit multitask: TASK-593 + TASK-595 done. Remaining from `/global-audit`: TASK-594, 596–599. TASK-326 partial (HIBP → DEV-001). TASK-500 deferred.

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

# Sheet / creator debt follow-ups (from `/global-audit` 2026-07-20)

- id: TASK-594
  title: Unify sheet EditSpecies/EditArchetype with creator/guided species+path primitives
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/edit-species-modal.tsx
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/components/character-creator/species-modal.tsx
    - src/components/character-creator/MixedSpeciesModal.tsx
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/guided-creator/guided-species-detail-modal.tsx
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/shared/choice-trait-option-select.tsx
  description: |
    Sheet edit-species (~819 LOC) and edit-archetype (~542 LOC) duplicate creator/guided
    species ancestry and path-picker flows. Extract shared primitives (trait pickers, path
    option lists, migration/confirm) and thin the sheet modals. Keep sheet-specific save
    migration (skills after species change) and path-switch confirms.
  acceptance_criteria:
    - No parallel trait-resolution / path-card chrome beyond documented guided L1 grammar.
    - Sheet edit flows still migrate skills and confirm path/forge switches.
    - Mobile fullScreenOnMobile scroll remains correct (no unconditional max-h vh).
    - Build + targeted smoke of edit species/archetype on a saved character.
  notes: |
    Product ack if UX should match GuidedChoiceCard vs SelectionCard. `/debt` already fixed
    max-h under fullScreenOnMobile and wired SpeciesModal to findTraitByIdOrName.

---

- id: TASK-596
  title: Extract Advanced equipment-step catalog into lib (guided parity)
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-creator/steps/equipment-step.tsx
    - src/lib/guided-creator/equipment-catalog-rows.ts
    - src/lib/guided-creator/equipment-eligibility.ts
    - src/lib/guided-creator/loadout-tp.ts
    - src/hooks/use-guided-equipment-catalog.ts
    - src/docs/ai/GUIDED_EQUIPMENT_PHASED_SPEC.md
  description: |
    Advanced `equipment-step.tsx` (~1404 LOC) inlines catalog merge, currency/TP, path
    recommendations, and list rows. Guided already extracted tested modules. Pull Advanced
    pure catalog/budget logic into `lib/` (shared or character-creator) mirroring guided
    patterns; keep Advanced page UX (inline list, CreatorResourceBar) unless product asks
    for USM add-X.
  acceptance_criteria:
    - Pure helpers extracted with vitest; equipment-step becomes UI wiring.
    - Path recommend / currency / TP behavior unchanged vs BUILD_VALIDATION DEV-V-001 equipment tests.
    - No new parallel budget chrome; do not force LoadoutBudgetBar into Advanced without ack.
  notes: |
    Product decision: keep Advanced inline catalog vs migrate add onto USM — default keep list UX.

---

- id: TASK-597
  title: Campaign RM character view reuses sheet derived assemble
  created_at: 2026-07-20
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/campaigns/[id]/view/[userId]/[characterId]/page.tsx
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
    Prefer extending CharacterSheetBody/context with isReadOnly over forking sections.

---

- id: TASK-598
  title: Split oversized sheet + Advanced creator hot files
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/components/character-creator/steps/equipment-step.tsx
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-creator/steps/powers-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
  description: |
    God-file hygiene after TASK-381 sheet facade: split sheet-header, library-section,
    abilities-section and Advanced equipment/finalize/powers/feats steps along existing
    section/action seams without behavior change. Coordinate with TASK-594/596 if they
    already extract chunks.
  acceptance_criteria:
    - Target files under ~500 LOC where practical; no public API regressions.
    - Parity smoke: sheet play/edit; Advanced create through equipment/powers/finalize.
    - FEATURE_INDEX paths updated if files move.
  notes: |
    Skip if TASK-594/596 already shrink the same files enough.

---

- id: TASK-599
  title: Single source of truth for archetype-category marketing copy
  created_at: 2026-07-20
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/creator/archetype-selector.tsx
    - src/lib/constants/copy
  description: |
    `ARCHETYPE_INFO` (Power / Powered-Martial / Martial titles+descriptions) is triplicated
    with divergent copy between sheet edit-archetype and Advanced archetype-step (plus
    emoji variant in creator/archetype-selector). Consolidate into one copy module after
    owner picks canonical wording.
  acceptance_criteria:
    - One module exports archetype category title/description (selector may keep icons).
    - Sheet + Advanced + creature/creator selectors consume it.
    - Owner-approved copy strings (no silent rewrite of product voice).
  notes: |
    Needs owner ack on which descriptions win before implementing.
