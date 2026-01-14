# Fixes and Improvements Progress Tracker

> Last Updated: January 13, 2026
> Based on: Fixes and Improvements.md (Second iteration review)

## Summary

| Phase | Priority | Status | Progress |
|-------|----------|--------|----------|
| Phase 1: Encounter Tracker Fixes | HIGH | ✅ COMPLETE | 12/12 tasks |
| Phase 2: Creator Unification & Layout | HIGH | ✅ COMPLETE | 8/8 tasks |
| Phase 3: Power Creator Fixes | HIGH | ✅ COMPLETE | 13/13 tasks |
| Phase 4: Technique Creator Fixes | HIGH | ✅ COMPLETE | 6/6 tasks |
| Phase 5: Armament/Item Creator Fixes | HIGH | ✅ COMPLETE | 8/8 tasks |
| Phase 6: Creature Creator Fixes | HIGH | ✅ COMPLETE | 12/12 tasks |
| Phase 7: Codex Fixes | MEDIUM | ✅ COMPLETE | 18/18 tasks |
| Phase 8: Library Fixes | MEDIUM | ✅ COMPLETE | 5/5 tasks |
| Phase 9: Error Resolution | LOW | ✅ COMPLETE | 4/4 tasks |

---

## Phase 1: Encounter Tracker Fixes
**Priority: HIGH** | **File: `src/app/(main)/encounter-tracker/page.tsx`** | **Status: ✅ COMPLETE**

### Drag & Drop Issues
| Task | Status | Notes |
|------|--------|-------|
| Remove cross-arrow cursor on card hover, keep only 6-dot grip handle for drag | ✅ DONE | Grip handle now only draggable element |
| Fix card opacity not returning after drop | ✅ DONE | Using isDragging state instead of DOM manipulation |

### UI/Layout Improvements
| Task | Status | Notes |
|------|--------|-------|
| Make initiative value editable after card is added | ✅ DONE | Click to edit initiative badge |
| Add Energy (EN) tracking alongside HP | ✅ DONE | maxEnergy, currentEnergy with controls |
| Reduce card height - arrange chips horizontally | ✅ DONE | Compact inline layout |
| Make control buttons sticky while scrolling | ✅ DONE | Added sticky top-4 z-10 |
| Put tracked cards in scrollable container | ✅ DONE | max-h-[calc(100vh-280px)] overflow-y-auto |
| Add round and turn tracking to summary box | ✅ DONE | "Round X • Turn Y/Z" display |
| Allow editing card names after adding | ✅ DONE | Click to edit name |
| Improve damage/heal/energy input UX | ✅ DONE | Grouped controls with color coding |

### Functionality Improvements
| Task | Status | Notes |
|------|--------|-------|
| Remove "Apply Surprise" button - auto-apply for surprised creatures | ✅ DONE | Surprise automatically applied in round 1 |
| Add "Companion" creature type | ✅ DONE | New CombatantType with purple styling |
| Merge sort buttons (Alternative Initiative only) | ✅ DONE | Single sort button for alternating initiative |
| Add card duplication with A-Z naming | ✅ DONE | Duplicate button + quantity on add |

---

## Phase 2: Creator Unification & Layout
**Priority: HIGH** | **Affects all creator pages** | **Status: ✅ COMPLETE**

### Layout Consistency
| Task | Status | Notes |
|------|--------|-------|
| Unify save/load button positions across all creators | ✅ DONE | `CreatorHeader` component with Load button |
| Move calculated values to sticky sidebar | ✅ DONE | Already implemented in all creators |
| Move summary/description to fixed top area | ✅ DONE | `CreatorHeader` component with title/description |
| Standardize option stepper UI across creators | ✅ DONE | `NumberStepper` and `OptionStepper` components |

### Code Unification
| Task | Status | Notes |
|------|--------|-------|
| Create shared `OptionStepper` component for all creators | ✅ DONE | Already existed in `components/creator/` |
| Create shared `CreatorHeader` component | ✅ DONE | Added to `creator-layout.tsx` with icon, title, description, load button |
| Create shared `CostSidebar` component | ✅ DONE | `CostSummary` component already exists |
| Create shared `MechanicPartCard` component | ✅ DONE | Created `PartCard` component for power/technique parts |

---

## Phase 3: Power Creator Fixes
**Priority: HIGH** | **File: `src/app/(main)/power-creator/page.tsx`**

### Data Loading Fix (Root Cause)
| Task | Status | Notes |
|------|--------|-------|
| Add mechanic, duration, percentage flags to fetchPowerParts | ✅ DONE | Missing flags prevented mechanic parts from being found |
| Add op_3_desc, op_3_en, op_3_tp to fetchPowerParts | ✅ DONE | Option 3 data was missing |
| Add same fields to fetchTechniqueParts | ✅ DONE | Same issue affected techniques |

### Basic Mechanics Wiring
| Task | Status | Notes |
|------|--------|-------|
| Wire Range to POWER_RANGE part (ID: 292) | ✅ DONE | Now works with mechanic flag fix |
| Wire Area of Effect to appropriate parts | ✅ DONE | Sphere (232), Cylinder (231), Cone (89), Line (88), Trail (233) |
| Wire Action Type to mechanic parts | ✅ DONE | Quick (83), Long (81), Reaction (82) |
| Wire Damage to damage type parts | ✅ DONE | Magic (294), Elemental (297), Physical (296), etc. |

### Duration Fixes
| Task | Status | Notes |
|------|--------|-------|
| Add "Instant" duration option (default) | ✅ DONE | Already present, was working |
| Fix duration intervals (minutes: 1, 10, 30) | ✅ DONE | Added DURATION_VALUES with correct presets |
| Increase Sustain AP cap to 4 | ✅ DONE | Extended dropdown to 4 AP |
| Wire Focus, No Harm, Ends on Activation to duration parts | ✅ DONE | Part IDs: 304, 303, 302 - already wired |

### Advanced Mechanics
| Task | Status | Notes |
|------|--------|-------|
| Fix empty advanced mechanics dropdown | ✅ DONE | Now works with mechanic flag fix |
| Filter out mechanic parts from "Add Part" dropdown | ✅ DONE | Already filtering by !p.mechanic |

---

## Phase 4: Technique Creator Fixes
**Priority: HIGH** | **File: `src/app/(main)/technique-creator/page.tsx`** | **Status: ✅ COMPLETE**

### Data Loading Fix
| Task | Status | Notes |
|------|--------|-------|
| Fix base_en not showing in part display | ✅ DONE | Changed from base_stam to base_en |
| Add op_3 fields to fetchTechniqueParts | ✅ DONE | Already fixed with Phase 3 fix |

### Weapon Options
| Task | Status | Notes |
|------|--------|-------|
| Remove "Any Melee" / "Any Range" weapon options | ✅ DONE | Kept only "Unarmed Prowess" as default |
| Rename "Unarmed" to "Unarmed Prowess" | ✅ DONE | Matches vanilla site naming |

### Part Display
| Task | Status | Notes |
|------|--------|-------|
| Fix parts showing energy costs correctly | ✅ DONE | Using base_en instead of base_stam |
| Update energy calculation in part cards | ✅ DONE | Changed partStam variable to partEnergy |

---

## Phase 5: Armament/Item Creator Fixes
**Priority: HIGH** | **File: `src/app/(main)/item-creator/page.tsx`** | **Status: ✅ COMPLETE**

### Naming/Terminology
| Task | Status | Notes |
|------|--------|-------|
| Rename "Item Power" to "Item Points" (IP) | ✅ DONE | Updated UI label |
| Display Currency Multiplier (C) for properties | ✅ DONE | Added C display to property card header |

### Data Loading Fix
| Task | Status | Notes |
|------|--------|-------|
| Add base_ip, base_tp, base_c to fetchItemProperties | ✅ DONE | Extracted standardized fields from RTDB |
| Add op_1_ip, op_1_tp, op_1_c to fetchItemProperties | ✅ DONE | Support for option level values |
| Add op_1_desc to fetchItemProperties | ✅ DONE | Description for option 1 |

### Calculation Integration
| Task | Status | Notes |
|------|--------|-------|
| Currency calculations working with base_c/op_1_c | ✅ DONE | Calculator already had support, just needed data |
| IP calculations working with base_ip/op_1_ip | ✅ DONE | Calculator already had support, just needed data |
| TP calculations working correctly | ✅ DONE | Calculator already had support, just needed data |

---

## Phase 6: Creature Creator Fixes
**Priority: HIGH** | **File: `src/app/(main)/creature-creator/page.tsx`** | **Status: ✅ COMPLETE**

### Layout Fixes
| Task | Status | Notes |
|------|--------|-------|
| Swap calculated values and summary positions | ✅ DONE | Resource points in sticky sidebar, creature summary at top |
| Rename "H/E Points" to "HP/EN Points" | ✅ DONE | Changed to "HP/EN Points" in stats display |
| Rename "Loot Value" to "Currency" | ✅ DONE | Changed to "Currency" in stats display |

### Proficiency System Fix
| Task | Status | Notes |
|------|--------|-------|
| Implement "Proficiency Points" spendable system | ✅ DONE | Formula: level < 1 ? ceil(2*level) : 2 + floor(level/5). Shows spent/max with color coding |
| Reference vanilla site for proficiency spending | ✅ DONE | Added validation UI with red border when over limit |

### Health/Energy Display
| Task | Status | Notes |
|------|--------|-------|
| Move HP/EN to basic information area | ✅ DONE | Added to basic info section with compact +/- controls |
| Add +/- controls for HP/EN in same location | ✅ DONE | Shows bonus amount and max, with pool status display |

### Skills System
| Task | Status | Notes |
|------|--------|-------|
| Show skill bonus value (Ability + Skill Value) | ✅ DONE | Full bonus calculation including ability modifier from RTDB |
| Unify skill logic with character sheet | ✅ DONE | Added calculateSkillBonus utilities to formulas.ts, used by creature-creator |
| Track skill points spent/remaining | ✅ DONE | Already had remaining display, works correctly |

### Creature Feats & Mechanics
| Task | Status | Notes |
|------|--------|-------|
| Wire resistances/immunities/weaknesses to creature feat IDs | ✅ DONE | Auto-calculates feat points for Resistance(2), Immunity(3), Weakness(4), Condition Immunity(34) |
| Calculate feat points for mechanical feats (senses, movement, etc.) | ✅ DONE | Added CREATURE_FEAT_IDS and MECHANICAL_CREATURE_FEAT_IDS to id-constants.ts |
| Hide mechanical feats from manual feat selection | ✅ DONE | LoadFeatModal filters out mechanical feats by ID |
| Fix "No feats found" error after adding first feat | ✅ DONE | Fixed in fetchCreatureFeats - uses array index as fallback ID |

---

## Phase 7: Codex Fixes ✅ COMPLETE
**Priority: MEDIUM** | **File: `src/app/(main)/codex/page.tsx`**

### Consistency Issues
| Task | Status | Notes |
|------|--------|-------|
| Standardize tab layouts with headers | ✅ DONE | Properties and Equipment tabs now have sortable header rows |
| Add filter visibility toggle to all tabs | ✅ DONE | FilterSection component with show/hide toggle for all tabs |
| Unify ascending/descending sort across tabs | ✅ DONE | Properties and Equipment have consistent clickable sort headers |

### Feats Tab
| Task | Status | Notes |
|------|--------|-------|
| Rename filter to "Ability/Defense Requirement" | ✅ DONE | Added label prop to AbilityRequirementFilter |
| Change level filter to input instead of dropdown | ✅ DONE | Changed to number input with "Max Required Level" label |
| Fix duplicate "State Feats" in dropdown | ✅ DONE | Changed placeholder to "All Feats", clearer option labels |

### Skills Tab
| Task | Status | Notes |
|------|--------|-------|
| Fix ability display (add comma + space separation) | ✅ DONE | Updated fetchSkills to join array abilities with ", " |
| Implement sub-skill logic | ✅ DONE | Sub-skills show with ↳ indicator, linked to base_skill, filter options added |
| Add ability filter dropdown options | ✅ DONE | filterOptions now splits comma-separated abilities |

### Power & Technique Parts Tab
| Task | Status | Notes |
|------|--------|-------|
| Add filter border styling | ✅ DONE | FilterSection component with consistent border styling |
| Add "Hide Filters" toggle | ✅ DONE | FilterSection component with collapsible filters |

### Armament Properties Tab
| Task | Status | Notes |
|------|--------|-------|
| Display TP, IP, Currency Multiplier values | ✅ DONE | Header row with IP/TP/Cost columns, sortable |
| Add headers and filters | ✅ DONE | Added type filter and sortable 5-column header |

### Equipment Tab
| Task | Status | Notes |
|------|--------|-------|
| Load and display: name, description, currency, rarity, category | ✅ DONE | Shows type, subtype, cost, rarity in columns |
| Add headers and filters | ✅ DONE | Added sortable 5-column header row |
| Add category as filter/sort criteria | ✅ DONE | Added type and subtype filter dropdowns |

---

## Phase 8: Library Fixes ✅ COMPLETE
**Priority: MEDIUM** | **File: `src/app/(main)/library/page.tsx`**

### Part/Property Details
| Task | Status | Notes |
|------|--------|-------|
| Make part/property chips expandable for details | ✅ DONE | Powers and Techniques now show part descriptions in expanded view |

### Creatures Tab
| Task | Status | Notes |
|------|--------|-------|
| Create auto-generated creature stat blocks | ✅ DONE | Using CreatureStatBlock component with D&D-style layout |
| Display stat block in expanded view | ✅ DONE | Shows abilities, defenses, resistances, skills, combat info |

### General
| Task | Status | Notes |
|------|--------|-------|
| Ensure consistent expanded view across all library items | ✅ DONE | All tabs have proper expanded details with descriptions |
| Add edit/delete actions to library items | ✅ DONE | Already present in ItemCard manage mode |

---

## Phase 9: Error Resolution
**Priority: LOW** | **Various files** | **Status: ✅ COMPLETE**

### React Error #31 (Objects as Children)
| Task | Status | Notes |
|------|--------|-------|
| Find and fix object rendering issues | ✅ DONE | Added `formatDamageDisplay()` utility to safely render damage objects |
| Check damage config rendering | ✅ DONE | Updated 6 files to use safe formatter |

### WebSocket/Firebase Errors
| Task | Status | Notes |
|------|--------|-------|
| Investigate message channel closing error | ✅ DONE | Caused by Chrome extensions - added suppressConnectionWarnings |
| Check Firebase connection stability | ✅ DONE | Added graceful handling in firebase/client.ts |

---

## Implementation Order

1. **Phase 1: Encounter Tracker** - High visibility, user-facing issues
2. **Phase 2: Creator Unification** - Creates shared components for other phases
3. **Phase 3: Power Creator** - Critical functionality gaps
4. **Phase 4: Technique Creator** - Shares logic with Power Creator
5. **Phase 5: Armament Creator** - Completes creator fixes
6. **Phase 6: Creature Creator** - Complex, many interconnected issues
7. **Phase 7: Codex** - Polish and consistency
8. **Phase 8: Library** - Enhanced display features
9. **Phase 9: Errors** - Cleanup and stability

---

## Key ID References

### Power Parts (Mechanic Types)
| ID | Name | Use |
|----|------|-----|
| 81 | Power Long Action | Long action type |
| 82 | Power Reaction | Reaction action type |
| 83 | Power Quick or Free Action | Quick/free action type |
| 294 | Magic Damage | Magic damage type |
| 296 | Physical Damage | Physical damage type |
| 297 | Elemental Damage | Elemental damage type |
| 383 | Power Range | Range mechanic |
| 302 | Duration Ends On Activation | Duration modifier |
| 303 | No Harm or Adaptation for Duration | Duration modifier |
| 304 | Focus for Duration | Duration modifier |
| 305 | Sustain for Duration | Duration modifier |

### Technique Parts
| ID | Name | Use |
|----|------|-----|
| 2 | Reaction | Technique reaction |
| 3 | Long Action | Technique long action |
| 4 | Quick or Free Action | Technique quick action |
| 6 | Additional Damage | Extra damage dice |
| 7 | Add Weapon Attack | Weapon TP contribution |

### Item Properties
| ID | Name | Use |
|----|------|-----|
| 13 | Range | Ranged weapon property |
| 14 | Two-Handed | Two-handed property |
| 15 | Shield Base | Shield base stats |
| 16 | Armor Base | Armor base stats |
| 17 | Weapon Damage | Base weapon damage |

### Creature Feats (Mechanical)
| ID | Name | Use |
|----|------|-----|
| 2 | Resistance | Damage resistance |
| 3 | Immunity | Damage immunity |
| 4 | Weakness | Damage weakness |
| 34 | Condition Immunity | Condition immunity |
| 10-12 | Darkvision I-III | Vision senses |
| 13-16 | Blindsense I-IV | Blind senses |

---

## Notes

- Always reference vanilla site (`vanilla-site-reference-only/`) for expected behavior
- Prioritize code unification to reduce maintenance burden
- Test calculations against vanilla site outputs
- Update this document as tasks are completed
