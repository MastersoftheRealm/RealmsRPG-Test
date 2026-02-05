# Migration Fix Progress Tracker

> Last Updated: January 13, 2026

## Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Critical Infrastructure | ✅ COMPLETE | 3/3 tasks |
| Phase 2: Creator Unification | ✅ COMPLETE | 5/5 tasks |
| Phase 3: Specific Creator Fixes | ✅ COMPLETE | Core fixes done |
| Phase 4: Encounter Tracker | ✅ COMPLETE | 4/4 tasks |
| Phase 5: Codex/Library | ✅ COMPLETE | 5/5 tasks |
| Phase 6: Character Creation | ✅ COMPLETE | 2/2 tasks |
| Enhancement Stage 1: Creature Creator | ✅ COMPLETE | 6/6 tasks |
| Enhancement Stage 2: RTDB Wiring | ✅ COMPLETE | 9/9 tasks |
| Enhancement Stage 3: UI/UX Polish | ⬜ TODO | 0/5 tasks |

**Migration Fixes Complete!** All critical migration issues resolved.
**Enhancement Stages 1 & 2 Complete!** RTDB part wiring implemented.

---

# Enhancement Phase

> The following enhancements build upon the stable migration foundation.
> Prioritized by impact and complexity.

## Enhancement Stage 1: Creature Creator Polish
**Priority: HIGH** | **Complexity: Medium** | **Status: ✅ COMPLETE**

These fixes address core Creature Creator functionality issues.

| Task | Status | Notes |
|------|--------|-------|
| Fix health/energy minimum formulas | ✅ DONE | Health = 8 + VIT×Level + hitPoints, Energy = HighestNonVIT × Level |
| Use creature_feats from RTDB | ✅ DONE | `useCreatureFeats()` hook in use (line 506) |
| Add feat points tracking | ✅ DONE | `featPoints`, `featSpent`, `featRemaining` computed |
| Fix equipment loading | ✅ DONE | `LoadArmamentModal` uses `useUserItems()` |
| Fix powers/techniques loading | ✅ DONE | Modals use `useUserPowers()` and `useUserTechniques()` |
| Negative ability = point gain | ✅ DONE | Negative abilities correctly reduce `abilitySpent` total |

**All verified against vanilla site formulas - functionality already implemented!**

---

## Enhancement Stage 2: RTDB Part ID Wiring
**Priority: MEDIUM** | **Complexity: High** | **Status: ✅ COMPLETE**

Wire action/damage mechanics to actual RTDB part IDs for accurate cost calculations.
The `buildMechanicPartPayload()` function already exists in `technique-calc.ts` but isn't used by the creators.

### Power Creator Fixes

| Task | Status | Notes |
|------|--------|-------|
| Create `buildPowerMechanicPartPayload()` | ✅ DONE | New function in `power-calc.ts` with action type + damage support |
| Wire action types to partsPayload | ✅ DONE | Uses `POWER_QUICK_OR_FREE_ACTION`, `POWER_LONG_ACTION`, `POWER_REACTION` |
| Wire damage to damage type parts | ✅ DONE | Maps damage type to `MAGIC_DAMAGE`, `ELEMENTAL_DAMAGE`, etc. |
| Update cost calculation to include mechanic parts | ✅ DONE | Mechanic parts merged into `partsPayload` before `calculatePowerCosts()` |

### Technique Creator Fixes

| Task | Status | Notes |
|------|--------|-------|
| Import `buildMechanicPartPayload` | ✅ DONE | Imported from `@/lib/calculators` |
| Wire action types to partsPayload | ✅ DONE | IDs: `QUICK_OR_FREE_ACTION`, `LONG_ACTION`, `REACTION` |
| Wire damage to Additional Damage part | ✅ DONE | Uses `PART_IDS.ADDITIONAL_DAMAGE` |
| Load weapons from user library | ✅ DONE | Uses `useUserItems()` filtered to weapons, grouped in optgroups |
| Wire weapon TP to Add Weapon Attack | ✅ DONE | Uses `PART_IDS.ADD_WEAPON_ATTACK` with weapon's TP |

### Implementation Notes

**Power Part IDs added to `id-constants.ts`:**
```typescript
POWER_REACTION: 82,
POWER_LONG_ACTION: 81,
POWER_QUICK_OR_FREE_ACTION: 83,
POWER_RANGE: 292,
// Power damage type IDs:
MAGIC_DAMAGE: 294,
LIGHT_DAMAGE: 295,
PHYSICAL_DAMAGE: 296,
ELEMENTAL_DAMAGE: 297,
POISON_OR_NECROTIC_DAMAGE: 298,
SONIC_DAMAGE: 299,
SPIRITUAL_DAMAGE: 300,
PSYCHIC_DAMAGE: 301,
```

**Technique Part IDs (from `id-constants.ts`):**
```typescript
REACTION: 2,
LONG_ACTION: 3,
QUICK_OR_FREE_ACTION: 4,
ADDITIONAL_DAMAGE: 6,
ADD_WEAPON_ATTACK: 7,
```

---

## Enhancement Stage 3: UI/UX Polish
**Priority: LOW** | **Complexity: Low-Medium**

Cosmetic and UX improvements for consistency.

| Task | Status | Notes |
|------|--------|-------|
| Standardize part/property cards | ✅ DONE | Shared `PartCard` component in `components/shared/` |
| Creature stat-block design | ✅ DONE | `CreatureStatBlock` component - D&D-style layout |
| Species display improvements | ✅ DONE | `SpeciesTraitCard` + `TraitGroup` components with category colors |
| Add sort direction indicators | ✅ DONE | `ItemList` now shows "A→Z / Z→A" or "0→9 / 9→0" based on sort type |
| Skills page UI redesign (Creature) | ✅ DONE | Matches character sheet edit mode with rounded proficiency buttons, bordered list, total bonus display |

**Reference:** Vanilla site codex for species display patterns

---

## ID Constants Reference

Key RTDB IDs needed for wiring (from `MIGRATION_AUDIT_MANUAL.md`):

### Properties
| ID | Name | Use |
|----|------|-----|
| 13 | Range | Weapon range |
| 14 | Two-Handed | Two-handed weapons |
| 15 | Shield Base | Shield type |
| 16 | Armor Base | Armor type |
| 17 | Weapon Damage | Weapon damage dice |

### Parts (Technique)
| ID | Name | Use |
|----|------|-----|
| 2 | Reaction | Reaction action |
| 3 | Long Action | Long action type |
| 4 | Quick or Free Action | Quick/free action |
| 6 | Additional Damage | Damage dice |
| 7 | Add Weapon Attack | Weapon integration |

---

## Completed Migration Items ✅

### Phase 1-6 Complete
- ✅ RTDB initialization with `waitForFirebase()`
- ✅ CORS fixed (direct Firestore writes)
- ✅ Currency standardized to "c"
- ✅ CreatorLayout with sticky sidebar
- ✅ "Items" → "Armaments" rename
- ✅ "Weapon Type" → "Weapon" label fix
- ✅ Property filtering by armament type
- ✅ "decaying" → "leveled" terminology
- ✅ Encounter Tracker right-click & contrast
- ✅ Codex expand/collapse & sort indicators
- ✅ Ancestry trait selection

### Previously Resolved
- ✅ Characters page: Add character button hover feedback
- ✅ Species modal popup with "Pick Me!" / "Nah..." buttons
- ✅ Species multiple sizes array handling
- ✅ Button visibility (btn-continue/btn-back styles)
- ✅ +/- stepper button visibility
- ✅ Archetype vs character feats separation
- ✅ Sort Initiative button (simple and alternating)
- ✅ Drag-and-drop initiative reordering
- ✅ Next turn button visibility
- ✅ Condition removal at level 0
- ✅ Custom conditions support
- ✅ Species traits resolve from IDs

---

## Change Log

### January 13, 2026 (Enhancement Stage 2 Complete)
- ✅ Power Creator: Created `buildPowerMechanicPartPayload()` function
  - Added power damage type IDs to `id-constants.ts` (MAGIC_DAMAGE, ELEMENTAL_DAMAGE, etc.)
  - Maps action type selection to RTDB parts (POWER_REACTION, POWER_LONG_ACTION, etc.)
  - Maps damage type + dice to appropriate damage part with calculated op_1_lvl
- ✅ Power Creator: Wired mechanic parts into partsPayload for cost calculation
- ✅ Technique Creator: Imported and wired `buildMechanicPartPayload()`
- ✅ Technique Creator: Added user weapon loading from library
  - Uses `useUserItems()` filtered to weapons
  - Dropdown shows "General" and "My Weapons" optgroups
  - Weapon TP integrated into mechanic parts

### January 13, 2026 (Enhancement Stage 1 Verified)
- Verified all Creature Creator items already implemented:
  - Health/energy formulas correct
  - `useCreatureFeats()` hook in use
  - Feat points tracking working
  - Equipment/powers/techniques loading via user library hooks
  - Negative abilities correctly refund points

### January 13, 2026 (Enhancement Phase Setup)
- Reorganized progress document for Enhancement Phase
- Created 3-stage enhancement plan with priorities
- Added RTDB ID constants reference table

### January 13, 2026 (Migration Fixes)
- ✅ Phase 3 - Armament Creator fixes:
  - Added property filtering by armament type (Weapon/Armor/Shield)
  - Properties incompatible with new armament type are removed on type change
  - Verified Accessories option is already not present
- ✅ Phase 3 - Technique Creator: Fixed "Weapon Type" → "Weapon" label
- ✅ Phase 4 complete: Encounter Tracker fixes
  - Renamed "decaying" to "leveled" throughout conditions system
  - Verified right-click context menu already implemented
  - Verified initiative display has proper contrast
- ✅ Phase 5 complete: Codex/Library fixes (all items already implemented)
- ✅ Phase 2 started: Library "Items" → "Armaments" label
- ✅ Phase 1 complete: RTDB initialization fix, CORS already fixed, currency already correct
- Created progress tracking document
