# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-819
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-814, TASK-815, TASK-812, TASK-810, TASK-809, TASK-808, TASK-807, TASK-805, TASK-804, TASK-803, TASK-802, TASK-800, TASK-793, TASK-790, TASK-789, TASK-788, TASK-787, TASK-783, TASK-779, TASK-786, TASK-778, TASK-775, TASK-782, TASK-784, TASK-781, TASK-780, TASK-774, TASK-773, TASK-771, TASK-770, TASK-762, TASK-753, TASK-764, TASK-408, TASK-752, TASK-763, TASK-761, TASK-757, TASK-756, TASK-759, TASK-758, TASK-760, TASK-733, TASK-755, TASK-754, TASK-750, TASK-747, TASK-746, TASK-739, TASK-741, TASK-734, TASK-735, TASK-736, TASK-737, TASK-714, TASK-732, TASK-716, TASK-726…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 4 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** Owner 2026-08-17: **TASK-818 / TASK-817 filed** (TASK-814 /cleanup) — path More details catalog chips; creature selected-inventory play chips (not Qty). **TASK-816 filed** (TASK-815 /cleanup) — creature Add equipment custom-item form, reuse sheet `AddCustomEquipmentForm`. **TASK-815 done** pending-qa (sheet Add equipment custom-item form restored under Search, not buried in Filters). **TASK-814 done** pending-qa — GLR never-neither (demote overflow facts to chips; sheet library derives Official display). **TASK-813 filed** — unify `EquipmentListSection` creature-layout Qty with `formatCreatureEquipmentQuantity` (do not fake 1; sheet layout keeps steppers). **TASK-812 done** pending-qa (creature inventory document split into weapons / armor / shields / equipment; migrate `data.armaments` on read). **TASK-810 done** pending-qa (per-kind armament lists; no mixed Type+Stat USM; creature Inventory UI split). **TASK-808 / TASK-809 / TASK-811 done** (never-both CI, chipFacts-driven add-modal chips, catalog CI rename). **TASK-807 done** pending-qa (GLR resolver drives Official/sheet/USM/guided list chrome; DEV-V-016 T021). **TASK-806 done** n/a (ADR-0016 fact catalog + density + CI; Codex gear closed set). Owner 2026-08-15: **TASK-805 done** pending-qa (feat Customize caret no longer jumps mid-type; ID was TASK-802 until master landed campaign RLS as TASK-802, sheet skill names as TASK-803, and Continue Without Saving as TASK-804). **TASK-804 done** pending-qa (guest **Continue Without Saving** on character create). **TASK-803 done** pending-qa (sheet skill names after species change + hover descriptions). **TASK-802 done** pending-qa (campaign create RLS + Sentry CSP). **TASK-800 done** pending-qa (Skills spend/temp inline steppers + heading status). **Wave 3C implementable slices done** — TASK-789 landing RSC (pending-qa), TASK-790 Guided skills defense + governing Ability (pending-qa), TASK-791 currency/appearance-age extract (n/a), TASK-792 ValueStepper + ListHeader dedup (n/a), TASK-793 crafting/my-account titles + crawlable `/rules` intro (pending-qa). **Architect leftovers in WAITING:** TASK-794–799 (`shared/` split, generated types, `/rules` MDX + Codex detail metadata, indexed-access burn-down, Legacy shared extract, remaining list/modal clusters). Do **not** delete `/characters/new/advanced` this wave. 3A + 3B still pending-qa. TASK-410–414 deferred. Do not reopen ADR-0013 / 761 / 762 / TASK-584 / TASK-415 / TASK-585 / TASK-586.

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
    TASK-812 creator selected rows already pass layout="characterSheet" plus an explicit Qty column that uses formatCreatureEquipmentQuantity. EquipmentListSection's default layout="creature" still does e.quantity ?? 1 (and a no-op QuantitySelector). Stat block equipment Qty is a parallel hand-rolled column. Unify creature/stat-block display onto the shared section + helper; do not change sheet characterSheet Qty steppers that default missing quantity to 1.
  acceptance_criteria:
    - EquipmentListSection layout="creature" shows stored quantity or "-" (formatCreatureEquipmentQuantity); it does not fake Qty 1.
    - Character sheet EquipmentListSection layout="characterSheet" still uses quantity steppers and may default missing quantity to 1.
    - Prefer routing creature/stat-block equipment lists through EquipmentListSection instead of a second Qty column, without a new shared/ui file.
    - Tests: targeted vitest if a helper is extracted; npm run build. Add DEV-V-016-T025 when implementing.
  notes: |
    Filed from TASK-812 /cleanup. Creator Inventory already meets TASK-812 AC via custom columns. This is the leftover shared-section fork. Do not delete /characters/new/advanced.

