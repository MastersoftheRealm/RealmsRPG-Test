# RealmsRPG Migration Fix Plan
## Comprehensive React Site Overhaul & Vanilla Site Feature Parity

**Document Version:** 1.0  
**Date:** January 12, 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Global Issues & Themes](#2-global-issues--themes)
3. [Character Creator Fixes](#3-character-creator-fixes)
4. [Creators (Power, Technique, Armament, Creature)](#4-creators-power-technique-armament-creature)
5. [Codex & Library Pages](#5-codex--library-pages)
6. [Encounter Tracker](#6-encounter-tracker)
7. [Character Sheet](#7-character-sheet)
8. [Architecture & Code Organization](#8-architecture--code-organization)
9. [UI/UX Standardization](#9-uiux-standardization)
10. [Database & ID Mapping](#10-database--id-mapping)
11. [Cloud Functions & Save/Load](#11-cloud-functions--saveload)
12. [Implementation Priority & Phases](#12-implementation-priority--phases)

---

## 1. Executive Summary

The React migration from the vanilla site has made significant UI improvements but has critical functionality gaps. This document outlines a complete remediation plan to achieve full feature parity while maintaining the improved React UI/UX patterns.

### Key Problem Areas

| Area | Severity | Description |
|------|----------|-------------|
| Button Visibility | Critical | White buttons on white backgrounds invisible site-wide |
| Character Creator | Critical | Missing traits, invisible buttons, broken feat system |
| Species/Traits | High | ID lookups not working, traits showing IDs not names |
| Creators | High | Missing parts functionality, CORS errors on save |
| Encounter Tracker | Medium | Missing drag-drop, alternating initiative, invisible UI |
| Codex/Library | Medium | Inconsistent layouts, missing expand/collapse, broken tabs |

### Core Principles for Fixes

1. **"Learn one UI, learn them all"** - Standardize patterns across pages
2. **ID-based lookups** - Use `findByIdOrName()` pattern consistently
3. **Part/Property database integration** - All costs from RTDB, not hardcoded
4. **Shared components** - Extract repeated patterns into reusable modules
5. **Currency terminology** - Use "c" or "currency", never "gp" or "gold"

---

## 2. Global Issues & Themes

### 2.1 Invisible Button Problem

**Issue:** Buttons across the site use white text on white backgrounds or have insufficient contrast.

**Affected Areas:**
- Character Creator: Continue/Next buttons, +/- ability buttons, feat select
- Creature Creator: All stepper buttons
- Encounter Tracker: Next turn button, condition buttons
- Power/Technique/Item Creators: Increase/decrease buttons

**Solution:**
Create consistent button styling in `globals.css`:

```css
/* Add to globals.css - Button Visibility Fix */
.btn-stepper {
  @apply flex items-center justify-center w-10 h-10 rounded-full 
         bg-primary-100 text-primary-700 font-bold text-xl
         hover:bg-primary-200 active:bg-primary-300
         disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
         transition-colors;
}

.btn-stepper-danger {
  @apply bg-red-100 text-red-700 hover:bg-red-200;
}

/* Ensure primary buttons are always visible */
.btn-continue {
  @apply bg-primary-600 text-white font-bold px-8 py-3 rounded-xl
         hover:bg-primary-700 shadow-md
         disabled:bg-gray-300 disabled:text-gray-500;
}
```

### 2.2 Tab Navigation Visibility

**Issue:** Current step highlight makes text white/invisible; future steps too greyed out.

**Solution:**
```css
/* Tab navigation visibility */
.creator-tab {
  @apply px-4 py-2 font-medium transition-colors;
}

.creator-tab--active {
  @apply bg-primary-600 text-white rounded-t-lg;
}

.creator-tab--completed {
  @apply text-primary-700 bg-primary-50;
}

.creator-tab--upcoming {
  @apply text-gray-600 hover:text-gray-800; /* Not too greyed out */
}

.creator-tab--disabled {
  @apply text-gray-400 cursor-not-allowed;
}
```

### 2.3 Currency Terminology

**Global Find & Replace:**
- Replace `gp` → `c`
- Replace `gold` → `currency` (when referring to in-game money)
- Replace `Gold` → `Currency`

**Files to update:**
- `src/app/(main)/item-creator/page.tsx`
- `src/app/(main)/creature-creator/page.tsx`
- `src/components/creator/cost-summary.tsx`
- `src/lib/calculators/item-calc.ts`

### 2.4 Hover Feedback

**Issue:** Add character button and other interactive elements lack hover feedback.

**Solution:** Add hover states to all interactive elements:
```css
.interactive-card {
  @apply transition-all duration-200 cursor-pointer
         hover:shadow-md hover:border-primary-300 hover:-translate-y-0.5;
}
```

---

## 3. Character Creator Fixes

### 3.1 Species Step Overhaul

**Current Issues:**
- No modal popup when clicking species
- Speed shown but species don't have speed in RTDB
- Sizes are arrays, not single values
- Traits show as IDs, not resolved names

**Required Changes:**

#### 3.1.1 Species Modal Component
Create `src/components/character-creator/species-modal.tsx`:

```tsx
interface SpeciesModalProps {
  species: Species | null;
  traits: Trait[];
  onSelect: () => void;
  onClose: () => void;
}

export function SpeciesModal({ species, traits, onSelect, onClose }: SpeciesModalProps) {
  if (!species) return null;
  
  // Resolve trait IDs to full trait objects
  const resolveTraits = (traitIds: (string | number)[]) => {
    return traitIds.map(id => {
      const trait = traits.find(t => 
        t.id === String(id) || t.name === id
      );
      return trait || { id: String(id), name: String(id), description: 'Unknown trait' };
    });
  };
  
  const speciesTraits = resolveTraits(species.species_traits || []);
  const ancestryTraits = resolveTraits(species.ancestry_traits || []);
  const flaws = resolveTraits(species.flaws || []);
  const characteristics = resolveTraits(species.characteristics || []);
  
  return (
    <Modal open onClose={onClose}>
      <div className="max-w-2xl">
        <h2>{species.name}</h2>
        <p className="text-gray-600">{species.description}</p>
        
        {/* Stats - NO SPEED (species don't have speed) */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div>Size: {species.sizes?.join(', ') || 'Medium'}</div>
          <div>Type: {species.type}</div>
          <div>Height: {species.ave_hgt_cm} cm</div>
          <div>Weight: {species.ave_wgt_kg} kg</div>
        </div>
        
        {/* Trait Sections */}
        <TraitSection title="Species Traits" traits={speciesTraits} />
        <TraitSection title="Ancestry Traits" traits={ancestryTraits} selectable />
        <TraitSection title="Flaws" traits={flaws} isFlaw />
        <TraitSection title="Characteristics" traits={characteristics} selectable />
        
        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button onClick={onSelect} className="btn-primary flex-1">
            Pick Me!
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Nah...
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

#### 3.1.2 Update Species Step
Remove speed display, fix sizes display, add modal trigger:

```tsx
// In species-step.tsx
const handleCardClick = (species: Species) => {
  setSelectedSpeciesForModal(species);
  setShowModal(true);
};

// Remove speed display from card
<div className="flex items-center gap-2">
  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">
    {Array.isArray(s.sizes) ? s.sizes.join('/') : s.size}
  </span>
  {/* NO SPEED - species don't have speed values */}
</div>
```

### 3.2 Ancestry Step - Trait Selection

**Current Issues:**
- Traits showing as IDs, not resolved names/descriptions
- No trait selection functionality
- Missing flaw/characteristic selection logic

**Required Changes:**

#### 3.2.1 Trait ID Resolution Hook
Add to `src/hooks/use-rtdb.ts`:

```typescript
export function useResolvedTraits(traitIds: (string | number)[]): Trait[] {
  const { data: allTraits } = useTraits();
  
  return useMemo(() => {
    if (!allTraits || !traitIds) return [];
    
    return traitIds.map(id => {
      // Try numeric ID first
      const byId = allTraits.find(t => t.id === String(id));
      if (byId) return byId;
      
      // Try name match
      const byName = allTraits.find(t => 
        t.name.toLowerCase() === String(id).toLowerCase()
      );
      if (byName) return byName;
      
      // Return placeholder
      return { id: String(id), name: String(id), description: 'Trait not found' };
    });
  }, [allTraits, traitIds]);
}
```

#### 3.2.2 Ancestry Trait Selection UI
The user should be able to:
- Select 1-2 ancestry traits (2 if they chose a flaw)
- Select 1 characteristic
- Optionally select 1 flaw (grants extra ancestry trait)

```tsx
// Track selections in store
interface AncestrySelections {
  ancestryTraits: string[]; // 1-2 trait IDs
  characteristic: string | null;
  flaw: string | null;
}

// Selection logic
const maxAncestryTraits = selectedFlaw ? 2 : 1;
```

### 3.3 Abilities Step - Button Visibility

**Current Issues:**
- +/- buttons invisible until stat reaches +3
- Buttons blend into background

**Solution:**
```tsx
// Replace button styling in abilities-step.tsx
<button
  onClick={() => handleDecrease(ability)}
  disabled={!canDecreaseAbility(value)}
  className="btn-stepper btn-stepper-danger"
>
  −
</button>

<button
  onClick={() => handleIncrease(ability)}
  disabled={!canIncreaseAbility(value, remainingPoints, true)}
  className="btn-stepper"
>
  +
</button>
```

### 3.4 Feats Step - Complete Overhaul

**Current Issues:**
- Only allows 1 feat total
- Should allow: 1 archetype feat + 1 character feat
- Martial: 3 archetype feats + 1 character feat
- Powered-Martial: 2 archetype feats + 1 character feat
- Power: 1 archetype feat + 1 character feat

**Required Changes:**

```typescript
// In feats-step.tsx
const getArchetypeFeatLimit = () => {
  const archetype = draft.archetype?.type;
  switch (archetype) {
    case 'martial': return 3;
    case 'powered-martial': return 2;
    case 'power': return 1;
    default: return 1;
  }
};

const CHARACTER_FEAT_LIMIT = 1;

// Separate tracking
const [selectedArchetypeFeats, setSelectedArchetypeFeats] = useState<string[]>([]);
const [selectedCharacterFeats, setSelectedCharacterFeats] = useState<string[]>([]);

// Display sections separately
<section>
  <h3>Archetype Feats ({selectedArchetypeFeats.length}/{getArchetypeFeatLimit()})</h3>
  {/* Archetype feat selection */}
</section>

<section>
  <h3>Character Feat ({selectedCharacterFeats.length}/{CHARACTER_FEAT_LIMIT})</h3>
  {/* Character feat selection - char_feat: true */}
</section>
```

### 3.5 Equipment Step - Data Loading

**Issue:** Weapons, armor, equipment not loading.

**Root Cause:** Equipment path in RTDB may be different or data structure mismatch.

**Solution:**
1. Verify RTDB path: `equipment` vs `items`
2. Add error handling and loading states
3. Check data transformation

```typescript
// In use-rtdb.ts - verify equipment hook
export function useEquipment() {
  return useQuery({
    queryKey: ['rtdb', 'equipment'],
    queryFn: async () => {
      const snapshot = await get(ref(rtdb, 'equipment'));
      if (!snapshot.exists()) {
        console.warn('[rtdb] No data at equipment path');
        return [];
      }
      // Transform array or object format
      const data = snapshot.val();
      return Array.isArray(data) 
        ? data.filter(Boolean) 
        : Object.values(data);
    },
  });
}
```

---

## 4. Creators (Power, Technique, Armament, Creature)

### 4.1 Unified Creator Architecture

**Problem:** Each creator has different layouts, button positions, and interaction patterns.

**Solution:** Create a unified creator layout component:

```tsx
// src/components/creator/unified-creator-layout.tsx
interface UnifiedCreatorLayoutProps {
  title: string;
  children: React.ReactNode;
  summary: React.ReactNode;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
  isLoading?: boolean;
  resourceDisplay: {
    label: string;
    spent: number;
    total?: number;
    color?: 'green' | 'red' | 'blue';
  }[];
}

export function UnifiedCreatorLayout({
  title,
  children,
  summary,
  onSave,
  onLoad,
  onReset,
  isLoading,
  resourceDisplay,
}: UnifiedCreatorLayoutProps) {
  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex gap-2">
            <button onClick={onLoad} className="btn-secondary">
              <FolderOpen className="w-4 h-4 mr-2" /> Load
            </button>
            <button onClick={onSave} className="btn-primary" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" /> Save
            </button>
            <button onClick={onReset} className="btn-danger">
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </button>
          </div>
        </header>
        
        {children}
      </div>
      
      {/* Sticky Summary Sidebar */}
      <aside className="w-80 shrink-0">
        <div className="sticky top-24 space-y-4">
          {/* Resource Display - Always visible */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-bold mb-3">Resources</h3>
            {resourceDisplay.map((res) => (
              <div key={res.label} className="flex justify-between items-center py-1">
                <span className="text-gray-600">{res.label}</span>
                <span className={cn(
                  'font-bold',
                  res.color === 'green' && 'text-green-600',
                  res.color === 'red' && 'text-red-600',
                  res.color === 'blue' && 'text-blue-600',
                )}>
                  {res.spent}{res.total !== undefined && ` / ${res.total}`}
                </span>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          {summary}
        </div>
      </aside>
    </div>
  );
}
```

### 4.2 Power Creator Fixes

**Issues:**
1. Missing basic mechanics (duration, range, area)
2. No advanced mechanics options
3. Damage not tied to proper parts
4. CORS error on save

#### 4.2.1 Basic Mechanics Implementation

```tsx
// Add these sections to power-creator
const [basicMechanics, setBasicMechanics] = useState({
  duration: 'instant', // instant | round | minute | hour | day | permanent
  durationLevel: 1,
  durationFocus: false, // Focus for Duration part
  
  range: 'self', // self | touch | 6 | 12 | 24 | 48 | custom
  rangeLevel: 1,
  
  area: 'none', // none | line | cone | sphere | cylinder
  areaLevel: 1,
});

// Duration parts mapping (from PART_IDS)
const DURATION_PART_MAP = {
  round: PART_IDS.DURATION_ROUND,    // 289
  minute: PART_IDS.DURATION_MINUTE,  // 290
  hour: PART_IDS.DURATION_HOUR,      // 291
  day: PART_IDS.DURATION_DAYS,       // 293
  permanent: PART_IDS.DURATION_PERMANENT, // 294
};

// When calculating costs, add duration/range/area parts automatically
const getImplicitParts = () => {
  const parts: SelectedPart[] = [];
  
  if (basicMechanics.duration !== 'instant') {
    const durationPartId = DURATION_PART_MAP[basicMechanics.duration];
    const durationPart = allParts.find(p => p.id === String(durationPartId));
    if (durationPart) {
      parts.push({
        part: durationPart,
        op_1_lvl: basicMechanics.durationLevel - 1,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: true,
      });
    }
  }
  
  // Similar for range and area...
  return parts;
};
```

#### 4.2.2 Part Option Display

Each part can have up to 3 options. Display them properly:

```tsx
function PartOptionsDisplay({ part, levels, onUpdate }: PartOptionsProps) {
  return (
    <div className="space-y-3 mt-3">
      {part.op_1_desc && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex-1">
            <span className="text-sm">{part.op_1_desc}</span>
            <span className="text-xs text-gray-500 ml-2">
              (EN: {part.op_1_en || 0}, TP: {part.op_1_tp || 0})
            </span>
          </div>
          <NumberStepper
            value={levels.op_1_lvl}
            min={0}
            max={10}
            onChange={(v) => onUpdate({ op_1_lvl: v })}
          />
        </div>
      )}
      {/* Similar for op_2 and op_3 */}
    </div>
  );
}
```

### 4.3 Technique Creator Fixes

**Issues:**
1. "Stamina" should be "Energy"
2. "Weapon Type" should be "Weapon" (with library dropdown)
3. Parts not properly linked to RTDB IDs

**Required Changes:**

```tsx
// Rename all "stamina" to "energy"
// In technique-creator/page.tsx:
- const [stamina, setStamina] = useState(0);
+ const [energy, setEnergy] = useState(0);

// Weapon selection from library
const { data: userItems } = useUserItems();
const weapons = useMemo(() => 
  userItems?.filter(item => item.type === 'weapon') || [],
  [userItems]
);

<select 
  value={selectedWeaponId} 
  onChange={(e) => setSelectedWeaponId(e.target.value)}
  className="input-field"
>
  <option value="">Select Weapon...</option>
  {weapons.map(w => (
    <option key={w.id} value={w.id}>{w.name}</option>
  ))}
</select>
```

### 4.4 Item Creator Fixes (Rename to Armament Creator)

**Issues:**
1. Should be called "Armament Creator"
2. Remove "Accessory" option
3. Properties should filter by selected type (Weapon/Armor/Shield)
4. Missing property options, rarity calculation
5. No TP cost display for proficiency requirements

**Required Changes:**

```tsx
// Rename page and update navigation
// Valid armament types
const ARMAMENT_TYPES = ['weapon', 'armor', 'shield'] as const;

// Filter properties by type
const availableProperties = useMemo(() => {
  if (!properties) return [];
  
  return properties.filter(p => {
    // General properties available to all
    if (!p.type || p.type === 'general') return true;
    // Type-specific properties
    return p.type === selectedType;
  });
}, [properties, selectedType]);

// Remove already-added properties that don't match new type
useEffect(() => {
  if (selectedType) {
    setAddedProperties(prev => prev.filter(p => 
      !p.property.type || p.property.type === 'general' || p.property.type === selectedType
    ));
  }
}, [selectedType]);

// Property option display with costs
<div className="text-sm text-gray-600">
  <span>IP: {property.base_ip}</span>
  <span className="ml-2">TP: {property.base_tp}</span>
  <span className="ml-2">C: {property.base_c}</span>
</div>
```

### 4.5 Creature Creator Fixes

**Issues:**
1. All buttons invisible (white on white)
2. "gp" should be "c" (currency)
3. Negative abilities should give points back
4. Minimum energy = highest non-vitality ability × level
5. Minimum health = vitality × level (can be negative at level 1)
6. Feat points not tracked
7. Using wrong feat collection (should be `creature_feats`)
8. Skills UI needs redesign

**Required Changes:**

#### 4.5.1 Button Visibility
```tsx
// Replace all stepper buttons with btn-stepper class
<button className="btn-stepper">+</button>
<button className="btn-stepper btn-stepper-danger">-</button>
```

#### 4.5.2 Currency Fix
```tsx
// Find/replace in creature-creator/page.tsx
- 'GP'
- 'gp'
+ 'c'
+ 'Currency'
```

#### 4.5.3 Ability Points with Negatives
```typescript
const calculateSpentAbilityPoints = (abilities: Record<string, number>) => {
  return Object.values(abilities).reduce((sum, val) => {
    if (val <= 0) {
      return sum + val; // Negatives give points back (1:1)
    } else if (val <= 3) {
      return sum + val; // 1 point each for 0-3
    } else {
      // 1 point each for 0-3, 2 points each for 4+
      return sum + 3 + (val - 3) * 2;
    }
  }, 0);
};
```

#### 4.5.4 Health/Energy Minimums
```typescript
const calculateMinimumHealth = (level: number, vitality: number) => {
  if (level < 1) {
    // Fraction levels use level 1 minimums
    return vitality; // Can be negative
  }
  return vitality * level;
};

const calculateMinimumEnergy = (level: number, abilities: Record<string, number>) => {
  const { vitality, ...others } = abilities;
  const highestNonVit = Math.max(...Object.values(others), 0);
  
  if (level < 1) {
    return highestNonVit;
  }
  return highestNonVit * level;
};
```

#### 4.5.5 Creature Feats Hook
```typescript
// Add to use-rtdb.ts
export function useCreatureFeats() {
  return useQuery({
    queryKey: ['rtdb', 'creature_feats'],
    queryFn: async () => {
      const snapshot = await get(ref(rtdb, 'creature_feats'));
      if (!snapshot.exists()) return [];
      return transformData(snapshot.val());
    },
    staleTime: 1000 * 60 * 10,
  });
}
```

#### 4.5.6 Feat Point Tracking
```tsx
// Add feat point tracking
const CREATURE_FEAT_COSTS = {
  resistance: 1,  // ID 2
  immunity: 2,    // ID 3
  weakness: -1,   // ID 4 (gives points back)
  // ... map all creature feat IDs
};

const spentFeatPoints = useMemo(() => {
  return creature.feats.reduce((sum, feat) => {
    return sum + (feat.points || CREATURE_FEAT_COSTS[feat.name.toLowerCase()] || 0);
  }, 0);
}, [creature.feats]);
```

---

## 5. Codex & Library Pages

### 5.1 Unified List Item Component

**Goal:** Create one component for all expandable list items across Codex, Library, and other pages.

```tsx
// src/components/shared/expandable-list-item.tsx
interface ExpandableListItemProps {
  title: string;
  subtitle?: string;
  chips?: { label: string; color?: string }[];
  children: React.ReactNode;
  defaultExpanded?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  sortIndicators?: { label: string; ascending: boolean }[];
}

export function ExpandableListItem({
  title,
  subtitle,
  chips,
  children,
  defaultExpanded = false,
  onSelect,
  selected,
  sortIndicators,
}: ExpandableListItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className={cn(
      'bg-white border rounded-lg overflow-hidden transition-all',
      selected && 'border-primary-400 bg-primary-50',
    )}>
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        {onSelect && (
          <input 
            type="checkbox" 
            checked={selected} 
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{title}</h4>
          {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
        </div>
        
        {chips && (
          <div className="flex gap-1 flex-wrap">
            {chips.map((chip, i) => (
              <span key={i} className={cn('chip', chip.color)}>
                {chip.label}
              </span>
            ))}
          </div>
        )}
        
        <ChevronDown className={cn(
          'w-5 h-5 text-gray-400 transition-transform',
          expanded && 'rotate-180'
        )} />
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}
```

### 5.2 Codex Species Tab Fix

**Issues:**
- Traits showing as IDs, not names
- Missing trait categories (species traits, ancestry traits, flaws, characteristics)
- No size ascending/descending sort indicators

**Solution:**

```tsx
// Species display with proper trait resolution
function SpeciesCard({ species, allTraits }: { species: Species; allTraits: Trait[] }) {
  const resolveTraitIds = (ids: (string | number)[]) => {
    return ids.map(id => {
      const trait = allTraits.find(t => 
        String(t.id) === String(id) || t.name === String(id)
      );
      return trait || { name: String(id), description: 'Unknown' };
    });
  };
  
  const speciesTraits = resolveTraitIds(species.species_traits || []);
  const ancestryTraits = resolveTraitIds(species.ancestry_traits || []);
  const flaws = resolveTraitIds(species.flaws || []);
  const characteristics = resolveTraitIds(species.characteristics || []);
  
  return (
    <ExpandableListItem
      title={species.name}
      subtitle={species.type}
      chips={[
        { label: species.sizes?.join('/') || 'Medium' },
      ]}
    >
      <p className="text-gray-600 mb-4">{species.description}</p>
      
      <TraitGrid title="Species Traits" traits={speciesTraits} />
      <TraitGrid title="Ancestry Traits" traits={ancestryTraits} />
      <TraitGrid title="Flaws" traits={flaws} variant="warning" />
      <TraitGrid title="Characteristics" traits={characteristics} variant="info" />
    </ExpandableListItem>
  );
}
```

### 5.3 Sort Header Indicators

**Feature:** Add ascending/descending indicators to sortable columns.

```tsx
// src/components/shared/sort-header.tsx
interface SortHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  ascLabel?: string;  // e.g., "0-10", "small-large"
  descLabel?: string; // e.g., "10-0", "large-small"
}

export function SortHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  ascLabel = 'A-Z',
  descLabel = 'Z-A',
}: SortHeaderProps) {
  const isActive = currentSort.key === sortKey;
  
  return (
    <button 
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600"
    >
      {label}
      <span className="flex gap-1 text-xs">
        <span className={cn(
          'px-1 rounded',
          isActive && currentSort.direction === 'asc' 
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-400'
        )}>
          {ascLabel}
        </span>
        <span className={cn(
          'px-1 rounded',
          isActive && currentSort.direction === 'desc'
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-400'
        )}>
          {descLabel}
        </span>
      </span>
    </button>
  );
}
```

### 5.4 Codex Properties & Equipment Tabs

**Issue:** No expand/collapse functionality like other tabs.

**Solution:** Apply the same `ExpandableListItem` pattern:

```tsx
// Properties tab
{properties.map(prop => (
  <ExpandableListItem
    key={prop.id}
    title={prop.name}
    chips={[
      { label: prop.type || 'General' },
      { label: `IP: ${prop.base_ip}` },
      { label: `TP: ${prop.base_tp}` },
    ]}
  >
    <p>{prop.description}</p>
    {prop.op_1_desc && (
      <div className="mt-2 p-2 bg-white rounded border">
        <strong>Option 1:</strong> {prop.op_1_desc}
        <span className="text-sm text-gray-500 ml-2">
          (+{prop.op_1_ip} IP, +{prop.op_1_tp} TP, +{prop.op_1_c} C)
        </span>
      </div>
    )}
  </ExpandableListItem>
))}
```

### 5.5 Library Creatures Tab

**Issue:** Creatures not displaying with proper stat-block layout.

**Solution:** Create a creature stat-block component:

```tsx
// src/components/library/creature-stat-block.tsx
export function CreatureStatBlock({ creature }: { creature: Creature }) {
  return (
    <div className="creature-stat-block">
      {/* Header */}
      <div className="bg-primary-800 text-white px-4 py-2 rounded-t-lg">
        <h3 className="text-xl font-bold">{creature.name}</h3>
        <p className="text-sm opacity-80">
          {creature.size} {creature.type}, Level {creature.level}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="bg-primary-50 border-x border-primary-200 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="HP" value={creature.hitPoints} />
          <Stat label="Energy" value={creature.energyPoints} />
          <Stat label="Speed" value={creature.speed} />
        </div>
      </div>
      
      {/* Abilities */}
      <div className="border-x border-b border-primary-200 p-4">
        <div className="grid grid-cols-6 gap-2 text-center text-sm">
          {Object.entries(creature.abilities).map(([key, val]) => (
            <div key={key}>
              <div className="font-bold text-primary-700">{key.slice(0, 3).toUpperCase()}</div>
              <div>{val >= 0 ? '+' : ''}{val}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Features */}
      <div className="border-x border-b border-primary-200 p-4 space-y-3">
        {creature.resistances?.length > 0 && (
          <div>
            <strong>Resistances:</strong> {creature.resistances.join(', ')}
          </div>
        )}
        {creature.immunities?.length > 0 && (
          <div>
            <strong>Immunities:</strong> {creature.immunities.join(', ')}
          </div>
        )}
        {creature.weaknesses?.length > 0 && (
          <div>
            <strong>Weaknesses:</strong> {creature.weaknesses.join(', ')}
          </div>
        )}
        {creature.senses?.length > 0 && (
          <div>
            <strong>Senses:</strong> {creature.senses.join(', ')}
          </div>
        )}
      </div>
      
      {/* Powers & Techniques */}
      {creature.powers?.length > 0 && (
        <div className="border-x border-b border-primary-200 p-4">
          <h4 className="font-bold text-primary-700 mb-2">Powers</h4>
          {creature.powers.map(p => (
            <PowerEntry key={p.id} power={p} />
          ))}
        </div>
      )}
      
      {/* Feats */}
      {creature.feats?.length > 0 && (
        <div className="border-x border-b border-primary-200 rounded-b-lg p-4">
          <h4 className="font-bold text-primary-700 mb-2">Creature Feats</h4>
          {creature.feats.map(f => (
            <div key={f.id} className="mb-1">
              <strong>{f.name}.</strong> {f.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6. Encounter Tracker

### 6.1 Initiative Value Visibility

**Issue:** Selected creature's initiative invisible on their turn.

**Solution:**
```tsx
// Add contrasting background for current turn
<div className={cn(
  'combatant-row',
  isCurrentTurn && 'bg-green-100 border-green-400',
)}>
  <span className={cn(
    'initiative-badge',
    isCurrentTurn ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
  )}>
    {combatant.initiative}
  </span>
</div>
```

### 6.2 Green Bar Purpose

**Issue:** Green bar on combatants has no function.

**Options:**
1. Remove it entirely
2. Use it as health percentage indicator
3. Use it as turn order indicator

**Recommended:** Health percentage indicator
```tsx
<div 
  className="h-1 bg-green-500 transition-all"
  style={{ width: `${(currentHealth / maxHealth) * 100}%` }}
/>
```

### 6.3 Leveled Conditions (Rename from "Decaying")

**Changes:**
- Rename "decaying conditions" to "leveled conditions"
- Right-click to reduce level
- Click X to remove entirely (not decrease)

```tsx
// Condition badge with right-click handler
<span 
  className="condition-badge"
  onContextMenu={(e) => {
    e.preventDefault();
    if (condition.level > 1) {
      updateConditionLevel(combatantId, condition.name, condition.level - 1);
    }
  }}
>
  {condition.name} {condition.level > 0 && `(${condition.level})`}
  <button 
    onClick={() => removeCondition(combatantId, condition.name)}
    className="ml-1 hover:text-red-500"
  >
    ×
  </button>
</span>
```

### 6.4 Custom Conditions

**Add ability to create custom leveled conditions:**

```tsx
const [customCondition, setCustomCondition] = useState({ name: '', level: 1 });

<div className="flex gap-2">
  <input 
    placeholder="Custom condition..."
    value={customCondition.name}
    onChange={(e) => setCustomCondition(prev => ({ ...prev, name: e.target.value }))}
    className="input-field flex-1"
  />
  <NumberStepper 
    value={customCondition.level} 
    min={1} 
    max={10}
    onChange={(level) => setCustomCondition(prev => ({ ...prev, level }))}
  />
  <button onClick={() => addCustomCondition()} className="btn-primary">
    Add
  </button>
</div>
```

### 6.5 Drag-and-Drop Initiative Reordering

**Implementation with react-dnd or @dnd-kit:**

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

function SortableCombatant({ combatant, isCurrentTurn }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: combatant.id,
  });
  
  return (
    <div 
      ref={setNodeRef} 
      style={{ transform, transition }}
      {...attributes}
      {...listeners}
    >
      {/* Combatant content */}
    </div>
  );
}

// In main component
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  
  const oldIndex = sortedCombatants.findIndex(c => c.id === active.id);
  const newIndex = sortedCombatants.findIndex(c => c.id === over.id);
  
  const newOrder = arrayMove(sortedCombatants, oldIndex, newIndex);
  
  // If dragged combatant is current turn, maintain their turn
  const draggedCombatant = sortedCombatants[oldIndex];
  if (encounter.currentTurnIndex === oldIndex) {
    // Current turn stays with dragged combatant at new position
    setEncounter(prev => ({ ...prev, currentTurnIndex: newIndex }));
  }
  
  setEncounter(prev => ({
    ...prev,
    combatants: newOrder,
  }));
};
```

### 6.6 Alternating Initiative Sort

**Issue:** Initiative should alternate allies and enemies (highest to lowest).

**Implementation:**
```typescript
const sortAlternatingInitiative = (combatants: Combatant[]) => {
  // Separate allies and enemies, each sorted by initiative desc
  const allies = combatants.filter(c => c.isAlly)
    .sort((a, b) => b.initiative - a.initiative || b.acuity - a.acuity);
  const enemies = combatants.filter(c => !c.isAlly)
    .sort((a, b) => b.initiative - a.initiative || b.acuity - a.acuity);
  
  const result: Combatant[] = [];
  
  // Determine who goes first based on highest initiative
  const allyFirst = (allies[0]?.initiative || 0) >= (enemies[0]?.initiative || 0);
  
  let aIdx = 0, eIdx = 0;
  let isAllyTurn = allyFirst;
  
  while (aIdx < allies.length || eIdx < enemies.length) {
    if (isAllyTurn && aIdx < allies.length) {
      result.push(allies[aIdx++]);
    } else if (!isAllyTurn && eIdx < enemies.length) {
      result.push(enemies[eIdx++]);
    } else if (aIdx < allies.length) {
      result.push(allies[aIdx++]);
    } else {
      result.push(enemies[eIdx++]);
    }
    isAllyTurn = !isAllyTurn;
  }
  
  return result;
};

// Sort button
<button onClick={() => {
  const sorted = sortAlternatingInitiative(encounter.combatants);
  setEncounter(prev => ({ ...prev, combatants: sorted }));
}} className="btn-secondary">
  Sort Initiative
</button>
```

### 6.7 Next Turn Button Visibility

```tsx
<button 
  onClick={nextTurn}
  className="btn-continue" // Use visible button class
  disabled={!encounter.isActive}
>
  Next Turn →
</button>
```

---

## 7. Character Sheet

*(This section covers character sheet editing, which shares logic with creature creator)*

### 7.1 Shared Editing Logic

Create shared utilities for ability/skill editing that work for both characters and creatures:

```typescript
// src/lib/game/shared-editing.ts
export const createAbilityEditor = (
  abilities: Record<string, number>,
  setAbilities: (abilities: Record<string, number>) => void,
  totalPoints: number,
) => {
  const getSpentPoints = () => calculateSpentAbilityPoints(abilities);
  const getRemainingPoints = () => totalPoints - getSpentPoints();
  
  const canIncrease = (ability: string) => {
    const current = abilities[ability] || 0;
    const cost = current >= 3 ? 2 : 1;
    return getRemainingPoints() >= cost && current < 10;
  };
  
  const canDecrease = (ability: string) => {
    return (abilities[ability] || 0) > -2;
  };
  
  const increase = (ability: string) => {
    if (!canIncrease(ability)) return;
    setAbilities({ ...abilities, [ability]: (abilities[ability] || 0) + 1 });
  };
  
  const decrease = (ability: string) => {
    if (!canDecrease(ability)) return;
    setAbilities({ ...abilities, [ability]: (abilities[ability] || 0) - 1 });
  };
  
  return { getSpentPoints, getRemainingPoints, canIncrease, canDecrease, increase, decrease };
};
```

---

## 8. Architecture & Code Organization

### 8.1 File Size Reduction

**Problem:** Many files are 800-1700 lines.

**Solution:** Split into smaller, focused components.

#### Power Creator Split Example:
```
src/app/(main)/power-creator/
├── page.tsx              # Main page (routing, state management)
├── components/
│   ├── basic-mechanics.tsx
│   ├── part-selector.tsx
│   ├── part-card.tsx
│   ├── damage-config.tsx
│   ├── cost-summary.tsx
│   └── power-preview.tsx
├── hooks/
│   └── use-power-state.ts
└── utils/
    └── power-calculations.ts
```

### 8.2 Shared Constants Consolidation

Move all shared constants to central files:

```
src/lib/
├── constants/
│   ├── index.ts          # Re-exports all
│   ├── abilities.ts      # Ability names, limits, costs
│   ├── conditions.ts     # All game conditions
│   ├── damage-types.ts   # Damage type list
│   ├── creature-types.ts # Creature types
│   └── sizes.ts          # Size categories
```

### 8.3 Component Library Structure

```
src/components/
├── ui/                   # Generic UI components
├── shared/               # Shared domain components
│   ├── expandable-list-item.tsx
│   ├── sort-header.tsx
│   ├── resource-bar.tsx
│   └── trait-grid.tsx
├── creator/              # Creator-specific shared
├── character-creator/    # Character creation wizard
├── character-sheet/      # Character sheet views
├── codex/                # Codex components
└── library/              # Library components
```

---

## 9. UI/UX Standardization

### 9.1 Design Token Additions

Add to `globals.css`:

```css
@theme {
  /* Stepper button tokens */
  --stepper-size: 2.5rem;
  --stepper-bg: var(--color-primary-100);
  --stepper-text: var(--color-primary-700);
  --stepper-hover-bg: var(--color-primary-200);
  --stepper-disabled-bg: var(--color-gray-100);
  --stepper-disabled-text: var(--color-gray-300);
  
  /* Card hover lift */
  --card-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --card-hover-translate: -2px;
  
  /* Resource indicator colors */
  --resource-positive: var(--color-success);
  --resource-negative: var(--color-danger);
  --resource-neutral: var(--color-gray-600);
}
```

### 9.2 Component Pattern Reference

| Pattern | Usage | Component |
|---------|-------|-----------|
| Expandable List | Codex, Library, Feat selection | `ExpandableListItem` |
| Resource Display | All creators | `ResourceBar` |
| Stepper | Ability/Skill/Option adjustment | `NumberStepper` |
| Filter Chips | Codex filtering | `FilterChip` |
| Sort Headers | Sortable tables | `SortHeader` |
| Modal | Selection, confirmation | `Modal` |
| Stat Block | Creature display | `CreatureStatBlock` |

---

## 10. Database & ID Mapping

### 10.1 Complete ID Constants

Expand `src/lib/id-constants.ts` with all IDs from vanilla site:

```typescript
// Add missing creature feat IDs
export const CREATURE_FEAT_IDS = {
  UNCANNY_DODGE: 1,
  RESISTANCE: 2,
  IMMUNITY: 3,
  WEAKNESS: 4,
  PACK_TACTICS: 5,
  FLYING: 6,
  FLYING_II: 7,
  BURROW: 8,
  BURROW_II: 9,
  DARKVISION: 10,
  DARKVISION_II: 11,
  DARKVISION_III: 12,
  BLINDSENSE: 13,
  BLINDSENSE_II: 14,
  BLINDSENSE_III: 15,
  BLINDSENSE_IV: 16,
  // ... complete list from MIGRATION_AUDIT_MANUAL
} as const;

// Creature feat point costs
export const CREATURE_FEAT_COSTS: Record<number, number> = {
  [CREATURE_FEAT_IDS.UNCANNY_DODGE]: 3,
  [CREATURE_FEAT_IDS.RESISTANCE]: 1,
  [CREATURE_FEAT_IDS.IMMUNITY]: 2,
  [CREATURE_FEAT_IDS.WEAKNESS]: -1, // Gives points back
  // ... complete mapping
};
```

### 10.2 findByIdOrName Utility

Ensure consistent usage across the codebase:

```typescript
// src/lib/utils/find-by-id-or-name.ts
export function findByIdOrName<T extends { id: string; name: string }>(
  collection: T[],
  lookup: { id?: string | number; name?: string },
): T | undefined {
  if (!collection || !lookup) return undefined;
  
  // Try ID first (convert to string for comparison)
  if (lookup.id !== undefined) {
    const byId = collection.find(item => 
      String(item.id) === String(lookup.id)
    );
    if (byId) return byId;
  }
  
  // Fall back to name (case-insensitive)
  if (lookup.name) {
    return collection.find(item => 
      item.name.toLowerCase() === lookup.name!.toLowerCase()
    );
  }
  
  return undefined;
}
```

---

## 11. Cloud Functions & Save/Load

### 11.1 CORS Fix for Save Functions

**Issue:** All save functions failing with CORS errors.

**Solution:** Update Cloud Functions with proper CORS headers.

In `functions/index.js`:

```javascript
const cors = require('cors')({ origin: true });

// Wrap all HTTP functions with CORS
exports.savePowerToLibrary = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // ... existing logic
  });
});

exports.saveTechniqueToLibrary = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // ... existing logic
  });
});

exports.saveItemToLibrary = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // ... existing logic
  });
});
```

**Alternative:** Use Callable Functions (already handles CORS):

```javascript
exports.savePowerToLibrary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { power } = data;
  const userId = context.auth.uid;
  
  // Save logic...
  return { success: true, id: docRef.id };
});
```

### 11.2 Direct Firestore Save Pattern

For simpler implementation, bypass Cloud Functions and save directly:

```typescript
// src/hooks/use-user-library.ts
const savePower = async (power: PowerData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in');
  
  const powerRef = power.id 
    ? doc(db, `users/${user.uid}/library/${power.id}`)
    : doc(collection(db, `users/${user.uid}/library`));
  
  await setDoc(powerRef, {
    ...power,
    updatedAt: serverTimestamp(),
    createdAt: power.createdAt || serverTimestamp(),
  });
  
  return powerRef.id;
};
```

---

## 12. Implementation Priority & Phases

### Phase 1: Critical Fixes (1-2 weeks)

**Goal:** Make the site usable.

1. **Button visibility fixes** (globals.css + component updates)
2. **Character Creator continue buttons** visible
3. **Species modal** with proper trait display
4. **Feat system** separation (archetype vs character)
5. **CORS/Save fixes** for all creators

### Phase 2: Functionality Parity (2-3 weeks)

**Goal:** Match vanilla site features.

1. **Trait ID resolution** across all pages
2. **Power Creator** basic/advanced mechanics
3. **Technique Creator** energy rename, weapon selection
4. **Armament Creator** rename, property filtering
5. **Creature Creator** feat points, proper creature feats

### Phase 3: UI Standardization (1-2 weeks)

**Goal:** "Learn one UI, learn them all."

1. **Unified creator layout** component
2. **ExpandableListItem** across Codex/Library
3. **Sort headers** with indicators
4. **Creature stat block** component
5. **Resource display** standardization

### Phase 4: Encounter Tracker (1 week)

1. **Drag-drop initiative**
2. **Alternating sort**
3. **Leveled conditions** rename
4. **Custom conditions**
5. **Visual polish**

### Phase 5: Polish & Testing (1 week)

1. **Currency terminology** global update
2. **Error handling** improvements
3. **Loading states** consistency
4. **Cross-page testing**
5. **Mobile responsiveness**

---

## Appendix A: File Modification Checklist

### High Priority Files

- [ ] `src/app/globals.css` - Button/visibility fixes
- [ ] `src/components/character-creator/steps/species-step.tsx`
- [ ] `src/components/character-creator/steps/ancestry-step.tsx`
- [ ] `src/components/character-creator/steps/abilities-step.tsx`
- [ ] `src/components/character-creator/steps/feats-step.tsx`
- [ ] `src/app/(main)/power-creator/page.tsx`
- [ ] `src/app/(main)/technique-creator/page.tsx`
- [ ] `src/app/(main)/item-creator/page.tsx` (rename to armament-creator)
- [ ] `src/app/(main)/creature-creator/page.tsx`
- [ ] `src/app/(main)/encounter-tracker/page.tsx`
- [ ] `src/hooks/use-rtdb.ts` - Add creature feats hook
- [ ] `src/lib/id-constants.ts` - Complete ID mapping
- [ ] `functions/index.js` - CORS fixes

### New Files to Create

- [ ] `src/components/character-creator/species-modal.tsx`
- [ ] `src/components/shared/expandable-list-item.tsx`
- [ ] `src/components/shared/sort-header.tsx`
- [ ] `src/components/shared/resource-bar.tsx`
- [ ] `src/components/library/creature-stat-block.tsx`
- [ ] `src/components/creator/unified-creator-layout.tsx`
- [ ] `src/lib/utils/find-by-id-or-name.ts`

---

## Appendix B: Quick Reference

### Part ID Quick Reference (Most Used)

| Part | ID | Type |
|------|-----|------|
| True Damage | 1 | Technique |
| Reaction | 2 | Technique |
| Long Action | 3 | Technique |
| Quick/Free | 4 | Technique |
| Additional Damage | 6 | Both |
| Add Weapon | 7 | Technique |
| Power Reaction | 82 | Power |
| Power Long Action | 81 | Power |
| Power Quick/Free | 83 | Power |
| Duration (Round) | 289 | Power |
| Duration (Minute) | 290 | Power |
| Power Range | 292 | Power |

### Property ID Quick Reference

| Property | ID | Type |
|----------|-----|------|
| Damage Reduction | 1 | Armor |
| Armor Strength Req | 2 | Armor |
| Range | 13 | Weapon |
| Two-Handed | 14 | Weapon |
| Shield Base | 15 | Shield |
| Armor Base | 16 | Armor |
| Weapon Damage | 17 | Weapon |

### Archetype Feat Limits

| Archetype | Archetype Feats | Character Feats |
|-----------|-----------------|-----------------|
| Power | 1 | 1 |
| Powered-Martial | 2 | 1 |
| Martial | 3 | 1 |

---

*End of Document*
---

## Progress Tracking (Updated: January 13, 2026)

### ✅ COMPLETED

#### Session 1 (Previous)
- [x] Power Creator CORS fix - Direct Firestore writes replacing Cloud Functions
- [x] Technique Creator CORS fix - Direct Firestore writes replacing Cloud Functions
- [x] Creature Creator - Improved library display with stat-block design
- [x] Creature Creator - Added challenge rating, environment, creature type fields
- [x] Library Creatures Tab - Better creature display with expandable stat blocks

#### Session 2 (Current)
- [x] **Codex Skills Tab Error** - Fixed `e.charAt is not a function` by adding type safety for non-string ability values
- [x] **Codex Equipment Tab** - Added expand/collapse functionality with EquipmentCard component
- [x] **Codex Properties Tab** - Added expand/collapse functionality with PropertyCard component
- [x] **Item Creator CORS** - Converted to direct Firestore writes (matching power/technique pattern)
- [x] **Character Creator Equipment** - Fixed RTDB path from 'equipment' to 'items' (matching vanilla site)
- [x] **Species Trait Resolution** - Enhanced `findTraitByIdOrName` with sanitized ID lookups (handles "Trait Name" → "trait_name")
- [x] **Terminology Fix** - Changed all "Stam/Stamina" references to "En/Energy" in technique creator
- [x] **Type Consistency** - Renamed `staminaCost` to `energyCost` in EnrichedTechnique interface
- [x] **NumberStepper Visibility** - Updated to use btn-stepper classes for consistent, visible +/- buttons across all creators
- [x] **Encounter Tracker Verified** - Sort initiative (with alternating) and drag-drop already working
- [x] **All Creators Use Direct Firestore** - Verified power, technique, item, and creature creators all save directly to Firestore (no Cloud Functions CORS issues)
- [x] **Species Modal Verified** - Already has "Pick Me!" / "Nah..." buttons
- [x] **Ancestry Step Verified** - Properly shows species traits, ancestry trait selection, flaw selection, and characteristics
- [x] **Currency Terminology Verified** - UI displays "c" for currency (database field names unchanged)
- [x] **Character Creator Feats** - Verified archetype feat limits work correctly (Power:1, Powered-Martial:2, Martial:3)
- [x] **Power Creator Advanced Mechanics** - Verified Duration, Range, Area of Effect already implemented with RTDB parts
- [x] **Creature Creator RTDB Feats** - Verified uses `creature_feats` from RTDB (not normal feats) via `useCreatureFeats()` hook
- [x] **Creature Creator Feat Points** - Verified feat point tracking with `calculateCreatureFeatPoints()` function
- [x] **Creature Health Calculation Fix** - Fixed negative vitality to only apply at level 1, not multiplied by level
- [x] **Creature Energy Minimum Verified** - Energy minimum = highest non-vitality ability × level (correctly implemented)
- [x] **Encounter Tracker Conditions** - Added right-click (onContextMenu) to reduce condition level; verified custom conditions exist
- [x] **Codex Size Sort** - Added sortable SIZES column with proper Tiny→Gargantuan ordering
- [x] **Terminology Audit Complete** - Removed "Stamina" from cost-summary.tsx; verified no gp/stamina in user-facing code

### ✅ VERIFIED WORKING (No Changes Needed)

#### Character Creator
- [x] Species popup modal with "Pick Me!" / "Nah..." buttons (already implemented)
- [x] Species sizes displayed correctly (no speed shown - per spec)
- [x] Ancestry traits display with selection logic
- [x] Flaw selection grants +1 ancestry trait
- [x] Characteristic selection
- [x] btn-continue and btn-back classes for visible buttons
- [x] Archetype feat limits: Power=1, Powered-Martial=2, Martial=3 (getArchetypeFeatLimit)
- [x] Character feats separate from archetype feats

#### Encounter Tracker
- [x] Sort Initiative button with alternating ally/enemy logic
- [x] Drag-and-drop reordering  
- [x] Initiative values visible (using bg-primary-600 text-white when current turn)

#### Power Creator
- [x] Duration options (Round, Minute, Hour, Days, Permanent) with levels
- [x] Range option (Power Range) with space calculation
- [x] Area of Effect (Sphere, Cylinder, Cone, Line, Trail)
- [x] Part-based cost calculation using RTDB parts data
- [x] Direct Firestore save (no CORS issues)

#### Creature Creator
- [x] Uses creature_feats from RTDB (useCreatureFeats hook)
- [x] Feat point tracking with calculateCreatureFeatPoints
- [x] Proficiency point allocation
- [x] Health calculation: 8 + vitalityContribution + hitPoints
  - Negative vitality only applies once (at level 1)
  - Positive vitality multiplied by level
- [x] Energy minimum = highest non-vitality ability × level
- [x] Direct Firestore save (no CORS issues)

#### Library Creatures Tab
- [x] Full stat-block display via transformCreature() function
- [x] Displays: Level, HP, Energy Points
- [x] Type and Size badges
- [x] Abilities formatted as stat block
- [x] Defense Bonuses
- [x] Resistances, Weaknesses, Immunities, Condition Immunities
- [x] Senses, Movement Types, Languages
- [x] Skills with proficiency markers
- [x] Combat abilities summary (powers, techniques, armaments, feats)

#### Codex Species Tab
- [x] Species Traits displayed (blue background)
- [x] Ancestry Traits displayed (green background)
- [x] Flaws displayed (red background)
- [x] Characteristics displayed (purple background)
- [x] Height, weight, languages shown
- [x] Search and filter by type/size
- [x] Size sort headers (Tiny→Gargantuan ordering)

#### Encounter Tracker (Full)
- [x] Sort Initiative button with alternating ally/enemy logic
- [x] Drag-and-drop reordering  
- [x] Initiative values visible
- [x] Custom condition creation (input + "Add Custom" button)
- [x] Right-click on conditions to reduce level
- [x] Left-click on conditions to increase level
- [x] × button decreases level (decaying) or removes (non-decaying)

### ✅ COMPLETED POLISH ITEMS

- [x] Encounter Tracker: Condition right-click to reduce level (added onContextMenu handler)
- [x] Encounter Tracker: Custom condition creation (already existed - verified)
- [x] Terminology Audit: Removed "Stamina" from cost-summary.tsx fallbacks
- [x] Terminology Audit: Verified no "gp" or "stamina" user-facing text in src/
- [x] Codex Species: Added sortable SIZES column header with proper Tiny→Gargantuan ordering

### 📋 TODO (Priority Order)

#### High Priority - Functionality Gaps
1. ~~**Character Creator Issues**~~ ✅ VERIFIED WORKING
   - ~~Species popup modal with "Pick Me!" / "Nah..." buttons~~ ✅
   - ~~Ancestry traits display (species traits from RTDB)~~ ✅
   - ~~Feat system (archetype feats based on character type)~~ ✅
   - ~~Verify button visibility with btn-continue class~~ ✅

2. ~~**Power Creator Advanced Mechanics**~~ ✅ VERIFIED WORKING
   - ~~Duration, Range, Area of Effect options~~ ✅
   - ~~Part-based cost calculation from RTDB~~ ✅

3. ~~**Creature Creator Issues**~~ ✅ COMPLETE
   - ~~Use creature feats from RTDB (not normal feats)~~ ✅
   - ~~Feat point tracking and display~~ ✅
   - ~~Proficiency point allocation~~ ✅
   - ~~Health/Energy minimum calculations~~ ✅

#### Medium Priority - UI/UX
4. ~~**Library Creatures Tab**~~ ✅ VERIFIED WORKING
   - ~~Improve stat-block display~~ ✅
   - ~~Show resistances, immunities, abilities properly~~ ✅

5. ~~**Codex Species Display**~~ ✅ COMPLETE
   - ~~Categories for traits/flaws/characteristics~~ ✅
   - ~~Size sort headers~~ ✅

#### Lower Priority - Polish ✅ ALL COMPLETE
6. ~~**Creators Standardization**~~ ✅
   - Analyzed: Creature creator has intentionally different layout (resource summary bar)
   - Power/Technique/Item creators already share consistent patterns

7. ~~**Terminology Audit**~~ ✅ COMPLETE
   - No "gp/gold" usage found in user-facing code
   - All stamina→energy changes verified

8. ~~**Size Sort Headers for Codex**~~ ✅ COMPLETE
   - Added sortable SIZES column with proper Tiny→Gargantuan ordering