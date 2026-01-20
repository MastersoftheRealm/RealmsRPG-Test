# Component Consolidation & Reuse Strategy

## Purpose
Track reusable components, identify duplications, and ensure consistent UI patterns across the entire React TTRPG site. This document helps us:
1. Know what components exist and can be reused
2. Track consolidation progress
3. Document where components are used
4. Plan extraction of reusable patterns
5. Identify where we can create/reuse components across the site for more uniformity, user intuition, and so on.

---

## INVENTORY OF SHARED COMPONENTS

### UI Components (`src/components/ui/`)

| Component | Purpose | Used In | Notes |
|-----------|---------|---------|-------|
| **ExpandableChip** | Click-to-expand chip with description | creature-creator only | ✅ Can use across site |
| **ChipGroup** | Flex wrap container for chips | creature-creator | ✅ Can use across site |
| **Chip** | Static badge/tag with variants | Various | Has many variants |
| **Card** | Container with header/content/footer | Various | Base container |
| **Collapsible** | Animated collapse section | Limited use | Available for use |
| **Modal** | Portal modal with animation | All modals | ✅ Widely used |
| **Tabs** | Tabbed interface | Library sections | ✅ Widely used |
| **Toast** | Notifications | Not currently used | ⚠️ Should add for save notifications |
| **Button** | Styled buttons | Various | ✅ Widely used |
| **Input** | Form inputs | Various | ✅ Widely used |

### Shared Components (`src/components/shared/`)

| Component | Purpose | Used In | Notes |
|-----------|---------|---------|-------|
| **AbilityCard** | Powers/Techniques/Armaments display | Library page | ✅ **Best candidate for char sheet** |
| **ItemCard** | Generic item display | ItemList, ItemSelectionModal | Different from char sheet ItemCard |
| **SpeciesTraitCard** | Trait display with uses | Character Creator, Codex | ✅ Use for Traits section |
| **CreatureStatBlock** | Full creature display | Library page | Specific to creatures |
| **DeleteConfirmModal** | Confirm delete dialogs | Library page | ✅ Can use across site |
| **LoadingState/ErrorState** | Loading/error display | Library page | ✅ Can use across site |
| **SearchInput/SortHeader** | List utilities | Library, Codex | ✅ List components |

### AbilityCard Sub-Components (Extractable)
- **PartChipButton** - Clickable chip with TP badge (lines 270-295)
- **PartChipDetails** - Expanded chip detail panel (lines 297-340)

---

## DUPLICATIONS FOUND

### 1. Card Components for Powers/Techniques/Items

| Location | Component | Features | Parts Chips? |
|----------|-----------|----------|--------------|
| `shared/ability-card.tsx` | AbilityCard | Full-featured, stats, parts chips | ✅ Yes |
| `character-sheet/library-section.tsx` | PowerCard | Innate toggle, use button, energy display | ❌ No |
| `character-sheet/library-section.tsx` | TechniqueCard | Use button, energy display | ❌ No |
| `character-sheet/library-section.tsx` | ItemCard | Equip toggle, attack/damage rolls | ❌ Basic only |
| `shared/item-card.tsx` | ItemCard | Selection mode, manage mode, badges | ❌ No parts |
| `codex/page.tsx` | EquipmentCard | Properties as comma-separated text | ⚠️ Basic |

**Action:** Extend AbilityCard OR create CharacterAbilityCard that shares chip components

### 2. Part/Property Chip Patterns

| Location | Pattern | Expandable? | TP Cost? |
|----------|---------|-------------|----------|
| `ability-card.tsx` | PartChipButton + PartChipDetails | ✅ | ✅ |
| `ui/expandable-chip.tsx` | ExpandableChip | ✅ | ❌ (has generic cost) |
| `library-section.tsx` ItemCard | Basic `<span>` chips | ❌ | ❌ |
| `codex/page.tsx` EquipmentCard | Basic comma-separated | ❌ | ❌ |
| `creature-creator/page.tsx` | ExpandableChipList | ✅ | ❌ |

**Action:** Create unified `PartChip` and `PartChipList` components that work everywhere

### 3. PartCard (Creator Forms)

| Location | Purpose |
|----------|---------|
| `power-creator/page.tsx` | Edit power parts |
| `technique-creator/page.tsx` | Edit technique parts |
| `item-creator/page.tsx` | Edit item properties (PropertyCard) |

**Action:** Could create shared `PartEditorCard` component

---

## CONSOLIDATION PLAN

### Phase 1: Extract Shared Chip Components ✅
**Status:** COMPLETED (2025-01-20)

1. ✅ Created `src/components/shared/part-chip.tsx`:
   - `PartChip` - Unified clickable chip with TP cost badge
   - `PartChipDetails` - Expanded detail panel
   - `PartChipList` - Container that manages expansion state
   - `PropertyChipList` - Simplified variant for item properties
   
2. ✅ Updated character sheet library-section to use PartChipList
3. ⏳ TODO: Update AbilityCard to use new shared components (for consistency)

### Phase 2: Enhance Character Sheet Cards ✅
**Status:** COMPLETED (2025-01-20)

**Completed:**
1. ✅ Parts chips added to PowerCard, TechniqueCard, ItemCard (via PartChipList)
2. ✅ Feat uses +/- buttons (always visible, not just edit mode)
3. ✅ Recovery period display for feats with limited uses
4. ✅ Remove skill (✕) button in edit mode
5. ✅ Proficiency editing (+/- controls for mart_prof, pow_prof)
6. ✅ Traits section using SpeciesTraitCard

**Pending (requires data enrichment):**
- ⏳ Trait uses +/- (traits stored as strings, need database lookup for uses_per_rec)
- ⏳ Requirements warnings (needs requirement checking logic)

### Phase 3: Unify Card Components ⏳
**Status:** Not Started

1. Create `CharacterAbilityCard` or extend `AbilityCard` to support:
   - Use button (powers/techniques)
   - Innate toggle (powers)
   - Equip toggle (weapons/armor)
   - Attack/Damage roll buttons
   - Remove button (edit mode)
   
2. Replace local cards in library-section.tsx

### Phase 4: Codex Integration ⏳
**Status:** Not Started

1. Update EquipmentCard to use PartChipList for properties
2. Ensure consistent styling with Library and Character Sheet

---

## COMPONENT USAGE MATRIX

Where each reusable component should be used:

| Component | Library Page | Character Sheet | Codex | Creators |
|-----------|-------------|-----------------|-------|----------|
| PartChip | ✅ Via AbilityCard | 🔄 Add | 🔄 Add | N/A |
| PartChipList | ✅ Via AbilityCard | 🔄 Add | 🔄 Add | N/A |
| ExpandableChip | ❌ | 🔄 Consider | ❌ | ✅ creature |
| AbilityCard | ✅ | 🔄 Consider | 🔄 Consider | N/A |
| SpeciesTraitCard | ❌ | 🔄 Add for Traits | ✅ | ✅ species |
| Toast | 🔄 Add | 🔄 Add | 🔄 Add | 🔄 Add |

Legend: ✅ = Currently used, 🔄 = Should add, ❌ = Not applicable

---

## VANILLA FEATURE CHECKLIST

Track vanilla site features and their React implementation status:

### Character Sheet Core
- [x] Portrait with placeholder
- [x] Name, species, gender display
- [x] Level and XP tracking
- [x] Speed and Evasion stats
- [x] Health/Energy bars with +/-
- [x] Terminal threshold display
- [x] 6 Ability scores with roll buttons
- [x] 6 Defense scores with roll buttons
- [x] Skills table with proficiency
- [x] Sub-skills display

### Edit Mode Features
- [x] Global edit toggle
- [ ] Notification dot on edit button (green pulsing)
- [ ] Section edit toggles (pencil icons)
- [x] Ability +/- allocation
- [ ] Ability 2-point cost for 4+
- [ ] Defense value allocation
- [ ] Health-Energy allocation panel
- [x] Skill +/- allocation
- [ ] Remove skill (✕) button
- [ ] Proficiency +/- editing (mart_prof, pow_prof)

### Powers Tab
- [x] Power cards with name/description
- [x] Energy cost display
- [x] Innate badge
- [x] Toggle innate checkbox (edit mode)
- [x] Use button (deducts energy)
- [ ] **Parts chips** (expandable)
- [ ] Innate vs Regular separation

### Techniques Tab
- [x] Technique cards with name/description
- [x] Energy cost display
- [x] Use button (deducts energy)
- [ ] **Parts chips** (expandable)
- [ ] Weapon requirement display

### Inventory Tab
- [x] Weapons with attack/damage rolls
- [x] Armor with damage reduction
- [x] Equipment with quantities
- [x] Equip/unequip toggle
- [ ] **Property chips** (expandable)
- [ ] Currency +/- input
- [ ] Armament proficiency box

### Archetype Section
- [x] Martial/Power proficiency display
- [x] Attack Bonuses table (Prof/Unprof)
- [x] Power Potency display
- [ ] Proficiency +/- editing
- [ ] Archetype choices (mixed archetypes)

### Feats Section
- [x] Feat cards with description
- [x] Add feat button
- [ ] Uses +/- controls
- [ ] Recovery display
- [ ] **Traits section** (ancestry, flaw, characteristic)

### Dice Rolling
- [x] Roll log panel
- [x] Skill/Attack/Damage/Defense rolls
- [x] Crit success/fail styling
- [x] Dice pool builder
- [x] Roll history

---

## NEXT ACTIONS

1. **Create `src/components/shared/part-chip.tsx`** with extracted chip components
2. **Add parts data** to character powers/techniques (need transformer)
3. **Update library-section.tsx** to display parts chips
4. Add remove skill button
5. Add proficiency editing

---

## NOTES

- Always prefer extending existing shared components over creating new ones
- When creating new shared components, put them in `src/components/shared/`
- UI primitives go in `src/components/ui/`
- Document all component changes in this file
- Test components work across all usage contexts before marking complete

Last Updated: 2025-01-20
