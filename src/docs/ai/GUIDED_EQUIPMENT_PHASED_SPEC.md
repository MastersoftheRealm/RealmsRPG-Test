# Guided Equipment — Phased Sub-flow Spec

**Authority:** Implements [`REALMS_PRODUCT_OVERVIEW.md`](../REALMS_PRODUCT_OVERVIEW.md) §5.7 (equipment), §5.9 (resources), §3 / §3.1 (layers + selection grammar).  
**Tasks:** TASK-422 (parent), TASK-424 (phased sub-flow), TASK-442 (kit removal), TASK-443 (phase visibility + card remodel), TASK-446 (L1 simplify + orphan fix), TASK-447, TASK-527 (no cold-load jump to Equipment)

## UX summary

Within the guided **Loadout** chapter (`loadout` sub-step), users complete **visible** phases only (renumbered 1…N):

1. **Weapons + shields** (if path has weapon options) — Layer 1: path choice cards; Layer 2: full filtered shop (`UnifiedSelectionModal`)
2. **Armor** (if `armorStep` is not `none` and options exist) — pick from path cards; skip when absent
3. **Equipment** — recommended items + remaining currency; optional **Add all recommended Equipment**

Chapter rail title is **Loadout** (weapons, armor, Equipment, then Powers or Techniques). Internal phase id remains `gear`.

**Entry timing (TASK-527):** Do not commit `equipmentPhase` from visibility until item catalogs (and path data) are loaded. Unresolved pool refs must not count as Equipment — otherwise a cold cache collapses visible phases to `['gear']` and locks the entry jump onto Equipment.

**No quick kits.** Users pick weapons and armor individually from curated path pools. Live DB strip applied (TASK-442): `level1_loadouts` is metadata-only (`armorStep` / `sharedEquipment`); path picks use `level1_armaments` / `level1_equipment`.

**Card-first (TASK-446 / TASK-447 / TASK-456 / TASK-457):** No phase progress strip (Next/Back only). Page title = current phase only. Weapon, armor, and Equipment picks are **optional**. **PointStatus** Currency and Training Points on every phase. Collapsed weapon/armor cards: image, title, title-adjacent **Currency** + **Training Points** descriptors, description — no property/mechanic chips in the collapsed body. **See more…** reveals non-expanding mechanic facts (Ability Requirement, handedness, damage/type, Strength/Agility/Acuity Weapon) plus named property descriptors with InfoTippy; nothing renders under the disclosure row. **See more options** opens catalog L2. Entity modals use **More details** elsewhere (path/species).

## Layer rules

| Layer | Weapons / armor | Equipment (`gear` phase) |
|-------|-----------------|-------------------------|
| **1** | Optional picks; image + title + title-adjacent Currency + Training Points; See more = mechanic facts + named property InfoTippy chips (no expand); PointStatus Currency + Training Points | Optional recommended cards + qty (above disclosure); optional Add all (budget-aware); PointStatus Currency + Training Points |
| **2** | `UnifiedSelectionModal` (GridListRow): weapons Name/Damage/Currency/Training Points; armor Damage Reduction; Equipment Currency; properties on expand; footer PointStatus Currency + Training Points | Modal; PointStatus Currency + Training Points |

Entity depth vs catalog breadth: see REALMS §3.1. Cards = quieter presentation of the same facts as browse rows.

**Currency column / chips (Library GLR protocol):** Display market cost via `calculateCurrencyCostAndRarity(totalC, totalIP)` — never raw `costs.totalCurrency` (property C sum). Catalog rows set `gold_cost` to that market cost (`equipment-catalog-rows` / `resolveItemUnitCost`).

**L2 replacement budgets:** Equipment Confirm ceiling = starting Currency − arms spend (current Equipment is reclaimable). Weapon/armor eligibility filters against **cross-phase** TP only (same reclaim rule).

## L2 eligibility (all phases)

- **Common** rarity only at level 1
- Ability requirements met (hide req in UI when met)
- Per-item property TP ≤ archetype `armamentMax` (3 / 8 / 12)
- Total selected TP ≤ training point limit
- Equipment: each item ≤ **50 Currency**; total ≤ Equipment budget (starting − arms)

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

`GuidedChoiceCard`, `UnifiedSelectionModal` (search/sort/filter inside the shared modal — not a parallel list stack), `GuidedLayerNav`, `PointStatus` via **`LoadoutBudgetBar`** (`@/components/shared`; TASK-614). Advanced creator reuses the same budget chrome (TASK-606). See TASK-424 / TASK-443 / TASK-447.

## Compliance checklist (per PR)

- [x] Unified L1 (`guided-equipment-l1-phase.tsx`); L2 `UnifiedSelectionModal` + `PointStatus`
- [x] Quick kits removed from UI/admin/DB (TASK-442 applied)
- [x] `use-guided-equipment-catalog` in `hooks/`; copy in `guided-creator-copy.ts`
- [x] Phase skip + Next/Back (no SegmentedControl progress strip)
- [x] Weapon/armor title-adjacent Currency + Training Points; See more mechanic + property facts (no chips under disclosure) (TASK-457)
- [x] Weapon/armor quiet collapsed chips + See more mechanic facts; Currency + Training Points PointStatus (TASK-446 / TASK-447 / TASK-456)
- [x] Optional weapon/armor/Equipment continuation; shared TP visible L1/L2 + powers/techniques (TASK-456)
- [x] No selection-summary chrome; path L1 always shown; orphan unresolved draft prune (TASK-446)
- [x] Equipment Add all recommended + quantity steppers (Currency-gated)
- [x] L2 Equipment/TP budgets treat replacements as reclaiming current-phase spend
- [x] Chapter title **Loadout**; Equipment phase (not Adventuring Gear) in user-facing copy (TASK-459)
- [x] Semantic tokens; mobile via `UnifiedSelectionModal` fullScreenOnMobile; 44px touch targets
- [x] Pool builders use flat recommendations only (no kit arrays)
- [ ] `BUILD_VALIDATION` sign-off; codex path recommendation seeds for remaining paths (TASK-423)
