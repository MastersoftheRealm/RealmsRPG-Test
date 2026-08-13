# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-720
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-642, TASK-707, TASK-706, TASK-712, TASK-711, TASK-709…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 6 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **TASK-714** MixedSpeciesModal source type. **TASK-715/716** damage/range display SoT. **TASK-717/718** BUILD_VALIDATION honesty. **TASK-719** archive ID collisions. TASK-642 archived pending-qa (DEV-008). TASK-326/500 moved to WAITING.

---

- id: TASK-714
  title: MixedSpeciesModal — drop local SourceFilterValue, use shared alias
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_tasks:
    - TASK-712
    - TASK-605
    - TASK-641
  related_files:
    - src/components/character-creator/MixedSpeciesModal.tsx
    - src/components/shared/filters/source-filter.tsx
    - src/lib/library/source-scope.ts
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    MixedSpeciesModal declares a local `SourceFilterValue = 'all' | 'public' | 'my'` and a
    hand-rolled SegmentedControl with All / Public species / My species. TASK-712 made
    `SourceFilterValue` an alias of `LibrarySourceScope`. Delete the local type and import
    the shared alias. Prefer `SourceFilter` for All / Realms Library / My Library chrome
    unless species-specific labels ("Public species" / "My species") are kept on purpose —
    in that case still type the control with the shared union. Do not alias Advanced
    `species-step`'s local union (it includes `'make'`). Dual-select UX stays MixedSpeciesModal
    (not USM).
  acceptance_criteria:
    - Local `type SourceFilterValue` in MixedSpeciesModal is deleted; source state uses the shared `SourceFilterValue` / `LibrarySourceScope` alias.
    - Source chrome is either shared `SourceFilter` or SegmentedControl typed with that alias (no second union).
    - Mixed dual-select confirm flow unchanged; not migrated to USM.
    - Advanced species-step `'make'` source stays a local wider union.
    - FEATURE_INDEX MixedSpeciesModal note; build/typecheck/lint pass.
  notes: |
    TASK-712 cleanup follow-up. Labels today differ from SourceFilter ("Public species" vs
    "Realms Library") — pick shared chrome unless owner wants the species wording.

---

- id: TASK-715
  title: Route item damage display through formatDamageDisplay
  created_at: 2026-08-13
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/lib/utils/string.ts
    - src/lib/calculators/item-calc.ts
    - src/lib/guided-creator/resolve-loadout-items.ts
    - src/lib/calculators/index.ts
  description: |
    `formatDamage` in item-calc.ts duplicates `formatDamageDisplay` (string.ts) for typed
    `ItemDamage[]`. One remaining caller: resolve-loadout-items.ts. Wire that caller through
    the display SoT and delete or thin-delegate `formatDamage`.
  acceptance_criteria:
    - resolve-loadout-items uses formatDamageDisplay (or a typed wrapper that delegates to it).
    - No second damage-join implementation in item-calc (delete or one-line delegate).
    - Guided loadout damage strings unchanged for valid dice+type rows; vitest/typecheck/lint pass.
  notes: |
    Filed from 2026-08-13 /global-audit. Do not change sheet `formatDamageType` (string chip
    wrapper) in this task.

---

- id: TASK-716
  title: Finish TASK-701 — remaining formatRange callers use resolveWeaponRangeDisplay
  created_at: 2026-08-13
  created_by: agent
  priority: medium
  status: not-started
  parent_task: TASK-701
  related_files:
    - src/lib/calculators/item-calc.ts
    - src/components/character-creator/steps/equipment/equipment-catalog-panel.tsx
    - src/lib/guided-creator/equipment-phase-stats.ts
    - src/lib/detail-option/compact-facts.ts
    - src/lib/game/weapon-attack-ability.ts
  description: |
    TASK-701 made resolveWeaponRangeDisplay the display SoT (properties-first, reject corrupt
    stored 0/bare integers). Direct formatRange calls remain when properties are assumed present.
    Route remaining callers through resolveWeaponRangeDisplay so corrupt stored range cannot
    resurface.
  acceptance_criteria:
    - equipment-catalog-panel, equipment-phase-stats, compact-facts, weapon-attack-ability do not
      call formatRange for user-facing labels (use resolveWeaponRangeDisplay / compact helper).
    - formatRange may remain as an internal properties-only derive used by the SoT.
    - Melee / spaces labels match TASK-701; vitest for item-calc range + typecheck/lint pass.
  notes: |
    Filed from 2026-08-13 /global-audit. Behavior-sensitive — do not fold into docs-only debt.

---

- id: TASK-717
  title: Rewrite DEV-V-001 for chooser vs Advanced archetype steps
  created_at: 2026-08-13
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/docs/ai/BUILD_VALIDATION.md
    - src/app/(main)/characters/new/page.tsx
    - src/app/(main)/characters/new/advanced/page.tsx
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    DEV-V-001 start URL is `/characters/new` → step "1. Archetype" / Forge Your Own, but that
    route is now the Guided/Custom/Legacy chooser. Archetype path/forge steps live at
    `/characters/new/advanced`. Rewrite the suite so steps can pass as written; spot-check
    sibling suites for the same pre-chooser assumption.
  acceptance_criteria:
    - DEV-V-001 Where/Start URL/steps distinguish chooser (`/characters/new`) vs Advanced
      (`/characters/new/advanced`) Archetype.
    - Forge Your Own / Choose a Path steps target Advanced, not the chooser.
    - DEVELOPER_TASK_QUEUE index blurb updated if the suite title/count changes.
    - No other DEV-V-001 tests left describing pre-chooser `/characters/new` as step 1 Archetype.
  notes: |
    Filed from 2026-08-13 /global-audit. QA-authority rewrite — not a /debt fold.

---

- id: TASK-718
  title: Archive BUILD_VALIDATION suites that cannot stay in the 322KB hot file
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    BUILD_VALIDATION.md is ~322KB / 45 suites / 320 tests with no archive file. Create
    archive/BUILD_VALIDATION_ARCHIVE.md and move verified or long-superseded suites out of
    the hot file. Keep suites still cited by Pending owner QA in the hot file.
  acceptance_criteria:
    - archive/BUILD_VALIDATION_ARCHIVE.md exists with a pointer from BUILD_VALIDATION.md.
    - Hot file shrinks; Pending owner QA linked suites remain in the hot file.
    - DEVELOPER_TASK_QUEUE build-validation index links still resolve.
  notes: |
    Filed from 2026-08-13 /global-audit. Do not delete tests — move them.

---

- id: TASK-719
  title: Disambiguate duplicate archive IDs TASK-615 and TASK-284
  created_at: 2026-08-13
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/docs/ai/archive/TASK_QUEUE_DONE.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    Archive has two distinct done blocks each for TASK-615 (facade shrink vs Web Analytics)
    and TASK-284 (role-based admin vs mixed-species list dedupe). Not copy-paste dupes —
    ID collisions. Re-id one of each (new TASK-###) and retarget DEVELOPER_TASK_QUEUE /
    BUILD_VALIDATION citations so reconcile and pending-QA rows are unique.
  acceptance_criteria:
    - Each `- id: TASK-615` / `TASK-284` in the done archive refers to one piece of work.
    - The other block has a new unique TASK-###; DTQ pending-QA and DEV-006/DEV-V-018 links match.
    - `npm run tasks:validate` strict reconcile still passes for both IDs (commit subjects).
  notes: |
    Filed from 2026-08-13 /global-audit. Do not delete either block. Re-id needs a commit
    subject containing the new ID if strict-since covers completed_at.
