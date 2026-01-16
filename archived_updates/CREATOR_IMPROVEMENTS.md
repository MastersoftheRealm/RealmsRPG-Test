# Creator Systems: Comprehensive Analysis and Improvement Plan

## Executive Summary

This document provides a thorough analysis of the Power Creator, Technique Creator, Armament Creator (Item Creator), and Creature Creator systems. It identifies consistency issues, bugs, missing functionality, and provides recommendations for improvements to ensure all creators follow uniform patterns, share code, and match the vanilla site functionality.

---

## Table of Contents

1. [Universal Issues Across All Creators](#universal-issues-across-all-creators)
2. [Power Creator Issues](#power-creator-issues)
3. [Technique Creator Issues](#technique-creator-issues)
4. [Armament (Item) Creator Issues](#armament-item-creator-issues)
5. [Creature Creator Comparison](#creature-creator-comparison)
6. [Split Damage Dice Analysis](#split-damage-dice-analysis)
7. [Shared Components & Code Reuse](#shared-components--code-reuse)
8. [Implementation Priority](#implementation-priority)

---

## Universal Issues Across All Creators

### 1. Category Change Should Auto-Select First Part (HIGH PRIORITY)

**Current Behavior:** When changing the category filter for a part/property, the previously selected part remains selected even if it doesn't match the new category.

**Expected Behavior:** When switching categories, automatically select the first part alphabetically in that category.

**Files Affected:**
- [src/app/(main)/power-creator/page.tsx](src/app/(main)/power-creator/page.tsx) - `PartCard` component (line ~270)
- [src/app/(main)/technique-creator/page.tsx](src/app/(main)/technique-creator/page.tsx) - `PartCard` component (line ~165)
- [src/app/(main)/item-creator/page.tsx](src/app/(main)/item-creator/page.tsx) - `PropertyCard` component (line ~83)

**Fix Required:**
In each creator's category change handler:
```typescript
onChange={(e) => {
  const newCategory = e.target.value;
  const filtered = getFilteredParts(newCategory);
  const newPart = filtered[0]; // First alphabetically
  onUpdate({ 
    selectedCategory: newCategory,
    part: newPart,
    op_1_lvl: 0,
    op_2_lvl: 0,
    op_3_lvl: 0,
  });
}}
```

**Vanilla Site Reference:** See [vanilla-site-reference-only/public/js/tools/power-creator/main.js](vanilla-site-reference-only/public/js/tools/power-creator/main.js) lines 50-65, `updateSelectedCategory()` function.

---

### 2. Save/Load/Reset Button Location Inconsistency (MEDIUM PRIORITY)

**Current State:**
- **Creature Creator:** Buttons in the top-right header area
- **Power/Technique/Item Creators:** Buttons in the sidebar summary section (bottom of sticky column)

**Expected State:** All creators should have Save/Load/Reset buttons in the same location (top-right header area like the Creature Creator).

**Implementation:**
Move the action buttons from the sidebar to the header section in:
- [src/app/(main)/power-creator/page.tsx](src/app/(main)/power-creator/page.tsx)
- [src/app/(main)/technique-creator/page.tsx](src/app/(main)/technique-creator/page.tsx)
- [src/app/(main)/item-creator/page.tsx](src/app/(main)/item-creator/page.tsx)

**Example Header Structure:**
```tsx
<div className="mb-6 flex items-start justify-between">
  <div>
    <h1>Power Creator</h1>
    <p>Description...</p>
  </div>
  <div className="flex items-center gap-2">
    <button onClick={() => setShowLoadModal(true)}>Load from Library</button>
    <button onClick={handleSave}>Save</button>
    <button onClick={handleReset}>Reset</button>
  </div>
</div>
```

---

## Power Creator Issues

### 1. Range Not Contributing to Energy Calculation (HIGH PRIORITY)

**Problem:** The Power Range part (ID 383 → should be 292 per `id-constants.ts`) isn't wiring correctly to the energy calculation, or is using the wrong ID.

**Root Cause Analysis:**
- In [src/lib/id-constants.ts](src/lib/id-constants.ts) line 55: `POWER_RANGE: 292`
- The vanilla site uses `PART_IDS.POWER_RANGE` consistently
- Check if the React site is passing the correct range steps to the mechanic builder

**Fix Location:** [src/lib/calculators/mechanic-builder.ts](src/lib/calculators/mechanic-builder.ts) lines 294-302

**Current Code:**
```typescript
if (ctx.range && ctx.range.steps > 0) {
  addPart(
    PART_IDS.POWER_RANGE,
    'Power Range',
    Math.max(0, ctx.range.steps - 1),
    ctx.range.applyDuration
  );
}
```

**Verify:** Ensure `range.steps` is being passed correctly from the Power Creator UI.

---

### 2. Range Display Should Show Spaces, Not Steps (MEDIUM PRIORITY)

**Current Display:** Shows "Range Steps: X" with confusing step values
**Expected Display:** Show actual range in spaces (3 spaces per step, starting at 3)

**Formula:** `range_spaces = 3 + (steps * 3)` where steps=0 means melee (1 space)

**Current UI Code** (line ~1159):
```tsx
<NumberStepper
  value={range.steps}
  onChange={(v) => setRange((r) => ({ ...r, steps: v }))}
  label="Range Steps:"
  min={0}
  max={10}
/>
<span className="text-sm text-gray-600">
  {range.steps === 0 ? '(Melee / 1 Space)' : `(${range.steps * 6} spaces)`}
</span>
```

**Bug:** Using `range.steps * 6` instead of `3 + (range.steps * 3)`

**Fix:**
```tsx
<NumberStepper
  value={range.steps}
  onChange={(v) => setRange((r) => ({ ...r, steps: v }))}
  label="Range:"
  min={0}
  max={10}
/>
<span className="text-sm text-gray-600">
  {range.steps === 0 ? '(1 Space / Melee)' : `(${3 + (range.steps * 3)} spaces)`}
</span>
```

**Better UX:** Show the range directly and increment by 3:
```tsx
const rangeSpaces = range.steps === 0 ? 1 : 3 + (range.steps - 1) * 3;
// Display: "3 spaces", "6 spaces", "9 spaces", etc.
```

---

### 3. Duration Calculation Bug (HIGH PRIORITY)

**Problem:** Duration is calculating energy costs incorrectly - appears to be multiplying instead of using the correct formula.

**Vanilla Site Power Cost Formula:**
```javascript
// From vanilla-site-reference-only/public/js/calculators/power-calc.js lines 28-85
const totalEnergyRaw = (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur);
```

**React Site Implementation:**
```typescript
// From src/lib/calculators/power-calc.ts lines 115-122
const totalEnergyRaw =
  flat_normal * perc_all +
  (dur_all + 1) * flat_duration * perc_dur -
  flat_duration * perc_dur;
```

**Key Duration Logic Check:**
1. Duration parts (where `def.duration === true`) should MULTIPLY into `dur_all`
2. The Duration (Round) part: `id: 377`, `base_en: 0.125`, `duration: true`, `percentage: false`
3. For Duration (Round), 2 rounds = base (0.125), each additional round = +0.125 per `op_1_lvl`

**Potential Issue:** The duration part's energy contribution calculation:
```typescript
// Current code treats duration parts as multipliers to dur_all
if (isDuration) {
  dur_all *= energyContribution;  // e.g., 0.125 * 0.125 = 0.015625 (wrong!)
  hasDurationParts = true;
}
```

**The Real Issue:** Duration parts with `percentage: true` in the database use a PERCENTAGE value (like 0.125 = 12.5%), not a multiplier. The formula should be:
```typescript
// Duration adds to the multiplier, not multiplies
if (isDuration) {
  dur_all += energyContribution;  // Accumulative percentage
  hasDurationParts = true;
}
```

**OR** check the vanilla site's actual handling - it may be that `dur_all` starts at 0 and accumulates:
```javascript
// Vanilla site - if no duration parts, dur_all = 0
if (!hasDurationParts) dur_all = 0;
```

**Verification Needed:** Check the actual RTDB data for Duration (Round) part:
- Is `base_en: 0.125` or `base_en: 1.125`?
- The `percentage: true` flag indicates this is a percentage multiplier

---

### 4. Advanced Power Mechanics Section UI Issues (MEDIUM PRIORITY)

**Issue 4a: Columns Too Tall**
- Should wrap to multiple adjacent rows when there are more than 5 items per category
- Use CSS grid with `max-items: 5` per column

**Current Code** (around line 655):
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
```

**Fix:**
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
  {ADVANCED_CATEGORIES.map((category) => {
    const parts = getPartsForCategory(category);
    if (parts.length === 0) return null;
    // Split into chunks of 5
    const columns = [];
    for (let i = 0; i < parts.length; i += 5) {
      columns.push(parts.slice(i, i + 5));
    }
    return (
      <div key={category} className="space-y-2">
        <h4 className="text-sm font-bold text-gray-700">{category}</h4>
        <div className="flex gap-2">
          {columns.map((col, idx) => (
            <div key={idx} className="space-y-2 flex-1">
              {col.map(part => <AdvancedChip key={part.id} part={part} onAdd={() => onAdd(part)} />)}
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>
```

**Issue 4b: Click Anywhere to Expand Not Working**
Chips should expand on any click except the + button.

**Current Code** (AdvancedChip around line 383):
```tsx
<span
  className={cn('text-sm font-medium', colors.text)}
  onClick={() => setExpanded(!expanded)}
>
```

**Fix:** Move click handler to the parent container:
```tsx
<div
  className={cn(
    'rounded-lg border px-3 py-2 cursor-pointer transition-all',
    colors.bg, colors.border, colors.hoverBg
  )}
  onClick={() => setExpanded(!expanded)}
>
  <div className="flex items-center justify-between gap-2">
    <span className={cn('text-sm font-medium', colors.text)}>
      {part.name}
    </span>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // Prevent expansion
        onAdd();
      }}
      // ...
    >
```

**Issue 4c: Show Energy Contribution Per Mechanic Section**
Each mechanic section (Damage, Range, Area of Effect, Duration) should show its energy contribution.

**Example for Range Section:**
```tsx
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-bold text-gray-900">Range</h3>
    <span className="text-sm text-blue-600 font-medium">
      Energy: +{rangeEnergyCost.toFixed(1)}
    </span>
  </div>
  {/* ... range controls ... */}
</div>
```

---

### 5. Duration Section Label Fixes (LOW PRIORITY)

**Current Labels:**
- "Focus (Maintain)" → Should be just "Focus"
- "No Harm (End Early)" → Should be "No Offensive or Adaptation Parts"

**File:** [src/app/(main)/power-creator/page.tsx](src/app/(main)/power-creator/page.tsx) around lines 1345-1365

---

### 6. Area of Effect Label Fixes (LOW PRIORITY)

**Current Labels:**
- "Trail (Space)" → Should be just "Trail"
- "None (Single Target)" → Should be "None (Single Space)"

**File:** [src/app/(main)/power-creator/page.tsx](src/app/(main)/power-creator/page.tsx) lines 77-84 (AREA_TYPES constant)

---

## Technique Creator Issues

### 1. Additional Damage - Remove "(optional)" and Damage Type Selection (MEDIUM PRIORITY)

**Current State:**
- Label shows "Additional Damage (Optional)"
- Has a damage type dropdown

**Expected State:**
- Label should be just "Additional Damage"
- Remove damage type selection (uses weapon's damage type)

**File:** [src/app/(main)/technique-creator/page.tsx](src/app/(main)/technique-creator/page.tsx)

**Current damage types constant** (line 50):
```typescript
const DAMAGE_TYPES = [
  'none', 'physical', 'slashing', 'piercing', 'bludgeoning'
];
```

**Fix:** Remove damage type selector entirely, keep only dice amount and size.

---

### 2. Split Damage Dice Wiring (HIGH PRIORITY)

**Split Damage Dice IDs (User Specified):**
- **Technique Split Damage Dice:** ID 6 (user says 6, but `id-constants.ts` shows `SPLIT_DAMAGE_DICE: 5`)
- **Armament Split Damage Dice:** ID 12 (confirmed in `PROPERTY_IDS.SPLIT_DAMAGE_DICE`)
- **Power Damage Split Cost Part:** ID 414 (user specified - **NEEDS VERIFICATION IN RTDB**)

**ID Constants Current State** ([src/lib/id-constants.ts](src/lib/id-constants.ts)):
```typescript
// Technique Parts
ADDITIONAL_DAMAGE: 6,      // This is the Additional Damage part, NOT split dice
SPLIT_DAMAGE_DICE: 5,      // Technique split damage dice

// Item Properties  
SPLIT_DAMAGE_DICE: 12,     // Armament (weapon) split damage dice
```

**⚠️ CLARIFICATION NEEDED:** The user says technique split damage dice is ID 6, but the code has:
- ID 5 = Split Damage Dice (technique)
- ID 6 = Additional Damage (technique)

**Vanilla Site Reference:** The technique split damage dice uses the same logic as weapons - each additional die beyond the minimum needed increases the split level.

**Current Implementation** in [mechanic-builder.ts](src/lib/calculators/mechanic-builder.ts) line 282:
```typescript
const splits = calculateSplitDiceLevel(diceAmount);
if (splits > 0) {
  addPart(PART_IDS.SPLIT_DAMAGE_DICE, 'Split Damage Dice', splits - 1);
}
```

**Issue:** `calculateSplitDiceLevel` (line 204) uses a simplified `diceAmount - 1` formula but should use the proper split calculation that considers die size:
```typescript
// Correct formula from vanilla site (technique-calc.js, item-calc.js)
export function computeSplits(diceAmt: number, dieSize: number): number {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}
```

---

## Armament (Item) Creator Issues

### 1. Default Weapon Damage Should Be 1d4 (HIGH PRIORITY)

**Current Default:** 1d8
**Expected Default:** 1d4 (base weapon damage)

**File:** [src/app/(main)/item-creator/page.tsx](src/app/(main)/item-creator/page.tsx) line 219:
```typescript
const [damage, setDamage] = useState<DamageConfig>({ amount: 1, size: 6, type: 'slashing' });
```

**Fix:**
```typescript
const [damage, setDamage] = useState<DamageConfig>({ amount: 1, size: 4, type: 'slashing' });
```

---

### 2. Weapon Damage Types Should Only Be Physical (MEDIUM PRIORITY)

**Current Types:** All damage types including magical
**Expected Types:** Only slashing, bludgeoning, piercing

**File:** [src/app/(main)/item-creator/page.tsx](src/app/(main)/item-creator/page.tsx) line 54:
```typescript
const DAMAGE_TYPES = [
  'none', 'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 
  'lightning', 'acid', 'poison', 'necrotic', 'radiant', 'psychic'
];
```

**Fix:**
```typescript
const WEAPON_DAMAGE_TYPES = ['slashing', 'piercing', 'bludgeoning'];
```

---

### 3. Weapon Damage Not Contributing to IP/TP/C (HIGH PRIORITY)

**Problem:** Weapon damage (ID 17) isn't being added to the cost calculation.

**Expected Behavior:** Weapon Damage property should be auto-added with:
- Base: 1d4 (op_1_lvl = 0)
- Each 1d2 equivalent increase = +1 to op_1_lvl

**Formula:** `op_1_lvl = Math.floor((diceAmount * dieSize - 4) / 2)`

**Current Implementation** (lines 272-283):
```typescript
if (armamentType === 'Weapon') {
  // ... damage handling
}
```

**Fix:** Add Weapon Damage property to propertiesPayload:
```typescript
if (armamentType === 'Weapon' && damage.type !== 'none' && damage.amount > 0) {
  const weaponDamageProp = itemProperties.find(p => Number(p.id) === 17);
  if (weaponDamageProp) {
    const weaponDamageLevel = Math.max(0, Math.floor((damage.amount * damage.size - 4) / 2));
    baseProps.push({ 
      id: 17, 
      name: 'Weapon Damage', 
      op_1_lvl: weaponDamageLevel 
    });
    
    // Also add split damage dice if needed (ID: 12)
    const splits = computeSplits(damage.amount, damage.size);
    if (splits > 0) {
      baseProps.push({
        id: 12,
        name: 'Split Damage Dice',
        op_1_lvl: splits - 1
      });
    }
  }
}
```

---

### 4. Armor Configuration Issues (HIGH PRIORITY)

**Issue 4a: Damage Reduction Default Should Be 0**
**Current:** 1
**Expected:** 0

**File:** Line 220:
```typescript
const [damageReduction, setDamageReduction] = useState(1);
```

**Fix:**
```typescript
const [damageReduction, setDamageReduction] = useState(0);
```

**Issue 4b: Agility Reduction Default Should Be 0 (Not "None" Display)**
**Current Display:** Shows "None" when 0
**Expected:** Show "0"

**Issue 4c: Pull Description from RTDB**
- Damage Reduction description should come from property ID 1
- Agility Reduction description should come from property ID 5

**Issue 4d: Missing Critical Range Increase Option (ID 22)**
Need to add a Critical Range configuration section for armor.

**Implementation:**
```tsx
{armamentType === 'Armor' && (
  <div>
    {/* ... existing DR and Agi Reduction ... */}
    
    {/* Critical Range Increase */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Critical Range Increase
      </label>
      <div className="flex items-center gap-3">
        <button onClick={() => setCriticalRange(Math.max(0, criticalRange - 1))}>−</button>
        <span>{criticalRange}</span>
        <button onClick={() => setCriticalRange(criticalRange + 1)}>+</button>
      </div>
      <p className="text-xs text-gray-500 mt-1">{/* Description from RTDB */}</p>
    </div>
  </div>
)}
```

---

### 5. Shield Configuration Issues (HIGH PRIORITY)

**Issue 5a: Shield Amount Should Use Dice (1d4 base), Not Flat Value**

**Current Implementation:** Uses flat `shieldAmount` number
**Expected:** Use dice notation like weapons

**Property ID 39:** Shield Amount
- Base: 1d4 damage reduction
- Each op_1_lvl: +1d2

**Fix:** Change shield state to use dice:
```typescript
const [shieldDice, setShieldDice] = useState({ amount: 1, size: 4 }); // 1d4
```

**Issue 5b: Missing Shield Damage Section (Property ID 40)**

**Property ID 40:** Shield Damage
- Description: "This Shield can deal 1d4 Bludgeoning damage as a melee Weapon attack."
- Base: 1d4
- Each op_1_lvl: +1d2

**Implementation:**
```tsx
{armamentType === 'Shield' && (
  <>
    {/* Shield Damage Reduction */}
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3>Shield Block</h3>
      {/* Dice selector for damage reduction */}
    </div>
    
    {/* Shield Damage (Optional) */}
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <input 
          type="checkbox" 
          checked={hasShieldDamage}
          onChange={(e) => setHasShieldDamage(e.target.checked)}
        />
        <h3>Shield Damage (Optional)</h3>
      </div>
      {hasShieldDamage && (
        <div>
          {/* Dice selector for shield damage, starting at 1d4 */}
        </div>
      )}
    </div>
  </>
)}
```

---

### 6. Ability Requirements for Weapons, Armor, Shields (HIGH PRIORITY)

**Missing Feature:** Ability requirement selection

**Requirement Property IDs:**
- Weapon: 6 (STR), 7 (AGI), 8 (VIT), 9 (ACU), 10 (INT), 11 (CHA)
- Armor: 2 (STR), 3 (AGI), 4 (VIT)
- Shield: Uses Weapon requirements (6-11)

**Implementation:**
```tsx
const WEAPON_ABILITY_REQUIREMENTS = [
  { id: 6, name: 'Strength', label: 'STR' },
  { id: 7, name: 'Agility', label: 'AGI' },
  { id: 8, name: 'Vitality', label: 'VIT' },
  { id: 9, name: 'Acuity', label: 'ACU' },
  { id: 10, name: 'Intelligence', label: 'INT' },
  { id: 11, name: 'Charisma', label: 'CHA' },
];

const ARMOR_ABILITY_REQUIREMENTS = [
  { id: 2, name: 'Strength', label: 'STR' },
  { id: 3, name: 'Agility', label: 'AGI' },
  { id: 4, name: 'Vitality', label: 'VIT' },
];

// State
const [abilityRequirement, setAbilityRequirement] = useState<{id: number; level: number} | null>(null);

// Only one requirement can be selected at a time
// level: 1 = base property, 2+ = op_1_lvl = level - 1
```

---

### 7. Item Summary Should Show TP Sources as "Proficiencies" (MEDIUM PRIORITY)

**Current State:** Shows properties list
**Expected State:** Show TP breakdown similar to power/technique creators

**Implementation:**
```tsx
{costs.totalTP > 0 && (
  <div className="border-t border-gray-100 pt-4 mb-6">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Proficiencies</h4>
    <ul className="text-xs text-gray-600 space-y-1">
      {/* List each property that contributes TP */}
    </ul>
  </div>
)}
```

---

## Creature Creator Comparison

The Creature Creator serves as the reference for UI/UX patterns:

**Good Patterns to Copy:**
1. Action buttons (Save/Load/Reset) in header, not sidebar
2. Sticky sidebar for summary
3. Expandable sections with clear visual hierarchy
4. Consistent chip/tag display for multi-select values

---

## Split Damage Dice Analysis

### ID Reference (VERIFICATION NEEDED):
- **Armament (Weapon) Split Damage Dice:** ID 12 ✅ Confirmed in `PROPERTY_IDS.SPLIT_DAMAGE_DICE`
- **Technique Additional Damage Split Dice:** 
  - User says ID 6
  - Code shows `PART_IDS.SPLIT_DAMAGE_DICE: 5` and `PART_IDS.ADDITIONAL_DAMAGE: 6`
  - **ACTION:** Verify in RTDB which ID is correct for technique split dice
- **Power Damage Split Cost Part:** ID 414 (user specified) - **NEEDS VERIFICATION IN RTDB**
  - This ID is not currently in `src/lib/id-constants.ts`
  - Power creator may not have split damage dice implemented at all

### Split Damage Formula (Shared - from vanilla site):
```typescript
// From vanilla-site-reference-only/public/js/calculators/technique-calc.js lines 21-27
// Also in vanilla-site-reference-only/public/js/calculators/item-calc.js
export function computeSplits(diceAmt: number, dieSize: number): number {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}
```

### How Split Works:
1. **Base (first split):** Included in the property addition at op_1_lvl = 0
2. **Additional splits:** Each split beyond the first adds +1 to op_1_lvl

**Example:** 3d6 damage
- Total: 18
- Minimum dice using d12: ceil(18/12) = 2
- Splits needed: 3 - 2 = 1
- op_1_lvl = 1 - 1 = 0 (base covers first split)

### Current Implementation Check:

**Armament (item-calc.ts):** ✅ Has `computeSplits` function
**Technique (mechanic-builder.ts):** ⚠️ Uses `calculateSplitDiceLevel` which is simplified
**Power (mechanic-builder.ts):** ❌ No split damage dice implementation for powers

---

## Shared Components & Code Reuse

### Existing Shared Components:
- `NumberStepper` - [src/components/creator/number-stepper.tsx](src/components/creator/number-stepper.tsx)
- `LoadFromLibraryModal` - [src/components/creator/LoadFromLibraryModal.tsx](src/components/creator/LoadFromLibraryModal.tsx)
- `CostSummary` - [src/components/creator/cost-summary.tsx](src/components/creator/cost-summary.tsx)
- `PartCard` - [src/components/creator/part-card.tsx](src/components/creator/part-card.tsx)

### Recommended New Shared Components:

1. **DamageConfig Component**
   - Dice amount, die size, damage type selection
   - Used by Power, Technique, and Armament creators

2. **CreatorHeader Component**
   - Title, description, and action buttons (Save/Load/Reset)
   - Consistent layout across all creators

3. **CategoryPartSelector Component**
   - Category dropdown + Part dropdown with auto-select on category change
   - Used by Power and Technique creators

4. **CostDisplay Component**
   - Shows Energy/TP or IP/TP/Currency based on creator type
   - Unified styling

5. **AbilityRequirementSelector Component**
   - Single ability + level selector
   - Used by Armament creator for all types

### Code Consolidation Opportunities:

1. **Damage Level Calculation**
   - Currently duplicated in power-calc.ts and mechanic-builder.ts
   - Consolidate into a single utility

2. **Split Dice Calculation**
   - Currently in item-calc.ts and mechanic-builder.ts with different implementations
   - Use single `computeSplits` function everywhere

3. **Action Type Display**
   - Both Power and Technique have similar action type logic
   - Already somewhat consolidated in mechanic-builder.ts

---

## Implementation Priority

### Phase 1: Critical Bugs (HIGH PRIORITY)
1. [ ] Fix weapon damage not contributing to IP/TP/C
2. [ ] Fix duration calculation in power creator
3. [ ] Fix default weapon damage to 1d4
4. [ ] Implement split damage dice for all creators correctly
5. [ ] Add ability requirements to armaments

### Phase 2: Missing Features (MEDIUM PRIORITY)
1. [ ] Category change auto-selects first part
2. [ ] Shield dice-based damage reduction
3. [ ] Shield damage section
4. [ ] Armor critical range increase option
5. [ ] Power range display fix (show spaces, not steps)
6. [ ] Remove damage type from technique additional damage

### Phase 3: UI/UX Consistency (MEDIUM PRIORITY)
1. [ ] Move Save/Load/Reset buttons to header for all creators
2. [ ] Advanced mechanics section layout improvements
3. [ ] Click-to-expand for advanced mechanic chips
4. [ ] Show energy contribution per section
5. [ ] Pull descriptions from RTDB for armor properties

### Phase 4: Polish (LOW PRIORITY)
1. [ ] Fix label text (Focus, No Harm, Trail, None)
2. [ ] Unify styling across creators
3. [ ] Create shared components
4. [ ] Item summary proficiency display

---

## Appendix: ID Constants Reference

### Power Parts (src/lib/id-constants.ts):
```typescript
POWER_RANGE: 292,
MAGIC_DAMAGE: 294,
DURATION_ROUND: 377,
DURATION_PERMANENT: 306,
// ... etc
```

### Technique Parts:
```typescript
ADDITIONAL_DAMAGE: 6,
SPLIT_DAMAGE_DICE: 5,
REACTION: 2,
// ... etc
```

### Item Properties:
```typescript
WEAPON_DAMAGE: 17,
SPLIT_DAMAGE_DICE: 12,
SHIELD_AMOUNT: 39,
SHIELD_DAMAGE: 40,
CRITICAL_RANGE_PLUS_1: 22,
// Ability Requirements: 2-11
```

---

*Document created: January 16, 2026*
*Last updated: January 16, 2026*

---

## Appendix B: Database Verification Checklist

Before implementing fixes, verify these IDs in the RTDB:

### Power Parts Database
- [ ] Power Range part ID (code says 292, verify in RTDB)
- [ ] Duration (Round) part - verify `base_en`, `duration`, `percentage` flags
- [ ] Split Damage Dice for powers - user says ID 414 (NOT IN id-constants.ts currently)
- [ ] All damage type part IDs (294-301)

### Technique Parts Database
- [ ] Split Damage Dice ID - code says 5, user says 6
- [ ] Additional Damage ID - code says 6
- [ ] Verify the `mechanic` flag on all action type parts

### Item Properties Database
- [ ] Weapon Damage property ID 17 structure (base_ip, base_tp, base_c, op_1_* values)
- [ ] Split Damage Dice property ID 12
- [ ] Shield Amount property ID 39
- [ ] Shield Damage property ID 40
- [ ] Critical Range property ID 22
- [ ] All ability requirement property IDs (2-11)

---

## Appendix C: Quick Reference - File Locations

| Creator | Main Page | Calculator | Shared Components |
|---------|-----------|------------|-------------------|
| Power | [src/app/(main)/power-creator/page.tsx](src/app/(main)/power-creator/page.tsx) | [src/lib/calculators/power-calc.ts](src/lib/calculators/power-calc.ts) | LoadFromLibraryModal, NumberStepper |
| Technique | [src/app/(main)/technique-creator/page.tsx](src/app/(main)/technique-creator/page.tsx) | [src/lib/calculators/technique-calc.ts](src/lib/calculators/technique-calc.ts) | LoadFromLibraryModal, NumberStepper |
| Armament | [src/app/(main)/item-creator/page.tsx](src/app/(main)/item-creator/page.tsx) | [src/lib/calculators/item-calc.ts](src/lib/calculators/item-calc.ts) | LoadFromLibraryModal, NumberStepper |
| Creature | [src/app/(main)/creature-creator/page.tsx](src/app/(main)/creature-creator/page.tsx) | [src/lib/game/formulas.ts](src/lib/game/formulas.ts) | Various |

**Shared Utilities:**
- [src/lib/calculators/mechanic-builder.ts](src/lib/calculators/mechanic-builder.ts) - Unified mechanic part builder
- [src/lib/id-constants.ts](src/lib/id-constants.ts) - All ID constants and lookup utilities
- [src/components/creator/](src/components/creator/) - Shared creator components

**Vanilla Site Reference:**
- [vanilla-site-reference-only/public/js/calculators/](vanilla-site-reference-only/public/js/calculators/) - Original calculation logic
- [vanilla-site-reference-only/public/js/tools/](vanilla-site-reference-only/public/js/tools/) - Original creator UIs
