# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-820
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-814, TASK-815, TASK-812, TASK-810, TASK-809, TASK-808, TASK-807, TASK-805, TASK-804, TASK-803, TASK-802, TASK-800, TASK-793, TASK-790, TASK-789, TASK-788, TASK-787, TASK-783, TASK-779, TASK-786, TASK-778, TASK-775, TASK-782, TASK-784, TASK-781, TASK-780, TASK-774, TASK-773, TASK-771, TASK-770, TASK-762, TASK-753, TASK-764, TASK-408, TASK-752, TASK-763, TASK-761, TASK-757, TASK-756, TASK-759, TASK-758, TASK-760, TASK-733, TASK-755, TASK-754, TASK-750, TASK-747, TASK-746, TASK-739, TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 5 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Open: **TASK-816** creature Add equipment custom form; **TASK-817** selected-inventory play chips; **TASK-818** path More details catalog chips; **TASK-813** unused `EquipmentListSection` creature Qty path; **TASK-819** encounter full-card ValueStepper. **AddCharacterModal** is intentional non-USM. **Architect leftovers in WAITING:** TASK-794–799. Do **not** delete `/characters/new/advanced`. TASK-410–414 deferred. Do not reopen ADR-0013 / 761 / 762 / TASK-584 / TASK-415 / TASK-585 / TASK-586.

---

- id: TASK-816
  title: Creature Add equipment custom-item form (reuse sheet form)
  created_at: 2026-08-17
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/add-library-item/add-custom-equipment-form.tsx
    - src/components/character-sheet/add-library-item/build-custom-equipment.ts
    - src/app/(main)/creature-creator/page.tsx
    - src/app/(main)/creature-creator/creature-creator-workspace-persistence.ts
    - src/lib/game/creature-inventory.ts
    - src/app/(main)/creature-creator/transformers.ts
  description: |
    TASK-815 restored one-off custom gear on sheet Add equipment. Creature Select Inventory has no equivalent: Add equipment only lists library/codex rows, and onConfirm maps DisplayItem.sourceData (custom Item rows are not DisplayItems). Reuse AddCustomEquipmentForm + buildCustomEquipmentItem on the Equipment tab (keep kind tabs in scopeExtra). Persist into the equipment bucket via appendCreatureInventoryItems. Guided L2 stays catalog+budget only unless the owner expands this task.
  acceptance_criteria:
    - Creature Creator Inventory → Add equipment (Equipment tab) shows Name / Notes / Qty / Add custom under the kind tabs without opening Filters.
    - Custom rows land in the equipment bucket, survive save/reload, and do not go through displayItemToCreatureArmament.
    - Reuse AddCustomEquipmentForm / buildCustomEquipmentItem; do not fork a second custom-item form or a new shared/ui file.
    - Guided equipment L2 is unchanged (eligible catalog + currency/TP). Weapons/Armor/Shields tabs do not show the custom form.
    - Tests: targeted vitest for the creature append path if extracted; npm run build. Add DEV-V-016-T027 when implementing.
  notes: |
    Filed from TASK-815 /cleanup (owner asked to file the audit follow-up). Sheet path is TASK-815. Do not delete /characters/new/advanced.

- id: TASK-817
  title: Creature selected inventory — play chipFacts, drop totalTp footer
  created_at: 2026-08-17
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx
    - src/components/character-sheet/library-entity-rows.tsx
    - src/components/shared/entity-library-inventory.tsx
    - src/components/shared/entity-library-sections-rows.tsx
    - src/components/shared/creature-stat-block-panels.tsx
  description: |
    TASK-814 wired creature Inventory pickers onto select-density chipFacts, but selected Weapons/Armor/Shields/Equipment lists still hand-roll columns plus totalTp. Play density demotes rarity/currency/TP to chips, so a Total TP footer with no TP column is never-neither (and never-both if chips are added later). Reuse sheet library-entity-rows mappers (or glrSurfaceDetailSections on the same bindings) instead of a second fact table. Qty display stays TASK-813.
  acceptance_criteria:
    - Creature Creator selected inventory rows show play catalog facts as column XOR chip XOR rightSlot (rarity/currency/TP as chips when they are not columns).
    - Expanded Total TP is omitted when TP is a chip (no totalTp on those rows).
    - Reuse mapWeaponRows / mapArmorRows / mapEquipmentRows or the same glrSurfaceDetailSections bindings; do not fork a second chip table or a new shared/ui file.
    - Sheet characterSheet Qty steppers are unchanged (TASK-813). Skip Legacy /characters/new/advanced.
    - Tests: targeted vitest for the selected-row mapper if extracted; npm run build. Add DEV-V-016-T028 when implementing.
  notes: |
    Filed from TASK-814 /cleanup. Pickers are done; this is the selected-list leftover. Do not fold TASK-813 Qty into this task.

- id: TASK-818
  title: Path More details combat chips from GLR catalog
  created_at: 2026-08-17
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/lib/detail-option/combat-builder.ts
    - src/lib/glr/glr-surface-bindings.ts
    - src/lib/chip/list-row-metadata.ts
    - src/components/guided-creator/guided-path-detail-modal.tsx
  description: |
    detail-option-power is registered in glr-surface-bindings but powerToDetailOption / techniqueToDetailOption still hand-roll Energy/Action/Range/Area/Duration/Damage/TP chips. Wire DetailOptionList combat rows onto glrSurfaceDetailSections('detail-option-power') (and a technique binding if needed) so path More details follows ADR-0016 instead of a parallel chip table.
  acceptance_criteria:
    - Guided path More details power/technique chips come from layout.chipFacts (detail density), not combat-builder pushFact.
    - A valued catalog fact is column XOR chip XOR rightSlot; DetailOptionList may keep name+description columns with all facts as chips.
    - Reuse compact-facts formatters via rankedGlrFactChips; do not add a new shared/ui file.
    - Skip Legacy /characters/new/advanced. Tests: vitest on combat-builder; npm run build. Add a DEV-V-016 case when implementing.
  notes: |
    Filed from TASK-814 /cleanup. Out of 814 picker/sheet scope on purpose (deep-dive catalogs).

- id: TASK-813
  title: Unify EquipmentListSection creature Qty with formatCreatureEquipmentQuantity
  created_at: 2026-08-17
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/shared/entity-library-inventory.tsx
    - src/components/shared/entity-library-sections-types.ts
    - src/components/shared/creature-stat-block-panels.tsx
    - src/lib/game/creature-inventory.ts
    - src/app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx
  description: |
    TASK-812 creator selected rows already pass layout="characterSheet" plus an explicit Qty column that uses formatCreatureEquipmentQuantity. Stat-block equipment Qty already uses that helper (hand-rolled GridListRow, not EquipmentListSection). Remaining: EquipmentListSection's default layout="creature" still does e.quantity ?? 1 (and a no-op QuantitySelector) — unused today because creature creator overrides layout. Unify the default creature path + prefer routing the stat-block list through the shared section; do not change sheet characterSheet Qty steppers that default missing quantity to 1.
  acceptance_criteria:
    - EquipmentListSection layout="creature" shows stored quantity or "-" (formatCreatureEquipmentQuantity); it does not fake Qty 1.
    - Character sheet EquipmentListSection layout="characterSheet" still uses quantity steppers and may default missing quantity to 1.
    - Prefer routing creature/stat-block equipment lists through EquipmentListSection instead of a second Qty column, without a new shared/ui file.
    - Tests: targeted vitest if a helper is extracted; npm run build. Add DEV-V-016-T025 when implementing.
  notes: |
    Filed from TASK-812 /cleanup. Creator Inventory already meets TASK-812 AC via custom columns. Stat block no longer fakes Qty 1 — leftover is the unused default section path + hand-rolled columns. Do not delete /characters/new/advanced.

---

- id: TASK-819
  title: Encounter full-card HP/EN ValueStepper parity
  created_at: 2026-08-18
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/encounters/combatant-card-resources.tsx
    - src/components/shared/value-stepper.tsx
  description: |
    Compact CombatantCard resource chrome already pairs number inputs with ValueStepper. The full variant is raw HP/EN current+max number inputs only. Add the same ValueStepper beside those inputs for parity (ADR-0002); keep direct numeric entry. Do not change initiative click-to-edit or condition chip +/- .
  acceptance_criteria:
    - Full combatant card Health/Energy (when not linked-character read-only) show ValueStepper next to the number inputs, matching compact.
    - Linked-character read-only path is unchanged (no steppers).
    - No new shared/ui file; reuse ValueStepper. Compact layout unchanged.
    - Tests: npm run build. Add a DEV-V-008 case when implementing if the suite covers combatant cards.
  notes: |
    Filed from 2026-08-18 /global-audit → /debt. Compact already has the pattern. Initiative and condition chips stay out of scope.

