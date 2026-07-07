# Guided Equipment — Phased Sub-flow Spec

**Authority:** Implements [`REALMS_PRODUCT_OVERVIEW.md`](../REALMS_PRODUCT_OVERVIEW.md) §5.7 (equipment), §5.9 (resources), §3 (three layers).  
**Tasks:** TASK-422 (parent, partial), TASK-424 (phased sub-flow)

## UX summary

Within the guided **loadout** sub-step, users complete three phases:

1. **Weapons + shields** — Layer 1: path choice cards; Layer 2: full filtered shop (`UnifiedSelectionModal`)
2. **Armor** — confirm or pick; skip when `armorStep: none` (power, some monks)
3. **Adventuring gear** — path bundle + remaining currency after arms/armor

Kits (`level1_loadouts`) are **quick presets** that pre-fill all phases.

## Layer rules

| Layer | Weapons / armor | Gear |
|-------|-----------------|------|
| **1** | `GuidedChoiceCard`; TP hidden | Bundle + currency remainder |
| **2** | `UnifiedSelectionModal`; `PointStatus` for TP | Modal; currency only |

## L2 eligibility (all phases)

- **Common** rarity only at level 1
- Ability requirements met (hide req in UI when met)
- Per-item property TP ≤ archetype `armamentMax` (3 / 8 / 12)
- Total selected TP ≤ training point limit
- Gear: each item ≤ **50c**; total ≤ remaining currency

## L2 weapon ranking

1. Path-recommended items first  
2. Attack ability matches `mart_abil` or `pow_abil` (finesse → Agility, thrown → Strength, ranged → Acuity, else Strength)  
3. Name sort

## Path metadata

```json
{
  "armorStep": "required | optional | none",
  "sharedEquipment": [{ "id": "3", "quantity": 4 }]
}
```

Default `armorStep` from `archetypeType` when omitted (power → none).

## Shared components (mandatory)

`GuidedChoiceCard`, `UnifiedSelectionModal`, `GuidedLayerNav`, `PointStatus`, `SegmentedControl`, `useModalListState`. No `CreatorResourceBar` in guided flow. See TASK-424 / phased equipment plan.

## Compliance checklist (per PR)

- [x] Unified L1 (`guided-equipment-l1-phase.tsx`); L2 `UnifiedSelectionModal` + `PointStatus`
- [x] Quick kits demoted (`guided-loadout-kit-presets.tsx`); dead customize/section panels removed
- [x] `use-guided-equipment-catalog` in `hooks/`; copy in `guided-creator-copy.ts`
- [x] `npm run build` + unit tests (67 pass as of 2026-07-07)
- [x] Semantic tokens; mobile via `UnifiedSelectionModal` fullScreenOnMobile; 44px touch targets on phase nav / cards
- [x] Phase selection summary (`guided-equipment-phase-selection.tsx`)
- [x] Admin `armorStep` + `sharedEquipment` (stored in `level1_loadouts` wrapper when set)
- [ ] `BUILD_VALIDATION` sign-off (Phase 10); codex path SQL owner-approved (TASK-423)
