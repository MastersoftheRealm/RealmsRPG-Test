# Guided Equipment — Phased Sub-flow Spec

**Authority:** Implements [`REALMS_PRODUCT_OVERVIEW.md`](../REALMS_PRODUCT_OVERVIEW.md) §5.7 (equipment), §5.9 (resources), §3 / §3.1 (layers + selection grammar).  
**Tasks:** TASK-422 (parent), TASK-424 (phased sub-flow), TASK-442 (kit removal), TASK-443 (phase visibility + card remodel), TASK-446 (L1 simplify + orphan fix)

## UX summary

Within the guided **loadout** sub-step, users complete **visible** phases only (renumbered 1…N):

1. **Weapons + shields** (if path has weapon options) — Layer 1: path choice cards; Layer 2: full filtered shop (`UnifiedSelectionModal`)
2. **Armor** (if `armorStep` is not `none` and options exist) — pick from path cards; skip when absent
3. **Adventuring gear** — recommended items + remaining currency; optional **Add all recommended**

**No quick kits.** Users pick weapons and armor individually from curated path pools. Live DB strip applied (TASK-442): `level1_loadouts` is metadata-only (`armorStep` / `sharedEquipment`); path picks use `level1_armaments` / `level1_equipment`.

**Card-first (TASK-446 / TASK-447):** No phase progress strip (Next/Back only). No “Your selection” summary. **PointStatus** shows **Currency** (full word) like abilities/skills. Collapsed cards: image, title, description, named property chips (hover tip when described) + Currency cost chip. **More details** expands mechanic facts (handedness, damage, …). **See more options** opens catalog L2. Path L1 picks are not ability-filtered. Stale unresolved draft ids prune when lookup loads.

## Layer rules

| Layer | Weapons / armor | Gear |
|-------|-----------------|------|
| **1** | Image + title + description + named property chips (hover tips) + Currency chip; More details = mechanic facts; PointStatus Currency; TP hidden | Recommended cards + qty; optional Add all; PointStatus Currency |
| **2** | `UnifiedSelectionModal` (GridListRow); `PointStatus` for Training Points | Modal; PointStatus Currency |

Entity depth vs catalog breadth: see REALMS §3.1. Cards = quieter presentation of the same facts as browse rows.

## L2 eligibility (all phases)

- **Common** rarity only at level 1
- Ability requirements met (hide req in UI when met)
- Per-item property TP ≤ archetype `armamentMax` (3 / 8 / 12)
- Total selected TP ≤ training point limit
- Gear: each item ≤ **50 Currency**; total ≤ remaining Currency

## L2 weapon ranking

1. Path-recommended items first  
2. Attack ability matches `mart_abil` or `pow_abil` (finesse → Agility, thrown → Strength, ranged → Acuity, else Strength)  
3. Name sort

## Path metadata

```json
{
  "armorStep": "required | optional | none",
  "sharedEquipment": [{ "id": "3", "quantity": 4 }],
  "armaments": ["…"],
  "armor": ["…"],
  "equipment": ["…"]
}
```

Default `armorStep` from `archetypeType` when omitted (power → none). Flat recommendation lists only (no nested kit objects).

## Shared components (mandatory)

`GuidedChoiceCard`, `UnifiedSelectionModal` (search/sort/filter inside the shared modal — not a parallel list stack), `GuidedLayerNav`, `PointStatus`, `SegmentedControl`. No `CreatorResourceBar` in guided flow. See TASK-424 / TASK-443.

## Compliance checklist (per PR)

- [x] Unified L1 (`guided-equipment-l1-phase.tsx`); L2 `UnifiedSelectionModal` + `PointStatus`
- [x] Quick kits removed from UI/admin/DB (TASK-442 applied)
- [x] `use-guided-equipment-catalog` in `hooks/`; copy in `guided-creator-copy.ts`
- [x] Phase skip + dynamic SegmentedControl labels (TASK-443)
- [x] Weapon/armor quiet collapsed tags + More details expandable properties; quiet currency on all phases (TASK-446)
- [x] No selection-summary chrome; path L1 always shown; orphan unresolved draft prune (TASK-446)
- [x] Gear Add all recommended + quantity steppers
- [x] Semantic tokens; mobile via `UnifiedSelectionModal` fullScreenOnMobile; 44px touch targets
- [x] Pool builders use flat recommendations only (no kit arrays)
- [ ] `BUILD_VALIDATION` sign-off; codex path recommendation seeds for remaining paths (TASK-423)
